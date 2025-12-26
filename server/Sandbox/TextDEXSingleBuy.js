import { VersionedTransaction, Keypair } from "@solana/web3.js";
import axios from "axios";
import bs58 from "bs58";
import { solConnection } from "../utils/constants.js";

const RECIPIENT_PRIVATE_KEY = "";
const recipient = Keypair.fromSecretKey(bs58.decode(RECIPIENT_PRIVATE_KEY));

const buyDexSingle = async () => {
  // const URL = "https://api.pumpagent.com/dex-single-buy";
  const URL = "http://localhost:3000/dex-single-buy";
  const payload = {
    recipient: recipient.publicKey,
    ca: "6ZS4xPTjjFzB5kXyvQvcZvNSGgwxweymVJQkig6Hpump",
    solIn: "0.0001",
  };

  try {
    const request = await axios.post(URL, payload, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key":
          "EzA1XfYGR9kuBW1herClf7ftR6bgH7tD-8AcxXr9Jtye-CxJH9viGNS4-ydU8iWYE1rx-GqWxiCjQjGf-88ozHIVIYs0jsTLdk9ds3uVqtMhbK2Im",
      },
    });

    const { serializedTransaction } = request.data;
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

buyDexSingle();
