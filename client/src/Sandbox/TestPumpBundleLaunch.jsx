import { VersionedTransaction, Connection, Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { useEffect } from "react";
import { heliusKey } from "../../../server/utils/constants";

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
    if (result.error) console.log(result.error.message);
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

const RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${heliusKey()}`; // Visit Helius.dev
const connection = new Connection(RPC_URL, "confirmed");

const FUNDER_PRIVATE_KEY =
  "28QTiaALxryq1PAEU2xa8zdGViPKKwnuMuwniQaFjwVCiFgZ2LhgST5FDL1ukJsvaYkA69KJnTy4FRuQffT8df78";
const funder = Keypair.fromSecretKey(bs58.decode(FUNDER_PRIVATE_KEY));

const fullWalletData = [
  {
    // First object is the developer
    publicKey: "Eq1R2bJnyidR8dJhAVhcPmtumqXgyJo3rSZZ1zditAzN",
    privateKey:
      "28QTiaALxryq1PAEU2xa8zdGViPKKwnuMuwniQaFjwVCiFgZ2LhgST5FDL1ukJsvaYkA69KJnTy4FRuQffT8df78",
    solBuy: "0.001",
  },
  {
    // Buyer 1
    publicKey: "DKT9ekzwdjJw2KyjhSb9mbN6s6iX7eiKXua1bjpJWGKu",
    privateKey:
      "3WkWnc5qGih8vFLChzrPm6K7Jw1x1yE8HidGmXsUnPjCqm8BJhPn1pFmfwMuFAqaXdEXNWaR8b48yBMqNM1tBa5H",
    solBuy: "0.0001",
  },
  // ... up to 20
];

// Filter out private keys before sending to our server
const sanitizedWallets = fullWalletData.map(({ privateKey, ...rest }) => rest);

const lut = "61kk3cL5KGEaSLqLSkswqwnA1B8Gzn6zweXEQddcstWH";
const api =
  "lkg2IHUqTunEyG24dBiS9Em7moBKaGQU-8AcxXr9Jtye-CxJH9viGNS4-ydU8iWYE1rx-GqWxiCjQjGf-zYDKbzFxaInMzmcRQx8v9uDrki9xP7Pk";

const TestPumBundleLaunch = () => {
  useEffect(() => {
    return;
    const pumpLaunchBundle = async () => {
      const URL = "https://api.pumpagent.com/pump-launch-bundle";
      const payload = {
        funderPubKey: funder.publicKey,
        sanitizedWallets,
        name: "Pu234e",
        symbol: "P432",
        lut,
        uri: "https://ipfs.io/ipfs/QmSCKp7DWJHRURMXHHxW9vqGuC5iwp8NEeHAogmCMm85NX",
        // optionalFeeCharge: "0.05",
      };

      try {
        const request = await fetch(URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": api },
          body: JSON.stringify(payload),
        });

        const { unsigned, ca } = await request.json();

        const completedTransactions = unsigned.map((base64Tx, i) => {
          const serialized = Uint8Array.from(atob(base64Tx), (c) =>
            c.charCodeAt(0)
          );
          const tx = VersionedTransaction.deserialize(serialized);

          const signers = [];
          if (i === 0) {
            signers.push(funder);
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
          // const simResult = await connection.simulateTransaction(tx, {
          //   sigVerify: true,
          //   replaceRecentBlockhash: false,
          // });
          // console.log(`Sim result: ${i + 1} `, simResult);
          return bs58.encode(tx.serialize());
        });

        console.log("Sending");
        const success = await sendJitoTransaction(completedTransactions);
        console.log("Succes: ", success);
        if (!success) return;
        console.log(`Token Launched: ${ca}`);
        window.open(`https://pump.fun/${ca}`, "_blank");
      } catch (error) {
        console.error("Error:", error);
      }
    };

    pumpLaunchBundle();
  }, []);

  return <div></div>;
};

export default TestPumBundleLaunch;
