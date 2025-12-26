import { Keypair, VersionedTransaction, Connection } from "@solana/web3.js";
import bs58 from "bs58";
import { heliusKey } from "../../../server/utils/constants";
import { useEffect } from "react";

/////////////////////////////// CONFIG //////////////////////////////////////
const connection = new Connection(
  `https://mainnet.helius-rpc.com/?api-key=${heliusKey()}`
);
const FUNDER_PRIVATE_KEY =
  "2AQ7KkzFDiDtFSd2V3BitffVZjDpkuPWq2QaoqhY8JbyeBWcv1gxReQkKHB1qMycVwMde1BmUiUdRLjqdNsULCXC";
const funderKeypair = Keypair.fromSecretKey(bs58.decode(FUNDER_PRIVATE_KEY));
//////////////////////////////// END ////////////////////////////////////////

const payload = {
  funderPubKey: funderKeypair.publicKey,
  solIn: "0.15",
};

const TestClaimProfits = () => {
  useEffect(() => {
    const claimProfits = async () => {
      const URL = "https://api.pumpagent.com/claim-profits";

      try {
        const request = await fetch(URL, {
          method: "POST",
          body: JSON.stringify(payload),
          headers: {
            "Content-Type": "application/json",
            "x-api-key":
              "uVnlH0ofSg-EVRdkooMJsB-fHrU3f14Xgj-cC9f7XpSfW5-s3DxAKQSie5-0qVeX9jWra",
          },
        });

        const { serializedTransaction } = await request.json();
        const serialized = Uint8Array.from(atob(serializedTransaction), (c) =>
          c.charCodeAt(0)
        );

        const transaction = VersionedTransaction.deserialize(serialized);
        transaction.sign([funderKeypair]);

        await connection.sendTransaction(transaction);
      } catch (error) {
        console.error("Error:", error);
      }
    };

    claimProfits();
  }, []);

  return <></>;
};

export default TestClaimProfits;
