import { PublicKey } from "@solana/web3.js";
import {
  heliusConnection,
  heliusRPCURL,
  solConnection,
  solRPCURL,
} from "../../../server/utils/constants.js";
import {
  struct,
  publicKey,
  i64,
  u8,
  u16,
  str,
  u64,
  bool,
} from "@coral-xyz/borsh";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
export const copy = (text) => navigator.clipboard.writeText(text);

export const formatBalance = (num) => {
  if (num === undefined) return;
  if (num === 0) return "0";
  if (Math.abs(num) < 1) return num.toFixed(3);
  return num.toFixed(2);
};

export const timeAgo = (unixTimestamp) => {
  const now = Date.now();
  const timestamp = unixTimestamp < 1e12 ? unixTimestamp * 1000 : unixTimestamp;
  const diffMs = now - timestamp;

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) return `${seconds} Second${seconds !== 1 ? "s" : ""}`;
  if (minutes < 60) return `${minutes} Minute${minutes !== 1 ? "s" : ""}`;
  if (hours < 24) return `${hours} Hour${hours !== 1 ? "s" : ""}`;
  if (days < 7) return `${days} Day${days !== 1 ? "s" : ""}`;
  if (weeks < 4) return `${weeks} Week${weeks !== 1 ? "s" : ""}`;
  if (months < 12) return `${months} Month${months !== 1 ? "s" : ""}`;
  return `${years} year${years !== 1 ? "s" : ""}`;
};

export const smallerTimeAgo = (unixTimestamp) => {
  const now = Date.now();
  const timestamp = unixTimestamp < 1e12 ? unixTimestamp * 1000 : unixTimestamp;
  const diffMs = now - timestamp;

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return `${seconds}s`;
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
};

export const smallTimeAgo = (unixTimestamp, isMobile) => {
  const now = Date.now();
  const timestamp = unixTimestamp < 1e12 ? unixTimestamp * 1000 : unixTimestamp;
  const diffMs = now - timestamp;

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) return `${seconds} sec${seconds !== 1 ? "" : ""}`;
  if (minutes < 60) return `${minutes} min${minutes !== 1 ? "s" : ""}`;
  if (hours < 24) return `${hours} h${hours !== 1 ? "s" : ""}`;
  if (days < 7) return `${days} Day${days !== 1 ? "s" : ""}`;
  if (weeks < 4) return `${weeks} Week${weeks !== 1 ? "s" : ""}`;
  if (months < 12) return `${months} Month${months !== 1 ? "s" : ""}`;
  return `${years} year${years !== 1 ? "s" : ""}`;
};

export const isValidBase58 = (str) => {
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{31,}$/;
  return base58Regex.test(str);
};

export const formatTokens = (num) => {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toString();
};

export const formatChartTokens = (num) => {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(0).replace(/\.0$/, "") + "K";
  }
  return num.toString();
};

export const formatMarketcap = (num) => {
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
  }

  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num > 100_000 && num < 1_000_000) {
    return (num / 1_000).toFixed(0) + "K";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(0).replace(/\.0$/, "") + "K";
  }
  return num.toString();
};

export function getPumpPoolPdaString(baseMintStr) {
  const quoteMint = new PublicKey(
    "So11111111111111111111111111111111111111112"
  );
  const AMM = new PublicKey("pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA");
  const PUMP = new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");

  const baseMint = new PublicKey(baseMintStr);

  const encoder = new TextEncoder();
  const poolAuthoritySeed = encoder.encode("pool-authority");

  const [poolAuthority] = PublicKey.findProgramAddressSync(
    [poolAuthoritySeed, baseMint.toBytes()],
    PUMP
  );

  const indexBuffer = new Uint8Array([0, 0]); // equivalent to index 0

  const poolSeed = encoder.encode("pool");

  const [pool] = PublicKey.findProgramAddressSync(
    [
      poolSeed,
      indexBuffer,
      poolAuthority.toBytes(),
      baseMint.toBytes(),
      quoteMint.toBytes(),
    ],
    AMM
  );

  return pool.toBase58();
}

export const getIPFSUrl = (uri) => {
  if (!uri) return "";

  // Handle "ipfs://..." or raw hash
  if (uri.startsWith("ipfs://")) {
    return `https://ipfs.io/ipfs/${uri.slice(7)}`;
  }

  // Handle if it's just a raw CID or path
  if (!uri.startsWith("http")) {
    return `https://ipfs.io/ipfs/${uri}`;
  }

  // Replace non-official gateway with ipfs.io
  if (uri.includes("ipfs/")) {
    const parts = uri.split("ipfs/");
    return `https://ipfs.io/ipfs/${parts[1]}`;
  }

  return uri;
};

export const calculateMarketcap = (solReserves, tokenReserves, solPrice) => {
  const totalSupply = 1_000_000_000;

  const parsedSol = Number((solReserves / 1e9).toFixed(5));
  const parsedTokens = Number(tokenReserves / 1e6);

  if (!parsedTokens || parsedTokens <= 0 || !parsedSol || parsedSol <= 0) {
    return null;
  }

  const pricePerTokenInSOL = parsedSol / parsedTokens;
  const pricePerTokenInUSD = pricePerTokenInSOL * solPrice;
  const marketCap = totalSupply * pricePerTokenInUSD;

  return marketCap;
};

const waitForTransaction = async (signature, retries = 5, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    const tx = await solConnection().getTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });
    if (tx && tx.meta) return tx;
    await new Promise((res) => setTimeout(res, delay));
  }
  throw new Error("Transaction not found or missing metadata after retries");
};

