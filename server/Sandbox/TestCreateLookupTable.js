import { Keypair, VersionedTransaction, Connection } from "@solana/web3.js";
import axios from "axios";
import bs58 from "bs58";
import { heliusKey } from "../utils/constants";

const RPC_URL = ""; // Visit Helius.dev
const connection = new Connection(RPC_URL, "confirmed");
const CREATOR_PRIVATE_KEY = "";
const creatorKeypair = Keypair.fromSecretKey(bs58.decode(CREATOR_PRIVATE_KEY));

const wallets = [
  "BP6GTjFmsP65CZVcHQWraWCE1u5ExTq6ZP5KtbRVzffG",
  "9i3ZRoz2bhwgQcNYwR6sfaXUf1rgpDpigYmAArmSzHGH",
  // ... up to 20
];

const createLookupTable = async () => {
  try {
    const response = await axios.post(
      "https://api.pumpagent.com/create-lookup-table",
      {
        creator: creatorKeypair.publicKey,
      }
    );

    const { serializedTransaction, lut } = response.data;
    const serialized = Uint8Array.from(
      Buffer.from(serializedTransaction, "base64")
    );

    const transaction = VersionedTransaction.deserialize(serialized);
    transaction.sign([creatorKeypair]);

    const signature = await connection.sendTransaction(transaction);
    console.log(`Success: https://solscan.io/tx/${signature}`);
    console.log("Lookup Table Address: ", lut);

    return lut;
  } catch (error) {
    console.error("Error:", error);
  }
};

const extendLookupTable = async () => {
  const lut = await createLookupTable();

  try {
    const response = await axios.post(
      "https://api.pumpagent.com/extend-lookup-table",
      {
        creator: creatorKeypair.publicKey,
        wallets,
        lut,
      }
    );

    const { serializedTransaction } = response.data;
    const serialized = Uint8Array.from(atob(serializedTransaction), (c) =>
      c.charCodeAt(0)
    );

    const transaction = VersionedTransaction.deserialize(serialized);
    transaction.sign([creatorKeypair]);

    const signature = await connection.sendTransaction(transaction);
    console.log(`Success: https://solscan.io/tx/${signature}`);
  } catch (error) {
    console.error("Error:", error);
  }
};

extendLookupTable();
