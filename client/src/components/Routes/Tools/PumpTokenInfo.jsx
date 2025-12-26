import { useEffect, useRef, useState } from "react";
import Pagination from "../../Pagination/Pagination";
import Spinner from "../../../assets/Spinner.svg";
import { FaLongArrowAltLeft } from "react-icons/fa";
import { IoRefresh } from "react-icons/io5";
import { FaRegCopy } from "react-icons/fa6";
import { BsTwitterX } from "react-icons/bs";
import { FaTelegramPlane } from "react-icons/fa";
import { FaGlobeAfrica } from "react-icons/fa";
import { FaExternalLinkAlt } from "react-icons/fa";
import { timeAgo } from "../../../utils/functions";
import { Helmet } from "react-helmet";

const PumpTokenInfo = () => {
  const inputRef = useRef();
  const [inputValue, setInputValue] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [spinning, setSpinning] = useState(false);

  useEffect(() => {
    if (window.innerWidth > 800) inputRef.current?.focus();
  }, []);

  const searchToken = async () => {
    setLoading(true);
    setSpinning(true);

    setTimeout(() => setSpinning(false), 1000);
    try {
      const request = await fetch("https://api.pumpagent.com/pump-token-info", {
        method: "POST",
        body: JSON.stringify({
          ca: inputValue,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const { response } = await request.json();
      setResult(response);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const copy = (i) => navigator.clipboard.writeText(i);

  const tokenReserves = result?.virtual_token_reserves;
  const bondingCurveProgress =
    ((1_073_000_000 * 10 ** 6 - tokenReserves) * 100) / (793_100_000 * 10 ** 6);

  return (
    <article className="pt-0 text-[12px] text-white px-5 md:px-10 lg:px-10 flex-1 w-full xl:max-w-[950px] lg:mx-auto mb-10">
      <Helmet>
        <title>PumpAgent - Pump Token Info</title>
        <link
          rel="canonical"
          href="https://pumpagent.com/tools/pump-token-info"
        />
        <meta property="og:title" content="PumpAgent - Pump Token Info" />
        <meta
          property="og:url"
          content="https://pumpagent.com/tools/pump-token-info"
        />
      </Helmet>
      <Pagination />
      <h1 className="text-5xl lg:text-6xl dark:text-black pb-12">
        Pump Token Info
      </h1>

      <div className="bg-tile border-1 flex flex-col justify-center items-center border-gray-800 rounded-lg p-4 md:p-8 relative min-h-[325px] md:min-h-[400px] mb-10">
        {!result && (
          <>
            <span className="font-bold text-lg select-none text-center">
              Get Information About a Pump.fun Token
            </span>
            <div className="flex flex-col justify-center items-center gap-4 flex-1 w-full">
              <div className="border-1 border-gray-800 flex flex-col p-4 gap-4 rounded-md w-full max-w-md">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Enter pump.fun contract address"
                  className="text-[12px] p-2 px-3 rounded-md border border-gray-800 focus:border-gray-500 focus:outline-none"
                />
                <button
                  className="bg-green-700 hover:bg-green-600 text-white p-2 rounded-md text-[12px] cursor-pointer max-h-[28px] flex justify-center items-center disabled:bg-green-800 disabled:hover:bg-green-800"
                  onClick={searchToken}
                  disabled={loading ? true : false}
                >
                  {loading ? (
                    <img src={Spinner} alt="Spinner" />
                  ) : (
                    "Search Token"
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        {result && (
          <div className="flex flex-col justify-start items-start h-full w-full">
            {/* ROW */}
            <div className="flex justify-between items-center w-full">
              <button
                className="text-lg text-gray-600 cursor-pointer hover:text-white p-1 bg-[#33333348] px-2 rounded-md border border-gray-800"
                onClick={() => {
                  setInputValue("");
                  setResult(null);
                }}
              >
                <FaLongArrowAltLeft />
              </button>
              <button
                className="text-lg text-gray-600 cursor-pointer hover:text-white bg-[#33333348]  p-1 rounded-full border border-gray-800"
                onClick={() => searchToken(inputValue)}
                disabled={loading ? true : false}
              >
                <IoRefresh
                  className={`mb-[1px] ${spinning ? "rotater" : ""}`}
                />
              </button>
            </div>

            {/* ROW */}
            <div className="flex flex-col pt-8 w-full">
              <div className="flex w-full flex-col md:flex-row">
                <div className="flex justify-start items-start">
                  <div className="relative flex justify-start items-start mb-4 md:mb-0">
                    <img
                      src={result?.image_uri}
                      className="w-35 h-35 object-contain rounded-lg"
                    />
                    {result?.nsfw && (
                      <span className="absolute top-0 left-0 bg-red-500 p-0.5">
                        NSFW
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col justify-between h-full pl-4 gap-4 flex-1 md:mr-4">
                    <div className="border border-gray-800 p-2 rounded-lg flex flex-col  h-1/2">
                      <div className="flex justify-between">
                        <span className="text-gray-700">Name</span>
                        <button
                          className="p-1 group cursor-pointer"
                          onClick={() => copy(result?.name)}
                        >
                          <FaRegCopy className="text-gray-600 group-hover:text-white active:text-greener" />
                        </button>
                      </div>
                      <h2 className="text-[12px] my-auto">{result?.name}</h2>
                    </div>
                    <div className="border border-gray-800 p-2 rounded-lg flex flex-col h-1/2">
                      <div className="flex justify-between">
                        <span className="text-gray-700">Symbol</span>
                        <button
                          className="p-1 group cursor-pointer"
                          onClick={() => copy(result?.symbol)}
                        >
                          <FaRegCopy className="text-gray-600 group-hover:text-white active:text-greener" />
                        </button>
                      </div>
                      <h2 className="text-[12px] my-auto">{result?.symbol}</h2>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-800 p-2 rounded-lg flex flex-col mb:ml-4 flex-1">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Description</span>
                    {result?.description && (
                      <button
                        className="p-1 group cursor-pointer"
                        onClick={() => copy(result?.description)}
                      >
                        <FaRegCopy className="text-gray-600 group-hover:text-white active:text-greener" />
                      </button>
                    )}
                  </div>
                  <h2
                    className={`text-base ${
                      !result.description
                        ? "text-gray-700 m-auto"
                        : "text-white"
                    }`}
                  >
                    {result?.description || "No description"}
                  </h2>
                </div>
              </div>
            </div>

            {/* ROW */}
            <div className="flex w-full sm:gap-4 flex-col sm:flex-row">
              <div className="border border-gray-800 p-2 rounded-lg flex flex-col mt-4 md:text-[12px]">
                <div className="flex justify-between">
                  <span className="text-gray-700">Contract Address</span>
                  <button
                    className="p-1 group cursor-pointer"
                    onClick={() => copy(result?.mint)}
                  >
                    <FaRegCopy className="text-gray-600 group-hover:text-white active:text-greener" />
                  </button>
                </div>
                <span className="py-1 my-auto text-[9px] md:text-[12px]">
                  {result?.mint}
                </span>
              </div>

              <div className="border border-gray-800 p-2 rounded-lg flex flex-col mt-4 w-full">
                <div className="flex justify-between">
                  <span className="text-gray-700">Socials</span>
                </div>

                <div className="flex w-full pt-1 gap-2">
                  <button
                    className={`w-1/3 flex justify-center items-center border border-gray-800 p-2 rounded-md text-base relative ${
                      !result.twitter
                        ? "text-gray-700"
                        : "text-white cursor-pointer"
                    }`}
                    onClick={() => window.open(result.twitter, "_blank")}
                  >
                    <BsTwitterX />

                    {result?.twitter && (
                      <button
                        className="p-1 group cursor-pointer absolute top-1 right-1 text-[12px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          copy(result?.twitter);
                        }}
                      >
                        <FaRegCopy className="text-gray-600 group-hover:text-white active:text-greener" />
                      </button>
                    )}
                  </button>
                  <div
                    className={`w-1/3 flex justify-center items-center border border-gray-800 p-2 rounded-md text-base relative ${
                      !result.telegram
                        ? "text-gray-700"
                        : "text-white cursor-pointer"
                    }`}
                    onClick={() => window.open(result.telegram, "_blank")}
                  >
                    <FaTelegramPlane />
                    {result?.telegram && (
                      <button
                        className="p-1 group cursor-pointer absolute top-1 right-1 text-[12px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          copy(result?.telegram);
                        }}
                      >
                        <FaRegCopy className="text-gray-600 group-hover:text-white active:text-greener" />
                      </button>
                    )}
                  </div>
                  <button
                    className={`w-1/3 flex justify-center items-center border border-gray-800 p-2 rounded-md text-base relative ${
                      !result.website
                        ? "text-gray-700"
                        : "text-white cursor-pointer"
                    }`}
                    onClick={() => window.open(result.website, "_blank")}
                  >
                    <FaGlobeAfrica />
                    {result?.website && (
                      <button
                        className="p-1 group cursor-pointer absolute top-1 right-1 text-[12px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          copy(result?.website);
                        }}
                      >
                        <FaRegCopy className="text-gray-600 group-hover:text-white active:text-greener" />
                      </button>
                    )}
                  </button>
                </div>
              </div>
            </div>
            {/* ROW */}
            <div className="flex w-full gap-4">
              <div className="border border-gray-800 p-2 rounded-lg flex flex-col mt-4 w-full">
                <div className="flex justify-between">
                  <span className="text-gray-700">Bonding Curve</span>
                </div>
                <span className="w-full text-center text-gray-500 mt-[-10px]">
                  {result?.complete
                    ? "Complete"
                    : Math.ceil(bondingCurveProgress) + "%"}
                </span>
                <div className="flex p-2 px-0 mt-1 bg-[#3cbd0035] w-full h-3 rounded-md justify-start items-center">
                  <div
                    className="w-full h-3 rounded-md bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500 transition"
                    style={{
                      width: `${
                        result?.complete ? 100 : bondingCurveProgress
                      }%`,
                      background: "",
                    }}
                  ></div>
                </div>
              </div>
            </div>
            {/* ROW */}
            <div className="flex w-full gap-4">
              <div className="border border-gray-800 p-2 rounded-lg flex flex-col mt-4 w-full">
                <div className="flex justify-between">
                  <span className="text-gray-700">Creator</span>
                  <button
                    className="p-1 group cursor-pointer"
                    onClick={() => copy(result?.creator)}
                  >
                    <FaRegCopy className="text-gray-600 group-hover:text-white active:text-greener" />
                  </button>
                </div>
                <span className="py-1 mt-1.5 my-auto flex justify-start items-center gap-1 text-[9px] md:text-[12px]">
                  {result?.creator}{" "}
                  <FaExternalLinkAlt
                    className="text-gray-500 hover:text-white cursor-pointer text-[10px]"
                    onClick={() =>
                      window.open(
                        `https://solscan.io/account/${result?.creator}`
                      )
                    }
                  />
                </span>
              </div>
            </div>
            {/* ROW */}
            <div className="flex w-full gap-4">
              <div className="border border-gray-800 p-2 rounded-lg flex-col mt-4 w-1/3 flex justify-center items-center">
                <div className="flex justify-between">
                  <span className="text-gray-700 flex gap-1">Created</span>
                </div>
                <span className="py-1 mt-1.5 my-auto flex justify-start items-center gap-1">
                  {timeAgo(result.created_timestamp)}
                </span>
              </div>
              <div className="border border-gray-800 p-2 rounded-lg flex-col mt-4 w-1/3 flex justify-center items-center">
                <div className="flex justify-between">
                  <span className="text-gray-700">Comments</span>
                </div>
                <span className="py-1 mt-1.5 my-auto flex justify-start items-center gap-1">
                  {result?.reply_count}
                </span>
              </div>
              <div className="border border-gray-800 p-2 rounded-lg flex-col mt-4 w-1/3 flex justify-center items-center">
                <div className="flex justify-between">
                  <span className="text-gray-700">Livestreaming</span>
                </div>
                <span className="py-1 mt-1.5 my-auto flex justify-start items-center gap-1">
                  {result?.is_currently_live ? "Yes" : "No"}
                </span>
              </div>
            </div>
            {/* ROW */}
            <div className="flex w-full gap-4">
              <div className="border border-gray-800 p-2 rounded-lg flex-col mt-4 w-1/3 flex justify-center items-center">
                <div className="flex justify-between">
                  <span className="text-gray-700 flex gap-1 text-center">
                    Market Cap
                  </span>
                </div>
                <span className="py-1 mt-1.5 my-auto flex justify-start items-center gap-1 text-center">
                  ${Math.floor(result.usd_market_cap).toLocaleString()}
                </span>
              </div>
              <div className="border border-gray-800 p-2 rounded-lg flex-col mt-4 w-1/3 flex justify-center items-center">
                <div className="flex justify-between">
                  <span className="text-gray-700 text-center">
                    All Time High
                  </span>
                </div>
                <span className="py-1 mt-1.5 my-auto flex justify-start items-center gap-1 text-center">
                  ${Math.floor(result.ath_market_cap).toLocaleString()}
                </span>
              </div>
              <div className="border border-gray-800 p-2 rounded-lg flex-col mt-4 w-1/3 flex justify-center items-center">
                <div className="flex justify-between">
                  <span className="text-gray-700 text-center">
                    King of the Hill
                  </span>
                </div>
                <span className="py-1 mt-1.5 my-auto flex justify-start items-center gap-1 text-center">
                  {!result.king_of_the_hill_timestamp && "Not Reached"}
                  {result?.king_of_the_hill_timestamp && (
                    <>{timeAgo(result.king_of_the_hill_timestamp)} Ago</>
                  )}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </article>
  );
};

export default PumpTokenInfo;
