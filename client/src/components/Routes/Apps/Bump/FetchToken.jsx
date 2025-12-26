import { useState, useEffect } from "react";

const FetchToken = ({
  ca,
  setCa,
  setTokenData,
  getTokenTradeData,
  setMc,
  tokenData,
}) => {
  const [error, setError] = useState("");
  useEffect(() => {
    if (!ca) return;

    const tokenFetcher = async () => {
      try {
        const request = await fetch(
          "https://api.pumpagent.com/pump-token-info",
          {
            method: "POST",
            body: JSON.stringify({
              ca,
            }),
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        const { response } = await request.json();
        console.log(response);
        if (!response.image_uri) {
          setError("Token not found");
          return;
        }

        setTokenData(response);
        const data = getTokenTradeData(response);

        const { marketCap } = data || {};
        setMc(marketCap);
      } catch (e) {
        console.error(e);
        setError("Failed to find token");
      }
    };
    tokenFetcher();
  }, [ca]);

  return (
    <form
      className="flex text-[12px] text-gray-500 my-auto justify-center items-center flex-col gap-2 relative pb-5"
      onSubmit={(e) => e.preventDefault()}
    >
      <label htmlFor="contract-input">Enter Contract Address</label>
      <input
        type="text"
        id="contract-input"
        className="text-white placeholder:text-gray-700 focus:outline-green-300 focus:outline-1 focus:bg-[#23ff4011]  rounded-md border border-gray-800 p-1 w-70 pl-2"
        placeholder="Enter token contract address"
        value={ca}
        onChange={(e) => setCa(e.target.value)}
      />
      {error && (
        <span className="text-orange-500 text-center w-full">{error}</span>
      )}
    </form>
  );
};

export default FetchToken;
