import { IoIosRocket } from "react-icons/io";
import { FiAlertTriangle } from "react-icons/fi";
import { Keypair, VersionedTransaction } from "@solana/web3.js";
import bs58 from "bs58";
import { useState, useRef, useEffect } from "react";
import Toast from "../../Toast";
import { getWalletSolBalances } from "../../../../../../utils/functions";
import { ImStatsBars } from "react-icons/im";
import { FaCircleInfo } from "react-icons/fa6";
import SOL from "../../../../../../assets/SOL.png";

const Launch = ({ form, wallets, userData, setForm }) => {
  const [jitoTip, setJitoTip] = useState(
    localStorage.getItem("bundle-tip") || 0.01
  );

  useEffect(() => {
    localStorage.setItem("bundle-tip", jitoTip);
  }, [jitoTip]);
  const [deploying, setDeploying] = useState(false);
  const [message, setMessage] = useState("");
  // Token Setup
  const meta = form?.metadata;
  const tokenIsReady = meta?.uri && meta?.image && meta?.name && meta?.symbol;

  // Wallets Setup
  const bundle = wallets?.bundle;
  const totalBuyers = bundle.length + 1; // + Developer
  const buyAmounts = wallets?.buyAmounts;
  const filledBuyInputs = Object.values(buyAmounts).filter(Boolean);
  const allBuyersHaveEnterAmounts = totalBuyers === filledBuyInputs.length;
  const walletsAreReady = form?.lut && allBuyersHaveEnterAmounts;

  const retryRef = useRef(0);

  const loadBalanceFromPrivateKey = async (privateKeyBase58) => {
    try {
      const keypair = Keypair.fromSecretKey(bs58.decode(privateKeyBase58));
      const publicKey = keypair.publicKey.toBase58();
      const balances = await getWalletSolBalances([publicKey]);
      return balances[0];
    } catch (err) {
      console.error("Error fetching balance:", err);
    }
  };

  console.log(form);

  const handleBundleDeployment = async () => {
    setDeploying(true);
    const funderBalance = await loadBalanceFromPrivateKey(wallets.funder);
    if (funderBalance < 0.11) {
      alert("Insufficient funder balance to deploy.");
      setDeploying(false);
      return;
    }
    const developerBalance = await loadBalanceFromPrivateKey(wallets.developer);
    if (developerBalance < 0.025) {
      alert("Insufficient developer balance to deploy.");
      setDeploying(false);
      return;
    }

    const developerKeypair = Keypair.fromSecretKey(
      bs58.decode(wallets.developer)
    );
    const developer = {
      publicKey: developerKeypair.publicKey.toBase58(),
      solBuy: wallets.buyAmounts["developer"],
    };
    const bundleMap = wallets.bundle.map((wallet, index) => {
      const keyPair = Keypair.fromSecretKey(bs58.decode(wallet));
      return {
        publicKey: keyPair.publicKey.toBase58(),
        solBuy: wallets.buyAmounts[index],
      };
    });

    const sanitizedWallets = [developer, ...bundleMap];
    try {
      const funderKeypair = Keypair.fromSecretKey(bs58.decode(wallets.funder));
      const funderPublicKey = funderKeypair.publicKey;
      const { name, symbol, lut, platform } = form;

      const payload = {
        funderPubKey: funderPublicKey,
        sanitizedWallets,
        name,
        symbol,
        lut,
        uri: form.metadata.uri,
        vanityPriv: form.vanity || form.mintPriv,
        tip: jitoTip,
      };

      const URL = `https://api.pumpagent.com/${
        platform === "Pump" ? "pump" : "bonk"
      }-launch-bundle`;

      const request = await fetch(URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": userData?.api_key,
        },
        body: JSON.stringify(payload),
      });

      const { unsigned, tokensBought } = await request.json();
      const completedTransactions = unsigned.map((base64Tx, i) => {
        const tx = VersionedTransaction.deserialize(
          Uint8Array.from(atob(base64Tx), (c) => c.charCodeAt(0))
        );
        const signers = [];
        if (i === 0) {
          signers.push(
            Keypair.fromSecretKey(bs58.decode(wallets.developer)),
            funderKeypair
          );
        } else {
          const start = 0 + (i - 1) * 3;
          const chunk = wallets.bundle.slice(start, start + 3);
          signers.push(
            ...chunk.map((privateKey) =>
              Keypair.fromSecretKey(bs58.decode(privateKey))
            ),
            funderKeypair
          );
        }

        tx.sign(signers);
        return Buffer.from(tx.serialize()).toString("base64");
      });

      const confirmRequest = await fetch(
        "https://api.pumpagent.com/confirm-bundle",
        {
          method: "POST",
          body: JSON.stringify({ bundle: completedTransactions }),
          headers: {
            "Content-Type": "application/json",
            "x-api-key": userData?.api_key,
          },
        }
      );

      const confirmResponse = await confirmRequest.json();
      if (confirmResponse?.error) throw new Error(confirmResponse?.error);
      if (!confirmResponse?.success) return;

      if (form.platform === "Bonk") {
        alert("Launch successful!");
        window.open(`https://bonk.fun/token/${form.mintPub}`, "_blank");
        return;
      }

      setForm((prev) => ({ ...prev, tokenHoldings: tokensBought }));
      setDeploying(false);
      setTimeout(() => {
        setMessage("");
      }, 3000);
      // ✅ Success: reset retry counter
      retryRef.current = 0;
    } catch (err) {
      console.error(err);
      if (err.message?.includes("Failed to confirm bundle.")) {
        setMessage(`Failed To Confirm Bundle.`);
        setTimeout(() => setMessage(""), 3000);
        setDeploying(false);
        return;
      }

      // setTimeout(() => setMessage(""), 3000);
      if (err.message?.includes("Network congested") && retryRef.current < 10) {
        retryRef.current += 1;
        setMessage(`Network congested. Auto-retrying deployment.`);
        setTimeout(() => {
          handleBundleDeployment();
          setMessage("");
        }, 3000);
        return; // avoid setting deploying false yet
      }

      setMessage("Failed to deploy after 5 retries or unknown error.");
      retryRef.current = 0; // reset retry count on final failure
      setDeploying(false);
    } finally {
    }
  };

  return (
    <div className="text-[12px] text-gray-700 pt-0 p-6 flex flex-col gap-4  h-full max-h-[246px] mt-auto">
      {message && <Toast message={message} />}
      {!form.creationTime && (
        <div className="flex flex-col justify-center flex-1 gap-2">
          <div
            className={`flex justify-start items-center gap-1 rounded-lg p-2  h-1/2 ${
              tokenIsReady
                ? "sidegrad text-white border-none"
                : "bg-[#00640718]"
            }`}
          >
            <span className="text-gray-400 select-none pl-2">Token Setup</span>
            <span className="flex items-center gap-1 ml-auto mr-5">
              {tokenIsReady && <IoIosRocket className="text-[14px]" />}
              {!tokenIsReady && "NOT READY"}
              {tokenIsReady && "READY"}
              {!tokenIsReady && (
                <FiAlertTriangle className="text-orange-500 text-[16px] opacity-50" />
              )}
            </span>
          </div>

          <div
            className={`flex justify-start items-center gap-1 rounded-lg p-2  h-1/2 ${
              walletsAreReady
                ? "sidegrad text-white border-none"
                : "bg-[#00640718]"
            }`}
          >
            <span className="text-gray-400 select-none pl-2">
              Wallets Setup
            </span>
            <span className="flex items-center gap-1 ml-auto mr-5">
              {walletsAreReady && <IoIosRocket className="text-[14px]" />}
              {!walletsAreReady && "NOT READY"}
              {walletsAreReady && "READY"}
              {!walletsAreReady && (
                <FiAlertTriangle className="text-orange-500 text-[16px] opacity-50" />
              )}
            </span>
          </div>
          <div className="h-15 bg-[#ae00004b] flex justify-start pl-4 items-center rounded-md text-gray-500 text-[10px] text-center gap-2 mt-1">
            <FaCircleInfo className="text-yellow-500" />
            <span className=" text-center w-full leading-3 py-0.5">
              Jito is experiencing congestion. <br /> Deployment may require
              various attempts.
              <br />
              Higher tips are more likely to be confirmed.
            </span>
          </div>
          <div className="flex items-center gap-1 relative">
            <span className="text-gray-600 text-[12px]">Jito Tip</span>
            <input
              type="number"
              value={jitoTip}
              onChange={(e) => setJitoTip(e.target.value)}
              placeholder="Enter Jito tip amount"
              className="border border-gray-800 flex-1 ml-2 pl-2 placeholder:text-gray-700 p-1 focus:outline-green-300 focus:outline-1 focus:bg-[#23ff4011] rounded-sm text-white"
            />
            <img src={SOL} alt="SOL" className="w-4 h-4 absolute right-2" />
          </div>
        </div>
      )}
      {!form.creationTime && (
        <button
          className={`text-white p-3 rounded-full mt-auto flex justify-center items-center gap-1  ${
            deploying ? "gradbtn cursor-not-allowed" : "buycta cursor-pointer"
          }`}
          onClick={handleBundleDeployment}
          disabled={deploying ? true : false}
        >
          {!deploying && (
            <>
              <IoIosRocket /> Deploy Bundle
            </>
          )}
          {deploying && (
            <>
              <IoIosRocket className="rocket" /> Deploying
            </>
          )}
        </button>
      )}
      {form.creationTime && (
        <span
          className={`text-white p-3 rounded-full mt-auto flex justify-center items-center gap-1 select-none ${
            deploying ? "gradbtn" : "buycta"
          }`}
        >
          <ImStatsBars /> {form.symbol} Trading
        </span>
      )}
    </div>
  );
};

export default Launch;
