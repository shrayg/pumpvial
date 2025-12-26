import { useState } from "react";

const paymentPlan = [
  {
    duration: "15 Minutes",
    price: "0.15 SOL",
  },
  {
    duration: "30 Minutes",
    price: "0.25 SOL",
    saving: "17%",
  },
  {
    duration: "1 Hour",
    price: "0.45 SOL",
    saving: "25%",
  },
];

const randomUser = (length) =>
  [...Array(length)]
    .map(() =>
      "abcdefghijklmnopqrstuvwxyz0123456789".charAt(
        Math.floor(Math.random() * 36)
      )
    )
    .join("");

const BumpBotExample = () => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(randomUser(32));
  const [plan, setPlan] = useState(paymentPlan[0]);
  const [ca, setCa] = useState("");
  const [step, setStep] = useState("form"); // form -> payment -> bumping
  const [paymentAddress, setPaymentAddress] = useState(
    "3f3x6vUPSptHuYcYWxjqjditVnD1zhuGyF7mgyrLJLbB"
  );

  const handleSubmit = async () => {
    if (ca) setStep("payment");
  };

  const confirmPayment = async () => {
    setLoading(true);
    try {
      // const request = await fetch("https://api.pumpagent.com/confirm-payment", {
      //   method: "POST",
      //   body: JSON.stringify({
      //     user,
      //   }),
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      // });
      // const response = await request.json();
      // if (response.error) throw new Error(response.error);

      // Payment successful, bump starting

      setTimeout(() => {
        setStep("bumping");
        setUser(randomUser(32));
        setLoading(false);
      }, 3000);
    } catch (err) {
      console.error(err);
      alert(err);
    } finally {
    }
  };

  return (
    <div className="p-5 md:p-10 max-w-lg w-full h-[400px] mx-auto text-center border border-gray-800 rounded-xl shadow-lg text-[12px] flex flex-col dark:text-black">
      <h1 className="text-2xl font-bold mb-0">Turbo Bumper</h1>
      <p className="mb-4">Your go-to bumping service for pump.fun tokens</p>

      {step === "form" && (
        <>
          <input
            className="border border-gray-700 p-4 w-full mb-8 outline-none focus:bg-[#33333350] dark:focus:bg-[#3333331b] rounded-md mt-8"
            placeholder="Enter Pump Contract Address to Bump"
            value={ca}
            onChange={(e) => setCa(e.target.value)}
          />

          <div className="mb-4 space-x-2 flex justify-center items-center">
            {paymentPlan.map((d, i) => (
              <button
                key={i}
                className={`px-3 py-2 border border-gray-800 rounded cursor-pointer flex flex-col gap-2 items-center justify-center relative w-1/3 ${
                  plan?.duration === d?.duration
                    ? "bg-green-500"
                    : "bg-black dark:bg-transparent"
                }`}
                onClick={() => setPlan(d)}
              >
                <span className="text-[20px]">{d.price}</span>
                <span className="text-[12px]">{d.duration}</span>
                <span className="absolute bottom-[-20px] text-[#3bd08e] font-bold">
                  {d.saving && "Save " + d.saving + "!"}
                </span>
              </button>
            ))}
          </div>

          <button
            className="bg-green-700 hover:bg-green-500 text-white px-4 py-3 rounded mt-8 cursor-pointer"
            onClick={handleSubmit}
          >
            Continue
          </button>
        </>
      )}

      {step === "payment" && (
        <div className="flex flex-col">
          <button
            className="mr-auto bg-gray-900 max-h-[28px] hover:bg-gray-700 dark:text-white p-2 rounded-md cursor-pointer"
            onClick={() => setStep("form")}
          >
            Back
          </button>
          <p className="mb-2 mt-10">Send {plan?.price} To:</p>
          <div className="text-white font-mono mb-2 bg-[#3333338e] p-4 rounded-lg">
            {paymentAddress}
          </div>
          <button
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded cursor-pointer mt-10"
            onClick={confirmPayment}
            disabled={loading ? true : false}
          >
            {loading ? "Loading..." : "Confirm Payment"}
          </button>
        </div>
      )}

      {step === "bumping" && (
        <div className="flex flex-col items-center gap-2  mt-0">
          <button
            className="mr-auto bg-gray-900 dark:text-white hover:bg-gray-700 p-2 mb-15 rounded-md cursor-pointer"
            onClick={() => setStep("form")}
          >
            Back
          </button>
          <p className="text-[20px]">Token Bump Active!</p>
        </div>
      )}
    </div>
  );
};

export default BumpBotExample;
