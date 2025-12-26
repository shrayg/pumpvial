import { useEffect, useState } from "react";
import { IoClose } from "react-icons/io5";
import { kols } from "../../../../../../websocket/utils/kols";
import SOL from "../../../../assets/SOL.png";

const CreateStrategy = ({ setOverlay, strategies, apiKey, setStrategies }) => {
  const proof = JSON.parse(
    localStorage.getItem("sb-ewvqgcnetcqmnlkyjuww-auth-token")
  )?.access_token;
  const [kolSearch, setKolSearch] = useState("");
  const [load, setLoad] = useState(false);
  const [settings, setSettings] = useState({
    strategyName: "",
    creationTime: null, // Or {min: 0, max: 0}
    creatorAddress: null, // Or Creator address
    tokenName: null, // Or Token Name
    tokenSymbol: null, // Or Token Symbol
    kolRules: "All", // Or "Specific"
    kolRulesEntries: {
      // kolRules = All
      maxBuy: "3.5",
      maxMcEntry: "25",
      multipleKolsRequired: "1",
    },
    kolRulesCustomEntries: {
      // kolRules = Custom
      kolList: [], // Selected KOLs
      kolRules: [], // Rules for selected KOLs
    },
    entry: {
      solBuy: "",
      maxMcEntry: "",
    },
    exit: {
      exitMc: "",
    },
    stoploss: "",
  });

  // Check if tab is switched from edit to create, load settings
  useEffect(() => {
    const overwrite = localStorage.getItem("allowUpdate");
    if (!overwrite) return;
    const parsed = JSON.parse(overwrite);
    setSettings(parsed);
  }, []);

  const update = (k, v) => setSettings((prev) => ({ ...prev, [k]: v }));

  const addKolToList = (kol) => {
    setSettings((prev) => {
      const kolList = prev.kolRulesCustomEntries.kolList;
      const kolRules = prev.kolRulesCustomEntries.kolRules;

      const kolIndex = kolList.findIndex((k) => k.name === kol.name); // assuming `name` is unique
      let updatedList, updatedRules;

      if (kolIndex !== -1) {
        // KOL exists: remove from list and rules
        updatedList = kolList.filter((_, i) => i !== kolIndex);
        updatedRules = kolRules.filter((_, i) => i !== kolIndex);
      } else {
        // KOL doesn't exist: add to list and rules
        updatedList = [...kolList, kol];
        updatedRules = [
          ...kolRules,
          { maxBuy: "", maxMcEntry: "", name: kol.name },
        ];
      }

      return {
        ...prev,
        kolRulesCustomEntries: {
          ...prev.kolRulesCustomEntries,
          kolList: updatedList,
          kolRules: updatedRules,
        },
      };
    });
  };

  const saveStrategy = async () => {
    const trimmedName = settings.strategyName.trim();

    // Check if name is already taken
    const isDuplicate = strategies.some(
      (strategy) =>
        strategy.strategyName?.toLowerCase() === trimmedName.toLowerCase()
    );

    if (isDuplicate && !localStorage.getItem("allowUpdate")) {
      alert("Strategy name must be unique. This name is already in use.");
      return;
    }

    // Existing validation
    if (
      (settings.creatorAddress !== null &&
        settings.creatorAddress.length === 0) ||
      (settings.tokenName !== null && settings.tokenName.length === 0) ||
      (settings.tokenSymbol !== null && settings.tokenSymbol.length === 0) ||
      (settings.creationTime && !settings.creationTime.min.toString()) ||
      (settings.creationTime && !settings.creationTime.max) ||
      !settings.strategyName ||
      (settings.kolRules === "All" && !settings.kolRulesEntries.maxBuy) ||
      (settings.kolRules === "All" && !settings.kolRulesEntries.maxMcEntry) ||
      (settings.kolRules === "All" &&
        !settings.kolRulesEntries.multipleKolsRequired) ||
      !settings.entry.solBuy ||
      !settings.entry.maxMcEntry ||
      !settings.exit.exitMc ||
      !settings.stoploss
    ) {
      alert("Fill missing values before saving.");
      return;
    }

    setLoad(true);
    try {
      const request = await fetch(
        "https://api.pumpagent.com/update-koltrade-strategies",
        {
          method: "POST",
          body: JSON.stringify({
            proof,
            strategies,
            settings,
          }),
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
        }
      );
      const response = await request.json();
      if (!response.updated) {
        alert("Failed to update KOL strategies.");
        return;
      }

      setStrategies(response.updated);
      setOverlay("");
      localStorage.removeItem("allowUpdate");
    } catch (err) {
      console.error(err);
    } finally {
      setLoad(false);
    }
  };

  return (
    <div className="fixed top-17 w-full h-full bg-[#0000008c] backdrop-blur-md z-5000 flex flex-col justify-start items-center">
      <div className="flex p-1 pr-8 mt-2 w-full justify-end">
        <button
          className="text-gray-500 text-[20px] p-2 cursor-pointer hover:text-gray-300"
          onClick={() => {
            setOverlay("");
            localStorage.removeItem("allowUpdate");
          }}
        >
          <IoClose />
        </button>
      </div>
      <form
        className="flex flex-col justify-start items-center overflow-auto h-screen w-full max-h-[88.7vh] pb-10"
        onSubmit={(e) => e.preventDefault()}
      >
        <span className="text-gray-500 text-[14px] select-none">
          New Strategy
        </span>
        {/* Token Rules */}
        <div className=" w-full mt-4 flex flex-col gap-1 p-4">
          <div className="flex gap-4  mx-auto  min-w-lg">
            <div className="w-full bg-[#000000] relative border border-gray-700 rounded-lg text-gray-600 text-[12px] p-4 flex flex-col gap-4">
              <span className="absolute top-[-6px] left-4 px-1 bg-black rounded-md">
                TOKEN RULES
              </span>

              {/* Creation Time*/}
              <div className="h-full border border-gray-900 rounded-md flex flex-col justify-start items-center p-4">
                <span className="text-gray-400 pb-2">Creation time</span>
                <div className="flex text-[14px] w-full justify-center items-center">
                  <button
                    className={`w-20 ${
                      !settings.creationTime ? "bg-[#272727]" : ""
                    } py-2 text-white rounded-l-md cursor-pointer border-1 border-[#272727]`}
                    onClick={() => update("creationTime", null)}
                  >
                    Any
                  </button>
                  <button
                    className={`w-20 ${
                      settings.creationTime ? "bg-[#272727]" : ""
                    } py-2 text-white rounded-r-md cursor-pointer border-1 border-[#272727]`}
                    onClick={() => update("creationTime", { min: 0, max: 0 })}
                  >
                    Custom
                  </button>
                </div>
                {settings?.creationTime && (
                  <div className="flex flex-col">
                    {(() => {
                      const min = Number(settings?.creationTime?.min) ?? 0;
                      const max = Number(settings?.creationTime?.max) ?? 0;
                      const isInvalid = max < min && min && max;

                      const inputClass = (invalid) =>
                        `w-full pl-4 placeholder:text-gray-700 hover:outline-1 pl-2 outline-gray-400 focus:placeholder:text-gray-400 text-[12px] text-white rounded-full h-9 px-2 focus:outline-green-300 focus:outline-1 focus:bg-[#23ff4011] mt-0.5 ${
                          invalid
                            ? "border-red-500 outline-none"
                            : "border-gray-700"
                        } border`;

                      return (
                        <>
                          <div className="flex flex-col w-sm items-start pt-4 gap-1">
                            <span>Minimum</span>
                            <input
                              type="number"
                              placeholder="Enter minimum seconds after launch"
                              className={inputClass(isInvalid)}
                              value={settings?.creationTime?.min || ""}
                              onChange={(e) =>
                                update("creationTime", {
                                  ...settings.creationTime,
                                  min: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div className="flex flex-col w-sm items-start pt-4 gap-1">
                            <span>Maximum</span>
                            <input
                              type="number"
                              placeholder="Enter maximum seconds after launch"
                              className={inputClass(isInvalid)}
                              value={settings?.creationTime?.max || ""}
                              onChange={(e) =>
                                update("creationTime", {
                                  ...settings.creationTime,
                                  max: e.target.value,
                                })
                              }
                            />
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
              {/* Creator Address */}
              <div className="h-full border border-gray-900 rounded-md flex flex-col justify-start items-center p-4">
                <span className="text-gray-400 pb-2">Creator Address</span>
                <div className="flex text-[14px] w-full justify-center items-center">
                  <button
                    className={`w-20 ${
                      settings.creatorAddress === null ? "bg-[#272727]" : ""
                    } py-2 text-white rounded-l-md cursor-pointer border-1 border-[#272727]`}
                    onClick={() => update("creatorAddress", null)}
                  >
                    Any
                  </button>
                  <button
                    className={`w-20 ${
                      settings.creatorAddress !== null ? "bg-[#272727]" : ""
                    } py-2 text-white rounded-r-md cursor-pointer border-1 border-[#272727]`}
                    onClick={() => update("creatorAddress", "")}
                  >
                    Custom
                  </button>
                </div>
                {typeof settings?.creatorAddress === "string" && (
                  <div className="flex flex-col">
                    <div className="flex flex-col w-sm items-start pt-4 gap-1">
                      <span>Creator Wallet Address</span>
                      <input
                        type="text"
                        placeholder="Enter creator wallet address"
                        className={`w-full placeholder:text-gray-700 hover:outline-1 pl-4 outline-gray-400 focus:placeholder:text-gray-400 text-[12px] text-white rounded-full h-9 px-2 focus:outline-green-300 focus:outline-1 focus:bg-[#23ff4011] mt-0.5 border border-gray-700`}
                        value={settings?.creatorAddress || ""}
                        onChange={(e) =>
                          update("creatorAddress", e.target.value)
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Token Name */}
              <div className="h-full border border-gray-900 rounded-md flex flex-col justify-start items-center p-4">
                <span className="text-gray-400 pb-2">Token Name</span>
                <div className="flex text-[14px] w-full justify-center items-center">
                  <button
                    className={`w-20 ${
                      settings.tokenName === null ? "bg-[#272727]" : ""
                    } py-2 text-white rounded-l-md cursor-pointer border-1 border-[#272727]`}
                    onClick={() => update("tokenName", null)}
                  >
                    Any
                  </button>
                  <button
                    className={`w-20 ${
                      settings.tokenName !== null ? "bg-[#272727]" : ""
                    } py-2 text-white rounded-r-md cursor-pointer border-1 border-[#272727]`}
                    onClick={() => update("tokenName", "")}
                  >
                    Custom
                  </button>
                </div>
                {typeof settings?.tokenName === "string" && (
                  <div className="flex flex-col">
                    <div className="flex flex-col w-sm items-start pt-4 gap-1">
                      <span>Matching Token Name (case insensitive)</span>
                      <input
                        type="text"
                        placeholder="Enter token name"
                        className={`w-full placeholder:text-gray-700 hover:outline-1 pl-4 outline-gray-400 focus:placeholder:text-gray-400 text-[12px] text-white rounded-full h-9 px-2 focus:outline-green-300 focus:outline-1 focus:bg-[#23ff4011] mt-0.5 border border-gray-700`}
                        value={settings?.tokenName || ""}
                        onChange={(e) => update("tokenName", e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Token Symbol */}
              <div className="h-full border border-gray-900 rounded-md flex flex-col justify-start items-center p-4">
                <span className="text-gray-400 pb-2">Token Symbol</span>
                <div className="flex text-[14px] w-full justify-center items-center">
                  <button
                    className={`w-20 ${
                      settings.tokenSymbol === null ? "bg-[#272727]" : ""
                    } py-2 text-white rounded-l-md cursor-pointer border-1 border-[#272727]`}
                    onClick={() => update("tokenSymbol", null)}
                  >
                    Any
                  </button>
                  <button
                    className={`w-20 ${
                      settings.tokenSymbol !== null ? "bg-[#272727]" : ""
                    } py-2 text-white rounded-r-md cursor-pointer border-1 border-[#272727]`}
                    onClick={() => update("tokenSymbol", "")}
                  >
                    Custom
                  </button>
                </div>
                {typeof settings?.tokenSymbol === "string" && (
                  <div className="flex flex-col">
                    <div className="flex flex-col w-sm items-start pt-4 gap-1">
                      <span>Matching Token Symbol (case insensitive)</span>
                      <input
                        type="text"
                        placeholder="Enter token symbol"
                        className={`w-full placeholder:text-gray-700 hover:outline-1 pl-4 outline-gray-400 focus:placeholder:text-gray-400 text-[12px] text-white rounded-full h-9 px-2 focus:outline-green-300 focus:outline-1 focus:bg-[#23ff4011] mt-0.5 border border-gray-700`}
                        value={settings?.tokenSymbol || ""}
                        onChange={(e) => update("tokenSymbol", e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* KOL Rules */}
        <div className=" w-full flex flex-col gap-1 p-4 mt-0">
          <div className="flex gap-4  mx-auto  min-w-lg">
            <div className="w-full bg-[#000000] relative border border-gray-700 rounded-lg text-gray-600 text-[12px] p-4 flex flex-col gap-4">
              <span className="absolute top-[-6px] left-4 px-1 bg-black rounded-md">
                KOL RULES
              </span>

              {/* KOL */}
              <div className="h-full flex flex-col justify-start items-center p-4">
                <div className="flex text-[14px] w-full justify-center items-center">
                  <button
                    className={`w-20 ${
                      settings.kolRules === "All" ? "bg-[#272727]" : ""
                    } py-2 text-white rounded-l-md cursor-pointer border-1 border-[#272727]`}
                    onClick={() => update("kolRules", "All")}
                  >
                    All
                  </button>
                  <button
                    className={`w-20 ${
                      settings.kolRules === "Custom" ? "bg-[#272727]" : ""
                    } py-2 text-white rounded-r-md cursor-pointer border-1 border-[#272727]`}
                    onClick={() => update("kolRules", "Custom")}
                  >
                    Custom
                  </button>
                </div>
                {settings.kolRules === "All" && (
                  <div className="flex flex-col">
                    <div className="flex flex-col w-sm items-start pt-4 gap-1">
                      <span>Minimum Required Amount Of KOLs In Trade</span>

                      <input
                        type="text"
                        placeholder="Enter minimum required amount of KOLs in trade"
                        className={`w-full placeholder:text-gray-700 hover:outline-1 pl-4 outline-gray-400 focus:placeholder:text-gray-400 text-[12px] text-white rounded-full h-9 px-2 focus:outline-green-300 focus:outline-1 focus:bg-[#23ff4011] mt-0.5 border border-gray-700`}
                        value={
                          settings?.kolRulesEntries?.multipleKolsRequired || ""
                        }
                        onChange={(e) =>
                          update("kolRulesEntries", {
                            ...settings.kolRulesEntries,
                            multipleKolsRequired: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="flex flex-col w-sm items-start pt-4 gap-1">
                      <span>KOL Max Token Buy (M)</span>
                      <input
                        type="text"
                        placeholder="Enter max token buy (i.e. 3.5 which is 3.5m or 0.35%)"
                        className={`w-full placeholder:text-gray-700 hover:outline-1 pl-4 outline-gray-400 focus:placeholder:text-gray-400 text-[12px] text-white rounded-full h-9 px-2 focus:outline-green-300 focus:outline-1 focus:bg-[#23ff4011] mt-0.5 border border-gray-700`}
                        value={settings?.kolRulesEntries?.maxBuy || ""}
                        onChange={(e) =>
                          update("kolRulesEntries", {
                            ...settings.kolRulesEntries,
                            maxBuy: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="flex flex-col w-sm items-start pt-4 gap-1">
                      <span>KOL Max Marketcap Entry (K)</span>
                      <input
                        type="text"
                        placeholder="Enter maximum allowed marketcap for KOL buy(s)"
                        className={`w-full placeholder:text-gray-700 hover:outline-1 pl-4 outline-gray-400 focus:placeholder:text-gray-400 text-[12px] text-white rounded-full h-9 px-2 focus:outline-green-300 focus:outline-1 focus:bg-[#23ff4011] mt-0.5 border border-gray-700`}
                        value={settings?.kolRulesEntries?.maxMcEntry || ""}
                        onChange={(e) =>
                          update("kolRulesEntries", {
                            ...settings.kolRulesEntries,
                            maxMcEntry: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                )}
                {settings.kolRules === "Custom" && (
                  <div className="flex flex-col">
                    <div className="flex flex-col w-sm items-start pt-4 gap-1">
                      <span>Add KOL(s) To List</span>

                      <div className="overflow-auto w-full border border-gray-800 p-2 pt-0 relative">
                        <div className=" sticky top-0 bg-black pt-2 pb-1.5">
                          <input
                            type="text"
                            placeholder="Search KOLs"
                            className="bg-[#33333369] w-full p-2 mb-1 rounded-md placeholder:text-gray-700 focus:outline-green-300 focus:outline-1 focus:bg-[#23ff4011]"
                            value={kolSearch}
                            onChange={(e) => setKolSearch(e.target.value)}
                          />
                        </div>
                        <ul className="flex flex-col justify-start items-start h-50 gap-1">
                          {kols
                            .filter(
                              (kol) =>
                                kol.name
                                  .toLowerCase()
                                  .includes(kolSearch.toLowerCase()) ||
                                kol.twitter
                                  .toLowerCase()
                                  .includes(kolSearch.toLowerCase())
                            )
                            .map((kol, i) => (
                              <li
                                key={i}
                                className={`flex justify-start items-center gap-2 w-full cursor-pointer p-1
                                ${
                                  settings.kolRulesCustomEntries.kolList.includes(
                                    kol
                                  )
                                    ? "border border-green-500 bg-[#1f1f1f72]"
                                    : "border border-transparent hover:border-gray-800 hover:bg-[#1f1f1f72]"
                                }
                            `}
                                onClick={() => addKolToList(kol)}
                              >
                                <img
                                  src={`https://unavatar.io/x/${
                                    kol.twitter.split("/")[3]
                                  }`}
                                  className="w-[28px] h-[28px] rounded-md"
                                />
                                <span className="text-greener">{kol.name}</span>
                                <span className="text-gray-700">
                                  {kol.twitter}
                                </span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    </div>
                    <div className="flex flex-col mt-4 gap-4">
                      {settings.kolRulesCustomEntries.kolList.map(
                        (kol, index) => (
                          <div
                            key={kol.name}
                            className="border border-gray-800 p-2 flex flex-col gap-2 rounded-md"
                          >
                            <div className="flex justify-between">
                              <span>
                                Rules for{" "}
                                <span className="text-greener">
                                  {trade?.kol_twitter
                                    .split("/")
                                    .filter(Boolean)
                                    .pop()}
                                </span>
                              </span>
                              <button
                                className="p-0.5 cursor-pointer hover:text-white mr-1"
                                onClick={() => addKolToList(kol)}
                              >
                                x
                              </button>
                            </div>

                            {/* Max Token Buy */}
                            <div className="flex flex-col gap-1 mt-2">
                              <span>KOL Max Token Buy (M)</span>
                              <input
                                type="text"
                                placeholder="Enter max token buy (i.e. 3.5 which is 3.5m or 0.35%)"
                                className="w-full placeholder:text-gray-700 hover:outline-1 pl-2 outline-gray-400 focus:placeholder:text-gray-400 text-[12px] text-white rounded-full h-9 px-2 focus:outline-green-300 focus:outline-1 focus:bg-[#23ff4011] mt-0.5 border border-gray-700"
                                value={
                                  settings.kolRulesCustomEntries.kolRules[index]
                                    ?.maxBuy || ""
                                }
                                onChange={(e) => {
                                  const newRules = [
                                    ...settings.kolRulesCustomEntries.kolRules,
                                  ];
                                  newRules[index] = {
                                    ...newRules[index],
                                    maxBuy: e.target.value,
                                  };
                                  setSettings((prev) => ({
                                    ...prev,
                                    kolRulesCustomEntries: {
                                      ...prev.kolRulesCustomEntries,
                                      kolRules: newRules,
                                    },
                                  }));
                                }}
                              />
                            </div>

                            {/* Max Marketcap Entry */}
                            <div className="flex flex-col gap-1 mt-2">
                              <span>KOL Max Marketcap Entry (K)</span>
                              <input
                                type="text"
                                placeholder="Enter maximum allowed marketcap for KOL buy(s)"
                                className="w-full placeholder:text-gray-700 hover:outline-1 pl-2 outline-gray-400 focus:placeholder:text-gray-400 text-[12px] text-white rounded-full h-9 px-2 focus:outline-green-300 focus:outline-1 focus:bg-[#23ff4011] mt-0.5 border border-gray-700"
                                value={
                                  settings.kolRulesCustomEntries.kolRules[index]
                                    ?.maxMcEntry || ""
                                }
                                onChange={(e) => {
                                  const newRules = [
                                    ...settings.kolRulesCustomEntries.kolRules,
                                  ];
                                  newRules[index] = {
                                    ...newRules[index],
                                    maxMcEntry: e.target.value,
                                  };
                                  setSettings((prev) => ({
                                    ...prev,
                                    kolRulesCustomEntries: {
                                      ...prev.kolRulesCustomEntries,
                                      kolRules: newRules,
                                    },
                                  }));
                                }}
                              />
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Entry */}
        <div className="h-full w-full mt-0 flex flex-col gap-1 p-4">
          <div className="flex gap-4  mx-auto  min-w-lg">
            <div className="w-full bg-[#000000] relative border border-gray-700 rounded-lg text-gray-600 text-[12px] p-4 flex flex-col gap-4">
              <span className="absolute top-[-6px] left-4 px-1 bg-black rounded-md">
                ENTRY
              </span>

              <div className="h-full flex flex-col justify-start items-center p-4">
                <div className="flex flex-col w-sm items-start gap-1">
                  <span>SOL Buy Amount</span>
                  <div className="relative w-full">
                    <img
                      src={SOL}
                      alt="Solana"
                      className="w-5 h-5 absolute top-2.5 left-2"
                    />
                    <input
                      type="text"
                      placeholder="Enter SOL Buy Amount"
                      className={`w-full placeholder:text-gray-700 hover:outline-1 pl-8 outline-gray-400 focus:placeholder:text-gray-400 text-[12px] text-white rounded-full h-9 px-2 focus:outline-green-300 focus:outline-1 focus:bg-[#23ff4011] mt-0.5 border border-gray-700`}
                      value={settings?.entry.solBuy || ""}
                      onChange={(e) =>
                        update("entry", {
                          ...settings.entry,
                          solBuy: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="flex flex-col w-sm items-start pt-4 gap-1">
                  <span>Max Marketcap Entry (K)</span>
                  <div className="relative w-full">
                    <img
                      src={SOL}
                      alt="Solana"
                      className="w-5 h-5 absolute top-2.5 left-2"
                    />
                    <input
                      type="text"
                      placeholder="Enter maximum allowed marketcap for entry"
                      className={`w-full placeholder:text-gray-700 hover:outline-1 pl-8 outline-gray-400 focus:placeholder:text-gray-400 text-[12px] text-white rounded-full h-9 px-2 focus:outline-green-300 focus:outline-1 focus:bg-[#23ff4011] mt-0.5 border border-gray-700`}
                      value={settings?.entry?.maxMcEntry || ""}
                      onChange={(e) =>
                        update("entry", {
                          ...settings.entry,
                          maxMcEntry: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Exit */}
        <div className="h-full w-full mt-0 flex flex-col gap-1 p-4">
          <div className="flex gap-4  mx-auto  min-w-lg">
            <div className="w-full bg-[#000000] relative border border-gray-700 rounded-lg text-gray-600 text-[12px] p-4 flex flex-col gap-4">
              <span className="absolute top-[-6px] left-4 px-1 bg-black rounded-md">
                EXIT
              </span>

              <div className="h-full flex flex-col justify-start items-center p-4">
                <div className="flex flex-col w-sm items-start gap-1">
                  <span>Exit Marketcap (K)</span>
                  <div className="relative w-full">
                    <img
                      src={SOL}
                      alt="Solana"
                      className="w-5 h-5 absolute top-2.5 left-2"
                    />
                    <input
                      type="text"
                      placeholder="Enter exit marketcap"
                      className={`w-full placeholder:text-gray-700 hover:outline-1 pl-8 outline-gray-400 focus:placeholder:text-gray-400 text-[12px] text-white rounded-full h-9 px-2 focus:outline-green-300 focus:outline-1 focus:bg-[#23ff4011] mt-0.5 border border-gray-700`}
                      value={settings?.exit.exitMc || ""}
                      onChange={(e) =>
                        update("exit", {
                          ...settings.exit,
                          exitMc: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stoploss */}
        <div className="h-full w-full mt-0 flex flex-col gap-1 p-4">
          <div className="flex gap-4  mx-auto  min-w-lg">
            <div className="w-full bg-[#000000] relative border border-gray-700 rounded-lg text-gray-600 text-[12px] p-4 flex flex-col gap-4">
              <span className="absolute top-[-6px] left-4 px-1 bg-black rounded-md">
                STOPLOSS
              </span>

              <div className="h-full flex flex-col justify-start items-center p-4">
                <div className="flex flex-col w-sm items-start gap-1">
                  <span>Position Stoploss Marketcap (K)</span>
                  <div className="relative w-full">
                    <img
                      src={SOL}
                      alt="Solana"
                      className="w-5 h-5 absolute top-2.5 left-2"
                    />
                    <input
                      type="text"
                      placeholder="Enter stoploss marketcap"
                      className={`w-full placeholder:text-gray-700 hover:outline-1 pl-8 outline-gray-400 focus:placeholder:text-gray-400 text-[12px] text-white rounded-full h-9 px-2 focus:outline-green-300 focus:outline-1 focus:bg-[#23ff4011] mt-0.5 border border-gray-700`}
                      value={settings?.stoploss || ""}
                      onChange={(e) => update("stoploss", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Name & Save */}
        <div className="h-full w-full mt-0 flex flex-col gap-1 p-4">
          <div className="flex gap-4  mx-auto  min-w-lg">
            <div className="w-full bg-[#000000] relative border border-gray-700 rounded-lg text-gray-600 text-[12px] p-4 flex flex-col gap-4">
              <span className="absolute top-[-6px] left-4 px-1 bg-black rounded-md">
                STRATEGY NAME
              </span>

              <div className="h-full flex flex-col justify-start items-center p-4">
                <div className="flex flex-col w-sm items-start gap-1">
                  <span>Enter A Name For Your Strategy</span>
                  <div className="relative w-full">
                    <img
                      src={SOL}
                      alt="Solana"
                      className="w-5 h-5 absolute top-2.5 left-2"
                    />
                    <input
                      type="text"
                      placeholder="Enter strategy name"
                      className={`w-full placeholder:text-gray-700 hover:outline-1 pl-8 outline-gray-400 focus:placeholder:text-gray-400 text-[12px] text-white rounded-full h-9 px-2 focus:outline-green-300 focus:outline-1 focus:bg-[#23ff4011] mt-0.5 border border-gray-700`}
                      value={settings?.strategyName || ""}
                      onChange={(e) => update("strategyName", e.target.value)}
                    />
                  </div>
                  <button
                    className="px-6 py-3 bg-green-600 text-white hover:bg-green-500 rounded-md cursor-pointer mx-auto w-full mt-4"
                    onClick={saveStrategy}
                    disabled={load ? true : false}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateStrategy;
