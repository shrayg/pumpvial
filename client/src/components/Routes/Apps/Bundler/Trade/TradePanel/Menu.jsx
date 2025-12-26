import { FaBomb } from "react-icons/fa6";
import SOL from "../../../../../../assets/SOL.png";
import { Keypair, VersionedTransaction } from "@solana/web3.js";
import { GiNetworkBars } from "react-icons/gi";
import BumpBot from "./BumpBot";
import { useState, useEffect } from "react";
import bs58 from "bs58";
import Toast from "../../Toast";

const calculateSellAmountInSol = (
  sellAmount,
  virtualSolReserves,
  virtualTokenReserves
) => Number(sellAmount) * (virtualSolReserves / virtualTokenReserves);

const Menu = ({
  holders,
  wallets,
  trackedHolders,
  userData,
  form,
  setForm,
  setRefetchBalances,
}) => {
  const [dumpLoading, setDumpLoading] = useState(false);
  const [tokenInfo, setTokenInfo] = useState(null);

  const totalSolSpendOnBundle = form.solSpend;
  const currentTokens = form.tokenHoldings;
  const lastTrade = trackedHolders?.lastTrade;
  const totalSolInCurve = +(lastTrade?.real_sol_reserves / 1e9).toFixed(2);

  const tokensWorth =
    calculateSellAmountInSol(
      currentTokens / 1e6,
      lastTrade?.virtual_sol_reserves || tokenInfo?.virtual_sol_reserves,
      lastTrade?.virtual_token_reserves || tokenInfo?.virtual_token_reserves
    ) / 1000;

  const pnl = tokensWorth - totalSolSpendOnBundle; // Pnl = total sol - total sol spend
  const [keyPairs, setKeyPairs] = useState({});
  const developerPriv = wallets?.developer;
  const [message, setMessage] = useState("");

  // Calculate holders
  const traderWallets = [wallets?.developer, ...wallets?.bundle];
  const holderEntries = holders
    .filter((holder) => +holder.balance > 0)
    .map((holder) => holder.owner);
  const finalArray = holderEntries.filter(
    (entry) => !traderWallets.includes(entry)
  );

  useEffect(() => {
    if (!wallets.bundle.length) return;

    const allWallets = [developerPriv, ...(wallets?.bundle || [])].filter(
      Boolean
    ); // Prod
    const keyPairs = allWallets.reduce((acc, priv) => {
      const keyPair = Keypair.fromSecretKey(bs58.decode(priv));
      acc[keyPair.publicKey.toBase58()] = priv;
      return acc;
    }, {});
    setKeyPairs(keyPairs);
  }, [wallets.bundle]);

  const handleDumpAll = async () => {
    setDumpLoading(true);

    const funderKeypair = Keypair.fromSecretKey(bs58.decode(wallets.funder));
    const funderPublicKey = funderKeypair.publicKey.toBase58();

    const pubkeys = Object.values(keyPairs).map((kp) => {
      const keypair = Keypair.fromSecretKey(bs58.decode(kp));
      return {
        publicKey: keypair.publicKey.toBase58(),
      };
    }); // array of public keys
    const URL = "https://api.pumpagent.com/pump-dump-all";
    const payload = {
      receiver: funderPublicKey,
      ca: form?.mintPub,
      wallets: pubkeys,
      tip: "0.01",
    };

    try {
      const request = await fetch(URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": userData?.api_key,
        },
        body: JSON.stringify(payload),
      });

      const response = await request.json();
      if (response.err) return;
      const versionedTxs = response.map((tx) =>
        VersionedTransaction.deserialize(
          Uint8Array.from(atob(tx), (c) => c.charCodeAt(0))
        )
      );

      const completedTransactions = [];

      const entries = Object.entries(keyPairs); // [ [pubkey, privkey], ... ]
      const chunkSize = 5;
      for (let i = 0; i < versionedTxs.length; i++) {
        const tx = versionedTxs[i];
        const chunk = entries.slice(i * chunkSize, (i + 1) * chunkSize);

        chunk.forEach(([_, privateKey]) => {
          const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));
          tx.sign([keypair]);
        });

        tx.sign([funderKeypair]);

        const base64Tx = Buffer.from(tx.serialize()).toString("base64");
        completedTransactions.push(base64Tx);
      }

      const confirmRequest = await fetch(
        "https://api.pumpagent.com/confirm-bundle",
        {
          method: "POST",
          body: JSON.stringify({
            bundle: completedTransactions,
          }),
          headers: {
            "Content-Type": "application/json",
            "x-api-key": userData?.api_key,
          },
        }
      );
      const { success, error } = await confirmRequest.json();
      if (error) {
        setMessage(error);
        setTimeout(() => setMessage(""), 3000);
        return;
      }
      if (!success) return;

      setMessage("Bundle sold!");
      setForm((prev) => ({ ...prev, tokenHoldings: 0, fullstacked: true }));
      setTimeout(() => setMessage(""), 3000);
      await new Promise((resolve) => setTimeout(resolve, 15000));
      setRefetchBalances(true);
    } catch (err) {
      console.error(err);
    } finally {
      setDumpLoading(false);
    }
  };

  useEffect(() => {
    if (!userData || !form.mintPub) return;
    const loadInitialValues = async () => {
      try {
        const request = await fetch(
          "https://api.pumpagent.com/pump-token-info",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": userData?.api_key,
            },
            body: JSON.stringify({
              ca: form.mintPub,
            }),
          }
        );

        const response = await request.json();
        setTokenInfo(response.response);
      } catch (err) {
        console.error(err);
      }
    };
    loadInitialValues();
  }, [userData, form]);

  return (
    <div className="h-60 border-t border-gray-900 w-full flex flex-col p-2">
      {message && <Toast message={message} />}
      <div className="flex justify-evenly pt-3 buygrad rounded-t h-[44px]">
        {!form.fullstacked ? (
          <>
            <div className="flex flex-col items-center text-gray-500 text-[12px] gap-1 ">
              <span>PnL</span>
              <div className="flex items-center gap-1">
                <img src={SOL} alt="Solana" className="w-4 h-4" />
                <span className="text-white">
                  {!isNaN(pnl) ? pnl.toFixed(4) : "0"}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-center  text-gray-500 text-[12px] gap-1.5">
              <span>Holders</span>
              <div className="flex items-center gap-1">
                <span className="text-white">{finalArray.length}</span>
              </div>
            </div>
            <div className="flex flex-col items-center  text-gray-500 text-[12px] gap-1">
              <span>Curve </span>
              <div className="flex items-center gap-1">
                <img src={SOL} alt="Solana" className="w-4 h-4" />
                <span className="text-white">{totalSolInCurve || 0}</span>
              </div>
            </div>
          </>
        ) : null}
        {form.fullstacked ? (
          <div className="w-full h-full flex justify-center items-center">
            <span className="text-gray-600 text-[12px] select-none">
              Bundle Sold
            </span>
          </div>
        ) : null}
      </div>
      <div className="flex flex-col justify-evenly items-between h-full">
        <BumpBot form={form} userData={userData} wallets={wallets} />
        <div className="flex text-[12px] text-gray-500  border border-gray-900 p-3 w-full rounded-md">
          <span className="flex items-center gap-1 select-none">
            <GiNetworkBars /> Volume Bot
          </span>
          <div className="flex ml-auto">
            <button className="p-2 border border-gray-900 ml-2 bg-[#111] cursor-not-allowed">
              Coming Soon
            </button>
            {/* <button className="p-2 border border-gray-900 ml-2 cursor-pointer hover:text-white bg-[#111]">
              <HiCog8Tooth />
            </button> */}
          </div>
        </div>
      </div>
      <button
        className={`bg-[#232323] text-[12px] rounded-full py-3 mt-auto flex justify-center items-center gap-1 text-gray-400 hover:text-white hover:bg-[#333] ${
          !dumpLoading && form.creationTime
            ? "cursor-pointer"
            : "cursor-not-allowed"
        } `}
        onClick={handleDumpAll}
        disabled={dumpLoading || !form.creationTime ? true : false}
      >
        {!dumpLoading && (
          <>
            <FaBomb className="" /> Dump All
          </>
        )}
        {dumpLoading && (
          <span className="text-red-500 flex items-center gap-1">
            <FaBomb className="rocket text-red-500" /> Dumping
          </span>
        )}
      </button>
    </div>
  );
};

export default Menu;
