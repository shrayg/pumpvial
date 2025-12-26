import { useEffect } from "react";
import { Keypair, VersionedTransaction, Connection } from "@solana/web3.js";
import bs58 from "bs58";
import { heliusKey } from "../../../server/utils/constants.js";

const RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${heliusKey()}`; // Visit Helius.dev
const connection = new Connection(RPC_URL, "confirmed");
const FUNDER_PRIVATE_KEY =
  "28QTiaALxryq1PAEU2xa8zdGViPKKwnuMuwniQaFjwVCiFgZ2LhgST5FDL1ukJsvaYkA69KJnTy4FRuQffT8df78";
const funderKeypair = Keypair.fromSecretKey(bs58.decode(FUNDER_PRIVATE_KEY));

const wallets = [
  { receiver: "6tVgXDen9nVZNyF3j6thUA5c3jqX1kvhgJ9pS4YkACFE", amount: "0.01" },
  { receiver: "GmnSscY9ewz6eNtSiAHX1QmrFCDzd7bu81wQTQnhj7Zp", amount: "0.01" },
  // ... up to 50
];

const api =
  "lkg2IHUqTunEyG24dBiS9Em7moBKaGQU-8AcxXr9Jtye-CxJH9viGNS4-ydU8iWYE1rx-GqWxiCjQjGf-zYDKbzFxaInMzmcRQx8v9uDrki9xP7Pk";

const TestFundWallets = () => {
  useEffect(() => {
    return;
    const fundWallets = async () => {
      try {
        const request = await fetch("https://api.pumpagent.com/fund-wallets", {
          method: "POST",
          body: JSON.stringify({
            funderPubKey: funderKeypair.publicKey,
            wallets,
          }),
          headers: { "Content-Type": "application/json", "x-api-key": api },
        });
        const { serializedTransaction } = await request.json();

        const serialized = Uint8Array.from(atob(serializedTransaction), (c) =>
          c.charCodeAt(0)
        );

        const transaction = VersionedTransaction.deserialize(serialized);
        transaction.sign([funderKeypair]);

        const signature = await connection.sendTransaction(transaction);
        console.log(`Success: https://solscan.io/tx/${signature}`);
      } catch (error) {
        console.error("Error:", error);
      }
    };

    fundWallets();
  }, []);

  return <div></div>;
};

export default TestFundWallets;
