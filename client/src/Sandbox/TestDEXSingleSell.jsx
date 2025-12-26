import { VersionedTransaction, Connection, Keypair } from "@solana/web3.js";
import bs58 from "bs58";

const RPC = "https://api.mainnet-beta.solana.com"; // Premium RPC (i.e. Helius) recommended
const connection = new Connection(RPC_URL, "confirmed");
const RECIPIENT_PRIVATE_KEY = "Enter token recipient's private key.";
const recipient = Keypair.fromSecretKey(bs58.decode(RECIPIENT_PRIVATE_KEY));

const TestDEXSingleSell = () => {
  useEffect(() => {
    return;
    const sellDexSingle = async () => {
      const URL = "https://api.pumpagent.com/dex-single-sell";
      const payload = {
        recipient: recipient.publicKey,
        ca: "7iagMTDPfNSR5zVcERT1To7A9eaQoz58dJAh42EMHcCC",
        tokenAmount: "50000",
      };

      try {
        const request = await fetch(URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const { serializedTransaction } = await request.json();
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

    sellDexSingle();
  }, []);

  return <div></div>;
};

export default TestDEXSingleSell;
