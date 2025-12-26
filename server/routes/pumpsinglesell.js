import express from "express";
import anchor from "@coral-xyz/anchor";
import {
  heliusConnection,
  PUMP_AMM,
  solConnection,
} from "../utils/constants.js";
import IDL from "../utils/pumpfun-IDL.json" with { type: "json" };
import BN from "bn.js";
import {
  PUMP_FUN_PROGRAM,
  TOKEN_PROGRAM_ID,
  ASSOC_TOKEN_ACC_PROG,
  PUMP_FUN_ACCOUNT,
  GLOBAL,
  FEE_RECIPIENT,
} from "../utils/constants.js";
import bs58 from "bs58";
import {
  calculateSellAmountInSol,
  getCachedBlockhash,
  getPriorityFeeEstimate,
} from "../utils/helpers.js";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionMessage,
  VersionedTransaction,
  LAMPORTS_PER_SOL,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { requestTracker } from "../utils/requests.js";

const pumpSingleSellRouter = express.Router();

pumpSingleSellRouter.post("/", async (req, res) => {
  try {
    requestTracker.requestTracker++;

    const {
      recipient,
      ca,
      tokenAmount,
      optionalFeeCharge = null,
      prioFee = null,
    } = req.body;

    const apiKey = req.headers["x-api-key"];
    if (!apiKey || typeof apiKey !== "string") {
      return res.status(400).json({ error: "Missing or invalid API key" });
    }

    if (!recipient || !ca || !tokenAmount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    let recipientPublickey, mintPublickey;
    try {
      recipientPublickey = new PublicKey(recipient);
      mintPublickey = new PublicKey(ca);
    } catch (e) {
      return res.status(400).json({ error: "Invalid public key format" });
    }

    const PLATFORM_FEE =
      req.tier === "Apprentice"
        ? parseFloat(process.env.FEE_PERCENTAGE)
        : req.tier === "God"
        ? parseFloat(process.env.GOD_FEE_PERCENTAGE)
        : parseFloat(process.env.ALCHEMIST_FEE_PERCENTAGE);

    const pumpAgentFeeWallet = apiKey.split("-").slice(1, -1).join("");

    const provider = new anchor.AnchorProvider(
      solConnection(),
      new anchor.Wallet(Keypair.generate()),
      { commitment: "confirmed" }
    );

    const program = new anchor.Program(IDL, provider);
    const instructionsArray = [];

    const [global] = PublicKey.findProgramAddressSync(
      [Buffer.from("global")],
      PUMP_FUN_PROGRAM
    );
    const account = await program.account.global.fetch(global);
    const initialTokenReserves = Number(account.initialVirtualTokenReserves);
    const initialSolReserves = Number(account.initialVirtualSolReserves);

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

    const [bondingCurvePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("bonding-curve"), mintPublickey.toBuffer()],
      PUMP_FUN_PROGRAM
    );

    const accountInfo = await solConnection().getAccountInfo(bondingCurvePDA);
    if (!accountInfo) {
      return res.status(404).json({ error: "Bonding curve account not found" });
    }

    const tokenCreatorPublicKey = new PublicKey(accountInfo.data.slice(49, 81));

    const [coinCreatorVaultAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("creator_vault"), tokenCreatorPublicKey.toBuffer()],
      PUMP_AMM
    );

    const coinCreatorVaultAta = getAssociatedTokenAddressSync(
      mintPublickey,
      coinCreatorVaultAuthority,
      true
    );

    const sellInstruction = await program.methods
      .sell(new BN(tokenAmount * 1e6), new BN(0))
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
      })
      .instruction();

    instructionsArray.push(ATAinstruction, sellInstruction);

    const sellAmountSol = calculateSellAmountInSol(
      tokenAmount,
      initialSolReserves,
      initialTokenReserves
    );

    const baseFeeLamports = Math.floor(
      sellAmountSol * LAMPORTS_PER_SOL * PLATFORM_FEE
    );

    const feeTransferInstruction = SystemProgram.transfer({
      fromPubkey: recipientPublickey,
      toPubkey: new PublicKey(process.env.FEE_WALLET),
      lamports: BigInt(baseFeeLamports),
    });
    instructionsArray.push(feeTransferInstruction);

    if (optionalFeeCharge) {
      const optionalFeeChargeFeeAmount = Math.floor(
        ((sellAmountSol * LAMPORTS_PER_SOL - baseFeeLamports) *
          Number(optionalFeeCharge)) /
          100
      );

      instructionsArray.push(
        SystemProgram.transfer({
          fromPubkey: recipientPublickey,
          toPubkey: new PublicKey(pumpAgentFeeWallet),
          lamports: BigInt(optionalFeeChargeFeeAmount),
        })
      );
    }

    const priorityIx = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: 1000,
    });
    instructionsArray.push(priorityIx);

    const wantsPrio = ["Low", "Medium", "High", "VeryHigh"].includes(prioFee);
    const { blockhash } = await heliusConnection().getLatestBlockhash(
      "confirmed"
    );

    const messageV0 = new TransactionMessage({
      payerKey: recipientPublickey,
      recentBlockhash: blockhash,
      instructions: instructionsArray,
    }).compileToV0Message();

    const tx = new VersionedTransaction(messageV0);

    if (!wantsPrio) {
      return res.json({
        serializedTransaction: Buffer.from(tx.serialize()).toString("base64"),
      });
    }

    const prioIx = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: await getPriorityFeeEstimate(
        bs58.encode(tx.serialize()),
        prioFee
      ),
    });

    const updatedInstructions = [prioIx, ...instructionsArray];

    const message = new TransactionMessage({
      payerKey: recipientPublickey,
      recentBlockhash: blockhash,
      instructions: updatedInstructions,
    }).compileToV0Message();

    const prioTx = new VersionedTransaction(message);

    return res.json({
      serializedTransaction: Buffer.from(prioTx.serialize()).toString("base64"),
    });
  } catch (err) {
    console.error("Sell route error:", err);
    return res.status(500).json({
      error: "An unexpected error occurred",
      message: err?.message || "Internal Server Error",
    });
  }
});

export default pumpSingleSellRouter;
