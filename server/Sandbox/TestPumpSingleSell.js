import { Keypair, VersionedTransaction, Connection } from "@solana/web3.js";
import bs58 from "bs58";
import { heliusKey } from "../utils/constants.js";

const RPC_URL = ""; // Visit Helius.dev
const connection = new Connection(RPC_URL, "confirmed");
const RECIPIENT_PRIVATE_KEY = "";
const recipient = Keypair.fromSecretKey(bs58.decode(RECIPIENT_PRIVATE_KEY));

const optionalFeeCharge = {
  receiver: "Enter fee recipient's wallet address.",
  percentage: "1.5",
};

const sellPumpSingle = async () => {
  const URL = "https://api.pumpagent.com/pump-single-sell";
  const payload = {
    recipient: recipient.publicKey,
    ca: "93xHZCeaRxL7iwRQUPcW7utRbKF5UhMmaSQW9pdEpump",
    tokenAmount: "30000",
    optionalFeeCharge,
  };

  try {
    const response = await fetch(URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const { serializedTransaction } = await response.json();
    const serialized = Uint8Array.from(
      Buffer.from(serializedTransaction, "base64")
    );

    const transaction = VersionedTransaction.deserialize(serialized);
    transaction.sign([recipient]);

    const signature = await connection.sendTransaction(transaction);
    console.log(`Success: https://solscan.io/tx/${signature}`);
  } catch (error) {
    console.error("Error:", error);
  }
};

sellPumpSingle();
