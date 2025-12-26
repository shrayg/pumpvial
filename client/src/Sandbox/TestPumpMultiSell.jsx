import { VersionedTransaction, Connection, Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { useEffect } from "react";

const sendJitoTransaction = async (bundleTxs) => {
  try {
    const jitoResponse = await fetch(
      `https://mainnet.block-engine.jito.wtf/api/v1/bundles`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "sendJitoTransaction",
          params: [bundleTxs],
        }),
      }
    );

    const result = await jitoResponse.json();
    const JitoResponse = result.result;

    // Polling to check bundle status
    const pollBundleStatus = async (bundleId, maxRetries = 10) => {
      let attempts = 0;

      while (attempts < maxRetries) {
        attempts++;

        const jitoCheck = await fetch(
          "https://mainnet.block-engine.jito.wtf/api/v1/bundles",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: 1,
              method: "getBundleStatuses",
              params: [[bundleId]],
            }),
          }
        );

        if (!jitoCheck.ok) {
          throw new Error(`HTTP error! status: ${jitoCheck.status}`);
        }

        const data = await jitoCheck.json();
        const validBundle = data.result.value;

        if (validBundle.length > 0) {
          const status = validBundle[0]?.confirmation_status;

          if (status === "confirmed" || status === "finalized") {
            return validBundle[0].transactions[0];
          } else if (status === "failed") {
            throw new Error("Bundle failed.");
          }
        }

        // Wait before the next status check (e.g., 2 seconds)
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      throw new Error(
        `Max retries reached (${maxRetries}) without confirmation.`
      );
    };

    const bundleStatus = await pollBundleStatus(JitoResponse);
    return bundleStatus;
  } catch (err) {
    console.error(err);
  }
};

const TRANSACTION_FEE_PAYER_PRIVATE_KEY =
  "28QTiaALxryq1PAEU2xa8zdGViPKKwnuMuwniQaFjwVCiFgZ2LhgST5FDL1ukJsvaYkA69KJnTy4FRuQffT8df78";
const feePayer = Keypair.fromSecretKey(
  bs58.decode(TRANSACTION_FEE_PAYER_PRIVATE_KEY)
);

const fullWalletData = [
  {
    publicKey: "Eq1R2bJnyidR8dJhAVhcPmtumqXgyJo3rSZZ1zditAzN",
    privateKey:
      "28QTiaALxryq1PAEU2xa8zdGViPKKwnuMuwniQaFjwVCiFgZ2LhgST5FDL1ukJsvaYkA69KJnTy4FRuQffT8df78",
    tokenAmount: "10000",
  },
  {
    publicKey: "BU3pd9YZ3kiaL4SAhqwtLAf9w7EshZBvp6ETT4B2F94V",
    privateKey:
      "2KGwwZjY98VG5NGTsXHVaKPDNFRqWApGRqvuGP32ScdBmBrRncRNQcy1bzXMzEoq6K6cLFggQzD4o6DVH9UQgfG5",
    tokenAmount: "10000",
  },
  // ... up to 20
];

// Filter out private keys before sending to our server
const sanitizedWallets = fullWalletData.map(({ privateKey, ...rest }) => rest);

const api =
  "lkg2IHUqTunEyG24dBiS9Em7moBKaGQU-8AcxXr9Jtye-CxJH9viGNS4-ydU8iWYE1rx-GqWxiCjQjGf-zYDKbzFxaInMzmcRQx8v9uDrki9xP7Pk";

const TestPumpMultiSell = () => {
  useEffect(() => {
    return;
    const sellPumpMulti = async () => {
      const URL = "https://api.pumpagent.com/pump-multi-sell";
      const payload = {
        feePayer: feePayer.publicKey,
        ca: "J7tdXhwVowykRhRCFYu6rM2H5ywvu8vjqH8U4cqgpump",
        wallets: sanitizedWallets,
        optionalFeeCharge: "0.5",
      };

      try {
        const response = await fetch(URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": api },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        const versionedTxs = data.map((base64Tx) => {
          const serialized = Uint8Array.from(atob(base64Tx), (c) =>
            c.charCodeAt(0)
          );
          return VersionedTransaction.deserialize(serialized);
        });

        const completedTransactions = [];
        for (let i = 0; i < versionedTxs.length; i++) {
          const tx = versionedTxs[i];
          const chunk = fullWalletData.slice(i * 5, (i + 1) * 5);

          chunk.forEach(({ privateKey }) => {
            const recipient = Keypair.fromSecretKey(bs58.decode(privateKey));
            tx.sign([recipient]);
          });
          tx.sign([feePayer]);

          completedTransactions.push(bs58.encode(tx.serialize()));
        }

        const finalResponse = await sendJitoTransaction(completedTransactions);
        console.log(
          "Bundle success: ",
          `https://solscan.io/tx/${finalResponse}`
        );
      } catch (error) {
        console.error("Error:", error);
      }
    };

    sellPumpMulti();
  }, []);

  return <div></div>;
};

export default TestPumpMultiSell;
