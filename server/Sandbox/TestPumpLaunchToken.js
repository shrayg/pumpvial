import { VersionedTransaction, Connection, Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { heliusKey } from "../utils/constants.js";

const RPC_URL = ""; // Visit Helius.dev
const connection = new Connection(RPC_URL, "confirmed");
const DEVELOPER_PRIVATE_KEY = "";
const developer = Keypair.fromSecretKey(bs58.decode(DEVELOPER_PRIVATE_KEY));

const pumpLaunchToken = async () => {
  const URL = "https://api.pumpagent.com/pump-launch-token";
  const payload = {
    developer: developer.publicKey,
    solIn: "0.001",
    name: "Pump Meme",
    symbol: "Pump",
    uri: "https://ipfs.io/ipfs/QmenHsZ3EJRmxrbfyyXWyGUzUYE7UtfZK2xjFwjGeKWbj9",
    // optionalFeeCharge,
  };

  try {
    const request = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const { serializedTransaction, mint } = request.data;
    const serialized = Uint8Array.from(
      Buffer.from(serializedTransaction, "base64")
    );

    const transaction = VersionedTransaction.deserialize(serialized);
    const mintKeyPair = Keypair.fromSecretKey(bs58.decode(mint));

    transaction.sign([developer, mintKeyPair]);
    const signature = await connection.sendTransaction(transaction);

    const ca = mintKeyPair.publicKey.toBase58();
    console.log(`Token Launched: https://pump.fun/${ca}`);
  } catch (error) {
    console.error("Error:", error);
  }
};

pumpLaunchToken();
