import { useState, useRef, useEffect } from "react";
import { Helmet } from "react-helmet";
import { FaRegCopy, FaRegEye } from "react-icons/fa";
import { FaRegEyeSlash } from "react-icons/fa6";

// ✅ Long Press Hook
const useLongPress = (
  onLongPress,
  ms = 5000,
  setHoldProgress,
  setHovered,
  loading
) => {
  const timerRef = useRef(null);
  const intervalRef = useRef(null);
  const progressRef = useRef(0);

  const start = () => {
    if (loading) return;

    setHovered(true);
    setHoldProgress(0);
    progressRef.current = 0;

    intervalRef.current = setInterval(() => {
      progressRef.current += 100 / (ms / 10); // Progress steps
      setHoldProgress(progressRef.current);
    }, 10);

    timerRef.current = setTimeout(() => {
      clearInterval(intervalRef.current);
      setHoldProgress(0);
      setHovered(false);
      onLongPress();
    }, ms);
  };

  const clear = () => {
    clearTimeout(timerRef.current);
    clearInterval(intervalRef.current);
    setHoldProgress(0);
    setHovered(false);
  };

  return {
    onMouseDown: start,
    onTouchStart: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchEnd: clear,
    onTouchCancel: clear,
  };
};

const APIKey = ({ userData, setUserData }) => {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [apiKey, setApiKey] = useState(userData.api_key);
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);

  const toggleVisibility = () => setVisible(!visible);

  const handleCopy = () => {
    setCopied(true);
    navigator.clipboard.writeText(apiKey);
    setTimeout(() => setCopied(false), 1500);
  };

  const proof = JSON.parse(
    localStorage.getItem("sb-ewvqgcnetcqmnlkyjuww-auth-token")
  )?.access_token;

  const generateKey = async () => {
    setLoading(true);
    try {
      const request = await fetch("https://api.pumpagent.com/generate-api-key", {
        method: "POST",
        body: JSON.stringify({ proof, apiKey }),
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
      });
      const { newKey } = await request.json();
      setApiKey(newKey);
      setUserData((prev) => ({ ...prev, api_key: newKey }));
      setVisible(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const longPressHandlers = useLongPress(
    generateKey,
    5000,
    setHoldProgress,
    setHovered,
    loading
  );

  return (
    <main className="w-full mt-8 md:mt-14 px-4 md:px-10 max-w-[1048px]">
      <Helmet>
        <title>PumpAgent - API Key</title>
        <link rel="canonical" href="https://pumpagent.com/dashboard" />
        <meta property="og:title" content="PumpAgent - API Key" />
        <meta property="og:url" content="https://pumpagent.com/dashboard" />
      </Helmet>
      <div className="w-full min-h-70 border gap-8 md:gap-0 border-gray-800 dark:border-gray-200 bg-tile dark:bg-white dark:hover:bg-[#fff] rounded-md relativeitems-start p-5 md:p-10 py-6 md:py-12 flex-col md:flex-row flex">
        <div className="flex flex-col gap-4 h-full">
          <h2 className="text-[18px] font-lighter text-gray-600 select-none">
            API Key
          </h2>
          <div className="relative h-full flex-1 flex flex-col">
            <button
              className={
                "bg-[#62626232] dark:text-black min-w-[160px] select-none text-gray-500 transition hover:bg-green-700 hover:text-white z-10 text-[14px] p-2 mr-auto cursor-pointer h-[46px] max-h-[46px] w-full flex justify-center items-center md:mt-25"
              }
              {...longPressHandlers}
              disabled={loading}
              onMouseEnter={() => setHovered(true)}
            >
              {!hovered && "Generate New API Key"}
              {hovered && "Hold to Generate"}
            </button>
            <div
              className="h-1 bg-green-500"
              style={{ width: `${holdProgress}%` }}
            ></div>
          </div>
        </div>

        {/* API Key Display */}
        <div className="flex-1 md:border-l border-l-gray-800 md:ml-8 md:pl-8 flex justify-start items-start flex-col">
          <div className="flex items-center gap-0 md:gap-2 w-full bg-[#62626232] p-2 relative">
            <button
              className={`text-[16px] group p-2 rounded-2xl flex items-center gap-4 flex-1 text-center cursor-pointer`}
              onClick={toggleVisibility}
            >
              {apiKey && !visible && (
                <FaRegEye className="text-gray-400 group-hover:text-gray-200 dark:group-hover:text-black hover:dark:text-black dark:text-black" />
              )}
              {apiKey && visible && (
                <FaRegEyeSlash className="text-gray-400 group-hover:text-gray-200 dark:group-hover:text-black hover:dark:text-black dark:text-black" />
              )}
            </button>
            <span
              className={`w-full text-center text-[8px] md:text-[12px] min-h-[50px] flex justify-center items-center px-2 ${
                !apiKey || !visible
                  ? "text-gray-500"
                  : "text-gray-200 dark:text-black"
              }`}
            >
              {apiKey && visible && apiKey}
              {!apiKey &&
                !visible &&
                "???????????????-???????????????-???????????????-???????????????"}
              {apiKey &&
                !visible &&
                "???????????????-???????????????-???????????????-???????????????"}
            </span>
          </div>

          {apiKey && visible && (
            <>
              <span className="text-[10px] text-gray-500 pt-4 mb:pt-0 p-2 mb-4 md:mb-0 text-center w-full">
                {`headers: {  x-api-key: "${apiKey}"  }`}
              </span>
              <span className="text-[12px] mb-6 md:mb-0 text-red-500 w-full text-center mt-auto opacity-80 select-none">
                KEEP YOUR API KEY SECURE
              </span>
            </>
          )}

          {apiKey && visible && (
            <div className="text-[16px] mt-auto flex justify-between items-center w-full gap-2">
              <button
                className={`flex justify-center items-center gap-2 dark:hover:text-black text-gray-400 border-1 border-gray-700 p-2 rounded-xl dark:text-black cursor-pointer hover:text-white dark:hover-text-black text-[14px] select-none min-w-[125px] ${
                  copied ? "bg-green-400 text-white dark:text-black" : ""
                }`}
                onClick={handleCopy}
              >
                {copied ? (
                  "Copied"
                ) : (
                  <>
                    Copy API Key <FaRegCopy />
                  </>
                )}
              </button>
              <button
                className={`flex justify-center items-center gap-2 text-gray-400 dark:text-black border-1 border-gray-700 p-2 rounded-xl text-[14px] select-none`}
              >
                <div className="w-2 h-2 rounded-full bg-green-500 glow"></div>
                <span className="">Active</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default APIKey;
