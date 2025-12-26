import { useEffect } from "react";
import { Keypair, VersionedTransaction, Connection } from "@solana/web3.js";
import bs58 from "bs58";
import { heliusKey } from "../../../server/utils/constants.js";

const RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${heliusKey()}`; // Visit Helius.dev
const connection = new Connection(RPC_URL, "confirmed");
const RECIPIENT_PRIVATE_KEY =
  "28QTiaALxryq1PAEU2xa8zdGViPKKwnuMuwniQaFjwVCiFgZ2LhgST5FDL1ukJsvaYkA69KJnTy4FRuQffT8df78";
const recipient = Keypair.fromSecretKey(bs58.decode(RECIPIENT_PRIVATE_KEY));

const api =
  "lkg2IHUqTunEyG24dBiS9Em7moBKaGQU-8AcxXr9Jtye-CxJH9viGNS4-ydU8iWYE1rx-GqWxiCjQjGf-zYDKbzFxaInMzmcRQx8v9uDrki9xP7Pk";

const TestPumpTokenBump = () => {
  useEffect(() => {
    return;
    const pumpTokenBump = async () => {
      const URL = "https://api.pumpagent.com/pump-token-bump";
      const payload = {
        recipient: recipient.publicKey,
        ca: "3bp6Zho7SGLtFGmwt59gNrxGJK7KE77F2jKncieKpump",
        solIn: "0.022",
        optionalFeeCharge: "0.5",
      };

      try {
        const response = await fetch(URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": api,
          },
          body: JSON.stringify(payload),
        });

        const { serializedTransaction } = await response.json();
        if (!serializedTransaction) return;
        const serialized = Uint8Array.from(atob(serializedTransaction), (c) =>
          c.charCodeAt(0)
        );
        const transaction = VersionedTransaction.deserialize(serialized);
        transaction.sign([recipient]);

        const signature = await connection.sendTransaction(transaction);
        console.log(`Success: https://solscan.io/tx/${signature}`);
      } catch (error) {
        console.error("Error:", error);
      }
    };

    pumpTokenBump();
  }, []);

  return <div></div>;
};

export default TestPumpTokenBump;
