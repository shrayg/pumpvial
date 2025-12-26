import express from "express";
import {
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { heliusConnection, solConnection } from "../utils/constants.js";
import { requestTracker } from "../utils/requests.js";
import { getCachedBlockhash } from "../utils/helpers.js";
const claimProfitsRouter = express.Router();

claimProfitsRouter.post("/", async (req, res) => {
  const { funderPubKey, solIn } = req.body || {};
  requestTracker.totalRequests++;

  const apiKey = req.headers["x-api-key"];
  const pumpAgentDashboardWallet = apiKey.split("-").slice(1, -1).join("");

  const funder = new PublicKey(funderPubKey);

  const { blockhash } = await heliusConnection().getLatestBlockhash(
    "finalized"
  );
  const transferInstructions = SystemProgram.transfer({
    fromPubkey: funder,
    toPubkey: new PublicKey(pumpAgentDashboardWallet),
    lamports: BigInt(Math.floor(Number(solIn) * 1e9)),
  });

  const messageV0 = new TransactionMessage({
    payerKey: funder,
    recentBlockhash: blockhash,
    instructions: [transferInstructions],
  }).compileToV0Message();
  const transaction = new VersionedTransaction(messageV0);

  const serializedTransaction = Buffer.from(transaction.serialize()).toString(
    "base64"
  );

  res.json({ serializedTransaction });
});

export default claimProfitsRouter;
