export const tokenBumpEnvCode = `
PORT=3000
PUMPAGENT_API_KEY="ENTER YOUR PUMPAGENT API KEY HERE"
HELIUS_API_KEY="ENTER YOUR HELIUS API KEY HERE"
SUPABASE_URL=""
SUPABASE_SERVICE_KEY=""
`;

export const tokenBumpNodeServer = `
import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";
import bs58 from "bs58";
import { VersionedTransaction, Connection, Keypair } from "@solana/web3.js";
import { createClient } from "@supabase/supabase-js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json()); 
app.use(cors()); 

const solToLamports = (solIn) => parseFloat(solIn) * 1000000000;
const minutesToSeconds = (minutes) => minutes * 60;

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const RPC_URL = \`https://mainnet.helius-rpc.com/?api-key=\${process.env.HELIUS_API_KEY}\`;
const connection = new Connection(RPC_URL, "confirmed");

// Server payment cache
const paymentCache = new Map();

/////////////////////////////// CONFIG //////////////////////////////////////
// Make sure these schemas match the client side bump * duration plans
const lamportPlanPrices = {
  "0.15 SOL": solToLamports("0.15"),
  "0.25 SOL": solToLamports("0.25"),
  "0.45 SOL": solToLamports("0.45"),
};

const bumpPlanDurationsInSeconds = {
  "15 Minutes": minutesToSeconds(15),
  "30 Minutes": minutesToSeconds(30),
  "1 Hour": minutesToSeconds(60),
};

// SOL profit to claim
const bumpProfitClaimAmount = {
  "0.15 SOL": "0.1",  // Leaves 0.05 SOL to bump 15 minutes
  "0.25 SOL": "0.15", // Leaves 0.1 SOL to bump 30 minutes
  "0.45 SOL": "0.3",  // Leaves 0.15 SOL to bump 1 hour
};
//////////////////////////////// END ////////////////////////////////////////

// Token bump process
const runBumpProcess = (ca, duration, bumpWallet, user) => {
  const bumpEndTime = Math.floor(Date.now() / 1000) + duration;
  const recipient = Keypair.fromSecretKey(bs58.decode(bumpWallet.privateKey));

  const payload = {
    recipient: recipient.publicKey,
    ca,
    solIn: "0.022", // SOL amount to bump
  };

  // Clear payment cache
  paymentCache.delete(user);

  // Launch bump process
  const bumpProcess = setInterval(() => {
    const currentTime = Math.floor(Date.now() / 1000);

    if (currentTime < bumpEndTime) {
      bumpToken(payload, recipient);
    } else {
      clearInterval(bumpProcess); // Bump plan is over, terminate process
    }
  }, 7500); // 7.5 second bump interval
};

// Token bump function
const bumpToken = async (payload, recipient) => {
  const URL = "https://api.pumpagent.com/pump-token-bump";

  try {
    const request = await axios.post(URL, payload, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.PUMPAGENT_API_KEY,
      },
    });

    const { serializedTransaction } = request.data;
    const serialized = Uint8Array.from(Buffer.from(serializedTransaction, "base64"));

    const transaction = VersionedTransaction.deserialize(serialized);
    transaction.sign([recipient]);

    const signature = await connection.sendTransaction(transaction);
    console.log(\`Buy & Sell Transaction: https://solscan.io/tx/\${signature}\`);
  } catch (error) {
    console.error("Error:", error);
  }
};

// Create payment instance and store to cache
const createPaymentInstance = async (ca, plan, user) => {
  try {
    const request = await axios.post(
      "https://api.pumpagent.com/generate-wallets", { amount: 1 }, {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.PUMPAGENT_API_KEY,
        }}
    );

    const { walletArray } = request.data;
    const paymentWallet = walletArray[0];

    const paymentObject = {
      paymentWallet,
      plan,
      ca,
    };

    paymentCache.set(user, paymentObject);
    return paymentWallet.publicKey;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

// Claim profits to your PumpAgent dashboard
const claimProfits = async (checkout) => {
  try {
    const funderKeypair = Keypair.fromSecretKey(bs58.decode(checkout.paymentWallet.privateKey));
    const solIn = bumpProfitClaimAmount[checkout.plan.price];

    const payload = {
      funderPubKey: funderKeypair.publicKey,
      solIn,
    };

    const URL = "https://api.pumpagent.com/claim-profits";
    const request = await axios.post(URL, payload, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.PUMPAGENT_API_KEY,
      },
    });

    const { serializedTransaction } = request.data;
    const serialized = Uint8Array.from(Buffer.from(serializedTransaction, "base64"));

    const transaction = VersionedTransaction.deserialize(serialized);
    transaction.sign([funderKeypair]);

    const signature = await connection.sendTransaction(transaction);
    if (!signature) throw new Error("Failed to claim profits.");
    console.log(\`Profits claimed to dashboard: https://solscan.io/tx/\${signature}\`);
  } catch (err) {
    console.error(err);
    throw err;
  }
};

// Confirm payment before bumping
const confirmPayment = async (user) => {
  try {
    const checkout = paymentCache.get(user);
    const planPriceInLamports = lamportPlanPrices[checkout.plan.price];
    const duration = bumpPlanDurationsInSeconds[checkout.plan.duration];
    const ca = checkout.ca;

    const paymentWallet = checkout.paymentWallet.publicKey;
    const request = await axios.post(RPC_URL,
      {
        jsonrpc: "2.0",
        id: 1,
        method: "getAccountInfo",
        params: [paymentWallet, { encoding: "base58" }],
      },
      { headers: { "Content-Type": "application/json" }}
    );

    const balanceInLamports = request?.data?.result?.value?.lamports;
    if (!balanceInLamports || balanceInLamports < planPriceInLamports)
      throw new Error("Insufficient balance.");

    // Payment successful, store bump payment wallet in database
    const { error } = await supabase.from("checkout").insert({
      ...checkout.paymentWallet,
    });
    if (error) throw new Error(error);

    // Withdraw profits to your dashboard
    await claimProfits(checkout);

    return { success: true, ca, duration, bumpWallet: checkout.paymentWallet };
  } catch (err) {
    console.error(err);
    throw err;
  }
};

// Validate if token is within it's bonding curve
const checkIfStillBonding = async (ca) => {
  const URL = "https://api.pumpagent.com/pump-bonding-curve";

  try {
    const request = await axios.post(URL, { ca }, {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.PUMPAGENT_API_KEY,
        },
      }
    );

    const { curveProgress } = request.data;
    return !isNaN(curveProgress) && curveProgress < 100;
  } catch (err) {
    console.error("Error:", err);
    throw err;
  }
};

// Request payment wallet route
app.post("/request-payment", async (req, res) => {
  const { ca, plan, user } = req.body;

  try {
    const isAllowedToBump = await checkIfStillBonding(ca);
    if (!isAllowedToBump) throw new Error("Token has completed it's bonding curve.");
    
    const bumpPaymentWallet = await createPaymentInstance(ca, plan, user);
    res.json({ bumpPaymentWallet });
  } catch (err) {
    console.error("Payment request error:", err);
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
});

// Confirm payment route + start bump process (if payment is ok)
app.post("/confirm-payment", async (req, res) => {
  const { user } = req.body;
  
  try {
    const { success, ca, duration, bumpWallet } = await confirmPayment(user);
    
    if (success) {
      // Run bump process asynchronously
      runBumpProcess(ca, duration, bumpWallet, user);

      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, message: "Payment failed." });
    }
  } catch (err) {
    console.error("Payment error:", err);
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
});

// Start local development server on the specified port
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});`;

