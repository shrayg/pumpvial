import axios from "axios";

const getKingOfTheHill = async () => {
  try {
    const request = await axios.get("https://api.pumpagent.com/pump-koth", {
      headers: {
        "Content-Type": "application/json",
        "x-api-key":
          "EzA1XfYGR9kuBW1herClf7ftR6bgH7tD-8AcxXr9Jtye-CxJH9viGNS4-ydU8iWYE1rx-GqWxiCjQjGf-88ozHIVIYs0jsTLdk9ds3uVqtMhbK2Im",
      },
    });
    const { koth } = request.data;

    console.log("Current King Of The Hill: ", koth);
  } catch (error) {
    console.error("Error:", error);
  }
};

getKingOfTheHill();
