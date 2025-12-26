import { VersionedTransaction, Connection, Keypair } from "@solana/web3.js";
import axios from "axios";
import bs58 from "bs58";

const RPC = "https://api.mainnet-beta.solana.com"; // Premium RPC (i.e. Helius) recommended
const connection = new Connection(RPC_URL, "confirmed");
const RECIPIENT_PRIVATE_KEY = "Enter token recipient's private key.";
const recipient = Keypair.fromSecretKey(bs58.decode(RECIPIENT_PRIVATE_KEY));

const buyDexSingle = async () => {
  const URL = "https://api.pumpagent.com/dex-single-sell";
  const payload = {
    recipient: recipient.publicKey,
    ca: "7iagMTDPfNSR5zVcERT1To7A9eaQoz58dJAh42EMHcCC",
    tokenAmount: "50000",
  };

  try {
    const request = await axios.post(URL, payload, {
      headers: { "Content-Type": "application/json" },
    });

    const { serializedTransaction } = request.data;
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

buyDexSingle();
