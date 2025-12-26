import express from "express";
import anchor from "@coral-xyz/anchor";
import { solConnection } from "../utils/constants.js";
import IDL from "../utils/pumpfun-IDL.json" with { type: "json" };
import BN from "bn.js";
import bs58 from "bs58";
import {
  PUMP_FUN_PROGRAM,
  TOKEN_PROGRAM_ID,
  ASSOC_TOKEN_ACC_PROG,
  MPL_TOKEN_METADATA,
  MINT_AUTHORITY,
  PUMP_FUN_ACCOUNT,
  GLOBAL,
  FEE_RECIPIENT,
} from "../utils/constants.js";

import {
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  LAMPORTS_PER_SOL,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";

import {
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { getRandomTipAccount,   
         globalVolumeAccumulatorPda,
         userVolumeAccumulatorPda 
        } from "../utils/helpers.js";
import { requestTracker } from "../utils/requests.js";
const pumpLaunchBundleRouter = express.Router();

const chunkArray = (array, size) => {
  return Array.from({ length: Math.ceil(array.length / size) }, (v, i) =>
    array.slice(i * size, i * size + size)
  );
};

const calculateCurveTokenAmount = (solInput, context) => {
  const solAmount = solInput * LAMPORTS_PER_SOL;
  const e = new BN(solAmount);
  const initialVirtualSolReserves =
    30 * LAMPORTS_PER_SOL + context.initialRealSolReserves;

  const a = new BN(initialVirtualSolReserves).mul(
    new BN(context.initialVirtualTokenReserves)
  );
  const i = new BN(initialVirtualSolReserves).add(e);
  const l = a.div(i).add(new BN(1));
  let tokensToBuy = new BN(context.initialVirtualTokenReserves).sub(l);
  tokensToBuy = BN.min(tokensToBuy, new BN(context.initialRealTokenReserves));

  const tokensBought = tokensToBuy.toNumber();

  context.initialRealSolReserves += e.toNumber();
  context.initialRealTokenReserves -= tokensBought;
  context.initialVirtualTokenReserves -= tokensBought;

  return tokensBought;
};

const createWalletSwaps = async (
  payer,
  blockhash,
  wallets,
  lut,
  mint,
  program,
  bondingCurve,
  associatedBondingCurve,
  curveContext,
  coinCreatorVaultAuthority,
  tokensBought
) => {
  const unsignedTxs = [];
  const chunkedKeypairs = chunkArray(wallets,3);
  // Iterate over each chunk of keypairs
  for (let chunkIndex = 0; chunkIndex < chunkedKeypairs.length; chunkIndex++) {
    const chunk = chunkedKeypairs[chunkIndex];
    const instructionsForChunk = [];
    // Iterate over each keypair in the chunk to create swap instructions
    for (let i = 0; i < chunk.length; i++) {
      const recipientPublicKey = new PublicKey(chunk[i].publicKey);
      const walletBuyAmount = Number(chunk[i].solBuy);

      const ata = getAssociatedTokenAddressSync(
        mint.publicKey,
        recipientPublicKey,
      );
      const ATAinstruction = createAssociatedTokenAccountIdempotentInstruction(
        recipientPublicKey,
        ata,
        recipientPublicKey,
        mint.publicKey,
        TOKEN_PROGRAM_ID,
        ASSOC_TOKEN_ACC_PROG
      );

      // Buy transaction
      const walletTokenAmount = new BN(
        calculateCurveTokenAmount(walletBuyAmount, curveContext)
      );
      tokensBought = tokensBought + Number(walletTokenAmount);

      const walletSolAmount = new BN(
        Math.floor(1000 * walletBuyAmount * LAMPORTS_PER_SOL)
      );

      const buyInstruction = await program.methods
        .buy(walletTokenAmount, walletSolAmount)
        .accounts({
          global: GLOBAL,
          feeRecipient: FEE_RECIPIENT,
          mint: mint.publicKey,
          bondingCurve,
          associatedBondingCurve,
          associatedUser: ata,
          user: recipientPublicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          eventAuthority: PUMP_FUN_ACCOUNT,
          program: PUMP_FUN_PROGRAM,
          creatorVault: coinCreatorVaultAuthority,
          global_volume_accumulator: globalVolumeAccumulatorPda(),
          user_volume_accumulator: userVolumeAccumulatorPda(FEE_RECIPIENT)
        })
        .instruction();
      instructionsForChunk.push(ATAinstruction, buyInstruction);
    }

    const message = new TransactionMessage({
      payerKey: payer,
      instructions: instructionsForChunk,
      recentBlockhash: blockhash,
    }).compileToV0Message([lut]);
    const versionedTx = new VersionedTransaction(message);
    console.log("Tx length: ", versionedTx.serialize().length);
    unsignedTxs.push(Buffer.from(versionedTx.serialize()).toString("base64"));
  }
  return { unsignedTxs, tokensBought };
};

pumpLaunchBundleRouter.post("/", async (req, res) => {
  const {
    funderPubKey,
    sanitizedWallets,
    name,
    symbol,
    lut,
    uri,
    vanityPriv = null,
    optionalFeeCharge = null,
    tip = "0.01",
  } = req.body || {};
  requestTracker.requestTracker++;
  const pumpAgentFeeWallet = req.headers["x-api-key"]
    .split("-")
    .slice(1, -1)
    .join("");

  const createCurveContext = () => ({
    initialRealSolReserves: 0,
    initialVirtualTokenReserves: 1073000000 * 10 ** 6,
    initialRealTokenReserves: 793100000 * 10 ** 6,
  });
  const curveContext = createCurveContext();

  let tokensBought = 0;

  const PLATFORM_FEE =
    req.tier === "Apprentice"
      ? parseFloat(process.env.BUNDLE_LAUNCH_FEE)
      : req.tier === "God"
      ? parseFloat(process.env.GOD_FEE_PERCENTAGE)
      : parseFloat(process.env.ALCHEMIST_BUNDLE_LAUNCH_FEE);

  const funderKey = new PublicKey(funderPubKey);
  const creator = new PublicKey(sanitizedWallets[0].publicKey);

  const mintKeypair = vanityPriv
    ? Keypair.fromSecretKey(bs58.decode(vanityPriv))
    : Keypair.generate();

  const provider = new anchor.AnchorProvider(
    solConnection(),
    new anchor.Wallet(Keypair.generate()),
    { commitment: "confirmed" }
  );

  const program = new anchor.Program(IDL, provider);

  const unsigned = [];
  const lookupTable = new PublicKey(lut);

  const lookupTableAccount = (
    await solConnection().getAddressLookupTable(lookupTable)
  ).value;

  if (lookupTableAccount === null)
    throw new Error("Lookup table account not found!");
  // Get creator vault authority
  const [coinCreatorVaultAuthority] = PublicKey.findProgramAddressSync(
    [Buffer.from("creator-vault"), creator.toBuffer()],
    PUMP_FUN_PROGRAM
  );

  // Curve data
  const [bondingCurve] = PublicKey.findProgramAddressSync(
    [Buffer.from("bonding-curve"), mintKeypair.publicKey.toBytes()],
    program.programId
  );

  const [associatedBondingCurve] = PublicKey.findProgramAddressSync(
    [
      bondingCurve.toBuffer(),
      new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA").toBuffer(),
      mintKeypair.publicKey.toBuffer(),
    ],
    new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL")
  );

  const [metadata] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      MPL_TOKEN_METADATA.toBytes(),
      mintKeypair.publicKey.toBytes(),
    ],
    MPL_TOKEN_METADATA
  );

  const instructionsArray = [];

  const createInstruction = await program.methods
    .create(name, symbol, uri, creator)
    .accounts({
      mint: mintKeypair.publicKey,
      mintAuthority: MINT_AUTHORITY,
      bondingCurve,
      associatedBondingCurve,
      global: GLOBAL,
      mplTokenMetadata: MPL_TOKEN_METADATA,
      metadata,
      user: creator,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOC_TOKEN_ACC_PROG,
      rent: SYSVAR_RENT_PUBKEY,
      eventAuthority: PUMP_FUN_ACCOUNT,
      program: PUMP_FUN_PROGRAM,
    })
    .instruction();
  instructionsArray.push(createInstruction);

  // ATA instruction
  const ata = getAssociatedTokenAddressSync(mintKeypair.publicKey, creator);
  const ATAinstruction = createAssociatedTokenAccountIdempotentInstruction(
    creator,
    ata,
    creator,
    mintKeypair.publicKey,
    TOKEN_PROGRAM_ID,
    ASSOC_TOKEN_ACC_PROG
  );
  instructionsArray.push(ATAinstruction);

  // Developer buy instruction
  const devBuyAmount = Number(sanitizedWallets[0].solBuy);
  const devTokenAmount =
    devBuyAmount > 0
      ? new BN(calculateCurveTokenAmount(devBuyAmount, curveContext))
      : new BN(0);
  tokensBought = tokensBought + Number(devTokenAmount);

  const devSolAmount =
    devBuyAmount > 0
      ? new BN(1000 * devBuyAmount * LAMPORTS_PER_SOL)
      : new BN(0);

  const devBuyInstruction = await program.methods
    .buy(devTokenAmount, devSolAmount)
    .accounts({
      global: GLOBAL,
      feeRecipient: FEE_RECIPIENT,
      mint: mintKeypair.publicKey,
      bondingCurve,
      associatedBondingCurve,
      associatedUser: ata,
      user: creator,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      eventAuthority: PUMP_FUN_ACCOUNT,
      program: PUMP_FUN_PROGRAM,
      creatorVault: coinCreatorVaultAuthority,
      global_volume_accumulator: globalVolumeAccumulatorPda(),
      user_volume_accumulator: userVolumeAccumulatorPda(FEE_RECIPIENT)
    })
    .instruction();

  if (Number(devBuyAmount) > 0) {
    instructionsArray.push(devBuyInstruction);
  }

  // Optional fee recipient fee
  if (optionalFeeCharge) {
    const optionalFeeChargeTransfer = SystemProgram.transfer({
      fromPubkey: funderKey,
      toPubkey: new PublicKey(pumpAgentFeeWallet),
      lamports: BigInt(
        Math.floor(Number(optionalFeeCharge) * LAMPORTS_PER_SOL)
      ),
    });
    instructionsArray.push(optionalFeeChargeTransfer);
  }

  // Platform fees
  const feeInstruction = SystemProgram.transfer({
    fromPubkey: funderKey,
    toPubkey: new PublicKey(process.env.FEE_WALLET),
    lamports: BigInt(PLATFORM_FEE * LAMPORTS_PER_SOL), // Base fee of 0.1 SOL
  });
  instructionsArray.push(feeInstruction);

  // Jito bundle tip
  const jitoTipInstruction = SystemProgram.transfer({
    fromPubkey: funderKey,
    toPubkey: getRandomTipAccount(),
    lamports: BigInt(Math.floor(Number(tip) * LAMPORTS_PER_SOL)),
  });
  instructionsArray.push(jitoTipInstruction);

  const { blockhash } = await solConnection().getLatestBlockhash("finalized");


  const messageV0 = new TransactionMessage({
    payerKey: funderKey,
    instructions: instructionsArray,
    recentBlockhash: blockhash,
  }).compileToV0Message();
  const transaction = new VersionedTransaction(messageV0);
  transaction.sign([mintKeypair]);
  console.log("First tx length: ", transaction.serialize().length);
  const serializedTransaction = Buffer.from(transaction.serialize()).toString(
    "base64"
  );

  unsigned.push(serializedTransaction);
  // Create bundle buys
  const result = await createWalletSwaps(
    funderKey,
    blockhash,
    sanitizedWallets.slice(1),
    lookupTable,
    mintKeypair,
    program,
    bondingCurve,
    associatedBondingCurve,
    curveContext,
    coinCreatorVaultAuthority,
    tokensBought
  );

  const { unsignedTxs, tokensBought: updatedTokensBought } = result;
  tokensBought = updatedTokensBought;
  unsigned.push(...unsignedTxs);

  res.json({ unsigned, ca: mintKeypair.publicKey.toBase58(), tokensBought });
});

export default pumpLaunchBundleRouter;
