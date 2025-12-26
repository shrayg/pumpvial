import React, { useEffect, useRef, useState } from "react";
import Pagination from "../../Pagination/Pagination";
import BlogNav from "../../BlogNav/BlogNav";
import { FaLongArrowAltDown } from "react-icons/fa";
import { FaRegCircleQuestion } from "react-icons/fa6";
import { Helmet } from "react-helmet";

const LamportConverter = () => {
  const inputRef = useRef();
  const [inputValue, setInputValue] = useState("0.0001");
  const [rotated, setRotated] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const invertValues = () => {
    setInputValue(""); // clear input on toggle
    setRotated((prev) => !prev);
  };

  const getConvertedValue = () => {
    const parsed = parseFloat(inputValue.replace(/,/g, ""));
    if (isNaN(parsed)) return "";

    if (rotated) {
      // Lamports -> SOL
      return parsed / 1_000_000_000;
    } else {
      // SOL -> Lamports
      return (parsed * 1_000_000_000).toLocaleString();
    }
  };

  useEffect(() => {
    if (window.innerWidth > 800) inputRef.current?.focus();
  }, []);

  return (
    <article className="pt-0 text-[12px] text-white px-5 md:px-10 lg:px-10 flex-1 w-full xl:max-w-[950px] lg:mx-auto">
      <Helmet>
        <title>PumpAgent - Lamport Converter</title>
        <link
          rel="canonical"
          href="https://pumpagent.com/tools/lamport-converter"
        />
        <meta property="og:title" content="PumpAgent - Lamport Converter" />
        <meta
          property="og:url"
          content="https://pumpagent.com/tools/lamport-converter"
        />
      </Helmet>
      <Pagination />
      <h1 className="text-5xl lg:text-6xl dark:text-black pb-12">
        Lamport Converter
      </h1>

      <div className="bg-tile h-100 border-1 flex flex-col justify-center items-center border-gray-800 rounded-lg p-8 relative  md:w-md mx-auto mb-10">
        <button className="absolute top-4 right-4 text-gray-600 text-[16px] hover:text-gray-400 transition cursor-help">
          <FaRegCircleQuestion
            onMouseOver={() => setShowInfo(true)}
            onMouseOut={() => setShowInfo(false)}
          />
          {showInfo && (
            <div className="absolute right-3 top-5 bg-tile border border-gray-800 rounded-md p-2 text-white text-[12px] w-60 z-30">
              Lamports are the smallest denomination of SOL, the native token of
              the Solana blockchain. Just like cents to a dollar, lamports
              represent fractional amounts of SOL—specifically, 1 SOL equals
              1,000,000,000 lamports. They are used for precise accounting,
              transaction fees, and smart contract operations.
            </div>
          )}
        </button>
        <div className="flex flex-col justify-start items-center gap-2 flex-1">
          <span className="font-bold text-lg select-none text-center">
            Convert {rotated ? "LAMPORTS to SOL" : "SOL to LAMPORTS"}
          </span>
          <div className="border-1 border-gray-800 flex flex-col p-4 mt-2 gap-4 rounded-md w-full">
            <label htmlFor="in" className="text-gray-500 select-none">
              {rotated ? "LAMPORTS In" : "SOL In"}
            </label>
            <input
              ref={inputRef}
              type="number"
              value={inputValue}
              id="in"
              name="in"
              onChange={handleInputChange}
              placeholder={
                rotated ? "Enter LAMPORT Amount" : "Enter SOL Amount"
              }
              className="text-[12px] p-2 px-3 rounded-md border border-gray-800 focus:border-gray-500 focus:outline-none"
            />
          </div>
          <div
            className="flex cursor-pointer group p-1.5 rounded-full"
            onClick={invertValues}
          >
            <FaLongArrowAltDown className="text-gray-600 text-[20px] mr-[-11px] group-hover:text-gray-300 transition transition-300" />
            <FaLongArrowAltDown className="text-gray-600 text-[20px] rotate-180 group-hover:text-gray-300 transition transition-300" />
          </div>
          <div className="border-1 border-gray-800 flex flex-col p-4 gap-4 w-full rounded-md">
            <span className="text-gray-500 select-none">
              {rotated ? "SOL Out" : "LAMPORTS Out"}
            </span>
            <span className="text-[14px] font-bold text-white border-1 p-4 border-gray-800 rounded-xl select-none">
              {inputValue === ""
                ? "0"
                : rotated
                ? `${getConvertedValue()} SOL`
                : `${getConvertedValue()} Lamports`}
            </span>
          </div>
        </div>
        <span className="text-gray-600 mt-4 select-none">
          1 SOL = 1,000,000,000 LAMPORTS
        </span>
      </div>
    </article>
  );
};

export default LamportConverter;
