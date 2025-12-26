const TextDEXPaid = () => {
  useEffect(() => {
    return;

    const checkDexPaid = async () => {
      const URL = "https://api.pumpagent.com/dex-paid";
      const payload = {
        ca: "7iagMTDPfNSR5zVcERT1To7A9eaQoz58dJAh42EMHcCC",
      };

      try {
        const request = await fetch(URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const { dexPaid } = await request.json();
        console.log(`DEX Paid: ${dexPaid}`);
      } catch (error) {
        console.error("Error:", error);
      }
    };

    checkDexPaid();

    checkDexPaid();
  }, []);

  return <div></div>;
};

export default TextDEXPaid;
