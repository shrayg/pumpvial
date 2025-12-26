import { useContext, useEffect, useState } from "react";
import SOL from "../../../../../../assets/SOL.png";
import { IoWalletSharp } from "react-icons/io5";
import { FaRegCopy } from "react-icons/fa6";
import { copy } from "../../../../../../utils/functions";
import { AuthContext } from "../../../../../../utils/AuthProvider";
import { useNavigate } from "react-router-dom";
import CreateWallet from "./CreateWallet";
import WithdrawFunds from "./WithdrawFunds";
import { FaHandHoldingMedical } from "react-icons/fa";

const Wallet = ({
  traderWallet,
  setTraderWallet,
  apiKey,
  solBalance,
  setSolBalance,
  setWalletOpen,
  walletOpen,
}) => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [copied, setCopied] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [privkey, setPrivkey] = useState("");
  const [pubkey, setPubkey] = useState("");
  const [walletTab, setWalletTab] = useState("");
  // Get user sol balance
  const getBalance = async () => {
    try {
      const request = await fetch("https://api.pumpagent.com/sol-balance", {
        method: "POST",
        body: JSON.stringify({
          wallet: traderWallet,
        }),
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
      });
      const { solBalance } = await request.json();
      setSolBalance(solBalance);
    } catch (e) {
      console.error(e);
    }
  };

  // Load initial wallet SOL balance
  useEffect(() => {
    if (!traderWallet || !apiKey) return;
    getBalance();
  }, [traderWallet, apiKey]);

  const handleCopy = (type) => {
    navigator.clipboard
      .writeText(type === "Public" ? pubkey : privkey)
      .then(() => {
        setCopied(type);
        setTimeout(() => setCopied(""), 1000); // remove green after 2s
      });
  };

  const complete = async () => {
    setLoading(true);
    const proof = JSON.parse(
      localStorage.getItem("sb-ewvqgcnetcqmnlkyjuww-auth-token")
    )?.access_token;

    try {
      const request = await fetch(
        "https://api.pumpagent.com/create-koltrade-wallet",
        {
          method: "POST",
          body: JSON.stringify({
            pubKey: pubkey,
            privKey: privkey,
            proof,
          }),
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
        }
      );
      const response = await request.json();
      if (!response.error) setTraderWallet(pubkey);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
    return;
  };

  const openWallet = () => {
    if (!user) {
      localStorage.setItem("redirect", "/dex");
      navigate("/signin");
      return;
    }
    setExpanded((p) => !p);
    setWalletOpen((p) => !p);
  };

  return (
    <div
      className={`flex flex-col justify-center items-center relative border-b border-gray-900 overflow-hidden text-[12px] ${
        walletOpen ? "w-full" : "w-1/2"
      } hover:bg-[#14141469]`}
    >
      <div
        className="flex justify-start items-center w-full cursor-pointer select-none delay-1000 fadeinslow opacity-0 h-[35px]"
        onClick={openWallet}
      >
        {!expanded && traderWallet && (
          <div className="h-full w-full flex">
            <div className="flex justify-start items-center  h-full gap-2  w-1/2 pl-2">
              <div className="flex justify-center items-center gap-0.5">
                <img src={SOL} alt="Solana" className="w-5 h-5" />
                <span className="text-gray-500 ml-1">
                  {solBalance && solBalance.toFixed(3)}
                </span>
              </div>
              <IoWalletSharp className="text-[14px] text-gray-500 " />
            </div>
          </div>
        )}
        {!expanded && !traderWallet && (
          <div className="px-2 flex justify-between w-full items-center gradbtn hover:bg-green-600 h-full">
            <span className="text-center w-full text-white text-shadow-md">
              Create Wallet
            </span>
          </div>
        )}
        {expanded && (
          <span className="text-center w-full text-[12px] text-gray-700 py-2.5 hover:text-gray-400 hover:bg-[#14141469] h-full">
            Close
          </span>
        )}
      </div>

      {expanded && (
        <div className=" bg-black min-h-[490px] w-full z-6000 flex flex-col select-none">
          {/* Hero */}
          <div className="flex justify-center items-center flex-col py-4 grad pr-2">
            <div className="flex justify-center items-center">
              <img src={SOL} alt="Solana" className="w-10 h-10" />
              <span className="text-[24px] text-white">
                {solBalance.toFixed(4)}
              </span>
            </div>

            <span
              className="text-[12px] text-gray-500 flex justify-center items-center gap-1 group hover:text-greener cursor-pointer active:underline"
              onClick={() => copy(traderWallet)}
            >
              {traderWallet.slice(0, 5) +
                "..." +
                traderWallet.slice(traderWallet.length - 5)}{" "}
              <FaRegCopy className="" />
            </span>
          </div>

          {!walletTab && (
            <div className="flex flex-col h-full">
              <div className="flex h-full flex-col p-4 space-x-4 gap-4">
                <div
                  className="border rounded-lg border-gray-900 w-full flex justify-center items-center gap-2 py-4 my-auto hover:text-white cursor-pointer bg-[#11111141] text-gray-500 hover:bg-[#151515]"
                  onClick={() => setWalletTab("Withdraw")}
                >
                  <FaHandHoldingMedical className="text-greener" />
                  <span>Withdraw Funds</span>
                </div>
              </div>
            </div>
          )}
          {walletTab === "Withdraw" && (
            <WithdrawFunds
              setWalletTab={setWalletTab}
              apiKey={apiKey}
              solBalance={solBalance}
              traderWallet={traderWallet}
              setSolBalance={setSolBalance}
            />
          )}
        </div>
      )}

      {expanded && !traderWallet && (
        <CreateWallet
          copied={copied}
          handleCopy={handleCopy}
          complete={complete}
          loading={loading}
          privkey={privkey}
          setPrivkey={setPrivkey}
          pubkey={pubkey}
          setPubkey={setPubkey}
        />
      )}
    </div>
  );
};

export default Wallet;
