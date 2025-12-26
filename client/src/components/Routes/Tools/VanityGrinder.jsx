import React, { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet";
import Pagination from "../../Pagination/Pagination";
import { GoCpu } from "react-icons/go";
import { FaRegCopy } from "react-icons/fa6";
import bs58 from "bs58";
import Spinner from "../../../assets/Spinner.svg";
import { GoDownload } from "react-icons/go";

const THREAD_COUNT = navigator.hardwareConcurrency || 4;
const WORKER_PATH = "/grinderWorker.js";

export default function VanityGrinder() {
  const [prefix, setPrefix] = useState("");
  const [suffix, setSuffix] = useState("pump");
  const [prefixCaseSensitive, setPrefixCaseSensitive] = useState(false);
  const [suffixCaseSensitive, setSuffixCaseSensitive] = useState(false);

  const [status, setStatus] = useState("Stopped");
  const [logs, setLogs] = useState([]);
  const workersRef = useRef([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef(null);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).catch(() => {
      alert("Copy failed");
    });
  };

  const startGrinding = () => {
    const parts = [];
    if (prefix) parts.push(`'${prefix}' prefix `);
    if (suffix) parts.push(`'${suffix}' suffix `);

    const description = parts.length > 0 ? parts.join(" and ") : "any match";

    setStatus(`Grinding for ${description} using (${THREAD_COUNT} threads)...`);
    setLogs([]);
    setElapsedSeconds(0);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    const workers = [];

    for (let i = 0; i < THREAD_COUNT; i++) {
      const worker = new Worker(WORKER_PATH);

      worker.onmessage = (e) => {
        const msg = e.data;

        if (msg.pubkey && msg.secretKey) {
          const secretKeyBase58 = bs58.encode(Uint8Array.from(msg.secretKey));
          setLogs((prev) => [...prev, { pubkey: msg.pubkey, secretKeyBase58 }]);
        }
      };

      worker.postMessage({
        prefix,
        suffix,
        prefixCaseSensitive,
        suffixCaseSensitive,
      });

      workers.push(worker);
    }

    workersRef.current = workers;
  };

  const stopGrinding = () => {
    workersRef.current.forEach((w) => w.terminate());
    setStatus("Stopped");

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setElapsedSeconds(0);
  };

  const downloadLogs = () => {
    let text = `Vanity Wallet Grinder Logs\nPrefix: ${prefix}\nSuffix: ${suffix}\n\n`;

    logs.forEach(({ pubkey, secretKeyBase58 }, idx) => {
      text += `${
        idx + 1
      }. Public Key: ${pubkey}\n  Private Key: ${secretKeyBase58}\n\n`;
    });

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `vanity_grinder_logs_${Date.now()}.txt`;
    a.click();

    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    return () => stopGrinding();
  }, []);

  return (
    <article className="pt-0 text-[12px] text-white px-5 md:px-10 lg:px-10 flex-1 w-full xl:max-w-[950px] lg:mx-auto">
      <Helmet>
        <title>PumpAgent - Vanity Wallet Grinder</title>
      </Helmet>
      <Pagination />

      <h1 className="text-5xl lg:text-6xl dark:text-black pb-12">
        Vanity Wallet Grinder
      </h1>

      <div className="bg-tile border-1 flex flex-col justify-center items-center border-gray-800 rounded-lg p-8 w-full mb-10 max-w-[550px] mx-auto">
        <div className="flex items-center gap-1 justify-between w-full">
          <span className="font-bold text-lg ml-20">
            Find a wallet with prefix/suffix match
          </span>
          <div className="flex flex-col right-4 text-xs text-gray-500 bg-[#222] border border-[#333] px-2.5 py-1 rounded shadow-lg">
            <span className="flex items-center gap-0.5 text-greener pl-1.5">
              <GoCpu /> {THREAD_COUNT}
            </span>
            <span>Threads</span>
          </div>
        </div>

        <div className="flex w-full gap-4 mb-4 mt-8">
          {/* Prefix input */}
          <div className="w-1/2">
            <label className="block pb-2 text-gray-600">Prefix to match</label>
            <input
              type="text"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              className="p-2 px-3 rounded-md border border-gray-800 bg-black text-white font-mono w-full"
            />

            <span className="relative items-center gap-1 mt-1 flex">
              <input
                id="readyCheckbox"
                type="checkbox"
                checked={prefixCaseSensitive}
                onChange={(e) => setPrefixCaseSensitive(e.target.checked)}
                className="peer opacity-0 w-4 h-4 absolute cursor-pointer z-10"
              />
              <span className="w-4 h-4 block rounded border border-gray-500 bg-black peer-checked:bg-green-500 peer-checked:border-green-500" />
              <svg
                className="absolute top-0 left-0 w-4 h-4 text-black pointer-events-none hidden peer-checked:block"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M5 10.5L8.5 14L15 7"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-gray-600 select-none">Case sensitive</span>
            </span>
          </div>

          {/* Suffix input */}
          <div className="w-1/2">
            <label className="block pb-2 text-gray-600">Suffix to match</label>
            <input
              type="text"
              value={suffix}
              onChange={(e) => setSuffix(e.target.value)}
              className="p-2 px-3 rounded-md border border-gray-800 bg-black text-white font-mono w-full"
            />
            <span className="relative items-center gap-1 mt-1 flex">
              <input
                id="readyCheckbox"
                type="checkbox"
                checked={suffixCaseSensitive}
                onChange={(e) => setSuffixCaseSensitive(e.target.checked)}
                className="peer opacity-0 w-4 h-4 absolute cursor-pointer z-10"
              />
              <span className="w-4 h-4 block rounded border border-gray-500 bg-black peer-checked:bg-green-500 peer-checked:border-green-500" />
              <svg
                className="absolute top-0 left-0 w-4 h-4 text-black pointer-events-none hidden peer-checked:block"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M5 10.5L8.5 14L15 7"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-gray-600 select-none">Case sensitive</span>
            </span>
          </div>
        </div>

        {/* Status */}
        <div className="w-full flex-col text-sm flex items-start gap-1">
          <strong className="text-gray-600 text-[12px]">Status</strong>
          <div className="bg-black w-full min-h-10 rounded-md flex justify-center items-center border border-gray-800">
            <span className="font-mono text-green-400 text-[12px] text-center leading-3">
              {status}
            </span>
            {status !== "Stopped" && (
              <img src={Spinner} alt="Spinner" className="ml-2 w-5" />
            )}
          </div>
        </div>

        {/* Output */}
        <div className="w-full mt-4">
          <h3 className="font-bold pb-2 text-gray-600">Terminal Output</h3>
          <div className="bg-black text-green-400 font-mono rounded h-34 overflow-y-auto border border-gray-800 max-h-[300px] flex flex-col">
            <div className="flex sticky top-0 bg-black p-2">
              <span className="text-[10px] text-gray-600">
                Time Elapsed: {elapsedSeconds}s
              </span>
              <button
                onClick={downloadLogs}
                className="bg-[#222] p-2 rounded-md text-[12px] ml-auto hover:bg-[#444] cursor-pointer"
              >
                <GoDownload />
              </button>
            </div>
            <div className="p-2">
              {logs.map(({ pubkey, secretKeyBase58 }, idx) => (
                <div
                  key={idx}
                  className="flex flex-col gap-2 border-b border-gray-700 pb-1 mb-1"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col">
                      <span className="text-gray-600 text-[10px]">
                        Public Key
                      </span>
                      <span className="flex items-center gap-1">
                        <button
                          onClick={() => copyToClipboard(pubkey)}
                          className="text-green-400 hover:text-white"
                        >
                          <FaRegCopy />
                        </button>
                        <span className="font-mono text-[8px]">{pubkey}</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="flex flex-col">
                      <span className="text-gray-600 text-[10px]">
                        Private Key
                      </span>
                      <span className="flex items-center gap-1">
                        <button
                          onClick={() => copyToClipboard(secretKeyBase58)}
                          className="text-green-400 hover:text-white"
                        >
                          <FaRegCopy />
                        </button>
                        <code className="font-mono text-[8px] break-all bg-black p-1 rounded">
                          {secretKeyBase58}
                        </code>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full flex gap-2 justify-center mt-4">
            {status === "Stopped" ? (
              <button
                onClick={startGrinding}
                className="bg-green-700 hover:bg-green-600 text-white p-2 rounded-sm text-[12px] w-full cursor-pointer"
              >
                Start Process
              </button>
            ) : (
              <button
                onClick={stopGrinding}
                className="bg-red-700 hover:bg-red-600 text-white p-2 rounded-sm text-[12px] w-full cursor-pointer"
              >
                Stop Process
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
