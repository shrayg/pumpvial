import { useEffect } from "react";
const api =
  "lkg2IHUqTunEyG24dBiS9Em7moBKaGQU-8AcxXr9Jtye-CxJH9viGNS4-ydU8iWYE1rx-GqWxiCjQjGf-zYDKbzFxaInMzmcRQx8v9uDrki9xP7Pk";

const TestGenerateWallets = () => {
  useEffect(() => {
    // return;
    const generateWallets = async (amount) => {
      try {
        const request = await fetch(
          "https://api.pumpagent.com/generate-wallets",
          {
            method: "POST",
            body: JSON.stringify({ amount }),
            headers: { "Content-Type": "application/json", "x-api-key": api },
          }
        );

        const { walletArray } = await request.json();
        console.log("Generated Wallet Array: ", walletArray);
      } catch (error) {
        console.error("Error:", error);
      }
    };

    generateWallets("25");
  }, []);

  return <div></div>;
};

export default TestGenerateWallets;
