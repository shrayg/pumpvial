import { getPumpPoolPdaString } from "../../../../../utils/functions";
import ChartPanel from "./ChartPanel/ChartPanel";
import LeftBar from "./LeftBar/LeftBar";
import TradePanel from "./TradePanel/TradePanel";
import { useEffect, useState } from "react";

const Trade = ({
  userData,
  form,
  wallets,
  trackedHolders,
  solPrice,
  ca,
  refetchBalances,
  setRefetchBalances,
  setForm,
}) => {
  const [pumpswapCandles, setPumpswapCandles] = useState([]);
  const [holders, setHolders] = useState([]);
  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  const getCandles = async () => {
    let attempts = 0;
    const maxRetries = 4;

    const pool = getPumpPoolPdaString(form.mintPub);
    while (attempts <= maxRetries) {
      try {
        const chartRequest = await fetch(
          "https://api.pumpagent.com/pumpswap-chart",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": userData?.api_key,
            },
            body: JSON.stringify({
              pool,
              creationTime: form?.creationTime,
            }),
          }
        );

        if (!chartRequest.ok) {
          throw new Error(`HTTP error! Status: ${chartRequest.status}`);
        }

        const chartResponse = await chartRequest.json();
        setPumpswapCandles(chartResponse);
        return; // Exit if successful
      } catch (err) {
        console.error(`Attempt ${attempts + 1} failed:`, err);
        if (attempts === maxRetries) {
          console.error("All retry attempts failed.");
          break;
        }
        attempts++;
        await delay(2000); // Wait 2 seconds before retrying
      }
    }
  };

  useEffect(() => {
    if (!userData || pumpswapCandles.length > 0 || !form.creationTime) return;
    getCandles();
  }, [userData, pumpswapCandles, form]);

  return (
    <div className="w-full h-full  flex">
      <div className="flex flex-1">
        <LeftBar
          userData={userData}
          ca={ca}
          trackedHolders={trackedHolders}
          holders={holders}
          setHolders={setHolders}
          form={form}
        />
        <ChartPanel
          pumpswapCandles={pumpswapCandles}
          form={form}
          trackedHolders={trackedHolders}
          solPrice={solPrice}
          ca={ca}
          holders={holders}
        />
      </div>
      <TradePanel
        form={form}
        wallets={wallets}
        trackedHolders={trackedHolders}
        holders={holders}
        userData={userData}
        refetchBalances={refetchBalances}
        setRefetchBalances={setRefetchBalances}
        setForm={setForm}
      />
    </div>
  );
};

export default Trade;
