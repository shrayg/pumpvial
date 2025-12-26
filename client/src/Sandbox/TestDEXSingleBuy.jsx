import { VersionedTransaction, Connection, Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { useEffect } from "react";
import { heliusKey } from "../../../server/utils/constants";

const RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${heliusKey()}`; // Visit Helius.dev
const connection = new Connection(RPC_URL, "confirmed");
const RECIPIENT_PRIVATE_KEY =
  "28QTiaALxryq1PAEU2xa8zdGViPKKwnuMuwniQaFjwVCiFgZ2LhgST5FDL1ukJsvaYkA69KJnTy4FRuQffT8df78";
const recipient = Keypair.fromSecretKey(bs58.decode(RECIPIENT_PRIVATE_KEY));

const api =
  "lkg2IHUqTunEyG24dBiS9Em7moBKaGQU-8AcxXr9Jtye-CxJH9viGNS4-ydU8iWYE1rx-GqWxiCjQjGf-zYDKbzFxaInMzmcRQx8v9uDrki9xP7Pk";

const TestDEXSingleBuy = () => {
  useEffect(() => {
    // return;
    const buyDexSingle = async () => {
      const URL = "https://api.pumpagent.com/dex-single-buy";
      const payload = {
        recipient: recipient.publicKey,
        ca: "7iagMTDPfNSR5zVcERT1To7A9eaQoz58dJAh42EMHcCC",
        solIn: "0.0001",
      };

      try {
        const request = await fetch(URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": api },
          body: JSON.stringify(payload),
        });

        const { serializedTransaction } = await request.json();
        const serialized = Uint8Array.from(atob(serializedTransaction), (c) =>
          c.charCodeAt(0)
        );
        console.log(serialized);
        const transaction = VersionedTransaction.deserialize(serialized);
        transaction.sign([recipient]);

        // const signature = await connection.sendTransaction(transaction);
        // console.log(`Success: https://solscan.io/tx/${signature}`);
      } catch (error) {
        console.error("Error:", error);
      }
    };

    buyDexSingle();
  }, []);

  return <div></div>;
};

export default TestDEXSingleBuy;
