import { Keypair, VersionedTransaction, Connection } from "@solana/web3.js";
import bs58 from "bs58";
import axios from "axios";
import { heliusKey } from "../utils/constants";

/////////////////////////////// CONFIG //////////////////////////////////////
const connection = new Connection(
  `https://mainnet.helius-rpc.com/?api-key=${heliusKey()}`
);
const FUNDER_PRIVATE_KEY = "";
const funderKeypair = Keypair.fromSecretKey(bs58.decode(FUNDER_PRIVATE_KEY));
//////////////////////////////// END ////////////////////////////////////////

const payload = {
  funderPubKey: funderKeypair.publicKey,
  solIn: "0.15",
};

const claimProfits = async () => {
  const URL = "https://api.pumpagent.com/claim-profits";

  try {
    const request = await axios.post(URL, payload, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.PUMPAGENT_API_KEY,
      },
    });

    const { serializedTransaction } = request.data;
    const serialized = Uint8Array.from(
      Buffer.from(serializedTransaction, "base64")
    );

    const transaction = VersionedTransaction.deserialize(serialized);
    transaction.sign([funderKeypair]);

    const signature = await connection.sendTransaction(transaction);
    console.log(
      `Profits claimed to dashboard: https://solscan.io/tx/${signature}`
    );
  } catch (error) {
    console.error("Error:", error);
  }
};

claimProfits();
