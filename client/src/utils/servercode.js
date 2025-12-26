export const httpsServerGenerateWallets = `
import axios from 'axios';

/////////////////////////////// CONFIG //////////////////////////////////////
const API_KEY = process.env.PUMPAGENT_API_KEY;
const amount = "25";
//////////////////////////////// END ////////////////////////////////////////

const generateWallets = async (amount) => {
  const URL = "https://api.pumpagent.com/generate-wallets";

  try {
    const request = await axios.post(URL, { amount }, { 
      headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
      }}
    );

    const { walletArray } = request.data;
    console.log("Solana wallets: ", walletArray);
    return walletArray;
  } catch (error) {
    console.error(error);
  }
};

generateWallets("25");`;

export const httpsServerFundWallets = `
import { Keypair, VersionedTransaction, Connection } from "@solana/web3.js";
import bs58 from "bs58";
import axios from "axios";

/////////////////////////////// CONFIG //////////////////////////////////////
const API_KEY = process.env.PUMPAGENT_API_KEY;
const RPC_URL = ""; // Visit Helius.dev
const connection = new Connection(RPC_URL, "confirmed");
const FUNDER_PRIVATE_KEY = "Enter the funder's private key here";
const funderKeypair = Keypair.fromSecretKey(bs58.decode(FUNDER_PRIVATE_KEY));

const wallets = [
  { publicKey: "NkrHERKzAetSxbrWenirWbrd9YZ3kiaLWeeniQ", amount: "0.33" },
  { publicKey: "xbrWSxyfrKC8kiQfSxrWSxyfeni7EshZBvp6Qb", amount: "0.2" },
  // ... up to 50
];
//////////////////////////////// END ////////////////////////////////////////

const payload = {
  funderPubKey: funderKeypair.publicKey,
  wallets,
};

const fundWallets = async () => {
  const URL = "https://api.pumpagent.com/fund-wallets";

  try {
      const request = await axios.post(URL, payload, { 
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      }}
    );

    const { serializedTransaction } = request.data;
    const serialized = Uint8Array.from(Buffer.from(serializedTransaction, "base64"));

    const transaction = VersionedTransaction.deserialize(serialized);
    transaction.sign([funderKeypair]);

    const signature = await connection.sendTransaction(transaction);
    console.log(\`Success: https://solscan.io/tx/\${signature}\`);
  } catch (error) {
    console.error("Error:", error);
  }
};

fundWallets();`;

export const httpsServerClaimProfits = `
import { Keypair, VersionedTransaction, Connection } from "@solana/web3.js";
import bs58 from "bs58";
import axios from "axios";

/////////////////////////////// CONFIG //////////////////////////////////////
const API_KEY = process.env.PUMPAGENT_API_KEY;
const RPC_URL = ""; // Visit Helius.dev
const connection = new Connection(RPC_URL, "confirmed");
const FUNDER_PRIVATE_KEY = "Enter the funder's private key here";
const funderKeypair = Keypair.fromSecretKey(bs58.decode(FUNDER_PRIVATE_KEY));
//////////////////////////////// END ////////////////////////////////////////

const payload = {
  funderPubKey: funderKeypair.publicKey,
  solIn: "0.15"
};

const claimProfits = async () => {
  const URL = "https://api.pumpagent.com/claim-profits";

  try {
      const request = await axios.post(URL, payload, { 
      headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
      }}
    );

    const { serializedTransaction } = request.data;
    const serialized = Uint8Array.from(Buffer.from(serializedTransaction, "base64"));

    const transaction = VersionedTransaction.deserialize(serialized);
    transaction.sign([funderKeypair]);

    const signature = await connection.sendTransaction(transaction);
    console.log(\`Profits claimed to dashboard: https://solscan.io/tx/\${signature}\`);
  } catch (error) {
    console.error("Error:", error);
  }
};

claimProfits();`;

export const httpsServerPumpChart = `
import axios from "axios";

/////////////////////////////// CONFIG //////////////////////////////////////
const API_KEY = process.env.PUMPAGENT_API_KEY;
const payload = {
  ca: "9P1qxcUKQUJRtTL84duQrzqpePUbcJMV3WaHJFMfpump", 
};
//////////////////////////////// END ////////////////////////////////////////

const pumpChart = async () => {
  const URL = "https://api.pumpagent.com/pump-chart";

  try {
    const request = await axios.post(URL, payload, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY, 
      },
    });

    const candles = request.data;
  } catch (error) {
    console.error("Error:", error);
  }
};

pumpChart();
`;