export const getSolBalanceDifference = async (txSignature, walletPubkeyStr) => {
  const pubkey = new PublicKey(walletPubkeyStr);
  await heliusConnection().confirmTransaction(txSignature, "confirmed");

  const tx = await waitForTransaction(txSignature);

  const accountKeys = tx.transaction.message.staticAccountKeys;
  const accountIndex = accountKeys.findIndex((key) => key.equals(pubkey));

  if (accountIndex === -1) {
    throw new Error("Wallet not involved in transaction");
  }

  const preLamports = tx.meta.preBalances[accountIndex];
  const postLamports = tx.meta.postBalances[accountIndex];
  const lamportsSpent = preLamports - postLamports;

  return Math.abs(lamportsSpent / 1e9); // SOL
};

// Define SPL Token Account layout
const TokenAccountLayout = struct([
  publicKey("mint"),
  publicKey("owner"),
  u64("amount"),
  // 64 more bytes follow, but we only care about the first part
]);

export const getMintTokenAccount = async (account) => {
  try {
    const response = await fetch(heliusRPCURL(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getAccountInfo",
        params: [
          account,
          {
            encoding: "base64", // base64 keeps layout compatibility
          },
        ],
      }),
    });

    const { result } = await response.json();

    if (!result || !result.value) {
      throw new Error("Token account not found.");
    }

    const [base64Data] = result.value.data;

    // Decode base64 without Buffer
    const binaryStr = atob(base64Data);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const decoded = TokenAccountLayout.decode(bytes);
    return new PublicKey(decoded.mint).toBase58();
  } catch (error) {
    console.error("Error getting mint from token account:", error.message);
    return null;
  }
};

const PoolAccountLayout = struct([
  u8("pool_bump"),
  u16("index"),
  publicKey("creator"),
  publicKey("base_mint"),
  publicKey("quote_mint"),
  publicKey("lp_mint"),
  publicKey("pool_base_token_account"),
  publicKey("pool_quote_token_account"),
  u64("lp_supply"),
]);

export const getMintAddressesFromPool = async (poolAddress) => {
  try {
    const response = await fetch(solRPCURL(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getAccountInfo",
        params: [
          poolAddress,
          {
            encoding: "base64", // base64 keeps layout compatibility
          },
        ],
      }),
    });

    const { result } = await response.json();
    if (!result || !result.value) {
      throw new Error("Pool account not found.");
    }

    const [base64Data] = result.value.data;
    const buffer = Buffer.from(base64Data, "base64");
    const decoded = PoolAccountLayout.decode(buffer.slice(8));
    const mint = new PublicKey(decoded.base_mint).toBase58();

    return mint;
  } catch (error) {
    console.error("Error getting mint addresses from pool:", error.message);
    return null;
  }
};

// 6eJqMv1uJxruwxLBgNK8KVScQgq8oEqPTxPMXXvdB5u6

export const privToPub = (priv) => {
  try {
    const keypair = Keypair.fromSecretKey(bs58.decode(priv.trim()));
    return keypair.publicKey.toBase58();
  } catch (error) {
    console.error(
      "Failed to convert private key to public key:",
      error.message
    );
    return null; // Or return error.message if you prefer
  }
};

export async function getWalletSolBalances(wallets) {
  if (!Array.isArray(wallets) || wallets.length === 0) {
    throw new Error("Wallets must be a non-empty array.");
  }

  try {
    const response = await fetch("https://api.pumpagent.com/sol-balances", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ wallets }),
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.balances;
  } catch (err) {
    console.error("Failed to fetch balances from API:", err.message);
    throw new Error("Failed to fetch balances from local endpoint.");
  }
}

export async function getWalletTokenBalances(wallets, ca) {
  if (!Array.isArray(wallets) || wallets.length === 0) {
    throw new Error("Wallets must be a non-empty array.");
  }

  try {
    const response = await fetch(
      "https://api.pumpagent.com/get-mint-balances-for-holders",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ wallets, ca }),
      }
    );

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Failed to fetch balances from API:", err.message);
    throw new Error("Failed to fetch balances from local endpoint.");
  }
}

export const calculateMarketCap = (tokenReserves, solReserves, solPrice) => {
  const totalSupply = 1_000_000_000;

  const parsedSol = solReserves / 1e9;
  const parsedTokens = tokenReserves / 1e6;

  if (
    !parsedTokens ||
    parsedTokens <= 0 ||
    parsedSol < 0.001 ||
    parsedSol <= 10
  ) {
    return null;
  }

  const pricePerTokenInSOL = parsedSol / parsedTokens;
  const pricePerTokenInUSD = pricePerTokenInSOL * solPrice;
  const marketCap = (totalSupply * pricePerTokenInUSD) / 1000;

  return marketCap;
};

export const calculatePoolMarketCap = (
  tokenReserves,
  solReserves,
  solPrice,
  totalSupply,
  tokenDecimals
) => {
  const parsedSol = solReserves / 1e9;
  const parsedTokens = tokenReserves / 10 ** tokenDecimals;

  if (
    !parsedTokens ||
    parsedTokens <= 0 ||
    parsedSol < 0.001 ||
    parsedSol <= 10
  ) {
    return null;
  }

  const pricePerTokenInSOL = parsedSol / parsedTokens;
  const pricePerTokenInUSD = pricePerTokenInSOL * solPrice;
  const marketCap = totalSupply * pricePerTokenInUSD;
  return marketCap;
};
