import axios from "axios";

/////////////////////////////// CONFIG //////////////////////////////////////
const API_KEY =
  "8AcxXr9Jtye-CxJH9viGNS4-ydU8iWYE1rx-GqWxiCjQjGf-88ozHIVIYs0jsTLdk9ds3uVqtMhbK2Im";
const ca = "2N1tLUPf7XSz7DHkUieaJE9g8DSFPtx6FBW7kAr9Nodb";
//////////////////////////////// END ////////////////////////////////////////

const getPumpTokenInfo = async () => {
  //   const URL = "https://api.pumpagent.com/token-info";
  const URL = "http://localhost:3000/token-info";

  try {
    const request = await axios.post(
      URL,
      { ca },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
      }
    );

    const { response } = request.data;
    console.log("Token info: ", response);
  } catch (error) {
    console.error("Error:", error);
  }
};

getPumpTokenInfo();
