const tokenMetadata = {
  // image: imageString, // From the example below (Base64 data url)
  name: "PumpKit Memecoin",
  symbol: "PKIT",
  description: "The greatest toolkit to start shipping!",
  twitter: "https://@pumpkit_memecoin",
  telegram: "https://t.me/pumpkit_memecoin",
  website: "https://pumpkitmemecoin.com",
};

const createIPFS = async () => {
  try {
    // const request = await fetch("https://api.pumpagent.com/create-ipfs", {
    const request = await fetch("http://localhost:3000/create-ipfs", {
      method: "POST",
      body: JSON.stringify(tokenMetadata),
      headers: {
        "Content-Type": "application/json",
        "x-api-key":
          "EzA1XfYGR9kuBW1herClf7ftR6bgH7tD-8AcxXr9Jtye-CxJH9viGNS4-ydU8iWYE1rx-GqWxiCjQjGf-88ozHIVIYs0jsTLdk9ds3uVqtMhbK2Im",
      },
    });

    const response = await request.json();
    console.log("Metadata: ", response);
  } catch (error) {
    console.error("Error:", error);
  }
};

createIPFS();
