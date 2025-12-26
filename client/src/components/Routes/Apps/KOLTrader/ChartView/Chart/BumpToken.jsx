import { useEffect, useRef, useState } from "react";

const BumpToken = ({ activateBumps, ca, traderWallet, apiKey }) => {
  const intervalRef = useRef(null);
  const [bumpSettings, setBumpSettings] = useState(() => {
    const stored = localStorage.getItem("bumpSettings");
    return stored ? JSON.parse(stored) : null;
  });

  // If bumpSettings don't exist in localStorage, set default object
  useEffect(() => {
    if (!bumpSettings) {
      const defaultSettings = {
        solin: 0.022,
        interval: 7500,
      };
      setBumpSettings(defaultSettings);
      localStorage.setItem("bumpSettings", JSON.stringify(defaultSettings));
    }
  }, [bumpSettings]);

  const solIn = bumpSettings?.solin;
  const interval = bumpSettings?.interval;

  useEffect(() => {
    const invokeBump = async () => {
      try {
        const res = await fetch("https://api.pumpagent.com/koltrader-bump", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
          body: JSON.stringify({
            recipient: traderWallet,
            ca,
            solIn,
          }),
        });
        const result = await res.json();
        if (!result.success) return;
        console.log(result);
      } catch (err) {
        console.error("Error while bumping:", err);
      }
    };

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // If activateBumps is true, start bumping
    if (activateBumps) {
      intervalRef.current = setInterval(invokeBump, interval);
    }

    // Cleanup on unmount or dependency change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [activateBumps, interval, apiKey, traderWallet, ca, solIn]);

  return <></>;
};

export default BumpToken;
