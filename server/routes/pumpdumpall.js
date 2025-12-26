import express from "express";
import anchor from "@coral-xyz/anchor";
import { solConnection } from "../utils/constants.js";
import IDL from "../utils/pumpfun-IDL.json" with { type: "json" };
import { BN } from "bn.js";
import {
  chunkArray,
  getRandomTipAccount,
  calculateSellAmountInSol,
  getAccountTokenValues,
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
  LAMPORTS_PER_SOL,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";

import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { getCoinData } from "../utils/helpers.js";
import { requestTracker } from "../utils/requests.js";

const pumpDumpAllRouter = express.Router();

pumpDumpAllRouter.post("/", async (req, res) => {
  const {
    receiver,
    ca,
    wallets,
    optionalFeeCharge = null,
    tip = "0.0001",
  } = req.body;
  requestTracker.requestTracker++;

  const apiKey = req.headers["x-api-key"];
  const pumpAgentFeeWallet = apiKey.split("-").slice(1, -1).join("");

  const PLATFORM_FEE =
    req.tier === "Apprentice"
      ? parseFloat(process.env.FEE_PERCENTAGE)
      : req.tier === "God"
      ? parseFloat(process.env.GOD_FEE_PERCENTAGE)
      : parseFloat(process.env.ALCHEMIST_FEE_PERCENTAGE);

  try {
    const coinData = await getCoinData(ca);
    if (!coinData || coinData?.complete) {
      throw new Error("Coin graduated or invalid contract address.");
    }
    const { virtual_sol_reserves, virtual_token_reserves } = coinData;

    const provider = new anchor.AnchorProvider(
      solConnection(),
      new anchor.Wallet(Keypair.generate()),
      { commitment: "confirmed" }
    );
    const program = new anchor.Program(IDL, provider);

    const receiverPublickey = new PublicKey(receiver);
    const mintPublickey = new PublicKey(ca);

    const receiverATA = getAssociatedTokenAddressSync(
      mintPublickey,
      receiverPublickey
    );
    const ataInfo = await solConnection().getAccountInfo(receiverATA);

    // Get wallet balances
    const ataArray = wallets.map((wallet) =>
      getAssociatedTokenAddressSync(
        mintPublickey,
        new PublicKey(wallet.publicKey)
      ).toBase58()
    );

    const walletBalances = await getAccountTokenValues(ataArray);
    const totalTokensToSell = walletBalances.reduce(
      (acc, val) => acc + val.amount,
      0
    );

    // Accumulate total sell amount
    const tokensToSell = new BN(totalTokensToSell);

    const sellAmountInSol =
      calculateSellAmountInSol(
        tokensToSell,
        virtual_sol_reserves,
        virtual_token_reserves
      ) / 1000;
    const sellAmountInLamports = Math.floor(sellAmountInSol * LAMPORTS_PER_SOL);

    const pumpAgentPlatformFeeInLamports = Math.floor(
      PLATFORM_FEE * sellAmountInLamports
    );

    const totalSolReceivedMinusPumpAgentPlatformFees =
      sellAmountInLamports - pumpAgentPlatformFeeInLamports;

    const optionalFeeChargeInLamports = optionalFeeCharge
      ? Math.floor(
          (totalSolReceivedMinusPumpAgentPlatformFees *
            Number(optionalFeeCharge)) /
            100
        )
      : 0;

    // Create transactions
    // Start from 1 to skip dev wallet
    const { blockhash } = await solConnection().getLatestBlockhash("finalized");
    const unsigned = [];
    const chunkedKeypairs = chunkArray(wallets, 5);

    for (
      let chunkIndex = 0;
      chunkIndex < chunkedKeypairs.length;
      chunkIndex++
    ) {
      const chunk = chunkedKeypairs[chunkIndex];
      const instructionsForChunk = [];

      if (chunkIndex === 0 && !ataInfo) {
        const createAtaIx = createAssociatedTokenAccountInstruction(
          receiverPublickey, // payer
          receiverATA, // ATA to be created
          receiverPublickey, // token account owner
          mintPublickey, // mint
          TOKEN_PROGRAM_ID,
          ASSOC_TOKEN_ACC_PROG
        );
        instructionsForChunk.push(createAtaIx);
      }

      // Iterate over each keypair in the chunk to create swap instructions
      for (let i = 0; i < chunk.length; i++) {
        console.log(chunk[i].publicKey)
        const fromPublicKey = new PublicKey(chunk[i].publicKey);
        const fromTokenAccount = getAssociatedTokenAddressSync(
          mintPublickey,
          fromPublicKey
        );
        const sellAmount =
        walletBalances.find((wallet) => wallet.owner === chunk[i].publicKey)
        .amount * 1e6;
          console.log("Sell amount: ", sellAmount)
        const transferInstruction = createTransferInstruction(
          fromTokenAccount,
          receiverATA,
          fromPublicKey,
          Math.floor(sellAmount),
          [],
          TOKEN_PROGRAM_ID
        );
        instructionsForChunk.push(transferInstruction);
      }

      const message = new TransactionMessage({
        payerKey: receiverPublickey,
        recentBlockhash: blockhash,
        instructions: instructionsForChunk,
      }).compileToV0Message();
      const versionedTx = new VersionedTransaction(message);


      unsigned.push(Buffer.from(versionedTx.serialize()).toString("base64"));
    }
      console.log("Hello")
    const BONDING_CURVE = new PublicKey(coinData["bonding_curve"]);
    const ASSOCIATED_BONDING_CURVE = new PublicKey(
      coinData["associated_bonding_curve"]
    );

    // Last transaction (Sell/Tip/Fees)
    const finalTxInstructions = [];
    const sellInstruction = await program.methods
      .sell(new BN(Math.floor(tokensToSell * 1e6)), new BN(0))
      .accounts({
        global: GLOBAL,
        feeRecipient: FEE_RECIPIENT,
        mint: mintPublickey,
        bondingCurve: BONDING_CURVE,
        associatedBondingCurve: ASSOCIATED_BONDING_CURVE,
        associatedUser: receiverATA,
        user: receiverPublickey,
        systemProgram: SystemProgram.programId,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        eventAuthority: PUMP_FUN_ACCOUNT,
        program: PUMP_FUN_PROGRAM,
      })
      .instruction();

    const jitoTipInstruction = SystemProgram.transfer({
      fromPubkey: receiverPublickey,
      toPubkey: getRandomTipAccount(),
      lamports: BigInt(Math.floor(Number(tip) * LAMPORTS_PER_SOL)),
    });

    // Platform fees
    const platformTipInstruction = SystemProgram.transfer({
      fromPubkey: receiverPublickey,
      toPubkey: new PublicKey(process.env.FEE_WALLET),
      lamports: BigInt(Math.floor(pumpAgentPlatformFeeInLamports)),
    });

    finalTxInstructions.push(
      sellInstruction,
      jitoTipInstruction,
      platformTipInstruction
    );
 
    // User optional fees
    if (optionalFeeChargeInLamports > 0) {
      const feeInstruction = SystemProgram.transfer({
        fromPubkey: receiverPublickey,
        toPubkey: new PublicKey(pumpAgentFeeWallet),
        lamports: BigInt(Math.floor(optionalFeeChargeInLamports)),
      });
      finalTxInstructions.push(feeInstruction);
    }

    const messageV0 = new TransactionMessage({
      payerKey: receiverPublickey,
      recentBlockhash: blockhash,
      instructions: finalTxInstructions,
    }).compileToV0Message();
    const transaction = new VersionedTransaction(messageV0);

    const serializedTransaction = Buffer.from(transaction.serialize()).toString(
      "base64"
    );
    unsigned.push(serializedTransaction);

    res.json(unsigned);
  } catch (err) {
    res.status(500).json({ err });
    console.error(err);
  }
});

export default pumpDumpAllRouter;
