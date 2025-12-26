import { VersionedTransaction, Keypair } from "@solana/web3.js";
import axios from "axios";
import bs58 from "bs58";

const FUNDS_RECEIVER_PRIVATE_KEY = "Enter transaction fee payer's private key.";
const fundsReceiver = Keypair.fromSecretKey(
  bs58.decode(FUNDS_RECEIVER_PRIVATE_KEY)
);

const optionalFeeCharge = {
  receiver: "Enter fee recipient's wallet address.",
  percentage: "1.5",
};

const fullWalletData = [
  {
    publicKey: "HFNjSiNQDJWtWNGyZsguiz5ULP8SFYgTWRSoJ4McnrQr",
    privateKey:
      "5YwarpcUQgDU5XmPVR8RKDXVH9...7Q3WBCjjBuJdohavc6V1sJR3vPDUv3jZYn",
  },
  {
    publicKey: "C1VvtLa86LTnoqiLsVZ7qE59AD5u2Z1sRbrwZ8ndvJG2",
    privateKey:
      "SKhKbEv9WWd3R33tnsCmGR16v4...aBjizm1NTJHi2qbRFpaYjnLFzEqWpcynS",
  },
  // ... up to 20
];

// Filter out private keys before sending to our server
const sanitizedWallets = fullWalletData.map(({ privateKey, ...rest }) => rest);

const pumpDumpAll = async () => {
  const URL = "https://api.pumpagent.com/pump-dump-all";
  const payload = {
    receiver: fundsReceiver.publicKey,
    ca: "7jgMahwDFb3joVRfxhmeVXPzCqpFSxYnni3qdsKvpump",
    wallets: sanitizedWallets,
    optionalFeeCharge,
  };

  try {
    const request = await axios.post(URL, payload, {
      headers: { "Content-Type": "application/json" },
    });

    const versionedTxs = request.data.unsigned.map((base64Tx) => {
      const serialized = Uint8Array.from(Buffer.from(base64Tx, "base64"));
      return VersionedTransaction.deserialize(serialized);
    });

    const completedTransactions = [];
    for (let i = 0; i < versionedTxs.length; i++) {
      const tx = versionedTxs[i];
      const chunk = fullWalletData.slice(i * 5, (i + 1) * 5);

      chunk.forEach(({ privateKey }) => {
        const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));
        tx.sign([keypair]);
      });
      tx.sign([feePayer]);

      completedTransactions.push(bs58.encode(tx.serialize()));
    }

    const finalResponse = await sendJitoTransaction(completedTransactions);
    console.log("Bundle success: ", `https://solscan.io/tx/${finalResponse}`);
  } catch (error) {
    console.error("Error:", error);
  }
};

pumpDumpAll();
