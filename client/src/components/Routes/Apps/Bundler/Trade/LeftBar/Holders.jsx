import { useEffect, useState } from "react";
import { FaExternalLinkAlt } from "react-icons/fa";
const Holders = ({
  trackedHolders,
  ca,
  userData,
  holders,
  setHolders,
  form,
}) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!trackedHolders?.lastTrade) return;

    const trade = trackedHolders.lastTrade;
    setHolders((prevHolders) => {
      let updatedHolders = [...prevHolders];
      const index = updatedHolders.findIndex(
        (holder) => holder.owner === trade.recipient
      );

      const tokens = Number(trade.tokens_received);
      const sol = Number(trade.tokens_sold);

      if (index !== -1) {
        const updatedHolder = { ...updatedHolders[index] };
        if (trade.type === "Buy") {
          updatedHolder.balance = Number(updatedHolder.balance) + tokens;
        } else {
          updatedHolder.balance = Number(updatedHolder.balance) - sol;
          if (updatedHolder.balance < 0) updatedHolder.balance = 0;
        }
        delete updatedHolder.new;
        updatedHolders[index] = updatedHolder;
      } else if (trade.type === "Buy") {
        updatedHolders.push({
          owner: trade.recipient,
          balance: tokens,
          new: true,
        });
      }

      return updatedHolders;
    });
  }, [trackedHolders.lastTrade]);

  useEffect(() => {
    if (!form.mintPub) return;

    const fetchHolders = async () => {
      try {
        const response = await fetch("https://api.pumpagent.com/mint-holders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": userData?.api_key,
          },
          body: JSON.stringify({ mint: form.mintPub }),
        });

        const data = await response.json();
        if (data.accounts) {
          setHolders(data.accounts);
        } else {
          console.error("No accounts found in response");
          setHolders([]);
        }
      } catch (error) {
        console.error("Failed to fetch holders:", error);
        setHolders([]);
      } finally {
        setLoading(false);
      }
    };

    if (form.creationTime) {
      setTimeout(() => fetchHolders(), 12500);
      return;
    }
    if (form.fullstacked) {
      setTimeout(() => fetchHolders(), 7500);
      return;
    }

    fetchHolders();
  }, [form.mintPub, form.fullstacked, form.creationTime]);

  // Calculate total balance including curve
  const total = holders.reduce((sum, h) => sum + Number(h.balance), 0);
  const totalHolders = holders.length;
  const positiveHolderCount = holders.filter(
    (h) => Number(h.balance) > 0
  ).length;

  const getColorClass = (index) => {
    if (index === 1) return "text-yellow-400";
    if (index === 2) return "text-[#888]";
    if (index === 3) return "text-amber-700";
    return "text-gray-300";
  };

  const getPercentageColor = (percentage) => {
    if (percentage < 3) return "text-white";
    if (percentage < 5) return "text-orange-400";
    return "text-red-500";
  };

  // Filter out curve wallet only for rendering
  const visibleHolders = holders
    .sort((a, b) => Number(b.balance) - Number(a.balance))
    .slice(0, 20);

  return (
    <div className="h-1/2 border-b border-gray-900 p-1 flex">
      {loading ? (
        <div className="flex-1 w-full flex justify-center items-center">
          <span className="text-[12px] text-gray-700">No holders</span>
        </div>
      ) : holders.length ? (
        <ul className="flex flex-col justify-start h-full w-full gap-0.5">
          <div className="flex p-2 justify-between items-center">
            <span className="text-[12px] text-gray-600">
              Buyers {totalHolders}
            </span>
            <span className="text-[12px] text-gray-600">
              Holders {positiveHolderCount}
            </span>
          </div>

          {visibleHolders.map((holder, index) => {
            const percentage = (Number(holder.balance) / total) * 100;
            const percentageText = percentage.toFixed(2);
            const indexColorClass = getColorClass(index);
            const percentColorClass = getPercentageColor(percentage);

            return (
              <li
                key={index}
                className="flex justify-between pl-1 px-4 text-[12px] hover:bg-[#111] py-[2px]"
              >
                <span className="flex items-center gap-2">
                  <span className={`text-[10px] ${indexColorClass}`}>
                    {index + 1})
                  </span>
                  <span
                    className={`truncate mr-2 cursor-pointer hover:underline flex items-center gap-1 group ${indexColorClass}`}
                    onClick={() =>
                      window.open(
                        `https://solscan.io/account/${holder.owner}`,
                        "_blank"
                      )
                    }
                  >
                    {holder.owner === form.curveAddress
                      ? "Bonding Curve"
                      : holder.owner.slice(0, 20)}

                    <FaExternalLinkAlt className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 hover:text-white" />
                  </span>
                </span>
                <span
                  className={`font-mono w-7 ${
                    holder.owner !== form.curveAddress
                      ? percentColorClass
                      : "text-white"
                  }`}
                >
                  {percentageText}%
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex-1 w-full flex justify-center items-center select-none">
          <span className="text-[12px] text-gray-700">No holders</span>
        </div>
      )}
    </div>
  );
};

export default Holders;
