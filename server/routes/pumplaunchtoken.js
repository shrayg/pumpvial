import express from "express";
import anchor from "@coral-xyz/anchor";
import { heliusConnection, solConnection } from "../utils/constants.js";
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
import { requestTracker } from "../utils/requests.js";
import {
  globalVolumeAccumulatorPda,
  userVolumeAccumulatorPda,
} from "../utils/helpers.js";
const pumpLaunchTokenRouter = express.Router();

const calculateCurveTokenAmount = (solInput) => {
  const solAmount = solInput * LAMPORTS_PER_SOL;
  const tokenDecimals = 10 ** 6;
  const initialRealSolReserves = 0;
  const initialVirtualTokenReserves = 1073000000 * tokenDecimals;
  const initialRealTokenReserves = 793100000 * tokenDecimals;

  const e = new BN(solAmount);
  const initialVirtualSolReserves =
    30 * LAMPORTS_PER_SOL + initialRealSolReserves;
  const a = new BN(initialVirtualSolReserves).mul(
    new BN(initialVirtualTokenReserves)
  );
  const i = new BN(initialVirtualSolReserves).add(e);
  const l = a.div(i).add(new BN(1));

  let tokensToBuy = new BN(initialVirtualTokenReserves).sub(l);
  tokensToBuy = BN.min(tokensToBuy, new BN(initialRealTokenReserves));
  return tokensToBuy.toNumber();
};

pumpLaunchTokenRouter.post("/", async (req, res) => {
  const {
    developer,
    solIn,
    name,
    symbol,
    uri,
    vanityPriv = null,
    optionalFeeCharge = null,
  } = req.body;
  requestTracker.requestTracker++;

  const apiKey = req.headers["x-api-key"];
  const pumpAgentFeeWallet = apiKey.split("-").slice(1, -1).join("");

  const creator = new PublicKey(developer);
  const mintKeypair = vanityPriv
    ? Keypair.fromSecretKey(bs58.decode(vanityPriv))
    : Keypair.generate();

  const PLATFORM_FEE =
    req.tier === "Apprentice"
      ? parseFloat(process.env.TOKEN_LAUNCH_FEE)
      : req.tier === "God"
      ? parseFloat(process.env.GOD_FEE_PERCENTAGE)
      : parseFloat(process.env.ALCHEMIST_TOKEN_LAUNCH_FEE);

  const provider = new anchor.AnchorProvider(
    solConnection(),
    new anchor.Wallet(Keypair.generate()),
    { commitment: "confirmed" }
  );
  const program = new anchor.Program(IDL, provider);

  // Get bonding curve
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

  // Get creator vault authority
  const [coinCreatorVaultAuthority] = PublicKey.findProgramAddressSync(
    [Buffer.from("creator-vault"), creator.toBuffer()],
    PUMP_FUN_PROGRAM
  );

  // Derive creator_vault ATA
  const coinCreatorVaultAta = getAssociatedTokenAddressSync(
    mintKeypair.publicKey,
    coinCreatorVaultAuthority,
    true,
    TOKEN_PROGRAM_ID
  );

  const instructionsArray = [];

  // First wallet pays PumpAgent platform fees
  const pumpAgentPlatformFeesLamports = Math.floor(
    PLATFORM_FEE * LAMPORTS_PER_SOL
  );
  const pumpAgentPlatformFeeInstruction = SystemProgram.transfer({
    fromPubkey: creator,
    toPubkey: new PublicKey(process.env.FEE_WALLET),
    lamports: BigInt(pumpAgentPlatformFeesLamports),
  });

  instructionsArray.push(pumpAgentPlatformFeeInstruction);

  // User optional fees
  if (optionalFeeCharge > 0) {
    const feeInstruction = SystemProgram.transfer({
      fromPubkey: creator,
      toPubkey: new PublicKey(pumpAgentFeeWallet),
      lamports: BigInt(Math.floor(optionalFeeCharge * LAMPORTS_PER_SOL)),
    });
    instructionsArray.push(feeInstruction);
  }

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

  const devTokenAmount =
    solIn > 0 ? new BN(calculateCurveTokenAmount(solIn)) : new BN(0);
  console.log(Number(devTokenAmount));
  const devSolAmount = new BN(100000 * solIn * LAMPORTS_PER_SOL);

  const buyInstruction = await program.methods
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
      rent: SYSVAR_RENT_PUBKEY,
      eventAuthority: PUMP_FUN_ACCOUNT,
      program: PUMP_FUN_PROGRAM,
      creatorVault: coinCreatorVaultAuthority,
      global_volume_accumulator: globalVolumeAccumulatorPda(),
      user_volume_accumulator: userVolumeAccumulatorPda(FEE_RECIPIENT),
    })
    .instruction();
  if (Number(devTokenAmount) > 0) instructionsArray.push(buyInstruction);
  const { blockhash } = await heliusConnection().getLatestBlockhash(
    "finalized"
  );

  const messageV0 = new TransactionMessage({
    payerKey: creator,
    recentBlockhash: blockhash,
    instructions: instructionsArray,
  }).compileToV0Message();
  const transaction = new VersionedTransaction(messageV0);
  transaction.sign([mintKeypair]);

  const serializedTransaction = Buffer.from(transaction.serialize()).toString(
    "base64"
  );
  res.json({ serializedTransaction, ca: mintKeypair.publicKey.toBase58() });
});

export default pumpLaunchTokenRouter;
