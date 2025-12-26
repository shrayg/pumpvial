import { useEffect, useState } from "react";

const TestCreateIPFS = () => {
  const [imageString, setImageString] = useState("");

  const tokenMetadata = {
    image: imageString, // From the example below
    name: "Test",
    symbol: "PKit",
    description: "gafdfdioing",
    twitter: "https://@pumpk",
    telegram: "https://t.me_memecoin",
    website: "https://memecoin.com",
  };

  const handleFileUpload = (e) => {
    const reader = new FileReader();
    reader.onloadend = () => setImageString(reader.result);
    reader.readAsDataURL(e.target.files[0]);
  };

  const api =
    "EzA1XfYGR9kuBW1herClf7ftR6bgH7tD-8AcxXr9Jtye-CxJH9viGNS4-ydU8iWYE1rx-GqWxiCjQjGf-88ozHIVIYs0jsTLdk9ds3uVqtMhbK2Im";

  const uri =
    "https://ipfs.io/ipfs/QmSCKp7DWJHRURMXHHxW9vqGuC5iwp8NEeHAogmCMm85NX";

  useEffect(() => {
    if (!imageString) return;
    const createIPFS = async () => {
      try {
        // const request = await fetch("https://api.pumpagent.com/create-ipfs", {
        const request = await fetch("https://api.pumpagent.com/create-ipfs", {
          method: "POST",
          body: JSON.stringify(tokenMetadata),
          headers: { "Content-Type": "application/json", "x-api-key": api },
        });

        const response = await request.json();
        console.log("Metadata: ", response);
      } catch (error) {
        console.error("Error:", error);
      }
    };

    createIPFS();
  }, [imageString]);

  return (
    <div>
      <input type="file" onChange={handleFileUpload} />
    </div>
  );
};

export default TestCreateIPFS;
