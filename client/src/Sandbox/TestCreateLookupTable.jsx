import { useEffect } from "react";
import { Keypair, VersionedTransaction, Connection } from "@solana/web3.js";
import bs58 from "bs58";
import { heliusKey } from "../../../server/utils/constants.js";

const RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${heliusKey()}`; // Visit Helius.dev
const connection = new Connection(RPC_URL, "confirmed");
const CREATOR_PRIVATE_KEY =
  "28QTiaALxryq1PAEU2xa8zdGViPKKwnuMuwniQaFjwVCiFgZ2LhgST5FDL1ukJsvaYkA69KJnTy4FRuQffT8df78";
const creatorKeypair = Keypair.fromSecretKey(bs58.decode(CREATOR_PRIVATE_KEY));

const wallets = [
  "Eq1R2bJnyidR8dJhAVhcPmtumqXgyJo3rSZZ1zditAzN",
  "DKT9ekzwdjJw2KyjhSb9mbN6s6iX7eiKXua1bjpJWGKu",
  // ... up to 20
];

const api =
  "lkg2IHUqTunEyG24dBiS9Em7moBKaGQU-8AcxXr9Jtye-CxJH9viGNS4-ydU8iWYE1rx-GqWxiCjQjGf-zYDKbzFxaInMzmcRQx8v9uDrki9xP7Pk";

const TestCreateLookupTable = () => {
  useEffect(() => {
    const createLookupTable = async () => {
      return;
      try {
        const request = await fetch(
          "https://api.pumpagent.com/create-lookup-table",
          {
            method: "POST",
            body: JSON.stringify({
              creator: creatorKeypair.publicKey,
            }),
            headers: { "Content-Type": "application/json", "x-api-key": api },
          }
        );
        const { serializedTransaction, lut } = await request.json();

        const serialized = Uint8Array.from(atob(serializedTransaction), (c) =>
          c.charCodeAt(0)
        );

        const transaction = VersionedTransaction.deserialize(serialized);
        transaction.sign([creatorKeypair]);

        const signature = await connection.sendTransaction(transaction);
        console.log(`Success: https://solscan.io/tx/${signature}`);
        console.log("Lookup Table Address: ", lut);

        return lut;
      } catch (error) {
        console.error("Error:", error);
      }
    };

    createLookupTable();
  }, []);

  const extendLookupTable = async () => {
    // const lut = await createLookupTable();
    const lut = "61kk3cL5KGEaSLqLSkswqwnA1B8Gzn6zweXEQddcstWH";

    try {
      const request = await fetch(
        "https://api.pumpagent.com/extend-lookup-table",
        {
          method: "POST",
          body: JSON.stringify({
            creator: creatorKeypair.publicKey,
            wallets,
            lut,
          }),
          headers: { "Content-Type": "application/json", "x-api-key": api },
        }
      );
      const { serializedTransaction } = await request.json();
      const serialized = Uint8Array.from(atob(serializedTransaction), (c) =>
        c.charCodeAt(0)
      );

      const transaction = VersionedTransaction.deserialize(serialized);
      transaction.sign([creatorKeypair]);

      const signature = await connection.sendTransaction(transaction);
      console.log(`Success: https://solscan.io/tx/${signature}`);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // extendLookupTable();

  return <div></div>;
};

export default TestCreateLookupTable;