export const httpsServerCreateIPFS = `
import axios from "axios";

/////////////////////////////// CONFIG //////////////////////////////////////
const API_KEY = process.env.PUMPAGENT_API_KEY;
const payload = {
  image: imageString, // From the example below (Base64 data url)
  name: "PumpKit Memecoin",
  symbol: "PKIT",
  description: "The greatest toolkit to start shipping!",
  twitter: "https://@pumpkit_memecoin",
  telegram: "https://t.me/pumpkit_memecoin",
  website: "https://pumpkitmemecoin.com",
};
//////////////////////////////// END ////////////////////////////////////////

const createIPFS = async () => {
  const URL = "https://api.pumpagent.com/create-ipfs";

  try {
    const request = await axios.post(URL, payload, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY, 
      },
    });

    console.log("Metadata:", request.data);
  } catch (error) {
    console.error("Error:", error);
  }
};

createIPFS();
`;

export const httpsServerCreateLookupTable = `
import { Keypair, VersionedTransaction, Connection } from "@solana/web3.js";
import bs58 from "bs58";
import axios from "axios";

/////////////////////////////// CONFIG //////////////////////////////////////
const API_KEY = process.env.PUMPAGENT_API_KEY;
const RPC_URL = ""; // Visit Helius.dev
const connection = new Connection(RPC_URL, "confirmed");
const CREATOR_PRIVATE_KEY = "Enter the creator's private key here";
const creatorKeypair = Keypair.fromSecretKey(bs58.decode(CREATOR_PRIVATE_KEY));
//////////////////////////////// END ////////////////////////////////////////

const createLookupTable = async () => {
  const URL = "https://api.pumpagent.com/create-lookup-table";

  try {
      const request = await axios.post(URL, { creator: creatorKeypair.publicKey }, { 
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      }}
    );      

    const { serializedTransaction, lut } = request.data;
    const serialized = Uint8Array.from(Buffer.from(serializedTransaction, "base64"));

    const transaction = VersionedTransaction.deserialize(serialized);
    transaction.sign([creatorKeypair]);

    const signature = await connection.sendTransaction(transaction);
    console.log(\`Success: https://solscan.io/tx/\${signature}\`);
    console.log("Lookup Table Address: ", lut);

    return lut;
  } catch (error) {
    console.error("Error:", error);
  }
};

createLookupTable();`;

export const httpsServerExtendLookupTable = `
import { Keypair, VersionedTransaction, Connection } from "@solana/web3.js";
import bs58 from "bs58";
import axios from "axios";

/////////////////////////////// CONFIG //////////////////////////////////////
const API_KEY = process.env.PUMPAGENT_API_KEY;
const RPC_URL = ""; // Visit Helius.dev
const connection = new Connection(RPC_URL, "confirmed");
const CREATOR_PRIVATE_KEY = "Enter the creator's private key here";
const creatorKeypair = Keypair.fromSecretKey(bs58.decode(CREATOR_PRIVATE_KEY));

const wallets = [
  "AXtjwLtAWbu6RaoMiMDYjRfy7cj5PJXhThixHYnkn86T",
  "5qSYqJd2wQfiDgbRdw2hKFyGQ377UwCcZS72Lj8RTVMH",
  "2VzqHV2cZ2ZwWvp6jxaYvMozZX6tA5YkyoTcpzj7A9Ke",
  // ... up to 20
];

const lut = await createLookupTable();
//////////////////////////////// END ////////////////////////////////////////

const extendLookupTable = async () => {
  const URL = "https://api.pumpagent.com/extend-lookup-table";

  try {
    const request = await axios.post(
      URL,
      {
        creator: creatorKeypair.publicKey,
        wallets,
        lut,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
      }
    );

    const { serializedTransaction } = request.data;
    const serialized = Uint8Array.from(Buffer.from(serializedTransaction, "base64"));

    const transaction = VersionedTransaction.deserialize(serialized);
    transaction.sign([creatorKeypair]);

    const signature = await connection.sendTransaction(transaction);
    console.log(\`Success: https://solscan.io/tx/\${signature}\`);
  } catch (error) {
    console.error("Error:", error);
  }
};

extendLookupTable();`;

