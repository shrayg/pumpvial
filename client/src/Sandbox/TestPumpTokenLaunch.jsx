import { VersionedTransaction, Connection, Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { useEffect } from "react";
import { heliusKey } from "../../../server/utils/constants.js";

const RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${heliusKey()}`; // Visit Helius.dev
const connection = new Connection(RPC_URL, "confirmed");
const DEVELOPER_PRIVATE_KEY =
  "28QTiaALxryq1PAEU2xa8zdGViPKKwnuMuwniQaFjwVCiFgZ2LhgST5FDL1ukJsvaYkA69KJnTy4FRuQffT8df78";
const developer = Keypair.fromSecretKey(bs58.decode(DEVELOPER_PRIVATE_KEY));

const api =
  "lkg2IHUqTunEyG24dBiS9Em7moBKaGQU-8AcxXr9Jtye-CxJH9viGNS4-ydU8iWYE1rx-GqWxiCjQjGf-zYDKbzFxaInMzmcRQx8v9uDrki9xP7Pk";

const TestPumpTokenLaunch = () => {
  useEffect(() => {
    return;
    const pumpLaunchToken = async () => {
      const URL = "https://api.pumpagent.com/pump-launch-token";
      const payload = {
        developer: developer.publicKey,
        solIn: "0.0001",
        name: "P134me",
        symbol: "Pufmp",
        uri: "https://ipfs.io/ipfs/QmSCKp7DWJHRURMXHHxW9vqGuC5iwp8NEeHAogmCMm85NX",
        // optionalFeeCharge: "0.5",
      };

      try {
        const request = await fetch(URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": api },
          body: JSON.stringify(payload),
        });

        const { serializedTransaction, ca } = await request.json();
        const serialized = Uint8Array.from(atob(serializedTransaction), (c) =>
          c.charCodeAt(0)
        );

        const transaction = VersionedTransaction.deserialize(serialized);
        transaction.sign([developer]);
        const signature = await connection.sendTransaction(transaction);
        console.log(signature);
        if (!signature) return;
        console.log(`Token Launched: ${ca}`);
        window.open(`https://pump.fun/${ca}`, "_blank");
      } catch (error) {
        console.error("Error:", error);
      }
    };

    pumpLaunchToken();
  }, []);

  return <div></div>;
};

export default TestPumpTokenLaunch;
