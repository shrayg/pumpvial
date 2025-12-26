import { useCallback, useEffect, useRef, useState } from "react";
import { FaRegCopy } from "react-icons/fa6";
import { createSocket } from "../Bundler/Trade/createSocket";
import { FaDollarSign } from "react-icons/fa";
import FetchToken from "./FetchToken";
import { Keypair, VersionedTransaction } from "@solana/web3.js";
import bs58 from "bs58";
import SOL from "../../../../assets/SOL.png";
import { IoRocket } from "react-icons/io5";
import { solConnection } from "../../../../../../server/utils/constants";
import { smallerTimeAgo } from "../../../../utils/functions";
import { FaExternalLinkAlt } from "react-icons/fa";

const Bump = () => {
  const [ca, setCa] = useState("");
  const [payerPriv, setPayerPriv] = useState("");
  const [tokenData, setTokenData] = useState(null);
  const [solPrice, setSolPrice] = useState(0);
  const [funderBalance, setFunderBalance] = useState(0.0);
  const [trades, setTrades] = useState({});
  const [mc, setMc] = useState(0);
  const [publicKey, setPublicKey] = useState("");
  const [bumpAmount, setBumpAmount] = useState(0.022);
  const [bumpInterval, setBumpInterval] = useState(7);
  const [botActive, setBotActive] = useState(false);
  const [loggedBumps, setLoggedBumps] = useState([]);
  const [_, setTick] = useState(0);

  useEffect(() => {
    const tickInterval = setInterval(() => {
      setTick((prev) => prev + 1);
    });
    return () => clearInterval(tickInterval);
  }, []);

  // Load from localStorage on mount
  useEffect(() => {
    const storedBumpAmount = localStorage.getItem("bumpAmount");
    const storedBumpInterval = localStorage.getItem("bumpInterval");

    if (storedBumpAmount !== null) {
      setBumpAmount(parseFloat(storedBumpAmount));
    }
    if (storedBumpInterval !== null) {
      setBumpInterval(parseInt(storedBumpInterval));
    }
  }, []);

  // Cache to localStorage when values change
  useEffect(() => {
    localStorage.setItem("bumpAmount", bumpAmount.toString());
  }, [bumpAmount]);

  useEffect(() => {
    localStorage.setItem("bumpInterval", bumpInterval.toString());
  }, [bumpInterval]);

  // Get SOL price every 60 sec
  useEffect(() => {
    const solFetcher = async () => {
      try {
        const res = await fetch(
          "https://lite-api.jup.ag/price/v2?ids=So11111111111111111111111111111111111111112&vsToken=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
        );
        const { data } = await res.json();

        // Extract the price
        const solPrice =
          data["So11111111111111111111111111111111111111112"].price;
        setSolPrice(+solPrice);
      } catch (err) {
        console.error("Failed to fetch SOL price:", err);
      }
    };

    solFetcher();
    const interval = setInterval(solFetcher, 60000);
    return () => clearInterval(interval);
  }, []);

  const getTokenTradeData = useCallback(
    (response) => {
      const totalSupply = 1_000_000_000;

      const solReserves =
        response?.virtual_sol_reserves ||
        trades?.lastTrade?.virtual_sol_reserves ||
        tokenData?.virtual_sol_reserves;

      const tokenReserves =
        response?.virtual_token_reserves ||
        trades?.lastTrade?.virtual_token_reserves ||
        tokenData?.virtual_token_reserves;

      const parsedSol = Number(solReserves / 1e9);
      const parsedTokens = Number(tokenReserves / 1e6);

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

      return { marketCap };
    },
    [tokenData, solPrice]
  );

  const reset = () => {
    setTokenData(null);
    setCa("");
    setFunderBalance(0.0);
    setTrades({});
    setMc(0);
    setPublicKey("");
    setPayerPriv("");
    setLoggedBumps([]);
  };

  const handleTokenTrades = (payload) => {
    const {
      recipient,
      type,
      tokens_received,
      tokens_sold,
      virtual_sol_reserves,
      virtual_token_reserves,
      real_sol_reserves,
    } = payload;
    const data = getTokenTradeData(payload);

    const { marketCap } = data || {};
    setMc(marketCap);

    setTrades((prev) => {
      const holdersMap = new Map(Object.entries(prev?.holders || {}));
      const currentBalance = holdersMap.get(recipient) || 0;
      let updatedBalance = currentBalance;

      if (type === "Buy" && tokens_received) {
        updatedBalance += tokens_received;
      } else if (type === "Sell" && tokens_sold) {
        updatedBalance -= tokens_sold;
        if (updatedBalance < 10) updatedBalance = 0;
      }

      holdersMap.set(recipient, updatedBalance);

      return {
        holders: Object.fromEntries(holdersMap),
        createdAt: prev?.createdAt || Date.now(),
        lastTrade: {
          virtual_sol_reserves,
          virtual_token_reserves,
          real_sol_reserves,
          recipient,
          type,
          tokens_received,
          tokens_sold,
        },
      };
    });
  };

  useEffect(() => {
    if (!ca || !tokenData) return;
    const socket = createSocket({ mints: [ca] }); // Create only one socket connection
    socket.on("tokenTrades", handleTokenTrades);
    return () => {
      // Clean up all listeners and disconnect
      socket.off("tokenTrades", handleTokenTrades);
      socket.disconnect();
    };
  }, [ca, tokenData]);

  const balanceFetcher = async () => {
    try {
      const request = await fetch("https://api.pumpagent.com/sol-balances", {
        method: "POST",
        body: JSON.stringify({
          wallets: [publicKey],
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const { balances } = await request.json();
      if (!balances) return;
      setFunderBalance(balances[0]);
    } catch (err) {
      console.error(err);
    }
  };
  useEffect(() => {
    if (!publicKey) return;

    balanceFetcher();
  }, [publicKey]);

  const launchBot = async () => {
    if (botActive) {
      balanceFetcher();
      return setBotActive(false);
    }
    setBotActive(true);
    balanceFetcher();
  };

  useEffect(() => {
    if (!botActive || +bumpAmount >= +funderBalance) return;

    const interval = setInterval(async () => {
      try {
        const recipient = Keypair.fromSecretKey(bs58.decode(payerPriv));

        const URL = "https://api.pumpagent.com/token-bump";
        const request = await fetch(URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            recipient: recipient.publicKey,
            ca,
            solIn: bumpAmount,
          }),
        });

        const { serializedTransaction } = await request.json();
        const serialized = Uint8Array.from(atob(serializedTransaction), (c) =>
          c.charCodeAt(0)
        );

        const transaction = VersionedTransaction.deserialize(serialized);
        transaction.sign([recipient]);

        const signature = await solConnection().sendTransaction(transaction);
        console.log(`Success: https://solscan.io/tx/${signature}`);

        // Optional: log to terminal
        setLoggedBumps((prev) => [
          { sig: signature, time: new Date() },
          ...prev,
        ]);
      } catch (err) {
        console.error("Bump failed:", err);
      }
    }, bumpInterval * 1000); // run at defined interval

    return () => clearInterval(interval); // cleanup on unmount or when bot deactivates
  }, [botActive, bumpInterval, bumpAmount, publicKey, ca]);

  return (
    <div className="flex-1 flex justify-center items-center relative">
      <div className="max-w-[500px] w-full mx-4 h-[500px] bg-[#080808] border border-gray-900 rounded-md flex flex-col items-center justify-start p-4 relative">
        <h2 className="text-[12px] text-gray-400">Pump.fun Token Bumper</h2>
        {!tokenData && (
          <div className="flex items-between gap-2 top-0 text-[12px] text-gray-500 pt-0.5">
            <span>No Deposit Fee</span>
            <span>0.5% Fee Per Bump</span>
          </div>
        )}
        {tokenData && (
          <button
            className="select-none absolute text-[12px] text-gray-500 left-3 top-3 bg-[#202020] hover:bg-[#333] hover:text-white p-1.5 cursor-pointer"
            onClick={reset}
          >
            Back
          </button>
        )}
        {!tokenData && (
          <FetchToken
            ca={ca}
            setCa={setCa}
            setTokenData={setTokenData}
            tokenData={tokenData}
            getTokenTradeData={getTokenTradeData}
            setMc={setMc}
          />
        )}
        {tokenData && (
          <div className="w-full flex flex-col border-b border-gray-900 pb-2 canvasgrad">
            <div className="flex p-2 mt-10 select-none">
              <img
                src={tokenData.image_uri}
                alt={tokenData.name}
                className="w-10 h-10 rounded-full"
              />
              <div className="flex flex-col text-[12px] text-gray-500 pl-2">
                <span className="text-white mb-0.25">{tokenData.name}</span>
                <span className="mb-0.25">{tokenData.symbol}</span>
                <span className=" items-center gap-1 select-none hidden md:flex text-[10px]">
                  {tokenData.mint}{" "}
                  <FaRegCopy
                    className="cursor-pointer text-gray-400 hover:text-white active:text-greener"
                    onClick={() =>
                      navigator.clipboard.writeText(tokenData.mint)
                    }
                  />
                </span>
                <span className=" items-center gap-1 select-none flex md:hidden">
                  {tokenData.mint.slice(0, 10) +
                    "..." +
                    tokenData.mint.slice(-10)}{" "}
                  <FaRegCopy
                    className="cursor-pointer text-gray-400 hover:text-white active:text-greener"
                    onClick={() =>
                      navigator.clipboard.writeText(tokenData.mint)
                    }
                  />
                </span>
              </div>
              <div className=" flex justify-center items-center ml-auto pr-5">
                <span className="text-greener text-[12px] flex flex-col items-center gap-1">
                  <span className="flex">MC</span>
                  <span className="flex">
                    <FaDollarSign /> {mc?.toFixed(2)}K{" "}
                  </span>
                </span>
              </div>
            </div>
          </div>
        )}
        {tokenData?.complete && (
          <div className="flex flex-1 h-full w-full justify-center items-center">
            <span className="text-[12px] text-gray-600">
              Token has completed it's bonding curve.
            </span>
          </div>
        )}
        {tokenData && !tokenData?.complete && (
          <>
            {!publicKey && (
              <div className="flex flex-col flex-1 h-full w-full text-[12px] text-gray-500 justify-center items-center gap-1 pb-10">
                <label htmlFor="contract-input select-none">
                  Enter Bump Payer Private Key
                </label>
                <input
                  type="text"
                  id="contract-input"
                  className="text-white placeholder:text-gray-700 focus:outline-green-300 focus:outline-1 focus:bg-[#23ff4011]  rounded-md border border-gray-800 p-1 w-70"
                  placeholder="Enter private key"
                  value={payerPriv}
                  onChange={(e) => {
                    const priv = e.target.value;
                    setPayerPriv(priv);

                    try {
                      const keypair = Keypair.fromSecretKey(bs58.decode(priv));
                      setPublicKey(keypair.publicKey.toBase58());
                    } catch (err) {
                      setPublicKey(""); // Invalid key
                    }
                  }}
                />
                <span className="mt-2 max-w-70 text-gray-600">
                  Private keys stay on your computer and won't be send to our
                  servers.{" "}
                  <span
                    className="text-greener cursor-pointer opacity-70 hover:opacity-100"
                    onClick={() =>
                      window.open(
                        "https://pumpagent.com/https/introduction",
                        "_blank"
                      )
                    }
                  >
                    Read More.
                  </span>
                </span>
              </div>
            )}
            {publicKey && (
              <>
                <div className="mt-2 text-white text-[12px] p-2 rounded w-full flex justify-between items-start select-none pr-7 border-b border-gray-900 pb-2">
                  <div className="flex flex-col items-start justify-between gap-1">
                    <span className="text-gray-500 pb-0.5">Funder</span>
                    <span className="select-none flex items-center gap-1">
                      {publicKey.slice(0, 10) + "..." + publicKey.slice(-10)}{" "}
                      <FaRegCopy
                        className="cursor-pointer text-gray-400 hover:text-white active:text-greener"
                        onClick={() => navigator.clipboard.writeText(publicKey)}
                      />
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5 flex-col">
                    <div className="text-gray-500">Balance</div>
                    <div className="flex items-center gap-1">
                      <img src={SOL} alt="SOL" className="w-5 h-5" />
                      <span
                        className={
                          +bumpAmount >= +funderBalance
                            ? "text-red-500"
                            : "text-white"
                        }
                      >
                        {funderBalance?.toFixed(3)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="w-full text-[12px] py-2 mt-2">
                  <div className="flex w-full gap-4">
                    <div className="w-1/2 bg-black rounded-md gap-2 flex flex-col p-2 items-center">
                      <span className="text-gray-600">Bump Interval</span>
                      <input
                        type="range"
                        className="w-4/5 "
                        min={5}
                        max={30}
                        step={1}
                        value={bumpInterval}
                        onChange={(e) => setBumpInterval(+e.target.value)}
                      />
                      <span className="text-white">
                        {bumpInterval}
                        <span className="text-gray-400 pl-0.5">s</span>
                      </span>
                    </div>
                    <div className="w-1/2 bg-black rounded-md gap-2 flex flex-col p-2 items-center">
                      <span className="text-gray-600">Bump Amount</span>
                      <div className="relative">
                        <img
                          src={SOL}
                          alt="SOL"
                          className="w-4 h-4 absolute top-1.25 left-1.5"
                        />
                        <input
                          type="number"
                          id="contract-input"
                          className="text-white placeholder:text-gray-700 placeholder:text-[12px] focus:outline-green-300 focus:outline-1 focus:bg-[#23ff4011]  rounded-md border border-gray-800 p-1 pl-6 w-40"
                          placeholder="Enter bump amount"
                          value={bumpAmount}
                          onChange={(e) => setBumpAmount(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  className={`text-black text-[12px]   p-2 rounded-md w-full mt-2 ${
                    +bumpAmount >= +funderBalance
                      ? "cursor-not-allowed"
                      : "cursor-pointer hover:text-white"
                  } hover:text-whit flex items-center gap-1 justify-center ${
                    botActive ? "gradbtn" : "bg-green-500"
                  }`}
                  onClick={launchBot}
                  disabled={+bumpAmount >= +funderBalance ? true : false}
                >
                  <IoRocket className={`${botActive ? "rocket" : ""}`} />
                  {+bumpAmount >= +funderBalance && "Insufficient Funds"}
                  {!botActive && +bumpAmount < +funderBalance && "Launch Bot"}
                  {botActive && +bumpAmount < +funderBalance && "Bot Active"}
                </button>
                <div className="flex justify-between w-full  mt-3 px-2">
                  <span className="text-[10px] text-gray-600">Terminal</span>
                  <span className="text-[10px] text-gray-600">
                    Bumps {loggedBumps.length}
                  </span>
                </div>
                <div className="flex flex-1 w-full mt-2 bg-black p-2 rounded-md flex-col gap-2 overflow-auto">
                  <table className="w-full text-left table-auto ">
                    <thead className="bg-black ">
                      <tr>
                        <th className="text-gray-400 text-[12px] p-1">
                          <span>Transaction</span>
                        </th>
                        <th className="text-gray-400 text-[12px]">
                          <span>Time</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {loggedBumps.map((bump, idx) => (
                        <tr key={idx}>
                          <td
                            className={`text-[11px] text-gray-600 truncate cursor-pointer w-min flex items-center gap-0.75 p-1`}
                          >
                            <FaExternalLinkAlt className="text-[8px]" />
                            <a
                              href={`https://solscan.io/tx/${bump.sig}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline hover:text-white"
                            >
                              {bump.sig.slice(0, 10)}...{bump.sig.slice(-10)}
                            </a>
                          </td>
                          <td className="text-white text-[11px] text-left">
                            {smallerTimeAgo(bump.time)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>
      <span className="text-gray-400 text-[12px] absolute left-2 bottom-2 select-none">
        <span className="opacity-50">Issues? Report in the</span>{" "}
        <span
          className="opacity-100 text-greener cursor-pointer hover:underline"
          onClick={() => window.open("https://discord.gg/WBmZss3jQq", "_blank")}
        >
          {" "}
          Discord{" "}
        </span>
      </span>
    </div>
  );
};

export default Bump;
// GaqjJz98U2kGEZfZjThoEs6TDnFKZFtmJTjYLnz5pump
// nMqrqMLZkCqfFpPpUMNw5rMPwALQAQ5t64XbRBbB7FjBZoLjJ2nDPTzYbt2CjAkb1AGdt7PUabEkrg88k43Pz43