export const httpsServerPumpBondingCurve = `
import axios from "axios";

/////////////////////////////// CONFIG //////////////////////////////////////
const API_KEY = process.env.PUMPAGENT_API_KEY;
const ca = "7jgMahwDFb3joVRfxhmeVXPzCqpFSxYnni3qdsKvpump";
//////////////////////////////// END ////////////////////////////////////////

const getPumpBondingCurve = async () => {
  const URL = "https://api.pumpagent.com/pump-bonding-curve";

  try {
    const request = await axios.post(URL, { ca }, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      }}
    );  

    const { curveProgress } = request.data;
    console.log("Bonding Curve Progress: ", curveProgress);
  } catch (error) {
    console.error("Error:", error);
  }
};

getPumpBondingCurve();`;

export const httpsServerPumpTokenInfo = `
import axios from "axios";

/////////////////////////////// CONFIG //////////////////////////////////////
const API_KEY = process.env.PUMPAGENT_API_KEY;
const ca = "7jgMahwDFb3joVRfxhmeVXPzCqpFSxYnni3qdsKvpump";
//////////////////////////////// END ////////////////////////////////////////

const getPumpTokenInfo = async () => {
  const URL = "https://api.pumpagent.com/token-info";

  try {
    const request = await axios.post(URL, { ca }, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      }}
    );  

    const { response } = request.data;
    console.log("Token info: ", response);
  } catch (error) {
    console.error("Error:", error);
  }
};

getPumpTokenInfo();`;

export const httpsServerPumpSingleBuy = `
import { VersionedTransaction, Connection, Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import axios from "axios";

/////////////////////////////// CONFIG //////////////////////////////////////
const API_KEY = process.env.PUMPAGENT_API_KEY;
const RPC_URL = ""; // Visit Helius.dev
const connection = new Connection(RPC_URL, 'confirmed');
const RECIPIENT_PRIVATE_KEY = "Enter token recipient's private key."; 
const recipient = Keypair.fromSecretKey(bs58.decode(RECIPIENT_PRIVATE_KEY));

const payload = {
  recipient: recipient.publicKey,
  ca: "93xHZCeaRxL7iwRQUPcW7utRbKF5UhMmaSQW9pdEpump",
  solIn: "0.15"
};
//////////////////////////////// END ////////////////////////////////////////

const buyPumpSingle = async () => {
  const URL = "https://api.pumpagent.com/pump-single-buy";

  try {
    const request = await axios.post(URL, payload, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      },
    });

    const { serializedTransaction } = request.data;
    const transaction = VersionedTransaction.deserialize(Uint8Array.from(Buffer.from(serializedTransaction, "base64")));
    
    transaction.sign([recipient]); 
    const signature = await connection.sendTransaction(transaction);
    console.log(\`Success: https://solscan.io/tx/\${signature}\`);
  } catch (error) {
    console.error("Error:", error);
  }
};

buyPumpSingle();`;

export const httpsServerPumpTokenBump = `
import { VersionedTransaction, Connection, Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import axios from "axios";

/////////////////////////////// CONFIG //////////////////////////////////////
const API_KEY = process.env.PUMPAGENT_API_KEY;
const RPC_URL = ""; // Visit Helius.dev
const connection = new Connection(RPC_URL, 'confirmed');
const RECIPIENT_PRIVATE_KEY = "Enter token recipient's private key."; 
const recipient = Keypair.fromSecretKey(bs58.decode(RECIPIENT_PRIVATE_KEY));

const payload = {
  recipient: recipient.publicKey,
  ca: "93xHZCeaRxL7iwRQUPcW7utRbKF5UhMmaSQW9pdEpump",
  solIn: "0.022"
};
//////////////////////////////// END ////////////////////////////////////////

const bumpToken = async () => {
  const URL = "https://api.pumpagent.com/pump-token-bump";

  try {
    const request = await axios.post(URL, payload, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      }}
    );  

    const { serializedTransaction } = request.data;
    const serialized = Uint8Array.from(Buffer.from(serializedTransaction, "base64"));

    const transaction = VersionedTransaction.deserialize(serialized);
    transaction.sign([recipient]);

    const signature = await connection.sendTransaction(transaction);
    console.log(\`Success: https://solscan.io/tx/\${signature}\`);
  } catch (error) {
    console.error("Error:", error);
  }
};

bumpToken();`;

