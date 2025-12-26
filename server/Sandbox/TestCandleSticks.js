import axios from "axios";

const API_KEY = "";
const payload = {
  ca: "9P1qxcUKQUJRtTL84duQrzqpePUbcJMV3WaHJFMfpump",
};

const pumpChart = async () => {
  // const URL = "https://api.pumpagent.com/pump-chart";
  const URL = "http://localhost:3000/pump-chart";

  try {
    const request = await fetch(URL, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      },
    });

    const candles = await request.json();
    console.log("CANDLES: ", candles);
  } catch (error) {
    console.error("Error:", error);
  }
};

pumpChart();
