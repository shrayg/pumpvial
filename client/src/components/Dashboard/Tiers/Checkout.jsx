import { useEffect, useState } from "react";
import Sollogo from "../../../assets/Sol.png";
import USDClogo from "../../../assets/USDC.png";
import Command from "../../Wrappers/Command";
import Spinner from "../../../assets/Spinner.svg";

const Checkout = ({
  setCheckingOut,
  paymentWallet,
  setPaymentWallet,
  userData,
  setUserData,
}) => {
  const [method, setMethod] = useState("");
  const [loading, setLoading] = useState(false);
  const [solPlanPrice, setSolPlanPrice] = useState(null);
  const back = () => (method ? setMethod("") : setCheckingOut(false));

  const { api_key } = userData;
  const proof = JSON.parse(
    localStorage.getItem("sb-ewvqgcnetcqmnlkyjuww-auth-token")
  )?.access_token;

  useEffect(() => {
    if (paymentWallet) return;

    const getPaymentWallet = async () => {
      try {
        const request = await fetch(
          "https://api.pumpagent.com/get-tier-payment-wallet",
          {
            method: "POST",
            body: JSON.stringify({ proof }),
            headers: {
              "Content-Type": "application/json",
              "x-api-key": api_key,
            },
          }
        );
        const { pubKey } = await request.json();
        setPaymentWallet(pubKey);
      } catch (err) {
        console.error(err);
        alert(err);
      }
    };
    getPaymentWallet();
  }, [paymentWallet]);

  useEffect(() => {
    const getSolPlanPrice = async () => {
      try {
        const request = await fetch("https://api.pumpagent.com/tier-sol-price", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": api_key,
          },
        });
        const { solPrice } = await request.json();
        setSolPlanPrice(solPrice);
      } catch (err) {
        console.error(err);
        alert(err);
      }
    };
    getSolPlanPrice();
  }, []);

  const confirmPayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const request = await fetch(
        "https://api.pumpagent.com/confirm-tier-payment",
        {
          method: "POST",
          body: JSON.stringify({
            proof,
            method,
            apiKey: userData.api_key,
          }),
          headers: {
            "Content-Type": "application/json",
            "x-api-key": userData.api_key,
          },
        }
      );
      const response = await request.json();
      if (response.error) return alert(response.error);
      if (!response.tier) {
        return alert("Failed to confirm. Verify transaction and retry.");
      }
      setUserData(response);
      setCheckingOut(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className=" h-full sm:h-min">
      <div className="w-full h-full md:h-[500px] border border-gray-800 dark:border-gray-200 bg-tile dark:bg-white dark:hover:bg-[#fff] rounded-md relative px-4 py-4 flex flex-col gap-2 mb-2 justify-start items-center">
        <button
          className="bg-[#33333379] dark:text-black dark:hover:text-black p-2 rounded-md text-gray-500 hover:text-white cursor-pointer text-[12px] mr-auto"
          onClick={back}
        >
          Back
        </button>
        {!method && (
          <>
            <h2 className="text-[32px] text-white pt-4 md:pt-8 text-center dark:text-black">
              UPGRADE TO <span className="text-purple-500">ALCHEMIST</span>
            </h2>
            <span className="text-gray-500 text-[14px]">
              Single Payment of $199
            </span>
            <div className="flex flex-col h-full md:h-min justify-center sm:flex-row gap-4 md:gap-8 pt-5 md:pt-20 w-full">
              <div
                className="flex flex-col flex-1 sm:flex-initial justify-center items-center gap-2 text-sm bg-[#33333379] dark:bg-black p-4 rounded-lg w-full md:w-60 h-40 cursor-pointer hover:scale-105"
                onClick={() => setMethod("USDC")}
              >
                <img src={USDClogo} alt="Solana" className="w-20" />
                <span>Pay with USDC</span>
              </div>
              <div
                className="flex flex-col flex-1 sm:flex-initial justify-center items-center gap-2 text-sm bg-[#33333379] dark:bg-black p-4 rounded-lg w-full md:w-60 h-40 cursor-pointer hover:scale-105 shadow-lg"
                onClick={() => setMethod("SOL")}
              >
                <img src={Sollogo} alt="Solana" className="w-20" />
                <span>Pay with SOL</span>
              </div>
            </div>
          </>
        )}
        {method && (
          <form className="flex flex-col bg-[#33333379] dark:bg-black rounded-lg p-4 py-6 my-auto md:mt-6 justify-center items-center w-full md:w-md ">
            <span className="text-[20px]">Pay with {method}</span>
            <img
              src={method === "USDC" ? USDClogo : Sollogo}
              alt="Token logo"
              className="w-20 pt-8"
            />
            <span className="text-[18px] pt-8 mb-4">
              Transfer {method === "USDC" ? "199 USDC" : solPlanPrice + " SOL"}{" "}
              TO
            </span>
            <Command text={paymentWallet} />
            <button
              className={`text-[12px] bg-green-700  w-full p-3 py-3.5 mt-4 rounded-lg  max-h-[40px] flex justify-center items-center ${
                loading
                  ? "cursor-not-allowed"
                  : "hover:bg-[#13d620bb] cursor-pointer"
              }`}
              onClick={confirmPayment}
              disabled={
                loading || (method === "SOL" && !solPlanPrice) ? true : false
              }
            >
              {loading ? (
                <img src={Spinner} alt="Spinner" />
              ) : (
                <>
                  Confirm Payment{" "}
                  <img src={Spinner} alt="Spinner" className="w-4 ml-2" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Checkout;