export const httpsServerPumpSingleSell = `
import { VersionedTransaction, Connection, Keypair } from '@solana/web3.js';
import bs58 from "bs58";
import axios from 'axios';

/////////////////////////////// CONFIG //////////////////////////////////////
const API_KEY = process.env.PUMPAGENT_API_KEY;
const RPC_URL = ""; // Visit Helius.dev
const connection = new Connection(RPC_URL, 'confirmed');
const RECIPIENT_PRIVATE_KEY = "Enter token recipient's private key."; 
const recipient = Keypair.fromSecretKey(bs58.decode(RECIPIENT_PRIVATE_KEY));

const payload = {
  recipient: recipient.publicKey,
  ca: "93xHZCeaRxL7iwRQUPcW7utRbKF5UhMmaSQW9pdEpump",
  tokenAmount: "30000",
  optionalFeeCharge: "0.5"
};
//////////////////////////////// END ////////////////////////////////////////

const sellPumpSingle = async () => {
  const URL = "https://api.pumpagent.com/pump-single-sell";

  try {
    const request = await axios.post(URL, payload, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      },
    });
    
    const { serializedTransaction } = request.data;
    const transaction = VersionedTransaction.deserialize(Uint8Array.from(Buffer.from(serializedTransaction, "base64")));
    transaction.sign([recipient]);

    const signature = await connection.sendTransaction(transaction);
    console.log(\`Success: https://solscan.io/tx/\${signature}\`);
  } catch (error) {
    console.error("Error:", error);
  }
};

sellPumpSingle();`;

export const httpsServerPumpMultiBuy = `
import { VersionedTransaction, Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import axios from "axios";

/////////////////////////////// CONFIG //////////////////////////////////////
const API_KEY = process.env.PUMPAGENT_API_KEY;
const TRANSACTION_FEE_PAYER_PRIVATE_KEY = "Enter transaction fee payer's private key."; 
const feePayer = Keypair.fromSecretKey(bs58.decode(TRANSACTION_FEE_PAYER_PRIVATE_KEY));

const fullWalletData = [
  {
    publicKey: "HFNjSiNQDJWtWNGyZsguiz5ULP8SFYgTWRSoJ4McnrQr",
    privateKey: "5YwarpcUQgDU5XmPVR8RKDXVH9...7Q3WBCjjBuJdohavc6V1sJR3vPDUv3jZYn",
    solBuy: "0.30",
  },
  {
    publicKey: "C1VvtLa86LTnoqiLsVZ7qE59AD5u2Z1sRbrwZ8ndvJG2",
    privateKey: "SKhKbEv9WWd3R33tnsCmGR16v4...aBjizm1NTJHi2qbRFpaYjnLFzEqWpcynS",
    solBuy: "1.55",
  },
  // ... up to 20
];

// Filter out private keys before sending to our server
const sanitizedWallets = fullWalletData.map(({ privateKey, ...rest }) => rest);

const payload = {
  feePayer: feePayer.publicKey,
  ca: "7jgMahwDFb3joVRfxhmeVXPzCqpFSxYnni3qdsKvpump",
  wallets: sanitizedWallets
};
//////////////////////////////// END ////////////////////////////////////////

const buyPumpMulti = async () => {
  const URL = "https://api.pumpagent.com/pump-multi-buy";

  try {
    const request = await axios.post(URL, payload, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      }}
    );  

    const versionedTxs = request.data.map((tx) => VersionedTransaction.deserialize(Uint8Array.from(Buffer.from(tx, "base64"))));

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

    const success = await sendJitoTransaction(completedTransactions);
    if(!success) return; 

    console.log("Bundle success: ", \`https://solscan.io/tx/\${success}\`);
  } catch (error) {
    console.error("Error:", error);
  }
};

buyPumpMulti();`;

