import { VersionedTransaction, Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import axios from "axios";

const FUNDER_PRIVATE_KEY = "";
const funder = Keypair.fromSecretKey(bs58.decode(FUNDER_PRIVATE_KEY));

const fullWalletData = [
  {
    // First object is the developer
    publicKey: "6tVgXDen9nVZNyF3j6thUA5c3jqX1kvhgJ9pS4YkACFE",
    privateKey:
      "3yNEYG6ZSsWKGhHP3UWSauBH4oRnSvTFmUYgKi3KBnomq8WtiqKDxVKjknKHZnNGfK1QYTXxxxs5MpAjd9KQ1Xt8",
    solBuy: "0.001",
  },
  {
    // Buyer 1
    publicKey: "GmnSscY9ewz6eNtSiAHX1QmrFCDzd7bu81wQTQnhj7Zp",
    privateKey:
      "3ahKrdWB4yaszZ2die11rnUwdbUHLxfrLVDDz2GVyGwmFwALRBQBgX5zo2TqfAsx5kLurk1Eo7JrfPo2MCJ46uGi",
    solBuy: "0.002",
  },
  // ... up to 20
];

const optionalFeeCharge = {
  receiver: "BU3pd9YZ3kiaL4SAhqwtLAf9w7EshZBvp6ETT4B2F94V",
  percentage: "1.5",
};

// Filter out private keys before sending to our server
const sanitizedWallets = fullWalletData.map(({ privateKey, ...rest }) => rest);

const lut = "HhwJF8rZnpj8jEYBmVDdSFNiJrxYtRMDHg2Xxztcvohq";

const pumpLaunchBundle = async () => {
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
    const request = await axios.post(URL, payload, {
      headers: { "Content-Type": "application/json" },
    });
    const { unsigned, ca } = request.data;

    const completedTransactions = unsigned.map((base64Tx, i) => {
      const serialized = Uint8Array.from(Buffer.from(base64Tx, "base64"));
      const tx = VersionedTransaction.deserialize(serialized);

      const signers = [];
      if (i === 0) {
        signers.push(
          Keypair.fromSecretKey(bs58.decode(fullWalletData[0].privateKey)),
          funder
        );
      } else {
        const start = 1 + (i - 1) * 5;
        const chunk = fullWalletData.slice(start, start + 5);
        signers.push(
          ...chunk.map(({ privateKey }) =>
            Keypair.fromSecretKey(bs58.decode(privateKey))
          ),
          funder
        );
      }

      tx.sign(signers);
      return bs58.encode(tx.serialize());
    });

    const success = await sendJitoTransaction(completedTransactions);
    if (!success) return;

    console.log(`Token Launched: ${ca}`);
  } catch (error) {
    console.error("Error:", error);
  }
};

pumpLaunchBundle();

pumpLaunchBundle();