export const tokenBumpPaymentRequest = `
// Request payment wallet route
app.post("/request-payment", async (req, res) => {
  const { ca, plan, user } = req.body;

  try {
    const isAllowedToBump = await checkIfStillBonding(ca);
    if (!isAllowedToBump) throw new Error("Token has completed it's bonding curve.");
    
    const bumpPaymentWallet = await createPaymentInstance(ca, plan, user);
    res.json({ bumpPaymentWallet });
  } catch (err) {
    console.error("Payment request error:", err);
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
});`;

export const tokenBumpPaymentInstance = `
// Create payment instance and store to cache
const createPaymentInstance = async (ca, plan, user) => {
  try {
    const request = await axios.post(
      "http://localhost:3000/generate-wallets", { amount: 1 },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.PUMPAGENT_API_KEY,
        },
      }
    );

    const { walletArray } = request.data;
    const paymentWallet = walletArray[0];

    const paymentObject = {
      paymentWallet,
      plan,
      ca,
    };

    paymentCache.set(user, paymentObject);
    return paymentWallet.publicKey;
  } catch (err) {
    console.error(err);
    throw err;
  }
}`;

export const tokenBumpConfirmPayment = `
const confirmPayment = async (user) => {
  try {
    const checkout = paymentCache.get(user);
    const planPriceInLamports = lamportPlanPrices[checkout.plan.price];
    const duration = bumpPlanDurationsInSeconds[checkout.plan.duration];
    const ca = checkout.ca;

    const paymentWallet = checkout.paymentWallet.publicKey;
    const request = await axios.post(RPC_URL,
      {
        jsonrpc: "2.0",
        id: 1,
        method: "getAccountInfo",
        params: [paymentWallet, { encoding: "base58" }],
      },
      { headers: { "Content-Type": "application/json" } }
    );

    const balanceInLamports = request?.data?.result?.value?.lamports;
    if (!balanceInLamports || balanceInLamports < planPriceInLamports)
      throw new Error("Insufficient balance.");

    // Payment successful, store bump payment wallet in database
    const { error } = await supabase.from("checkout").insert({
      ...checkout.paymentWallet,
    });
    if (error) throw new Error(error);

    // Withdraw profits to your PumpAgent dashboard
    await claimProfits(checkout);

    return { success: true, ca, duration, bumpWallet: checkout.paymentWallet };
  } catch (err) {
    console.error(err);
    throw err;
  }
};
`;

export const tokenBumpBumpProcess = `
const runBumpProcess = (ca, duration, bumpWallet, user) => {
  const bumpEndTime = Math.floor(Date.now() / 1000) + duration;
  const recipient = Keypair.fromSecretKey(bs58.decode(bumpWallet.privateKey));

  const payload = {
    recipient: recipient.publicKey,
    ca,
    solIn: "0.022", // SOL amount to bump
  };

  // Clear payment cache
  paymentCache.delete(user);

  // Launch bump process
  const bumpProcess = setInterval(() => {
    const currentTime = Math.floor(Date.now() / 1000);

    if (currentTime < bumpEndTime) {
      bumpToken(payload, recipient);
    } else {
      clearInterval(bumpProcess); // Bump plan is over, terminate process
    }
  }, 7500); // 7.5 second bump interval
};`;
