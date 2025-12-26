import express from "express";
import anchor from "@coral-xyz/anchor";
import { heliusConnection, PUMP_AMM, solConnection } from "../utils/constants.js";
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
  getCachedBlockhash,
  getPriorityFeeEstimate,
  globalVolumeAccumulatorPda,
  userVolumeAccumulatorPda
} from "../utils/helpers.js";

import {
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { requestTracker } from "../utils/requests.js";
import bs58 from "bs58";
import { tradeWalletsMap } from "../utils/loadtradewallets.js";

const koltraderBumpRouter = express.Router();

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

koltraderBumpRouter.post("/", async (req, res) => {
  try {
    const {
      recipient,
      ca,
      solIn,
    } = req.body;
    requestTracker.requestTracker++;

    const apiKey = req.headers["x-api-key"];
    if (!apiKey) {
      return res.status(400).json({ error: "Missing API key" });
    }
    const pumpAgentFeeWallet = apiKey.split("-").slice(1, -1).join("");
    if (!pumpAgentFeeWallet) {
      return res.status(400).json({ error: "Invalid API Key" });
    }

    if (!recipient || !ca || !solIn) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const PLATFORM_FEE =
      req.tier === "Apprentice"
        ? parseFloat(process.env.BUMP_FEE_PERCENTAGE)
        : req.tier === "God"
        ? parseFloat(process.env.GOD_FEE_PERCENTAGE)
        : parseFloat(process.env.ALCHEMIST_BUMP_FEE_PERCENTAGE);

    const recipientPublickey = new PublicKey(recipient);
    const traderKeypair = Keypair.fromSecretKey(
      bs58.decode(tradeWalletsMap.get(recipient))
    );
    const mintPublickey = new PublicKey(ca);

    const provider = new anchor.AnchorProvider(
      solConnection(),
      new anchor.Wallet(Keypair.generate()),
      { commitment: "confirmed" }
    );
    const program = new anchor.Program(IDL, provider);

    const [bondingCurve] = PublicKey.findProgramAddressSync(
      [Buffer.from("bonding-curve"), mintPublickey.toBytes()],
      program.programId
    );

    const struct = await program.account.bondingCurve.fetch(bondingCurve);

    const virtualSolReseres = Number(struct.virtualSolReserves);

    const virtualTokenReserves = Number(struct.virtualTokenReserves);

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

    const { tokensBought } = getTokensForSolConstantProduct(
      finalSolAmountInLamports,
      virtualSolReseres,
      virtualTokenReserves
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

    const instructionsArray = [
      SystemProgram.transfer({
        fromPubkey: recipientPublickey,
        toPubkey: new PublicKey(process.env.FEE_WALLET),
        lamports: BigInt(platformFeeAmountInLamports),
      }),
    ];


    const [bondingCurvePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("bonding-curve"), mintPublickey.toBuffer()],
      PUMP_FUN_PROGRAM
    );

    const accountInfo = await solConnection().getAccountInfo(bondingCurvePDA);
    if (!accountInfo) {
      return res.status(404).json({ error: "Bonding curve account not found" });
    }

    const data = accountInfo.data;
    const tokenCreatorPublicKey = new PublicKey(data.slice(49, 81));

    const [coinCreatorVaultAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("creator_vault"), tokenCreatorPublicKey.toBuffer()],
      PUMP_AMM
    );

    const coinCreatorVaultAta = getAssociatedTokenAddressSync(
      mintPublickey,
      coinCreatorVaultAuthority,
      true
    );

    const solInWithSlippage = Number(
      (finalSolAmountInLamports / LAMPORTS_PER_SOL) * (1 + 0.1)
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
        associatedBondingCurve,
        associatedUser: ata,
        user: recipientPublickey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
        eventAuthority: PUMP_FUN_ACCOUNT,
        program: PUMP_FUN_PROGRAM,
        creator_vault: coinCreatorVaultAta,
        global_volume_accumulator: globalVolumeAccumulatorPda(),
        user_volume_accumulator: userVolumeAccumulatorPda(FEE_RECIPIENT)
      })
      .instruction();

    instructionsArray.push(ATAinstruction, buyInstruction);
    const sellInstruction = await program.methods
      .sell(new BN(tokensBought), new BN(0))
      .accounts({
        global: GLOBAL,
        feeRecipient: FEE_RECIPIENT,
        mint: mintPublickey,
        bondingCurve,
        associatedBondingCurve,
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

    instructionsArray.push(sellInstruction);

  const { blockhash } = await heliusConnection().getLatestBlockhash("finalized");

    const messageV0 = new TransactionMessage({
      payerKey: recipientPublickey,
      recentBlockhash: blockhash,
      instructions: instructionsArray,
    }).compileToV0Message();
    const tx = new VersionedTransaction(messageV0);
 
    const prioIx = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: await getPriorityFeeEstimate(
        bs58.encode(tx.serialize(), "High")
      ),
    });

    const updatedInstructions = [prioIx, ...instructionsArray];

    const message = new TransactionMessage({
      payerKey: recipientPublickey,
      recentBlockhash: blockhash,
      instructions: updatedInstructions,
    }).compileToV0Message();

    const prioTx = new VersionedTransaction(message);
    prioTx.sign([traderKeypair]);

    const txid = await heliusConnection().sendTransaction(prioTx, {
      maxRetries: 5,
    });
    await heliusConnection().getTransaction(txid, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });

    return res.json({ success: txid });
  } catch (error) {
    console.error("Error in pumpTokenBumpRouter:", error);

    return res.status(500).json({
      error: "Internal server error",
      message: error?.message || "Unknown error occurred",
    });
  }
});

export default koltraderBumpRouter;