export const httpsServerPumpMultiSell = `
import { VersionedTransaction, Keypair } from '@solana/web3.js';
import bs58 from "bs58";
import axios from 'axios';

/////////////////////////////// CONFIG //////////////////////////////////////
const API_KEY = process.env.PUMPAGENT_API_KEY;
const TRANSACTION_FEE_PAYER_PRIVATE_KEY = "Enter transaction fee payer's private key."; 
const feePayer = Keypair.fromSecretKey(bs58.decode(TRANSACTION_FEE_PAYER_PRIVATE_KEY));

const fullWalletData = [
  {
    publicKey: "HFNjSiNQDJWtWNGyZsguiz5ULP8SFYgTWRSoJ4McnrQr",
    privateKey: "5YwarpcUQgDU5XmPVR8RKDXVH9...7Q3WBCjjBuJdohavc6V1sJR3vPDUv3jZYn",
    tokenAmount: "5000",
  },
  {
    publicKey: "C1VvtLa86LTnoqiLsVZ7qE59AD5u2Z1sRbrwZ8ndvJG2",
    privateKey: "SKhKbEv9WWd3R33tnsCmGR16v4...aBjizm1NTJHi2qbRFpaYjnLFzEqWpcynS",
    tokenAmount: "7500",
  },
  // ... up to 20
];

// Filter out private keys before sending to our server
const sanitizedWallets = fullWalletData.map(({ privateKey, ...rest }) => rest);

const payload = {
  feePayer: feePayer.publicKey,
  ca: "7jgMahwDFb3joVRfxhmeVXPzCqpFSxYnni3qdsKvpump",
  wallets: sanitizedWallets
};
//////////////////////////////// END ////////////////////////////////////////

const sellPumpMulti = async () => {
  const URL = "https://api.pumpagent.com/pump-multi-sell";

  try {
    const request = await axios.post(URL, payload, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      }}
    ); 

    const versionedTxs = request.data.map((tx) => VersionedTransaction.deserialize(Uint8Array.from(Buffer.from(tx, "base64"))));

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

    const success = await sendJitoTransaction(completedTransactions);
    if (!success) return;

    console.log("Bundle success: ", \`https://solscan.io/tx/\${success}\`);
  } catch (error) {
    console.error("Error:", error);
  }
};

sellPumpMulti();`;

export const httpsServerPumpDumpAll = `
import { VersionedTransaction, Keypair } from '@solana/web3.js';
import bs58 from "bs58";
import axios from 'axios';

/////////////////////////////// CONFIG //////////////////////////////////////
const API_KEY = process.env.PUMPAGENT_API_KEY;
const FUNDS_RECEIVER_PRIVATE_KEY = "Enter transaction fee payer's private key."; 
const fundsReceiver = Keypair.fromSecretKey(bs58.decode(FUNDS_RECEIVER_PRIVATE_KEY));

const fullWalletData = [
  {
    publicKey: "HFNjSiNQDJWtWNGyZsguiz5ULP8SFYgTWRSoJ4McnrQr",
    privateKey: "5YwarpcUQgDU5XmPVR8RKDXVH9...7Q3WBCjjBuJdohavc6V1sJR3vPDUv3jZYn",
  },
  {
    publicKey: "C1VvtLa86LTnoqiLsVZ7qE59AD5u2Z1sRbrwZ8ndvJG2",
    privateKey: "SKhKbEv9WWd3R33tnsCmGR16v4...aBjizm1NTJHi2qbRFpaYjnLFzEqWpcynS",
  },
  // ... up to 20
];

const payload = {
  receiver: fundsReceiver.publicKey,
  ca: "7jgMahwDFb3joVRfxhmeVXPzCqpFSxYnni3qdsKvpump",
  wallets: sanitizedWallets
};
//////////////////////////////// END ////////////////////////////////////////

// Filter out private keys before sending to our server
const sanitizedWallets = fullWalletData.map(({ privateKey, ...rest }) => rest);

const pumpDumpAll = async () => {
  const URL = "https://api.pumpagent.com/pump-dump-all";

  try {
    const request = await axios.post(URL, payload, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      }}
    );  

    const versionedTxs = request.data.map((tx) => VersionedTransaction.deserialize(Uint8Array.from(Buffer.from(tx, "base64"))));

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

    const success = await sendJitoTransaction(completedTransactions);
    if (!success) return;

    console.log("Bundle success: ", \`https://solscan.io/tx/\${success}\`);
  } catch (error) {
    console.error("Error:", error);
  }
};

pumpDumpAll();`;

export const httpsServerPumpLaunchToken = `
import { VersionedTransaction, Keypair, Connection } from "@solana/web3.js";
import bs58 from "bs58";
import axios from "axios";

/////////////////////////////// CONFIG //////////////////////////////////////
const API_KEY = process.env.PUMPAGENT_API_KEY;
const RPC_URL = ""; // Visit Helius.dev
const connection = new Connection(RPC_URL, 'confirmed');
const DEVELOPER_PRIVATE_KEY = "Enter developer private key."; 
const developer = Keypair.fromSecretKey(bs58.decode(DEVELOPER_PRIVATE_KEY));

const payload = {
  developer: developer.publicKey,
  solIn: "0.1",
  name: "PumpKit Meme",
  symbol: "PKIT",
  uri: "https://ipfs.io/ipfs/QmWoAXuw4wcuuQScK7New3Qm63Xt5YoYysmHda9Rr8L3cx"
};
//////////////////////////////// END ////////////////////////////////////////

const pumpLaunchToken = async () => {
  const URL = "https://api.pumpagent.com/pump-launch-token";

  try {
    const request = await axios.post(URL, payload, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      }}
    );  

    const { serializedTransaction, ca } = request.data;
    const transaction = VersionedTransaction.deserialize(Uint8Array.from(Buffer.from(serializedTransaction, "base64")));

    transaction.sign([developer]);
    const signature = await connection.sendTransaction(transaction);
    if (!signature) return;

    console.log(\`Token Launched: https://pump.fun/\${ca}\`);
  } catch (error) {
    console.error("Error:", error);
  }
};

pumpLaunchToken();`;

