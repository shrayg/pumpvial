import express from "express";
import anchor from "@coral-xyz/anchor";
import {
  heliusConnection,
  PUMP_AMM,
  solConnection,
} from "../utils/constants.js";
import IDL from "../utils/pumpfun-IDL.json" with { type: "json" };
import bs58 from "bs58";
import BN from "bn.js";
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
  ComputeBudgetProgram,
} from "@solana/web3.js";

import {
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  getCachedBlockhash,
  getCoinData,
  getPriorityFeeEstimate,
  globalVolumeAccumulatorPda,
  userVolumeAccumulatorPda,
} from "../utils/helpers.js";
import { requestTracker } from "../utils/requests.js";

const pumpSingleBuyRouter = express.Router();

pumpSingleBuyRouter.post("/", async (req, res) => {
  try {
    const {
      recipient,
      ca,
      solIn,
      optionalFeeCharge = null,
      prioFee = null,
    } = req.body;
    const start1 = Date.now();
    if (!recipient || !ca || !solIn) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    requestTracker.totalRequests++;

    const apiKey = req.headers["x-api-key"];
    if (!apiKey || !apiKey.includes("-")) {
      return res.status(403).json({ error: "Invalid or missing API key" });
    }

    const pumpAgentFeeWallet = apiKey.split("-").slice(1, -1).join("");
    const mintPublickey = new PublicKey(ca);

    const provider = new anchor.AnchorProvider(
      solConnection(),
      new anchor.Wallet(Keypair.generate()),
      { commitment: "confirmed" }
    );

    // Init program
    const program = new anchor.Program(IDL, provider);

    const [bondingCurve] = PublicKey.findProgramAddressSync(
      [Buffer.from("bonding-curve"), mintPublickey.toBytes()],
      program.programId
    );

    const struct = await program.account.bondingCurve.fetch(bondingCurve);
    const virtual_sol_reserves = Number(struct.virtualSolReserves);
    const virtual_token_reserves = Number(struct.virtualTokenReserves);
    const tokenCreatorPublicKey = struct.creator;

    const PLATFORM_FEE =
      req.tier === "Apprentice"
        ? parseFloat(process.env.FEE_PERCENTAGE)
        : req.tier === "God"
        ? parseFloat(process.env.GOD_FEE_PERCENTAGE)
        : parseFloat(process.env.ALCHEMIST_FEE_PERCENTAGE);

    const recipientPublickey = new PublicKey(recipient);

    const instructionsArray = [];

    const ata = getAssociatedTokenAddressSync(
      mintPublickey,
      recipientPublickey
    );
    const ATAinstruction = createAssociatedTokenAccountIdempotentInstruction(
      recipientPublickey,
      ata,
      recipientPublickey,
      mintPublickey,
      TOKEN_PROGRAM_ID,
      ASSOC_TOKEN_ACC_PROG
    );

    const totalFeePercentage = optionalFeeCharge
      ? Number(optionalFeeCharge) / 100 + PLATFORM_FEE
      : PLATFORM_FEE;

    const totalSolInLamports = Number(solIn) * LAMPORTS_PER_SOL;
    const totalFeesInLamports = Math.floor(
      totalSolInLamports * totalFeePercentage
    );
    const finalSolAmountInLamports = totalSolInLamports - totalFeesInLamports;

    const [associatedBondingCurve] = PublicKey.findProgramAddressSync(
      [
        bondingCurve.toBuffer(),
        new PublicKey(TOKEN_PROGRAM_ID).toBuffer(),
        mintPublickey.toBuffer(),
      ],
      new PublicKey(ASSOC_TOKEN_ACC_PROG)
    );

    const platformFeeAmountInLamports = Math.floor(
      totalSolInLamports * PLATFORM_FEE
    );

    const pumpAgentPlatformFeeInstruction = SystemProgram.transfer({
      fromPubkey: recipientPublickey,
      toPubkey: new PublicKey(process.env.FEE_WALLET),
      lamports: BigInt(platformFeeAmountInLamports),
    });

    instructionsArray.push(pumpAgentPlatformFeeInstruction);

    if (optionalFeeCharge) {
      const optionalFeeChargeFeeAmountInLamports = Math.floor(
        ((finalSolAmountInLamports - platformFeeAmountInLamports) *
          Number(optionalFeeCharge)) /
          100
      );

      const feeInstruction = SystemProgram.transfer({
        fromPubkey: recipientPublickey,
        toPubkey: new PublicKey(pumpAgentFeeWallet),
        lamports: BigInt(optionalFeeChargeFeeAmountInLamports),
      });
      instructionsArray.push(feeInstruction);
    }

    const [coinCreatorVaultAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("creator_vault"), tokenCreatorPublicKey.toBuffer()],
      PUMP_FUN_PROGRAM
    );

    const coinCreatorVaultAta = getAssociatedTokenAddressSync(
      mintPublickey,
      coinCreatorVaultAuthority,
      true
    );

    const solInWithSlippage = Number(
      (finalSolAmountInLamports / LAMPORTS_PER_SOL) * (1 + 0.1)
    );

    const tokenOut = Math.floor(
      (finalSolAmountInLamports * virtual_token_reserves) / virtual_sol_reserves
    );

    const buyInstruction = await program.methods
      .buy(
        new BN(tokenOut),
        new BN(Math.floor(solInWithSlippage * LAMPORTS_PER_SOL))
      )
      .accounts({
        global: GLOBAL,
        feeRecipient: FEE_RECIPIENT,
        mint: mintPublickey,
        bondingCurve: bondingCurve,
        associatedBondingCurve: associatedBondingCurve,
        associatedUser: ata,
        user: recipientPublickey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
        eventAuthority: PUMP_FUN_ACCOUNT,
        program: PUMP_FUN_PROGRAM,
        creator_vault: coinCreatorVaultAta,
        global_volume_accumulator: globalVolumeAccumulatorPda(),
        user_volume_accumulator: userVolumeAccumulatorPda(FEE_RECIPIENT),
      })
      .instruction();

    instructionsArray.push(ATAinstruction, buyInstruction);

    const priorityIx = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: 1000, 
    });
    instructionsArray.push(priorityIx);

    const { blockhash } = await heliusConnection().getLatestBlockhash(
      "processed"
    );
    const wantsPrio = ["Low", "Medium", "High", "VeryHigh"].includes(prioFee);

    const messageV0 = new TransactionMessage({
      payerKey: recipientPublickey,
      recentBlockhash: blockhash,
      instructions: instructionsArray,
    }).compileToV0Message();

    const tx = new VersionedTransaction(messageV0);
    const serializedTransaction = Buffer.from(tx.serialize()).toString(
      "base64"
    );

    if (!wantsPrio) {
      return res.json({ serializedTransaction });
    }

    const priorityFee = await getPriorityFeeEstimate(
      bs58.encode(tx.serialize(), prioFee)
    );

    const prioIx = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: priorityFee,
    });

    const updatedInstructions = [prioIx, ...instructionsArray];

    const message = new TransactionMessage({
      payerKey: recipientPublickey,
      recentBlockhash: blockhash,
      instructions: updatedInstructions,
    }).compileToV0Message();

    const prioTx = new VersionedTransaction(message);
    const serialized = Buffer.from(prioTx.serialize()).toString("base64");

    return res.json({ serializedTransaction: serialized });
  } catch (error) {
    console.error("Buy Route Error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

export default pumpSingleBuyRouter;
