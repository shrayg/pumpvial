import { useEffect, useRef, useState } from "react";
import Spinner from "../../../assets/Spinner.svg";
import Solimage from "../../../assets/Sol.png";
import Usdcimage from "../../../assets/USDC.png";
import { isValidBase58 } from "../../../utils/functions";

const WithdrawModal = ({
  fundWalletBalance,
  userData,
  setFundWalletBalance,
  setUserData,
  setWithdrawing,
}) => {
  const inputRef = useRef();
  const [loading, setLoading] = useState(false);
  const [targetPercentage, setTargetPercentage] = useState("100");
  const [targetWallet, setTargetWallet] = useState("");
  const { api_key } = userData;
  const [currency, setCurrency] = useState("SOL");

  const notFunded = fundWalletBalance.SOL <= 0.002;
  const usdcBalance = fundWalletBalance.USDC;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const validAddress = isValidBase58(targetWallet);
  const proof = JSON.parse(
    localStorage.getItem("sb-ewvqgcnetcqmnlkyjuww-auth-token")
  )?.access_token;

  const handleWithdraw = async () => {
    setLoading(true);

    try {
      const request = await fetch(
        `https://api.pumpagent.com/user-withdraw-${currency.toLowerCase()}`,
        {
          method: "POST",
          body: JSON.stringify({
            proof,
            api_key,
            targetWallet,
            targetPercentage,
            currency,
          }),
          headers: {
            "Content-Type": "application/json",
            "x-api-key": api_key,
          },
        }
      );
      const response = await request.json();

      if (response.error) throw new Error(response.error);
      const { newWithdrawal, newBalanceFormatted } = response;

      setFundWalletBalance((prev) => ({
        ...prev,
        [currency]: newBalanceFormatted,
      }));
      setUserData((prev) => ({
        ...prev,
        withdrawals: JSON.stringify([
          newWithdrawal,
          ...JSON.parse(prev.withdrawals),
        ]),
      }));
      setTargetPercentage("100");
      setTargetWallet("");
      setWithdrawing(false);
    } catch (err) {
      console.error(err);
      alert(err);
    } finally {
      setLoading(false);
    }
  };

  const buttonOutput = () => {
    if (loading) return <img src={Spinner} alt="Spinner" />;
    if (currency === "SOL") {
      if (notFunded) return "Insufficient SOL to Claim";
      if (!notFunded) return "Claim SOL";
    }
    if (currency === "USDC") {
      if (usdcBalance === 0) return "Insufficient USDC to Claim";
      if (usdcBalance > 0 && notFunded) return "Insufficient SOL to Claim USDC";
      if (usdcBalance > 0 && !notFunded) return "Claim USDC";
    }
  };

  return (
    <div className="w-full flex-1 text-[12px] lg:border-l border-l-gray-800 lg:ml-8 lg:pl-8 mt-4 lg:mt-0 flex flex-col">
      <div className="flex gap-2 mb-2">
        <button
          className={`w-1/2 p-2 border border-gray-800 flex justify-center items-center gap-2 cursor-pointer ${
            currency === "SOL" ? "bg-green-600" : ""
          }`}
          onClick={() => setCurrency("SOL")}
        >
          SOL <img src={Solimage} alt="SOL" className="w-5" />
        </button>
        <button
          className={`w-1/2 p-2 border border-gray-800 flex justify-center items-center gap-2 cursor-pointer ${
            currency === "USDC" ? "bg-green-600" : ""
          }`}
          onClick={() => setCurrency("USDC")}
        >
          USDC
          <img src={Usdcimage} alt="USDC" className="w-5" />
        </button>
      </div>
      <input
        ref={inputRef}
        type="text"
        placeholder="Receiver Wallet Address"
        className="border-1 border-gray-800 w-full p-3 outline-none focus:bg-[#3333333c]"
        value={targetWallet}
        onChange={(e) => setTargetWallet(e.target.value)}
      />

      <div className="flex gap-2 w-full pt-2">
        {["25", "50", "75", "100"].map((btn) => (
          <button
            key={btn}
            className={`border-1 border-gray-800 p-2 h-full w-1/4 cursor-pointer select-none ${
              targetPercentage === btn ? "bg-[#3333339e]" : ""
            }`}
            onClick={() => setTargetPercentage(btn)}
          >
            {btn}%
          </button>
        ))}
      </div>
      {validAddress && (
        <div className="flex flex-col flex-1 justify-center items-center">
          <button
            className={`w-full p-3 border-1 border-gray-800 mt-auto relative bg-green-700 hover:bg-green-600 max-h-[38px] flex justify-center items-center ${
              notFunded ? "cursor-not-allowed" : "cursor-pointer"
            }`}
            // disabled={loading || notFunded ? true : false}
            onClick={handleWithdraw}
          >
            {buttonOutput()}
          </button>
        </div>
      )}
    </div>
  );
};

export default WithdrawModal;
