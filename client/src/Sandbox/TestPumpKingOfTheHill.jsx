import { useEffect } from "react";

const TestPumpKingOfTheHill = () => {
  useEffect(() => {
    return;
    const getKingOfTheHill = async () => {
      const api =
        "lkg2IHUqTunEyG24dBiS9Em7moBKaGQU-8AcxXr9Jtye-CxJH9viGNS4-ydU8iWYE1rx-GqWxiCjQjGf-zYDKbzFxaInMzmcRQx8v9uDrki9xP7Pk";

      try {
        const request = await fetch("https://api.pumpagent.com/pump-koth", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": api,
          },
        });
        const { koth } = await request.json();

        console.log("Current King Of The Hill: ", koth);
      } catch (error) {
        console.error("Error:", error);
      }
    };

    getKingOfTheHill();
  }, []);

  return <div></div>;
};

export default TestPumpKingOfTheHill;
