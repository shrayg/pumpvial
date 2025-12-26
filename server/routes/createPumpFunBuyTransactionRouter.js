import express from "express";
import anchor from "@coral-xyz/anchor";
import {
  heliusConnection,
  PUMP_AMM,
  solConnection,
  solConnectionExtra,
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
import { AccountLayout } from "@solana/spl-token";
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
  getPriorityFeeEstimate,
  getRandomTipAccount,
  getTokenCurve,
  sendJitoTransaction,
  waitForFinalizedTransaction,
} from "../utils/helpers.js";
import { requestTracker } from "../utils/requests.js";
import { tradeWalletsMap } from "../utils/loadtradewallets.js";
import { tradesCacheMap } from "../utils/tradescache.js";
import { calculateMarketcap } from "../../client/src/utils/functions.js";

const createPumpFunBuyTransactionRouter = express.Router();

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

createPumpFunBuyTransactionRouter.post("/", async (req, res) => {
  try {
    const {
      ca,
      solIn,
      recipient,
      prioFee = "High",
      slippage,
      creator,
      jitoTip,
    } = req.body;

    if (!ca || !solIn) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    requestTracker.totalRequests++;
    
    const apiKey = req.headers["x-api-key"];
    if (!apiKey || !apiKey.includes("-")) {
      return res.status(403).json({ error: "Invalid or missing API key" });
    }
    // Init program
    const provider = new anchor.AnchorProvider(
      solConnection(),
      new anchor.Wallet(Keypair.generate()),
      { commitment: "confirmed" }
    );

    const program = new anchor.Program(IDL, provider);

    const curveData = await getTokenCurve(ca, program);
    const virtual_token_reserves = Number(curveData.virtualTokenReserves);
    const virtual_sol_reserves = Number(curveData.virtualSolReserves);

    if (!curveData) {
      return res.status(404).json({ error: "Curve data not found" });
    }

    const PLATFORM_FEE =
      req.tier === "Apprentice"
        ? parseFloat(process.env.FEE_PERCENTAGE)
        : req.tier === "God"
        ? parseFloat(process.env.GOD_FEE_PERCENTAGE)
        : parseFloat(process.env.ALCHEMIST_FEE_PERCENTAGE);

    const recipientPublickey = new PublicKey(recipient);
    const mintPublickey = new PublicKey(ca);
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

    const totalFeePercentage = PLATFORM_FEE;

    const totalSolInLamports = Number(solIn) * LAMPORTS_PER_SOL;
    const totalFeesInLamports = Math.floor(
      totalSolInLamports * totalFeePercentage
    );
    const finalSolAmountInLamports = totalSolInLamports - totalFeesInLamports;

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

    const platformFeeAmountInLamports = Math.floor(
      totalSolInLamports * PLATFORM_FEE
    );

    const pumpAgentPlatformFeeInstruction = SystemProgram.transfer({
      fromPubkey: recipientPublickey,
      toPubkey: new PublicKey(process.env.FEE_WALLET),
      lamports: BigInt(platformFeeAmountInLamports),
    });

    instructionsArray.push(pumpAgentPlatformFeeInstruction);

    const tokenCreatorPublicKey = new PublicKey(creator);

    const [coinCreatorVaultAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("creator_vault"), tokenCreatorPublicKey.toBuffer()],
      PUMP_AMM
    );

    const coinCreatorVaultAta = getAssociatedTokenAddressSync(
      mintPublickey,
      coinCreatorVaultAuthority,
      true
    );

    // Default to 15% if no valid value
    const slip = !isNaN(slippage) ? slippage : 15;
    // Entered slippage of 15 should become 1.5
    const solInWithSlippage =
      (finalSolAmountInLamports / LAMPORTS_PER_SOL) * (1 + slip / 100);
    const { tokensBought } = getTokensForSolConstantProduct(
      finalSolAmountInLamports,
      virtual_sol_reserves,
      virtual_token_reserves
    );

    const buyInstruction = await program.methods
      .buy(
        new BN(tokensBought),
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
      })
      .instruction();

    instructionsArray.push(ATAinstruction, buyInstruction);

    const jitoTipInstruction = SystemProgram.transfer({
      fromPubkey: recipientPublickey,
      toPubkey: getRandomTipAccount(),
      lamports: BigInt(Number(jitoTip) * LAMPORTS_PER_SOL),
    });

    instructionsArray.push(jitoTipInstruction);

    const { blockhash } = await heliusConnection().getLatestBlockhash("finalized");

    const messageV0 = new TransactionMessage({
      payerKey: recipientPublickey,
      recentBlockhash: blockhash,
      instructions: instructionsArray,
    }).compileToV0Message();

    const tx = new VersionedTransaction(messageV0);

    const prioIx = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: !isNaN(prioFee)
        ? Math.floor(prioFee * 1e9)
        : await getPriorityFeeEstimate(bs58.encode(tx.serialize()), prioFee),
    });

    const updatedInstructions = [prioIx, ...instructionsArray];

    const rebuildMessageV0 = new TransactionMessage({
      payerKey: recipientPublickey,
      recentBlockhash: blockhash,
      instructions: updatedInstructions,
    }).compileToV0Message();
    const finalTx = new VersionedTransaction(rebuildMessageV0);

    const serializedTransaction = Buffer.from(finalTx.serialize()).toString("base64");

    const txResult = {
     recipient: recipientPublickey.toBase58(),
     tokensBought: Math.floor(tokensBought),
     solSpend: solInWithSlippage,
    };

    return res.json({ serializedTransaction, txResult });
  } catch (error) {
    console.error("Buy Route Error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

export default createPumpFunBuyTransactionRouter;
