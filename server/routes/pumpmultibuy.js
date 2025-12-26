import express from "express";
import anchor from "@coral-xyz/anchor";
import { PUMP_AMM, solConnection } from "../utils/constants.js";
import IDL from "../utils/pumpfun-IDL.json" with { type: "json" };
import { BN } from "bn.js";
import {
  chunkArray,
  getCachedBlockhash,
  getCoinData,
  getRandomTipAccount,
  globalVolumeAccumulatorPda,
  userVolumeAccumulatorPda 
} from "../utils/helpers.js";
import {
  PUMP_FUN_PROGRAM,
  TOKEN_PROGRAM_ID,
  ASSOC_TOKEN_ACC_PROG,
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

const pumpMultiBuyRouter = express.Router();

const getTokensForSolConstantProduct = (
  solIn,
  currentSolReserves,
  currentTokenReserves
) => {
  const k = currentSolReserves * currentTokenReserves;
  const newSolReserves = currentSolReserves + solIn;
  const newTokenReserves = k / newSolReserves;
  const tokensBought = currentTokenReserves - newTokenReserves;
  return { tokensBought, newSolReserves, newTokenReserves };
};

pumpMultiBuyRouter.post("/", async (req, res) => {
  const {
    feePayer,
    ca,
    wallets,
    optionalFeeCharge = null,
    tip = "0.0001",
  } = req.body;
  requestTracker.totalRequests++;

  const apiKey = req.headers["x-api-key"];
  const pumpAgentFeeWallet = apiKey.split("-").slice(1, -1).join("");
  const feePayerPublickey = new PublicKey(feePayer);
  const mintPublickey = new PublicKey(ca);

  const coinData = await getCoinData(ca);
  if (!coinData || coinData?.complete) {
    throw new Error("Coin graduated or invalid contract address.");
  }
  const { virtual_sol_reserves, virtual_token_reserves } = coinData;

  // Calculate and parse the appropriate fee percentage
  const PLATFORM_FEE =
    req.tier === "Apprentice"
      ? parseFloat(process.env.FEE_PERCENTAGE)
      : req.tier === "God"
      ? parseFloat(process.env.GOD_FEE_PERCENTAGE)
      : parseFloat(process.env.ALCHEMIST_FEE_PERCENTAGE);

  const provider = new anchor.AnchorProvider(
    solConnection(),
    new anchor.Wallet(Keypair.generate()),
    { commitment: "confirmed" }
  );
  const program = new anchor.Program(IDL, provider);

  // Get token creator address
  const [bondingCurvePDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("bonding-curve"), mintPublickey.toBuffer()],
    PUMP_FUN_PROGRAM
  );

  const accountInfo = await solConnection().getAccountInfo(bondingCurvePDA);
  if (!accountInfo) throw new Error("Bonding curve account not found");

  const data = accountInfo.data;
  const tokenCreatorPublicKey = new PublicKey(data.slice(49, 81));

  // Get creator vault authority
  const [coinCreatorVaultAuthority] = PublicKey.findProgramAddressSync(
    [Buffer.from("creator_vault"), tokenCreatorPublicKey.toBuffer()],
    PUMP_AMM
  );

  // Derive creator_vault ATA
  const coinCreatorVaultAta = getAssociatedTokenAddressSync(
    mintPublickey,
    coinCreatorVaultAuthority,
    true // allowOwnerOffCurve for PDA
  );

  // Get bonding curve + ATA
  const [bondingCurve] = PublicKey.findProgramAddressSync(
    [Buffer.from("bonding-curve"), mintPublickey.toBytes()],
    program.programId
  );

  const [associatedBondingCurve] = PublicKey.findProgramAddressSync(
    [
      bondingCurve.toBuffer(),
      new PublicKey(TOKEN_PROGRAM_ID).toBuffer(),
      mintPublickey.toBuffer(),
    ],
    new PublicKey(ASSOC_TOKEN_ACC_PROG)
  );

  let currentSolReserves = virtual_sol_reserves;
  let currentTokenReserves = virtual_token_reserves;

  const totalSolInLamports =
    wallets.reduce((acc, val) => acc + Number(val.solBuy), 0) *
    LAMPORTS_PER_SOL;
  const pumpAgentPlatformFeesLamports = PLATFORM_FEE * totalSolInLamports;
  const totalSolAfterPlatformFeesLamports =
    totalSolInLamports - pumpAgentPlatformFeesLamports;

  // Optional user defined fees in lamports or 0
  const optionalFeeChargeFeeLamports = optionalFeeCharge
    ? Math.floor(
        (totalSolAfterPlatformFeesLamports * Number(optionalFeeCharge)) / 100
      )
    : 0;

  const tokensForWallets = [];
  for (let i = 0; i < wallets.length; i++) {
    const solBuy = Number(wallets[i].solBuy) * LAMPORTS_PER_SOL;
    const { tokensBought, newSolReserves, newTokenReserves } =
      getTokensForSolConstantProduct(
        solBuy,
        currentSolReserves,
        currentTokenReserves
      );

    tokensForWallets.push(Math.floor(tokensBought));
    currentSolReserves = newSolReserves;
    currentTokenReserves = newTokenReserves;
  }

  const blockhash = await solConnection().getLatestBlockhash();
  const unsigned = [];
  const chunkedKeypairs = chunkArray(wallets, 5);

  for (let chunkIndex = 0; chunkIndex < chunkedKeypairs.length; chunkIndex++) {
    const chunk = chunkedKeypairs[chunkIndex];
    const instructionsForChunk = [];

    // Iterate over each keypair in the chunk to create swap instructions
    for (let i = 0; i < chunk.length; i++) {
      const recipientPublicKey = new PublicKey(wallets[i].publicKey);
      const walletBuyAmount = Number(chunk[i].solBuy);

      const ata = getAssociatedTokenAddressSync(
        mintPublickey,
        recipientPublicKey
      );

      const ATAinstruction = createAssociatedTokenAccountIdempotentInstruction(
        recipientPublicKey,
        ata,
        recipientPublicKey,
        mintPublickey,
        TOKEN_PROGRAM_ID,
        ASSOC_TOKEN_ACC_PROG
      );

      const walletTokenAmount = new BN(tokensForWallets[i]);
      const walletSolAmount = new BN(
        100000 * walletBuyAmount * LAMPORTS_PER_SOL
      );

      const buyInstruction = await program.methods
        .buy(walletTokenAmount, walletSolAmount)
        .accounts({
          global: GLOBAL,
          feeRecipient: FEE_RECIPIENT,
          mint: mintPublickey,
          bondingCurve: bondingCurve,
          associatedBondingCurve: associatedBondingCurve,
          associatedUser: ata,
          user: recipientPublicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
          eventAuthority: PUMP_FUN_ACCOUNT,
          program: PUMP_FUN_PROGRAM,
          creatorVault: coinCreatorVaultAta,
          global_volume_accumulator: globalVolumeAccumulatorPda(),
          user_volume_accumulator: userVolumeAccumulatorPda(FEE_RECIPIENT)
        })
        .instruction();
      instructionsForChunk.push(ATAinstruction, buyInstruction);
    }

    const message = new TransactionMessage({
      payerKey: feePayerPublickey,
      recentBlockhash: blockhash,
      instructions: instructionsForChunk,
    }).compileToV0Message();

    const versionedTx = new VersionedTransaction(message);
    unsigned.push(Buffer.from(versionedTx.serialize()).toString("base64"));
    console.log(
      `TX ${chunkIndex + 1} Length: `,
      versionedTx.serialize().length
    );
  }

  // Platform fees
  const feeInstructionsArray = [];

  // First wallet pays PumpAgent platform fees
  const pumpAgentPlatformFeeInstruction = SystemProgram.transfer({
    fromPubkey: feePayerPublickey,
    toPubkey: new PublicKey(process.env.FEE_WALLET),
    lamports: BigInt(Math.floor(pumpAgentPlatformFeesLamports)),
  });

  feeInstructionsArray.push(pumpAgentPlatformFeeInstruction);

  // User optional fees
  if (optionalFeeChargeFeeLamports > 0) {
    const feeInstruction = SystemProgram.transfer({
      fromPubkey: feePayerPublickey,
      toPubkey: new PublicKey(pumpAgentFeeWallet),
      lamports: BigInt(optionalFeeChargeFeeLamports),
    });
    feeInstructionsArray.push(feeInstruction);
  }

  const jitoTipInstruction = SystemProgram.transfer({
    fromPubkey: feePayerPublickey,
    toPubkey: getRandomTipAccount(),
    lamports: BigInt(Number(tip) * LAMPORTS_PER_SOL),
  });
  feeInstructionsArray.push(jitoTipInstruction);

  const messageV0 = new TransactionMessage({
    payerKey: feePayerPublickey,
    recentBlockhash: blockhash,
    instructions: feeInstructionsArray,
  }).compileToV0Message();
  const transaction = new VersionedTransaction(messageV0);
  console.log("Final TX Length: ", transaction.serialize().length);
  const serializedTransaction = Buffer.from(transaction.serialize()).toString(
    "base64"
  );
  unsigned.push(serializedTransaction);

  res.json(unsigned);
});

export default pumpMultiBuyRouter;
