import axios from "axios";

const getPumpBondingCurve = async (ca) => {
  try {
    const response = await axios.post(
      // "https://api.pumpagent.com/pump-bonding-curve",
      "http://localhost:3000/pump-bonding-curve",
      { ca },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key":
            "EzA1XfYGR9kuBW1herClf7ftR6bgH7tD-8AcxXr9Jtye-CxJH9viGNS4-ydU8iWYE1rx-GqWxiCjQjGf-88ozHIVIYs0jsTLdk9ds3uVqtMhbK2Im",
        },
      }
    );
    const { curveProgress } = response.data;

    console.log("Bonding Curve Progress: ", curveProgress);
  } catch (error) {
    console.error("Error:", error);
  }
};

getPumpBondingCurve("38N1ou5bko51Cq6KSuV9bR3b23vKu8vR7mQ114k8pump");