export const httpsServerPumpLaunchBundle = `
import { VersionedTransaction, Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import axios from "axios";

/////////////////////////////// CONFIG //////////////////////////////////////
const API_KEY = process.env.PUMPAGENT_API_KEY;
const FUNDER_PRIVATE_KEY = "Enter Funder Private Key"; 
const funder = Keypair.fromSecretKey(bs58.decode(FUNDER_PRIVATE_KEY));

const fullWalletData = [
  { // First object is the developer
    publicKey: "HFNjSiNQDJWtWNGyZsguiz5ULP8SFYgTWRSoJ4McnrQr",
    privateKey: "5YwarpcUQgDU5XmPVR8RKDXVH9...7Q3WBCjjBuJdohavc6V1sJR3vPDUv3jZYn",
    solBuy: "0.30",
  },
  { // Buyer 1
    publicKey: "C1VvtLa86LTnoqiLsVZ7qE59AD5u2Z1sRbrwZ8ndvJG2",
    privateKey: "SKhKbEv9WWd3R33tnsCmGR16v4...aBjizm1NTJHi2qbRFpaYjnLFzEqWpcynS",
    solBuy: "1.55",
  },
  // ... up to 20
];

// Filter out private keys before sending to our server
const sanitizedWallets = fullWalletData.map(({ privateKey, ...rest }) => rest);
const lut = "Enter Lookup Table Address";

const payload = {
  funderPubKey: funder.publicKey,
  sanitizedWallets,
  name: "PumpKit Meme",
  symbol: "PKIT",
  lut,
  uri: "https://ipfs.io/ipfs/QmWoAXuw4wcuuQScK7New3Qm63Xt5YoYysmHda9Rr8L3cx"
};
//////////////////////////////// END ////////////////////////////////////////

const pumpLaunchBundle = async () => {
  const URL = "https://api.pumpagent.com/pump-launch-bundle";

  try {
    const request = await axios.post(URL, payload, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      }}
    );  
    const { unsigned, ca } = request.data;

    const completedTransactions = unsigned.map((base64Tx, i) => {
      const tx = VersionedTransaction.deserialize(Uint8Array.from(Buffer.from(base64Tx, "base64")));

      const signers = [];
      if (i === 0) {
        signers.push(
          Keypair.fromSecretKey(bs58.decode(fullWalletData[0].privateKey)),
          funder
        );
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
      return bs58.encode(tx.serialize());
    });

    const success = await sendJitoTransaction(completedTransactions);
    if (!success) return;

    console.log(\`Token Launched: \${ca}\`);
  } catch (error) {
    console.error("Error:", error);
  }
};

pumpLaunchBundle();`;

export const httpsServerSendBundle = `
const sendJitoTransaction = async (bundleTxs) => {
  try {
    const request = await axios.post(
      "https://mainnet.block-engine.jito.wtf/api/v1/bundles",
      {
        jsonrpc: "2.0",
        id: 1,
        method: "sendJitoTransaction",
        params: [bundleTxs],
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const JitoResponse = request.data.result;

    // Polling to check bundle status
    const pollBundleStatus = async (bundleId, maxRetries = 10) => {
      let attempts = 0;

      while (attempts < maxRetries) {
        attempts++;

        const request = await axios.post(
        "https://mainnet.block-engine.jito.wtf/api/v1/bundles",
        {
          jsonrpc: '2.0',
          id: 1,
          method: 'getBundleStatuses',
          params: [[bundleId]],
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const validBundle = request.data.result.value;

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
        \`Max retries reached (\${maxRetries}) without confirmation.\`
      );
    };

    const bundleStatus = await pollBundleStatus(JitoResponse);
    return bundleStatus;
  } catch (err) {
    console.error(err);
  }
};
`;

