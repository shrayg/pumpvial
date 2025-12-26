import { IoRocket } from "react-icons/io5";
import { HiCog8Tooth } from "react-icons/hi2";
import { useRef, useState, useEffect } from "react";
import { Keypair, VersionedTransaction } from "@solana/web3.js";
import { solConnection } from "../../../../../../../../server/utils/constants";
import bs58 from "bs58";

const BumpBot = ({ userData, form, wallets }) => {
  const intervalRef = useRef(null);
  const menuRef = useRef(null); // ref for menu container
  const [bumpsActive, setBumpsActive] = useState(false);
  const [bumpCount, setBumpCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const buttonRef = useRef(null);
  const [bumpSettings, setBumpSettings] = useState(() => {
    const stored = localStorage.getItem("bundleBumpSettings");
    return stored ? JSON.parse(stored) : null;
  });

  const ca = form.mintPub;
  const bumpPayerPriv = wallets.funder;

  // If bumpSettings don't exist in localStorage, set default object
  useEffect(() => {
    if (!bumpSettings) {
      const defaultSettings = {
        solin: 0.022,
        interval: 7500,
      };
      setBumpSettings(defaultSettings);
      localStorage.setItem(
        "bundleBumpSettings",
        JSON.stringify(defaultSettings)
      );
    }
  }, [bumpSettings]);

  const solIn = bumpSettings?.solin;
  const interval = bumpSettings?.interval;

  useEffect(() => {
    const invokeBump = async () => {
      setBumpCount((prev) => prev + 1);
      const recipient = Keypair.fromSecretKey(bs58.decode(bumpPayerPriv));
      const recipientPublicKey = recipient.publicKey;

      const payload = {
        recipient: recipientPublicKey,
        ca,
        solIn: bumpSettings?.solin,
      };
      try {
        const request = await fetch(
          "https://api.pumpagent.com/pump-token-bump",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": userData?.api_key,
            },
            body: JSON.stringify(payload),
          }
        );

        const { serializedTransaction } = await request.json();
        const serialized = Uint8Array.from(atob(serializedTransaction), (c) =>
          c.charCodeAt(0)
        );

        const transaction = VersionedTransaction.deserialize(serialized);
        transaction.sign([recipient]);

        const signature = await solConnection().sendTransaction(transaction);
        if (!signature) return;
      } catch (err) {
        console.error("Error while bumping:", err);
      }
    };

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (bumpsActive) {
      intervalRef.current = setInterval(invokeBump, interval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [bumpsActive, interval, ca, solIn]);

  // Click outside handler to close menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target) &&
        !buttonRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);
  return (
    <div className="flex text-[12px] text-gray-500  border border-gray-900 p-3 w-full rounded-md">
      <span className={`flex items-center gap-1 select-none`}>
        <IoRocket /> Bump Bot{" "}
        {bumpsActive && <span className="text-greener">Active</span>}
      </span>
      <div className="flex ml-auto">
        <span className="flex text-[8px] gap-1 justify-center items-center select-none">
          {bumpCount}
          <IoRocket />
        </span>
        <button
          className={`p-2 border border-gray-900 ml-2  hover:text-white w-[57px] flex justify-center items-center ${
            bumpsActive ? "gradbtnsmall" : "bg-[#111]"
          } ${!form.creationTime ? "cursor-not-allowed" : "cursor-pointer"}`}
          onClick={() => setBumpsActive((prev) => !prev)}
          disabled={!form.creationTime ? true : false}
        >
          {!bumpsActive && "Launch"}
          {bumpsActive && (
            <IoRocket className={`${bumpsActive ? "rocket" : ""}`} />
          )}
        </button>
        <button
          ref={buttonRef}
          className="p-2 border border-gray-900 ml-1 cursor-pointer hover:text-white bg-[#111] relative"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((prev) => !prev);
          }}
        >
          <HiCog8Tooth />
          {menuOpen && (
            <div
              ref={menuRef}
              className="absolute w-72 p-3 border border-gray-800 bg-[#111] right-[-2px] bottom-8 z-10 flex flex-col gap-2 text-[10px] text-white rounded-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col gap-1">
                <label htmlFor="solIn" className="text-gray-400">
                  SOL In
                </label>
                <input
                  id="solIn"
                  type="number"
                  step="0.001"
                  min="0"
                  value={solIn}
                  onChange={(e) => {
                    const newSettings = {
                      ...bumpSettings,
                      solin: parseFloat(e.target.value) || 0,
                    };
                    setBumpSettings(newSettings);
                    localStorage.setItem(
                      "bundleBumpSettings",
                      JSON.stringify(newSettings)
                    );
                  }}
                  className="bg-black text-white border border-gray-800 px-2 py-1 rounded  focus:outline-green-300 focus:outline-1 focus:bg-[#23ff4011]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="interval" className="text-gray-400">
                  Interval ({(interval / 1000).toFixed(1)}s)
                </label>
                <input
                  id="interval"
                  type="range"
                  min={0}
                  max={30}
                  step={0.5}
                  value={interval / 1000}
                  onChange={(e) => {
                    const newInterval = parseFloat(e.target.value) * 1000;
                    const newSettings = {
                      ...bumpSettings,
                      interval: newInterval,
                    };
                    setBumpSettings(newSettings);
                    localStorage.setItem(
                      "bundleBumpSettings",
                      JSON.stringify(newSettings)
                    );
                  }}
                  className="w-full cursor-grab active:cursor-grabbing"
                />
              </div>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default BumpBot;
