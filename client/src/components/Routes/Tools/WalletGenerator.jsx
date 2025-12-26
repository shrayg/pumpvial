import React, { useEffect, useRef, useState } from "react";
import { Keypair } from "@solana/web3.js";
import JSZip from "jszip";
import Pagination from "../../Pagination/Pagination";
import BlogNav from "../../BlogNav/BlogNav";
import { FaRegCircleQuestion } from "react-icons/fa6";
import { saveAs } from "file-saver";
import bs58 from "bs58";
import { Helmet } from "react-helmet";

const WalletGenerator = () => {
  const inputRef = useRef();
  const [showInfo, setShowInfo] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [wallets, setWallets] = useState([]);

  useEffect(() => {
    if (window.innerWidth > 800) inputRef.current?.focus();
  }, []);

  const handleGenerate = () => {
    const amount = parseInt(inputValue);
    if (!amount || amount <= 0) return;

    const newWallets = [];
    for (let i = 0; i < amount; i++) {
      const kp = Keypair.generate();
      newWallets.push({
        publicKey: kp.publicKey.toBase58(),
        secretKey: bs58.encode(kp.secretKey),
      });
    }
    setWallets(newWallets);
  };
  const downloadTxt = () => {
    const content = wallets
      .map(
        (w, i) =>
          `Wallet ${i + 1}:\nPublic Key: ${w.publicKey}\nSecret Key (base64): ${
            w.secretKey
          }\n`
      )
      .join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    saveAs(blob, "wallets.txt");
  };

  const downloadZip = async () => {
    const zip = new JSZip();
    wallets.forEach((wallet, i) => {
      const content = JSON.stringify(wallet, null, 2);
      zip.file(`wallet_${i + 1}.json`, content);
    });
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, "wallets.zip");
  };

  const saveAsJSON = () => {
    const walletsArray = [];

    wallets.forEach(({ secretKey }) => {
      try {
        // Decode secretKey from base58 string to Uint8Array
        const secretKeyBytes = bs58.decode(secretKey);
        // Create Keypair from secretKey bytes
        const kp = Keypair.fromSecretKey(secretKeyBytes);

        walletsArray.push({
          publicKey: kp.publicKey.toBase58(),
          privateKey: secretKey,
        });
      } catch (e) {
        console.error("Error decoding secretKey:", e);
      }
    });

    const jsonStr = JSON.stringify(walletsArray, null, 2);

    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${wallets.length} Wallets.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <article className="pt-0 text-[12px] text-white px-5 md:px-10 lg:px-10 flex-1 w-full xl:max-w-[950px] lg:mx-auto">
      <Helmet>
        <title>PumpAgent - Wallet Generator</title>
        <link
          rel="canonical"
          href="https://pumpagent.com/tools/wallet-generator"
        />
        <meta property="og:title" content="PumpAgent - Wallet Generator" />
        <meta
          property="og:url"
          content="https://pumpagent.com/tools/wallet-generator"
        />
      </Helmet>
      <Pagination />
      <h1 className="text-5xl lg:text-6xl dark:text-black pb-12">
        Wallet Generator
      </h1>

      <div className="bg-tile border-1 flex flex-col justify-center items-center border-gray-800 rounded-lg p-8 md:w-md mx-auto relative h-[400px] mb-10">
        <span className="font-bold text-lg select-none">
          Generate Solana Wallets
        </span>
        <button className="absolute top-4 right-4 text-gray-600 text-[16px] hover:text-gray-400 transition cursor-help">
          <FaRegCircleQuestion
            onMouseOver={() => setShowInfo(true)}
            onMouseOut={() => setShowInfo(false)}
          />
          {showInfo && (
            <div className="absolute right-3 top-5 bg-tile border border-gray-800 rounded-md p-2 text-white text-[12px] w-60 z-30">
              Generate Solana wallet keypairs (Public & Private Key) and save as
              .txt or .JSON in .zip.
            </div>
          )}
        </button>

        <div className="flex flex-col justify-center items-center gap-4 flex-1 w-full">
          <div className="border-1 border-gray-800 flex flex-col p-4 gap-4 rounded-md w-full">
            <input
              ref={inputRef}
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter amount to generate"
              className="text-[12px] p-2 px-3 rounded-md border border-gray-800 focus:border-gray-500 focus:outline-none"
            />
            <button
              onClick={handleGenerate}
              className="bg-green-700 hover:bg-green-600 text-white p-2 rounded-md text-[12px] cursor-pointer"
            >
              Generate Wallets
            </button>
          </div>

          {wallets.length > 0 && (
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm">{wallets.length} wallets generated</p>
              <div className="flex gap-3">
                <button
                  onClick={downloadTxt}
                  className="bg-blue-700 hover:bg-blue-600 text-white p-2 rounded-md text-[12px] cursor-pointer"
                >
                  Download .txt
                </button>
                <button
                  onClick={saveAsJSON}
                  className="bg-blue-700 hover:bg-blue-600 text-white p-2 rounded-md text-[12px] cursor-pointer"
                >
                  Download .JSON
                </button>
                <button
                  onClick={downloadZip}
                  className="bg-purple-700 hover:bg-purple-600 text-white p-2 rounded-md text-[12px] cursor-pointer"
                >
                  Download .zip
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export default WalletGenerator;
