import { useEffect, useState } from "react";
import { Keypair, VersionedTransaction } from "@solana/web3.js";
import bs58 from "bs58";
import { solConnection } from "../../../../../../../../server/utils/constants";
import { FaRegCopy } from "react-icons/fa6";
import SOL from "../../../../../../assets/SOL.png";
import Spinner from "../../../../../../assets/Spinner.svg";
import { privToPub } from "../../../../../../utils/functions";
import { FaRotateRight } from "react-icons/fa6";
import { LuHandCoins } from "react-icons/lu";
import { useMemo } from "react";
import { getWalletSolBalances } from "../../../../../../utils/functions";
import Toast from "../../Toast";

const FundWalletsTable = ({
  form,
  wallets,
  userData,
  balances,
  setBalances,
  developerBalance,
  setDeveloperBalance,
  setWallets,
}) => {
  const [fundAmounts, setFundAmounts] = useState({});
  const [funderBalance, setFunderBalance] = useState(0);
  const [funderLoading, setFunderLoading] = useState(false);
  const [developerLoading, setDeveloperLoading] = useState(false);
  const [walletsLoading, setWalletsLoading] = useState(false);
  const [fundingWallets, setFundingWallets] = useState(false);
  const [message, setMessage] = useState(""); // Toast

  const apiKey = userData?.api_key;

  const { totalToFund, countToFund } = useMemo(() => {
    const values = Object.values(fundAmounts);
    const numericValues = values
      .map((val) => parseFloat(val))
      .filter((val) => !isNaN(val) && val > 0);

    const total = numericValues.reduce((acc, curr) => acc + curr, 0);
    const count = numericValues.length;

    return {
      totalToFund: total, // Format to 3 decimal places
      countToFund: count,
    };
  }, [fundAmounts]);

  const fetchBalances = async () => {
    setWalletsLoading(true);
    if (!wallets.bundle.length) return;
    try {
      const publicKeys = (wallets.bundle || [])
        .map((priv) => {
          try {
            const kp = Keypair.fromSecretKey(bs58.decode(priv));
            return kp.publicKey.toBase58();
          } catch {
            return null;
          }
        })
        .filter(Boolean); // Filter out invalid keys
      if (!publicKeys.length) return;

      const balances = await getWalletSolBalances(publicKeys);
      setBalances(balances);
    } catch (err) {
      console.error("Error fetching balances:", err);
      setBalances([]);
    } finally {
      setTimeout(() => {
        setWalletsLoading(false);
      }, 1000);
    }
  };

  useEffect(() => {
    fetchBalances();

    setWallets((prev) => {
      const bundle = prev.bundle || {};
      const currentBuyAmounts = prev.buyAmounts || {};
      const newBuyAmounts = { ...currentBuyAmounts };

      for (const key in bundle) {
        if (!(key in newBuyAmounts)) {
          newBuyAmounts[key] = "";
        }
      }

      return {
        ...prev,
        buyAmounts: newBuyAmounts,
      };
    });
  }, [wallets.bundle]);

  const handleAmountChange = (index, value) => {
    const updated = { ...wallets.buyAmounts, [index]: value };

    setWallets((prev) => ({
      ...prev,
      buyAmounts: updated, // use the freshly updated object
    }));
  };

  const loadFunderBalance = async () => {
    setFunderLoading(true);
    try {
      const funderKeypair = Keypair.fromSecretKey(bs58.decode(wallets.funder));
      const funderPublicKey = funderKeypair.publicKey.toBase58();
      const balance = (await getWalletSolBalances([funderPublicKey]))[0];
      setFunderBalance(balance); // Convert lamports to SOL
    } catch (err) {
      console.error("Error fetching funder balance:", err);
      setFunderBalance(0);
    } finally {
      setTimeout(() => {
        setFunderLoading(false);
      }, 1000);
    }
  };

  const loadDeveloperBalance = async () => {
    setDeveloperLoading(true);
    try {
      const developerKeypair = Keypair.fromSecretKey(
        bs58.decode(wallets.developer)
      );
      const developerPublicKey = developerKeypair.publicKey.toBase58();

      const balance = (await getWalletSolBalances([developerPublicKey]))[0];

      setDeveloperBalance(balance);
    } catch (err) {
      console.error("Error fetching funder balance:", err);
    } finally {
      setTimeout(() => {
        setDeveloperLoading(false);
      }, 1000);
    }
  };

  const handleFundAmountChange = (index, value) => {
    setFundAmounts((prev) => ({
      ...prev,
      [index]: value,
    }));
  };

  // Load balances
  useEffect(() => {
    if (!wallets.developer) return;
    loadDeveloperBalance();
    loadFunderBalance();
  }, [wallets.developer]);

  const handleFundWallets = async () => {
    // First entry is always developer
    const fundOrder = [];
    // Dev buy amount
    const developerKeypair = Keypair.fromSecretKey(
      bs58.decode(wallets.developer)
    );
    const developerPublickey = developerKeypair.publicKey.toBase58();
    const developerBuy = {
      publicKey: developerPublickey,
      amount: fundAmounts["developer"] || 0,
    };
    fundOrder.push(developerBuy);

    // Prepare bundle wallets
    const fundArray = Object.entries(fundAmounts)
      .map((entry) => {
        const walletIndex = entry[0];
        const amountToFund = entry[1];
        if (!amountToFund) return null;
        const currentBundleWallets = wallets.bundle;
        if (walletIndex === "developer") return null;
        const userKeypair = Keypair.fromSecretKey(
          bs58.decode(currentBundleWallets[walletIndex])
        );
        const userPublicKey = userKeypair.publicKey.toBase58();
        return {
          publicKey: userPublicKey,
          amount: amountToFund,
        };
      })
      .filter(Boolean);

    fundOrder.push(...fundArray);
    const filteredArray = fundOrder.filter((amount) => amount.amount > 0);
    if (!filteredArray.length) return;
    setFundingWallets(true);

    try {
      const funderKeypair = Keypair.fromSecretKey(bs58.decode(wallets.funder));

      const URL = "https://api.pumpagent.com/fund-wallets";
      const request = await fetch(URL, {
        method: "POST",
        body: JSON.stringify({
          funderPubKey: funderKeypair.publicKey,
          wallets: fundOrder,
        }),
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
      });

      const { serializedTransaction } = await request.json();
      const serialized = Uint8Array.from(atob(serializedTransaction), (c) =>
        c.charCodeAt(0)
      );

      const transaction = VersionedTransaction.deserialize(serialized);
      transaction.sign([funderKeypair]);

      const signature = await solConnection().sendTransaction(transaction);
      if (!signature) return;
      setFundAmounts({});

      setMessage("Wallets Successfully Funded. Auto Refreshing in 15 Sec.");

      setTimeout(() => {
        loadDeveloperBalance();
        loadFunderBalance();
        fetchBalances();
      }, 15000);
    } catch (e) {
      setMessage("Failed To Fund Wallets");
      console.error(e);
    } finally {
      setFundingWallets(false);
      setTimeout(() => {
        setMessage("");
      }, 3000);
    }
  };

  const saveAsText = () => {
    const lines = [];
    const pushWallet = (label, priv) => {
      try {
        const kp = Keypair.fromSecretKey(bs58.decode(priv));
        lines.push(
          `${label}:\nPublic Key: ${kp.publicKey.toBase58()}\nPrivate Key: ${priv}\n`
        );
      } catch {
        lines.push(`${label}:\nNo/Invalid Private Key\n`);
      }
    };

    pushWallet("Developer", wallets.developer);

    // Add bundle wallets
    (wallets.bundle || []).forEach((priv, index) => {
      pushWallet(`Wallet ${index + 1}`, priv);
    });

    const blob = new Blob([lines.join("\n")], {
      type: "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${form.name || "Bundle"}_bundle_wallets.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveAsJSON = () => {
    const walletsArray = [];

    // Add developer wallet if valid
    if (wallets.developer) {
      try {
        const kp = Keypair.fromSecretKey(bs58.decode(wallets.developer));
        walletsArray.push({
          publicKey: kp.publicKey.toBase58(),
          privateKey: wallets.developer,
        });
      } catch {}
    }

    // Add bundle wallets
    (wallets.bundle || []).forEach((priv) => {
      try {
        const kp = Keypair.fromSecretKey(bs58.decode(priv));
        walletsArray.push({
          publicKey: kp.publicKey.toBase58(),
          privateKey: priv,
        });
      } catch {}
    });

    const jsonStr = JSON.stringify(walletsArray, null, 2);

    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${form.name || "Bundle"}_wallets.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-2xl mx-auto border border-gray-800">
      <div className="max-h-160 overflow-auto flex flex-col">
        {message && <Toast message={message} />}
        {/* Funder Wallet */}
        <div className="flex text-gray-300 text-[12px] h-40 p-4 relative justify-between">
          <div className="flex flex-col">
            <span>Bundle Funder</span>

            <span className="flex items-center gap-1 mt-1 text-gray-500 z-10">
              <FaRegCopy className="text-[12px] cursor-pointer hover:text-white active:text-greener active:scale-99" />
              <span className="select-none">
                {wallets?.funder && (
                  <>{privToPub(wallets?.funder)?.slice(0, 20) + "..."}</>
                )}
              </span>
            </span>
            <div className="flex items-center gap-1 ml-[-7px] mt-7 z-10 select-none">
              <img src={SOL} alt="Solana" className="w-10 h-10" />
              <span className="text-[16px] text-greener">
                {funderBalance?.toFixed(3)}
              </span>
              <button
                onClick={loadFunderBalance}
                disabled={funderLoading ? true : false}
              >
                <FaRotateRight
                  className={`cursor-pointer text-gray-500 ml-1 hover:text-white select-none ${
                    funderLoading ? "rotater" : ""
                  }`}
                />
              </button>
            </div>
            <div className="absolute green-grad w-full h-full inset-0 opacity-15"></div>
          </div>
          <div className="flex flex-col justify-end items-center p-1 rounded-md gap-2">
            <div className="flex flex-col gap-1 mb-4">
              <span className="text-gray-700">
                Funding <span className="text-greener">{countToFund}</span>{" "}
                Wallet
                {countToFund !== 1 ? "s" : ""}
              </span>
              <span className="text-gray-700">
                Sending{" "}
                <span className="text-greener">{totalToFund.toFixed(3)}</span>{" "}
                SOL
              </span>
            </div>
            <div className="flex gap-2">
              <button
                className={`${
                  fundingWallets
                    ? "bg-black cursor-not-allowed"
                    : "bg-green-500 cursor-pointer p-2"
                } text-black rounded-md  hover:text-white flex justify-center active:scale-99 z-10 gap- w-[110px] h-[28px]`}
                onClick={saveAsText}
              >
                Save As .txt
              </button>
              <button
                className={`${
                  fundingWallets
                    ? "bg-black cursor-not-allowed"
                    : "bg-green-500 cursor-pointer p-2"
                } text-black rounded-md  hover:text-white flex justify-center active:scale-99 z-10 gap- w-[110px] h-[28px]`}
                onClick={saveAsJSON}
              >
                Save As .JSON
              </button>
              <button
                className={`${
                  fundingWallets
                    ? "bg-black cursor-not-allowed"
                    : "bg-green-500 cursor-pointer p-2"
                } text-black rounded-md  hover:text-white flex justify-center active:scale-99 z-10 gap- w-[110px] h-[28px]`}
                onClick={handleFundWallets}
                disabled={fundingWallets ? true : false}
              >
                {fundingWallets && (
                  <img src={Spinner} alt="Spinner" className="w-4" />
                )}
                {!fundingWallets && (
                  <span className="flex gap-1 justify-center items-center">
                    <LuHandCoins className="rotate-180" /> Fund Wallets
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Developer Wallet */}
        <table className="w-full text-sm text-left text-gray-300 ">
          <thead className="bg-[#111] text-xs uppercase border-b border-gray-700">
            <tr>
              <th className="px-4 py-2">Developer Public Key</th>
              <th className="px-4 py-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={loadDeveloperBalance}
                    disabled={developerLoading ? true : false}
                  >
                    <FaRotateRight
                      className={`cursor-pointer text-gray-500 ml-1 hover:text-white select-none ${
                        developerLoading ? "rotater" : ""
                      }`}
                    />
                  </button>
                  <span>Balance</span>
                </div>
              </th>
              <th className="px-4 py-2">Buy Amount </th>
              <th className="px-4 py-2">Fund Amount </th>
            </tr>
          </thead>
          <tbody>
            {(wallets.developer ? wallets.developer.split(",") : []).map(
              (priv, i) => {
                let pubKey = "Invalid";
                try {
                  pubKey = Keypair.fromSecretKey(
                    bs58.decode(priv.trim())
                  ).publicKey.toBase58();
                } catch {}

                return (
                  <tr
                    key={i}
                    className="border-t border-gray-800 hover:bg-[#181818]"
                  >
                    <td className="px-4 py-2 truncate max-w-[250px] text-[12px]">
                      <div className=" flex items-center gap-1 w-45">
                        <FaRegCopy className="cursor-pointer text-gray-600 hover:text-white active:text-greener active:scale-99" />
                        <span className="select-none">
                          {pubKey.slice(0, 20)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2 select-none">
                      <div className="flex items-center gap-1">
                        <img src={SOL} alt="Solana" className="w-4 h-4" />
                        <span className="text-greener text-[12px]">
                          {developerBalance.toFixed(3) ?? "0"}
                        </span>
                      </div>
                    </td>
                    {/* Developer Buy Amount*/}
                    <td className="px-4 py-2">
                      <div
                        className={`flex items-center pl-1 border ${
                          wallets.buyAmounts["developer"] >=
                            +developerBalance - 0.0021 ||
                          wallets.buyAmounts["developer"] === "0" ||
                          !wallets.buyAmounts["developer"]
                            ? "border border-red-500"
                            : "focus-within:outline focus-within:outline-green-300 border-gray-700"
                        } rounded group `}
                      >
                        <img src={SOL} alt="Solana" className="w-4 h-4" />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={wallets.buyAmounts["developer"] || ""}
                          onChange={(e) =>
                            handleAmountChange("developer", e.target.value)
                          }
                          className={`w-24 p-1 text-white text-xs focus:outline-none focus:bg-[#23ff4011] flex-1`}
                          placeholder="0.00"
                        />
                      </div>
                    </td>
                    {/* Developer Fund Amount*/}
                    <td className="px-4 py-2">
                      <div className="flex items-center pl-1 border border-gray-700 rounded group focus-within:outline focus-within:outline-green-300">
                        <img src={SOL} alt="Solana" className="w-4 h-4" />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={fundAmounts["developer"] || ""}
                          onChange={(e) =>
                            handleFundAmountChange("developer", e.target.value)
                          }
                          className="w-24 p-1 text-white text-xs focus:outline-none focus:bg-[#23ff4011] flex-1"
                          placeholder="0.00"
                        />
                      </div>
                    </td>
                  </tr>
                );
              }
            )}
          </tbody>
        </table>

        {/* Bundle Wallets */}
        <table className="w-full text-sm text-left text-gray-300">
          <thead className="bg-[#111] text-xs uppercase border-b border-gray-700">
            <tr>
              <th className="px-4 py-2">Bundle Wallet Public Key</th>
              <th className="px-4 py-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={fetchBalances}
                    disabled={walletsLoading ? true : false}
                    tabIndex="-1"
                  >
                    <FaRotateRight
                      className={`cursor-pointer text-gray-500 ml-1 hover:text-white ${
                        walletsLoading ? "rotater" : ""
                      }`}
                    />
                  </button>
                  <span>Balance</span>
                </div>
              </th>
              <th className="px-4 py-2">Buy Amount</th>
              <th className="px-4 py-2">Fund Amount</th>
            </tr>
          </thead>
          <tbody>
            {(wallets.bundle || []).map((priv, i) => {
              let pubKey = "Invalid";
              try {
                pubKey = Keypair.fromSecretKey(
                  bs58.decode(priv)
                ).publicKey.toBase58();
              } catch {}

              return (
                <tr
                  key={i}
                  className="border-t border-gray-800 hover:bg-[#181818]"
                >
                  <td className="px-4 py-2 truncate max-w-[250px] text-[12px]">
                    <div className=" flex items-center gap-1 w-45">
                      <FaRegCopy className="cursor-pointer text-gray-600 hover:text-white active:text-greener active:scale-99" />
                      <span className="select-none">{pubKey.slice(0, 20)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 select-none">
                    <div className="flex items-center gap-1 justify">
                      <img src={SOL} alt="Solana" className="w-4 h-4" />
                      <span className="text-greener text-[12px]">
                        {balances[i]?.toFixed(3) ?? "0"}
                      </span>
                    </div>
                  </td>
                  {/* Bundle Buy Amount*/}
                  <td className="px-4 py-2">
                    <div
                      className={`flex items-center pl-1 border ${
                        wallets.buyAmounts[i] >= +balances[i] - 0.0021
                          ? "border border-red-500"
                          : "focus-within:outline focus-within:outline-green-300 border-gray-700"
                      } rounded group `}
                    >
                      <img src={SOL} alt="Solana" className="w-4 h-4" />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={wallets.buyAmounts[i] || ""}
                        onChange={(e) => handleAmountChange(i, e.target.value)}
                        className="w-24 p-1 text-white text-xs focus:outline-none focus:bg-[#23ff4011] flex-1"
                        placeholder="0.00"
                      />
                    </div>
                  </td>
                  {/* Bundle Buy Amount*/}
                  <td className="px-4 py-2">
                    <div className="flex items-center pl-1 border border-gray-700 rounded group focus-within:outline focus-within:outline-green-300">
                      <img src={SOL} alt="Solana" className="w-4 h-4" />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={fundAmounts[i] || ""}
                        onChange={(e) =>
                          handleFundAmountChange(i, e.target.value)
                        }
                        className="w-24 p-1 text-white text-xs focus:outline-none focus:bg-[#23ff4011] flex-1"
                        placeholder="0.00"
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FundWalletsTable;
