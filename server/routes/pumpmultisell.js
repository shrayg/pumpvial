import express from "express";
import anchor from "@coral-xyz/anchor";
import { solConnection } from "../utils/constants.js";
import IDL from "../utils/pumpfun-IDL.json" with { type: "json" };
import { BN } from "bn.js";
import {
  chunkArray,
  getRandomTipAccount,
  calculateSellAmountInSol,
  getCachedBlockhash,
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
import { getCoinData } from "../utils/helpers.js";
import { requestTracker } from "../utils/requests.js";
const pumpMultiSellRouter = express.Router();

pumpMultiSellRouter.post("/", async (req, res) => {
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

  const PLATFORM_FEE =
    req.tier === "Apprentice"
      ? parseFloat(process.env.FEE_PERCENTAGE)
      : req.tier === "God"
      ? parseFloat(process.env.GOD_FEE_PERCENTAGE)
      : parseFloat(process.env.ALCHEMIST_FEE_PERCENTAGE);

  const coinData = await getCoinData(ca);
  if (!coinData || coinData?.complete) {
    throw new Error("Coin graduated or invalid contract address.");
  }
  const { virtual_sol_reserves, virtual_token_reserves } = coinData;

  const dummyKeypair = Keypair.generate();
  const feePayerPublickey = new PublicKey(feePayer);
  const mintPublickey = new PublicKey(ca);
  const totalTokensIn = wallets.reduce(
    (acc, val) => acc + Number(val.tokenAmount),
    0
  );

  const totalSolReceived =
    calculateSellAmountInSol(
      totalTokensIn,
      virtual_sol_reserves,
      virtual_token_reserves
    ) / 1000;

  const totalSolReceivedInLamports = Math.floor(
    totalSolReceived * LAMPORTS_PER_SOL
  );

  const pumpAgentPlatformFeeInLamports = Math.floor(
    PLATFORM_FEE * totalSolReceivedInLamports
  );

  const totalSolReceivedMinusPumpAgentPlatformFees =
    totalSolReceivedInLamports - pumpAgentPlatformFeeInLamports;


  const optionalFeeChargeInLamports = optionalFeeCharge
    ? Math.floor(
        (totalSolReceivedMinusPumpAgentPlatformFees *
          Number(optionalFeeCharge)) /
          100
      )
    : 0;

  const provider = new anchor.AnchorProvider(
    solConnection(),
    new anchor.Wallet(dummyKeypair),
    { commitment: "confirmed" }
  );
  const program = new anchor.Program(IDL, provider);

  const BONDING_CURVE = new PublicKey(coinData["bonding_curve"]);
  const ASSOCIATED_BONDING_CURVE = new PublicKey(
    coinData["associated_bonding_curve"]
  );

  const blockhash = await solConnection().getLatestBlockhash();

  const unsigned = [];
  const chunkedKeypairs = chunkArray(wallets, 5);

  for (let chunkIndex = 0; chunkIndex < chunkedKeypairs.length; chunkIndex++) {
    const chunk = chunkedKeypairs[chunkIndex];
    const instructionsForChunk = [];

    // Iterate over each keypair in the chunk to create swap instructions
    for (let i = 0; i < chunk.length; i++) {
      const recipientPublicKey = new PublicKey(wallets[i].publicKey);
      const walletTokenAmount = Number(chunk[i].tokenAmount);
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

      const sellInstruction = await program.methods
        .sell(new BN(walletTokenAmount * 1e6), new BN(0))
        .accounts({
          global: GLOBAL,
          feeRecipient: FEE_RECIPIENT,
          mint: mintPublickey,
          bondingCurve: BONDING_CURVE,
          associatedBondingCurve: ASSOCIATED_BONDING_CURVE,
          associatedUser: ata,
          user: recipientPublicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
          eventAuthority: PUMP_FUN_ACCOUNT,
          program: PUMP_FUN_PROGRAM,
        })
        .instruction();

      instructionsForChunk.push(ATAinstruction, sellInstruction);
    }

    const message = new TransactionMessage({
      payerKey: feePayerPublickey,
      recentBlockhash: blockhash,
      instructions: instructionsForChunk,
    }).compileToV0Message();

    const versionedTx = new VersionedTransaction(message);

    unsigned.push(Buffer.from(versionedTx.serialize()).toString("base64"));
  }

  // Platform fees
  const feeInstructionsArray = [];

  const pumpAgentPlatformFeeInstruction = SystemProgram.transfer({
    fromPubkey: feePayerPublickey,
    toPubkey: new PublicKey(process.env.FEE_WALLET),
    lamports: BigInt(pumpAgentPlatformFeeInLamports),
  });
  feeInstructionsArray.push(pumpAgentPlatformFeeInstruction);

  // User optional fees
  if (optionalFeeChargeInLamports > 0) {
    const feeInstruction = SystemProgram.transfer({
      fromPubkey: feePayerPublickey,
      toPubkey: new PublicKey(pumpAgentFeeWallet),
      lamports: BigInt(optionalFeeChargeInLamports),
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

  const serializedTransaction = Buffer.from(transaction.serialize()).toString(
    "base64"
  );
  unsigned.push(serializedTransaction);

  res.json(unsigned);
});

export default pumpMultiSellRouter;
