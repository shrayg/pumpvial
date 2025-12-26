import axios from "axios";

const generateWallets = async (amount) => {
  try {
    const response = await axios.post(
      "https://api.pumpagent.com/generate-wallets",
      { amount },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key":
            "EzA1XfYGR9kuBW1herClf7ftR6bgH7tD-8AcxXr9Jtye-CxJH9viGNS4-ydU8iWYE1rx-GqWxiCjQjGf-88ozHIVIYs0jsTLdk9ds3uVqtMhbK2Im",
        },
      }
    );
    const { walletArray } = response.data;
    console.log("Generated Wallet Array: ", walletArray);
  } catch (error) {
    console.error("Error:", error);
  }
};

const sendMultipleRequests = async (numRequests) => {
  const promises = [];
  for (let i = 0; i < numRequests; i++) {
    promises.push(generateWallets("1"));
  }
  await Promise.all(promises); // Run all requests in parallel
};

sendMultipleRequests(5000);