export const httpsServerDexSingleBuy = `
import { VersionedTransaction, Connection, Keypair } from '@solana/web3.js';
import bs58 from "bs58";
import axios from 'axios';

/////////////////////////////// CONFIG //////////////////////////////////////
const API_KEY = process.env.PUMPAGENT_API_KEY;
const RPC_URL = ""; // Visit Helius.dev
const connection = new Connection(RPC_URL, 'confirmed');
const RECIPIENT_PRIVATE_KEY = "Enter token recipient's private key."; 
const recipient = Keypair.fromSecretKey(bs58.decode(RECIPIENT_PRIVATE_KEY));

const payload = {
  recipient: recipient.publicKey,
  ca: "7iagMTDPfNSR5zVcERT1To7A9eaQoz58dJAh42EMHcCC",
  solIn: "0.35"
};
//////////////////////////////// END ////////////////////////////////////////

const buyDexSingle = async () => {
  const URL = "https://api.pumpagent.com/dex-single-buy";

  try {
    const request = await axios.post(URL, payload, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      }}
    );  

    const { serializedTransaction } = request.data;
    const transaction = VersionedTransaction.deserialize(Uint8Array.from(Buffer.from(serializedTransaction, "base64")));
    transaction.sign([recipient]);

    const signature = await connection.sendTransaction(transaction);
    console.log(\`Success: https://solscan.io/tx/\${signature}\`);
  } catch (error) {
    console.error("Error:", error);
  }
};

buyDexSingle();`;

export const httpsServerDexSingleSell = `
import { VersionedTransaction, Connection, Keypair } from '@solana/web3.js';
import bs58 from "bs58";
import axios from 'axios';

/////////////////////////////// CONFIG //////////////////////////////////////
const API_KEY = process.env.PUMPAGENT_API_KEY;
const RPC_URL = ""; // Visit Helius.dev
const connection = new Connection(RPC_URL, 'confirmed');
const RECIPIENT_PRIVATE_KEY = "Enter token recipient's private key."; 
const recipient = Keypair.fromSecretKey(bs58.decode(RECIPIENT_PRIVATE_KEY));

const payload = {
  recipient: recipient.publicKey,
  ca: "7iagMTDPfNSR5zVcERT1To7A9eaQoz58dJAh42EMHcCC",
  tokenAmount: "50000"
};
//////////////////////////////// END ////////////////////////////////////////

const sellDexSingle = async () => {
  const URL = "https://api.pumpagent.com/dex-single-sell";

  try {
    const request = await axios.post(URL, payload, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      }}
    );  

    const { serializedTransaction } = request.data;
    const transaction = VersionedTransaction.deserialize(Uint8Array.from(Buffer.from(serializedTransaction, "base64")));
    transaction.sign([recipient]);

    const signature = await connection.sendTransaction(transaction);
    console.log(\`Success: https://solscan.io/tx/\${signature}\`);
  } catch (error) {
    console.error("Error:", error);
  }
};

sellDexSingle();`;

export const httpsServerDexPaid = `
import axios from "axios";

/////////////////////////////// CONFIG //////////////////////////////////////
const API_KEY = process.env.PUMPAGENT_API_KEY;
const ca = "7iagMTDPfNSR5zVcERT1To7A9eaQoz58dJAh42EMHcCC";
//////////////////////////////// END ////////////////////////////////////////

const checkDexPaid = async () => {
  const URL = "https://api.pumpagent.com/dex-paid";

  try {
    const request = await axios.post(URL, { ca }, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY, 
      }}
    );  

    const { dexPaid } = request.data;
    console.log(\`DEX Paid: \${dexPaid}\`);
  } catch (error) {
    console.error("Error:", error);
  }
};

checkDexPaid();`;

export const webSocketServerTokenMigration = `
import io from "socket.io-client";

const socket = io("wss://ws.pumpagent.com");

socket.on("connect", () => console.log("Connected to WebSocket."));

socket.on("tokenMigration", (migration) => {
  console.log("New Migration: ", migration);
  // Handle action...
});

socket.on("disconnect", () => console.log("Disconnected from WebSocket."));

process.on("SIGINT", () => {
  console.log("Closing connection...");
  socket.disconnect();
  process.exit();
});`;

export const webSocketServerTokenCreation = `
import io from "socket.io-client";

const socket = io("wss://ws.pumpagent.com");

socket.on("connect", () => console.log("Connected to WebSocket."));

socket.on("tokenCreation", (launch) => {
  console.log("New Token Launch: ", launch);
  // Handle action...
});

socket.on("disconnect", () => console.log("Disconnected from WebSocket."));

process.on("SIGINT", () => {
  console.log("Closing connection...");
  socket.disconnect();
  process.exit();
});`;

