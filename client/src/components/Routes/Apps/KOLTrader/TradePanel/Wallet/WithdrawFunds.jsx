import { useRef, useState } from "react";
import Spinner from "../../../../../../assets/Spinner.svg";

const WithdrawFunds = ({
  setWalletTab,
  apiKey,
  solBalance,
  traderWallet,
  setSolBalance,
}) => {
  const inputRef = useRef(null);
  const [withdrawAmount, setWithdrawAmount] = useState(25);
  const [loading, setLoading] = useState(false);
  const [recipientWallet, setRecipientWallet] = useState("");

  const handleWithdraw = async () => {
    if (!recipientWallet) {
      inputRef.current.focus();
      return;
    }
    setLoading(true);
    try {
      const proof = JSON.parse(
        localStorage.getItem("sb-ewvqgcnetcqmnlkyjuww-auth-token")
      )?.access_token;
      const api_key = apiKey;
      const targetWallet = recipientWallet;
      const fromWallet = traderWallet;
      const toWithdraw = solBalance * (withdrawAmount / 100);

      const response = await fetch(
        "https://api.pumpagent.com/koltrader-withdraw",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
          body: JSON.stringify({
            proof,
            api_key,
            targetWallet,
            fromWallet,
            toWithdraw,
          }),
        }
      );

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Withdrawal failed.");
      }

      setSolBalance((prev) => prev - toWithdraw);
      setRecipientWallet("");
      setWithdrawAmount(25);
    } catch (err) {
      console.error("Withdrawal error:", err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full w-full flex justify-center pb-20 flex-col mt-4 p-4 relative">
      <button
        className="border border-gray-900 p-2 mr-auto px-4 absolute top-0 cursor-pointer text-gray-600 hover:text-white hover:bg-[#151515]"
        onClick={() => setWalletTab("")}
      >
        Close
      </button>
      <span className="pb-2 text-gray-600 ">Recipient Wallet Address</span>
      <input
        ref={inputRef}
        type="text"
        placeholder="Enter Recipient Wallet Address"
        className="border border-gray-700 p-2 focus:outline-green-300 focus:outline-1 focus:bg-[#23ff4011] focus:placeholder:text-gray-600 placeholder:text-gray-700 text-white placeholder:text-[12px] text-[14px]"
        value={recipientWallet}
        onChange={(e) => setRecipientWallet(e.target.value)}
      />
      <div className="flex space-between mt-3 text-gray-700">
        {[25, 50, 75, 100].map((percent) => (
          <button
            key={percent}
            className={`w-1/4 p-3 cursor-pointer ${
              withdrawAmount === percent ? "bg-[#151515] text-white" : ""
            }`}
            onClick={() => setWithdrawAmount(percent)}
          >
            {percent}%
          </button>
        ))}
      </div>
      <span className="text-gray-600 text-center w-full mt-4 mb-2">
        Withdraw {(solBalance * (withdrawAmount / 100)).toFixed(4)} SOL
      </span>
      <button
        className={`p-2 ${
          loading
            ? "bg-[#111]"
            : "bg-green-600 hover:bg-green-500  cursor-pointer"
        } text-white mt-3  py-3 max-h-[36px] flex justify-center items-center`}
        onClick={handleWithdraw}
        disabled={loading ? true : false}
      >
        {!loading && "Withdraw"}
        {loading && <img src={Spinner} alt="Spinner" />}
      </button>
    </div>
  );
};

export default WithdrawFunds;
