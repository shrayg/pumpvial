import { Keypair, VersionedTransaction, Connection } from "@solana/web3.js";
import bs58 from "bs58";

const TRANSACTION_FEE_PAYER_PRIVATE_KEY = "";
const feePayer = Keypair.fromSecretKey(
  bs58.decode(TRANSACTION_FEE_PAYER_PRIVATE_KEY)
);

const optionalFeeCharge = {
  receiver: "Enter fee recipient's wallet address.",
  percentage: "1.5",
};

const buyPumpSingle = async () => {
  const URL = "https://api.pumpagent.com/pump-single-sell";
  const payload = {
    feePayer: feePayer.publicKey,
    ca: "7jgMahwDFb3joVRfxhmeVXPzCqpFSxYnni3qdsKvpump",
    wallets: sanitizedWallets,
    lut,
    optionalFeeCharge,
  };

  try {
    const response = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    const versionedTxs = data.unsigned.map((base64Tx) => {
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

buyPumpSingle();
