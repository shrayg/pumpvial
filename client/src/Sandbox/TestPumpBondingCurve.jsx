import { useEffect } from "react";

const api =
  "EzA1XfYGR9kuBW1herClf7ftR6bgH7tD-8AcxXr9Jtye-CxJH9viGNS4-ydU8iWYE1rx-GqWxiCjQjGf-88ozHIVIYs0jsTLdk9ds3uVqtMhbK2Im";

// Dead coin: 4QDtjni1Sqzi5K7t7Fu65N193F3Nd8m3ZGrxbCgVpump

const TestPumpBondingCurve = () => {
  useEffect(() => {
    // return;
    const getPumpBondingCurve = async (ca) => {
      try {
        const request = await fetch(
          "https://api.pumpagent.com/pump-bonding-curve",
          {
            method: "POST",
            body: JSON.stringify({ ca }),
            headers: { "Content-Type": "application/json", "x-api-key": api },
          }
        );

        const { curveProgress } = await request.json();
        console.log("Bonding Curve Progress: ", curveProgress);
      } catch (error) {
        console.error("Error:", error);
      }
    };

    getPumpBondingCurve("HM11exNRqYwkzDcibnQoPYBfKSCYHpwkhp6x853Lpump");
  }, []);

  return <div></div>;
};

export default TestPumpBondingCurve;