export const webSocketServerTokenTrades = `
import io from "socket.io-client";

const mints = [
  "AYmkmffpEJg59f3BhirAUcGpoxdcingYFRjPp1hxpump",
  "H3SHzDWbk5HPCLzseaW8unyJQFZRiQQnBVtqzNq9pump",
  "4ZTRU5K5js4Tqjo9B2soBiDYscfgg8ULNktREWy6pump"
];

const socket = io("wss://ws.pumpagent.com", {
  query: {
    mints: JSON.stringify(mints),
  },
});

socket.on("connect", () => console.log("Connected to WebSocket."));

socket.on("tokenTrades", (trade) => {
  console.log("New Trade: ", trade);
  // Handle action...
});

socket.on("disconnect", () => console.log("Disconnected from WebSocket."));

process.on("SIGINT", () => {
  console.log("Closing connection...");
  socket.disconnect();
  process.exit();
});`;

export const webSocketServerUserTrades = `
import io from "socket.io-client";

const users = [
  "J95FHyvCKo7rkU2UeRNV69HymE3qCozHZYZBfneDdHQz",
  "D9orvgvgxTxv1nuNE7aLcrLVS9TT9WPh4fq8owMbUsw2",
  "2Ttzp7pNJ3vUgdTwemMFXUUnV73HuYt8RBvqUpATQPNN",
];

const socket = io("wss://ws.pumpagent.com", {
  query: {
    users: JSON.stringify(users),
  },
});

socket.on("connect", () => console.log("Connected to WebSocket."));

socket.on("userTrades", (trade) => {
  console.log("New Trade: ", trade);
  // Handle action...
});

socket.on("disconnect", () => console.log("Disconnected from WebSocket."));

process.on("SIGINT", () => {
  console.log("Closing connection...");
  socket.disconnect();
  process.exit();
});`;

export const webSocketServerPoolCreation = `
import io from "socket.io-client";

const socket = io("wss://ws.pumpagent.com");

socket.on("connect", () => console.log("Connected to WebSocket."));

socket.on("poolCreation", (pool) => {
  console.log("New Pool: ", pool);
  // Handle action...
});

socket.on("disconnect", () => console.log("Disconnected from WebSocket."));

process.on("SIGINT", () => {
  console.log("Closing connection...");
  socket.disconnect();
  process.exit();
});`;

export const webSocketServerPoolTrades = `
import io from "socket.io-client";

const pools = [
  "AYmkmffpEJg59f3BhirAUcGpoxdcingYFRjPp1hxpump",
  "H3SHzDWbk5HPCLzseaW8unyJQFZRiQQnBVtqzNq9pump",
  "4ZTRU5K5js4Tqjo9B2soBiDYscfgg8ULNktREWy6pump"
];

const socket = io("wss://ws.pumpagent.com", {
  query: {
    pools: JSON.stringify(pools),
  },
});

socket.on("connect", () => console.log("Connected to WebSocket."));

socket.on("poolTrade", (trade) => {
  console.log("New Trade: ", trade);
  // Handle action...
});

socket.on("disconnect", () => console.log("Disconnected from WebSocket."));

process.on("SIGINT", () => {
  console.log("Closing connection...");
  socket.disconnect();
  process.exit();
});`;

export const webSocketServerKOLTrades = `
import io from "socket.io-client";

const socket = io("wss://ws.pumpagent.com");

socket.on("connect", () => console.log("Connected to WebSocket."));

socket.on("kolTrades", (trade) => {
  console.log("New KOL Trade: ", trade);
  // Handle action...
});

socket.on("disconnect", () => console.log("Disconnected from WebSocket."));

process.on("SIGINT", () => {
  console.log("Closing connection...");
  socket.disconnect();
  process.exit();
});`;

export const webSocketServerPoolKOLTrades = `
import io from "socket.io-client";

const socket = io("wss://ws.pumpagent.com");

socket.on("connect", () => console.log("Connected to WebSocket."));

socket.on("kolPoolTrade", (trade) => {
  console.log("New KOL Pool Trade: ", trade);
  // Handle action...
});

socket.on("disconnect", () => console.log("Disconnected from WebSocket."));

process.on("SIGINT", () => {
  console.log("Closing connection...");
  socket.disconnect();
  process.exit();
});`;
