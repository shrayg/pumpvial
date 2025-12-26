import Menu from "./Menu";
import SOL from "../../../../../../assets/SOL.png";
import Spinner from "../../../../../../assets/Spinner.svg";
import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Keypair, VersionedTransaction } from "@solana/web3.js";
import {
  formatTokens,
  getWalletSolBalances,
  getWalletTokenBalances,
  privToPub,
} from "../../../../../../utils/functions";
import bs58 from "bs58";

const solOptions = [
  { label: "Reset", value: "" },
  { label: "0.1 SOL", value: "0.1" },
  { label: "0.5 SOL", value: "0.5" },
  { label: "1 SOL", value: "1" },
];

const tokenOptions = [
  { label: "Reset", value: "" },
  { label: "25%", value: "25" },
  { label: "50%", value: "50" },
  { label: "75%", value: "75" },
  { label: "100%", value: "100" },
];

const TradePanel = ({
  form,
  wallets,
  trackedHolders,
  holders,
  userData,
  refetchBalances,
  setRefetchBalances,
  setForm,
}) => {
  const parentRef = useRef(null);
  const [buyAmounts, setBuyAmounts] = useState({});
  const [solBalances, setSolBalances] = useState({});
  const [tradeLoading, setTradeLoading] = useState({});
  const [tokenBalances, setTokenBalances] = useState({});
  const [sellAmounts, setSellAmounts] = useState({});
  const [expanded, setExpanded] = useState({});
  const [menuBuySell, setMenuBuySell] = useState({});
  const [height, setHeight] = useState(0);
  const [keyPairs, setKeyPairs] = useState({});
  const [allWallets, setAllWallets] = useState([]);

  const tokenImage = form.metadata?.image;
  const tokenSymbol = form.metadata?.symbol;
  const developerPriv = wallets?.developer;

  // Init menu
  useEffect(() => {
    if (wallets?.bundle) {
      const bundleState = wallets.bundle.reduce((acc, privKey) => {
        // const bundleState = bundles.reduce((acc, privKey) => {
        acc[privKey] = false;
        return acc;
      }, {});

      setExpanded({ ...bundleState });
      setMenuBuySell({ ...bundleState });
    }
  }, [wallets?.bundle]);

  useEffect(() => {
    // if (!wallets.bundle.length) return;

    const allWallets = [
      developerPriv,
      ...(Object.values(wallets?.bundle) || {}),
    ].filter(Boolean); // Prod
    const keyPairs = allWallets.reduce((acc, priv) => {
      const keyPair = Keypair.fromSecretKey(bs58.decode(priv));
      acc[keyPair.publicKey.toBase58()] = priv;
      return acc;
    }, {});
    setKeyPairs(keyPairs);
    setAllWallets(allWallets);
  }, [wallets.bundle]);
  // const allWallets = [developerPriv, ...bundles];

  useLayoutEffect(() => {
    if (parentRef.current) {
      setHeight(parentRef.current.clientHeight);
    }
  }, [parentRef]);

  useEffect(() => {
    if (!Object.entries(keyPairs).length) return;
    getSolBalances();
    getTokenBalances();
  }, [keyPairs]);

  const getSolBalances = async () => {
    try {
      const pubkeys = Object.keys(keyPairs); // array of public keys

      if (!pubkeys.length) return;
      const balances = await getWalletSolBalances(pubkeys); // array of balances

      const balanceMap = pubkeys.reduce((acc, key, index) => {
        acc[key] = balances[index]; // map each key to its balance
        return acc;
      }, {}); // don't forget the initial empty object

      setSolBalances(balanceMap);
    } catch (err) {
      console.error(err);
    }
  };

  const getTokenBalances = async () => {
    try {
      const pubkeys = Object.keys(keyPairs).filter(Boolean);
      const mint = form.mintPub;
      if (!mint || !pubkeys.length) return;
      const balances = await getWalletTokenBalances(pubkeys, mint); // array of balances
      const balanceMap = pubkeys.reduce((acc, key, index) => {
        acc[key] = balances[index]; // map each key to its balance
        return acc;
      }, {}); // don't forget the initial empty object

      setTokenBalances(balanceMap);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBuy = async (priv) => {
    const buyAmount = buyAmounts[priv];
    if (!buyAmount) return;
    const recipientKeypair = Keypair.fromSecretKey(bs58.decode(priv));
    const recipientPublickey = recipientKeypair.publicKey.toBase58();

    const developerKeypair = Keypair.fromSecretKey(bs58.decode(priv));
    const developerPublickey = developerKeypair.publicKey.toBase58();
    setTradeLoading((prev) => ({ ...prev, [recipientPublickey]: true }));

    try {
      // Create transaction
      const createRequest = await fetch(
        "https://api.pumpagent.com/create-pumpfun-buy-transaction",
        {
          method: "POST",
          body: JSON.stringify({
            ca: form.mintPub,
            solIn: buyAmount,
            recipient: recipientPublickey,
            prioFee: "Medium",
            slippapge: 15,
            creator: developerPublickey,
            jitoTip: "0.00002",
          }),
          headers: {
            "Content-Type": "application/json",
            "x-api-key": userData?.api_key,
          },
        }
      );
      const { serializedTransaction, txResult } = await createRequest.json();
      const transaction = VersionedTransaction.deserialize(
        Uint8Array.from(atob(serializedTransaction), (c) => c.charCodeAt(0))
      );
      transaction.sign([recipientKeypair]);

      const signedTxBase64 = btoa(
        String.fromCharCode(...transaction.serialize())
      );

      const confirmRequest = await fetch(
        "https://api.pumpagent.com/confirm-transaction",
        {
          method: "POST",
          body: JSON.stringify({
            transaction: signedTxBase64,
          }),
          headers: {
            "Content-Type": "application/json",
            "x-api-key": userData?.api_key,
          },
        }
      );
      const { success } = await confirmRequest.json();

      if (success && txResult) {
        const { recipient, tokensBought, solSpend } = txResult;

        const tokens = Number(tokensBought);
        const sol = Number(solSpend);

        if (isNaN(tokens) || isNaN(sol)) {
          console.warn("Invalid tokensBought or solSpend:", {
            tokensBought,
            solSpend,
          });
          return;
        }

        // Update form state
        setForm((prev) => {
          const prevBalance = Number(prev.tokenHoldings || 0);
          const prevSol = Number(prev.solSpend || 0);
          return {
            ...prev,
            tokenHoldings: Number(prevBalance) + tokens,
            solSpend: prevSol + sol,
          };
        });

        // Update token balance
        setTokenBalances((prev) => {
          const prevBalance = Number(prev[recipient] || 0);
          return {
            ...prev,
            [recipient]: Number(prevBalance) + tokens,
          };
        });

        // Update SOL balance
        setSolBalances((prev) => {
          const prevSol = Number(prev[recipient] || 0);
          return {
            ...prev,
            [recipient]: Math.max(Number(prevSol) - sol, 0),
          };
        });

        setBuyAmounts((prev) => ({ ...prev, [priv]: "" }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTradeLoading((prev) => ({ ...prev, [recipientPublickey]: false }));
    }
  };

  const handleSell = async (priv) => {
    const sellAmount = sellAmounts[priv];
    if (!sellAmount) return;
    const recipientKeypair = Keypair.fromSecretKey(bs58.decode(priv));
    const recipientPublickey = recipientKeypair.publicKey.toBase58();

    const developerKeypair = Keypair.fromSecretKey(bs58.decode(priv));
    const developerPublickey = developerKeypair.publicKey.toBase58();
    setTradeLoading((prev) => ({ ...prev, [recipientPublickey]: true }));

    try {
      // Create transaction
      const createRequest = await fetch(
        "https://api.pumpagent.com/create-pumpfun-sell-transaction",
        {
          method: "POST",
          body: JSON.stringify({
            ca: form.mintPub,
            tokensIn: sellAmount,
            recipient: recipientPublickey,
            prioFee: "Medium",
            slippapge: 15,
            creator: developerPublickey,
            jitoTip: "0.00002",
          }),
          headers: {
            "Content-Type": "application/json",
            "x-api-key": userData?.api_key,
          },
        }
      );
      const { serializedTransaction, txResult } = await createRequest.json();
      const transaction = VersionedTransaction.deserialize(
        Uint8Array.from(atob(serializedTransaction), (c) => c.charCodeAt(0))
      );
      transaction.sign([recipientKeypair]);

      const signedTxBase64 = btoa(
        String.fromCharCode(...transaction.serialize())
      );

      const confirmRequest = await fetch(
        "https://api.pumpagent.com/confirm-transaction",
        {
          method: "POST",
          body: JSON.stringify({
            transaction: signedTxBase64,
          }),
          headers: {
            "Content-Type": "application/json",
            "x-api-key": userData?.api_key,
          },
        }
      );
      const { success } = await confirmRequest.json();

      if (success && txResult) {
        const { recipient, tokensSold, solReceived } = txResult;
        setForm((prev) => ({
          ...prev,
          tokenHoldings: prev.tokenHoldings - Number(sellAmount),
          solSpend: prev.solSpend - solReceived,
        }));
        // Update token balance
        setTokenBalances((prev) => {
          const prevBalance = Number(prev[recipient] || 0);
          return {
            ...prev,
            [recipient]: prevBalance - Number(tokensSold),
          };
        });

        // Update SOL balance
        setSolBalances((prev) => {
          const prevSol = Number(prev[recipient] || 0);
          return {
            ...prev,
            [recipient]: Math.max(prevSol - Number(solReceived), 0),
          };
        });

        setSellAmounts((prev) => ({ ...prev, [priv]: "" }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTradeLoading((prev) => ({ ...prev, [recipientPublickey]: false }));
    }
  };

  useEffect(() => {
    if (!refetchBalances) return;
    getSolBalances();
    getTokenBalances();
    setRefetchBalances(false);
  }, [refetchBalances]);
  const balancesRef = useRef(tokenBalances);
  useEffect(() => {
    balancesRef.current = tokenBalances;
  }, [tokenBalances]);
  useEffect(() => {
    let interval;

    const fetchData = async () => {
      if (!form.creationTime) return;
      console.log("Fetching holder data");
      await getSolBalances();
      await getTokenBalances();
    };

    fetchData(); // initial fetch

    interval = setInterval(() => {
      if (Object.keys(balancesRef.current).length === 0) {
        fetchData();
      } else {
        clearInterval(interval); // stop retrying once we have balances
      }
    }, 5000); // every 5 seconds

    return () => clearInterval(interval); // clean up on unmount
  }, [form.creationTime]);

  return (
    <div
      className="min-w-[350px] max-w-[350px] max-h-200 border-l border-gray-900 flex flex-col"
      style={{ height: height || "100%" }}
      ref={parentRef}
    >
      <div className="flex-1 overflow-y-auto relative">
        {!allWallets.length && (
          <div className="flex h-full justify-center items-center absolute inset-0">
            <span className="text-[12px] text-gray-700">No wallets</span>
          </div>
        )}
        <ul className="flex flex-col h-full text-[12px] text-gray-500 p-1">
          {allWallets.map((priv, idx) => (
            <li
              key={idx}
              className={`border ${
                expanded[priv]
                  ? "border-green-900 bg-[#060606]"
                  : "border-gray-800"
              } p-2 cursor-pointer rounded-md mb-1`}
              onClick={() =>
                setExpanded((prev) => ({ ...prev, [priv]: !prev[priv] }))
              }
            >
              <div className="flex gap-2 justify-start">
                <div className="flex flex-col select-none min-w-33">
                  <span className={expanded[priv] ? "text-white" : ""}>
                    {idx === 0 ? "Developer" : `Wallet ${idx}`}
                  </span>
                  <span className="text-[10px] text-gray-700">
                    {priv && <>{privToPub(priv)?.slice(0, 6)}...</>}
                  </span>
                </div>
                <div className="flex flex-col select-none  mr-auto">
                  <span>
                    {(tokenBalances[privToPub(priv)] &&
                      formatTokens(tokenBalances[privToPub(priv)] / 1e6)) ||
                      "0K"}
                  </span>
                  <span className="text-[10px] text-gray-700">0.0%</span>
                </div>
                <div className="flex items-center gap-1 select-none">
                  <img src={SOL} alt="Solana" className="w-4 h-4" />
                  <span>
                    {parseFloat(solBalances[privToPub(priv)])?.toFixed?.(4) ??
                      "0.0000"}
                  </span>
                </div>
              </div>
              {expanded[priv] && (
                <>
                  <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex text-white">
                      <button
                        className={`w-1/2 py-2.5 rounded-l cursor-pointer ${
                          menuBuySell[priv] ? "bg-green-600" : "bg-[#222]"
                        }`}
                        onClick={() =>
                          setMenuBuySell((prev) => ({
                            ...prev,
                            [priv]: true,
                          }))
                        }
                      >
                        BUY
                      </button>
                      <button
                        className={`w-1/2 py-2.5 rounded-r cursor-pointer ${
                          !menuBuySell[priv] ? "bg-red-600" : "bg-[#222]"
                        }`}
                        onClick={() =>
                          setMenuBuySell((prev) => ({
                            ...prev,
                            [priv]: false,
                          }))
                        }
                      >
                        SELL
                      </button>
                    </div>
                  </div>

                  {menuBuySell[priv] ? (
                    <div
                      className="flex flex-col"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="relative w-full">
                        <input
                          type="number"
                          placeholder="Enter SOL Buy Amount"
                          value={buyAmounts[priv] || ""}
                          onChange={(e) =>
                            setBuyAmounts((prev) => ({
                              ...prev,
                              [priv]: e.target.value,
                            }))
                          }
                          className="border border-gray-800 rounded-sm w-full p-2 pl-3 mt-2  focus:outline-green-800 focus:outline-1 focus:bg-[#23ff4011] text-white placeholder:text-[10px] placeholder:text-gray-600"
                        />
                        <span className="flex items-center gap-1 absolute right-2 top-4.25">
                          <img src={SOL} alt="Solana" className="w-4 h-4" />
                          SOL
                        </span>
                      </div>
                      <div className="flex mt-2 gap-1 select-none">
                        {solOptions.map(({ label, value }) => (
                          <button
                            key={label}
                            className="w-1/2 border border-gray-800 py-1.25 cursor-pointer hover:text-white hover:bg-[#111]"
                            onClick={() =>
                              setBuyAmounts((prev) => ({
                                ...prev,
                                [priv]: value,
                              }))
                            }
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <button
                        className={`p-2 border border-gray-800 mt-2 text-gray-400 ${
                          !tradeLoading[privToPub(priv)]
                            ? "cursor-pointer hover:bg-[#111]"
                            : "cursor-default"
                        } hover:text-white h-[30px] flex justify-center items-center`}
                        onClick={() => handleBuy(priv)}
                        disabled={tradeLoading[privToPub(priv)] ? true : false}
                      >
                        {!tradeLoading[privToPub(priv)] && (
                          <>BUY {tokenSymbol}</>
                        )}
                        {tradeLoading[privToPub(priv)] && (
                          <img
                            src={Spinner}
                            alt="Spinner"
                            className="w-5 h-5"
                          />
                        )}
                      </button>
                    </div>
                  ) : (
                    <div
                      className="flex flex-col"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="relative w-full">
                        <input
                          type="number"
                          placeholder={`Enter ${tokenSymbol || ""} Sell Amount`}
                          value={Math.floor(sellAmounts[priv]) || ""}
                          onChange={(e) =>
                            setSellAmounts((prev) => ({
                              ...prev,
                              [priv]: e.target.value,
                            }))
                          }
                          className="border border-gray-800 rounded-sm w-full p-2 pl-3 mt-2  focus:outline-green-800 focus:outline-1 focus:bg-[#23ff4011] text-white placeholder:text-[10px] placeholder:text-gray-600"
                        />
                        <span className="flex items-center gap-1 absolute right-2 top-4.25">
                          {tokenImage && (
                            <img
                              src={tokenImage}
                              alt="Token"
                              className="w-4 h-4"
                            />
                          )}
                          {tokenSymbol}
                        </span>
                      </div>
                      <div className="flex mt-2 gap-1 select-none">
                        {tokenOptions.map(({ label, value }) => (
                          <button
                            key={label}
                            className="w-1/2 border border-gray-800 py-1.25 cursor-pointer hover:text-white hover:bg-[#111]"
                            onClick={() =>
                              setSellAmounts((prev) => ({
                                ...prev,
                                [priv]: Math.floor(
                                  (tokenBalances[privToPub(priv)] *
                                    (+value / 100)) /
                                    1e6
                                ),
                              }))
                            }
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <button
                        className="p-2 border border-gray-800 mt-2 text-gray-400 cursor-pointer hover:text-white hover:bg-[#111] h-[30px] flex justify-center items-center"
                        onClick={() => handleSell(priv)}
                        disabled={tradeLoading[privToPub(priv)] ? true : false}
                      >
                        {!tradeLoading[privToPub(priv)] && (
                          <>SELL {tokenSymbol}</>
                        )}
                        {tradeLoading[privToPub(priv)] && (
                          <img
                            src={Spinner}
                            alt="Spinner"
                            className="w-5 h-5"
                          />
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
      <Menu
        holders={holders}
        wallets={wallets}
        trackedHolders={trackedHolders}
        userData={userData}
        form={form}
        setForm={setForm}
        setRefetchBalances={setRefetchBalances}
      />
    </div>
  );
};

export default TradePanel;
