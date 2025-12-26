import { Keypair, VersionedTransaction, Connection } from "@solana/web3.js";
import bs58 from "bs58";
import { solConnection } from "../utils/constants.js";

const RECIPIENT_PRIVATE_KEY = "";
const recipient = Keypair.fromSecretKey(bs58.decode(RECIPIENT_PRIVATE_KEY));

const buyPumpSingle = async () => {
  // const URL = "https://api.pumpagent.com/pump-single-buy";
  const URL = "http://localhost:3000/pump-single-buy";
  const payload = {
    recipient: recipient.publicKey,
    ca: "Gu6tdujVg5W5JiA6h6azL3VrhC2BZUErSXnM2TYJpump",
    solIn: "0.0001",
  };

  try {
    const response = await fetch(URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key":
          "CBMlfaOGsrz8nvrZJuK1dXsgRr6mVn6S-CLutoZZRT5n-zUEvHYYo9Ha-grcKrh1xcvh-A7q2gcJHLc-U4RKqnRInDFm6yP2e2d9s0FqJ9DDOSZ7",
      },
      body: JSON.stringify(payload),
    });

    const { serializedTransaction } = await response.json();
    const serialized = Uint8Array.from(
      Buffer.from(serializedTransaction, "base64")
    );

    const transaction = VersionedTransaction.deserialize(serialized);
    transaction.sign([recipient]);

    const signature = await solConnection().sendTransaction(transaction);
    console.log(`Success: https://solscan.io/tx/${signature}`);
  } catch (error) {
    console.error("Error:", error);
  }
};

buyPumpSingle();
