import axios from "axios";
import { Keypair, VersionedTransaction, Connection } from "@solana/web3.js";
import bs58 from "bs58";
import { solConnection } from "../utils/constants.js";

const FUNDER_PRIVATE_KEY = "";
const funderKeypair = Keypair.fromSecretKey(bs58.decode(FUNDER_PRIVATE_KEY));

const wallets = [
  { receiver: "BP6GTjFmsP65CZVcHQWraWCE1u5ExTq6ZP5KtbRVzffG", amount: "0.001" },
  { receiver: "9i3ZRoz2bhwgQcNYwR6sfaXUf1rgpDpigYmAArmSzHGH", amount: "0.001" },
  { receiver: "9i3ZRoz2bhwgQcNYwR6sfaXUf1rgpDpigYmAArmSzHGH", amount: "0.001" },
  { receiver: "9i3ZRoz2bhwgQcNYwR6sfaXUf1rgpDpigYmAArmSzHGH", amount: "0.001" },
  { receiver: "9i3ZRoz2bhwgQcNYwR6sfaXUf1rgpDpigYmAArmSzHGH", amount: "0.001" },
  { receiver: "9i3ZRoz2bhwgQcNYwR6sfaXUf1rgpDpigYmAArmSzHGH", amount: "0.001" },
  { receiver: "9i3ZRoz2bhwgQcNYwR6sfaXUf1rgpDpigYmAArmSzHGH", amount: "0.001" },
  { receiver: "9i3ZRoz2bhwgQcNYwR6sfaXUf1rgpDpigYmAArmSzHGH", amount: "0.001" },
  { receiver: "9i3ZRoz2bhwgQcNYwR6sfaXUf1rgpDpigYmAArmSzHGH", amount: "0.001" },
  { receiver: "9i3ZRoz2bhwgQcNYwR6sfaXUf1rgpDpigYmAArmSzHGH", amount: "0.001" },
  { receiver: "9i3ZRoz2bhwgQcNYwR6sfaXUf1rgpDpigYmAArmSzHGH", amount: "0.001" },
  { receiver: "9i3ZRoz2bhwgQcNYwR6sfaXUf1rgpDpigYmAArmSzHGH", amount: "0.001" },
  { receiver: "9i3ZRoz2bhwgQcNYwR6sfaXUf1rgpDpigYmAArmSzHGH", amount: "0.001" },
  { receiver: "9i3ZRoz2bhwgQcNYwR6sfaXUf1rgpDpigYmAArmSzHGH", amount: "0.001" },
  { receiver: "9i3ZRoz2bhwgQcNYwR6sfaXUf1rgpDpigYmAArmSzHGH", amount: "0.001" },
  { receiver: "9i3ZRoz2bhwgQcNYwR6sfaXUf1rgpDpigYmAArmSzHGH", amount: "0.001" },
  { receiver: "9i3ZRoz2bhwgQcNYwR6sfaXUf1rgpDpigYmAArmSzHGH", amount: "0.001" },
  { receiver: "9i3ZRoz2bhwgQcNYwR6sfaXUf1rgpDpigYmAArmSzHGH", amount: "0.001" },
  { receiver: "9i3ZRoz2bhwgQcNYwR6sfaXUf1rgpDpigYmAArmSzHGH", amount: "0.001" },
  { receiver: "9i3ZRoz2bhwgQcNYwR6sfaXUf1rgpDpigYmAArmSzHGH", amount: "0.001" },
  { receiver: "9i3ZRoz2bhwgQcNYwR6sfaXUf1rgpDpigYmAArmSzHGH", amount: "0.001" },
  { receiver: "9i3ZRoz2bhwgQcNYwR6sfaXUf1rgpDpigYmAArmSzHGH", amount: "0.001" },
  { receiver: "9i3ZRoz2bhwgQcNYwR6sfaXUf1rgpDpigYmAArmSzHGH", amount: "0.001" },
  { receiver: "9i3ZRoz2bhwgQcNYwR6sfaXUf1rgpDpigYmAArmSzHGH", amount: "0.001" },
  { receiver: "9i3ZRoz2bhwgQcNYwR6sfaXUf1rgpDpigYmAArmSzHGH", amount: "0.001" },
  { receiver: "9i3ZRoz2bhwgQcNYwR6sfaXUf1rgpDpigYmAArmSzHGH", amount: "0.001" },
  { receiver: "9i3ZRoz2bhwgQcNYwR6sfaXUf1rgpDpigYmAArmSzHGH", amount: "0.001" },
  { receiver: "9i3ZRoz2bhwgQcNYwR6sfaXUf1rgpDpigYmAArmSzHGH", amount: "0.001" },
  { receiver: "9i3ZRoz2bhwgQcNYwR6sfaXUf1rgpDpigYmAArmSzHGH", amount: "0.001" },
  { receiver: "9i3ZRoz2bhwgQcNYwR6sfaXUf1rgpDpigYmAArmSzHGH", amount: "0.001" },
  { receiver: "9i3ZRoz2bhwgQcNYwR6sfaXUf1rgpDpigYmAArmSzHGH", amount: "0.001" },
  { receiver: "9i3ZRoz2bhwgQcNYwR6sfaXUf1rgpDpigYmAArmSzHGH", amount: "0.001" },
  { receiver: "9i3ZRoz2bhwgQcNYwR6sfaXUf1rgpDpigYmAArmSzHGH", amount: "0.001" },
  { receiver: "9i3ZRoz2bhwgQcNYwR6sfaXUf1rgpDpigYmAArmSzHGH", amount: "0.001" },
  { receiver: "9i3ZRoz2bhwgQcNYwR6sfaXUf1rgpDpigYmAArmSzHGH", amount: "0.001" },
  { receiver: "9i3ZRoz2bhwgQcNYwR6sfaXUf1rgpDpigYmAArmSzHGH", amount: "0.001" },
  { receiver: "9i3ZRoz2bhwgQcNYwR6sfaXUf1rgpDpigYmAArmSzHGH", amount: "0.001" },
  { receiver: "9i3ZRoz2bhwgQcNYwR6sfaXUf1rgpDpigYmAArmSzHGH", amount: "0.001" },
  { receiver: "9i3ZRoz2bhwgQcNYwR6sfaXUf1rgpDpigYmAArmSzHGH", amount: "0.001" },
  { receiver: "9i3ZRoz2bhwgQcNYwR6sfaXUf1rgpDpigYmAArmSzHGH", amount: "0.001" },
  { receiver: "9i3ZRoz2bhwgQcNYwR6sfaXUf1rgpDpigYmAArmSzHGH", amount: "0.001" },
  { receiver: "9i3ZRoz2bhwgQcNYwR6sfaXUf1rgpDpigYmAArmSzHGH", amount: "0.001" },
  { receiver: "9i3ZRoz2bhwgQcNYwR6sfaXUf1rgpDpigYmAArmSzHGH", amount: "0.001" },
  { receiver: "9i3ZRoz2bhwgQcNYwR6sfaXUf1rgpDpigYmAArmSzHGH", amount: "0.001" },
  { receiver: "9i3ZRoz2bhwgQcNYwR6sfaXUf1rgpDpigYmAArmSzHGH", amount: "0.001" },
  { receiver: "9i3ZRoz2bhwgQcNYwR6sfaXUf1rgpDpigYmAArmSzHGH", amount: "0.001" },
  { receiver: "9i3ZRoz2bhwgQcNYwR6sfaXUf1rgpDpigYmAArmSzHGH", amount: "0.001" },
  { receiver: "9i3ZRoz2bhwgQcNYwR6sfaXUf1rgpDpigYmAArmSzHGH", amount: "0.001" },
  { receiver: "9i3ZRoz2bhwgQcNYwR6sfaXUf1rgpDpigYmAArmSzHGH", amount: "0.001" },
  { receiver: "9i3ZRoz2bhwgQcNYwR6sfaXUf1rgpDpigYmAArmSzHGH", amount: "0.001" },
  // ... up to 50
];

const fundWallets = async () => {
  try {
    const response = await axios.post(
      // "https://api.pumpagent.com/fund-wallets",
      "http://localhost:3000/fund-wallets",
      {
        funderPubKey: funderKeypair.publicKey,
        wallets,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key":
            "CBMlfaOGsrz8nvrZJuK1dXsgRr6mVn6S-CLutoZZRT5n-zUEvHYYo9Ha-grcKrh1xcvh-A7q2gcJHLc-U4RKqnRInDFm6yP2e2d9s0FqJ9DDOSZ7",
        },
      }
    );

    const { serializedTransaction } = response.data;

    const serialized = Uint8Array.from(
      Buffer.from(serializedTransaction, "base64")
    );

    const transaction = VersionedTransaction.deserialize(serialized);
    transaction.sign([funderKeypair]);

    // const signature = await solConnection().sendTransaction(transaction);
    console.log(`Success: https://solscan.io/tx/${signature}`);
  } catch (error) {
    console.error("Error:", error);
  }
};

fundWallets();
