import { useState, useEffect } from "react";
import Gradient from "../../../assets/Gradientbg.webp";
import { FaArrowUpLong } from "react-icons/fa6";
import NumberCounter from "../../../utils/NumberCounter";
import AnimatedNumber from "../../../utils/AnimatedNumber";

const Speed = () => {
  const [landingData, setLandingData] = useState(null);

  useEffect(() => {
    const now = Math.floor(Date.now() / 1000); // current time in seconds
    const landingCache = parseInt(localStorage.getItem("landingcache"), 10);
    const cachedData = localStorage.getItem("cacheddata");

    // If cached data exists and is less than 2 hours old
    if (landingCache && landingCache + 2 * 3600 > now && cachedData) {
      try {
        const parsedData = JSON.parse(cachedData);
        setLandingData(parsedData);
        return; // Exit early since we're using cached data
      } catch (e) {
        console.error("Error parsing cached data", e);
        // Fall through to fetch new data
      }
    }

    // Otherwise, fetch fresh data
    const fetchLandingInfo = async () => {
      try {
        const res = await fetch("https://api.pumpagent.com/landing-info");
        if (!res.ok) throw new Error("Network response was not ok");
        const data = await res.json();
        setLandingData(data);
        localStorage.setItem("landingcache", now.toString());
        localStorage.setItem("cacheddata", JSON.stringify(data));
      } catch (error) {
        console.error("Error fetching /landing:", error);
      }
    };

    fetchLandingInfo();
  }, []);

  return (
    <div className="text-white dark:text-black px-0 md:px-5 xl:px-22 flex flex-col justify-start items-center pt-5 md:pt-30 relative overflow-hidden pb-15 md:pb-25 opacityfade">
      <h1 className="z-20 pt-4 md:pt-10 font-pixel text-center px-5 text-[50px]">
        START <span className="text-greener"> SHIPPING</span>
      </h1>

      <p className="text-center text-[20px] dark:text-black max-w-200 px-5 z-10 pt-5">
        Our mission is to create a beginner friendly community & toolkit that
        fast tracks your Solana development. Whether it's a scalp bot or launch
        bundler, ship your dream applications sooner.
      </p>

      <div className="flex flex-col justify-center items-center w-full pt-20 max-w-[300px] md:max-w-[600px]">
        <div className="flex justify-start w-full">
          <div className="bg-tile dark:bg-[#ddd] border border-gray-800 w-60 h-40 rounded-md z-1000  flex gap-2 flex-col justify-center items-center p-2">
            <span className="text-[20px] flex justify-center items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 glow mr-2"></div>
              <AnimatedNumber>
                <NumberCounter n={landingData?.builders} fixed={0} />
              </AnimatedNumber>
            </span>
            <span className="text-[16px] text-gray-600"> Active Users</span>
          </div>
        </div>

        <div className="flex justify-center w-full">
          <div className="h-15 w-30 md:w-80 rounded-bl-xl border-l-2 border-b-2 border-gray-800 relative">
            <div className="flex border-t-2 border-r-2 border-gray-800 rounded-tr-xl w-20 h-8 absolute bottom-[-2rem] right-[-1rem]">
              <FaArrowUpLong className="text-gray-800 text-[18.5px] rotate-180 mt-[-2px] absolute right-[-0.64rem] bottom-[-1rem]" />
            </div>
          </div>
        </div>

        <div className="flex justify-end w-full pr-8">
          <div className="bg-tile dark:bg-[#ddd] border border-gray-800 w-60 h-40 rounded-md z-1000 flex gap-2 flex-col justify-center items-center p-2 mt-11.5">
            <span className="text-[20px] flex justify-center items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 glow mr-2"></div>
              <AnimatedNumber>
                <NumberCounter n={landingData?.httpsRoutes} fixed={0} />
              </AnimatedNumber>
            </span>
            <span className="text-[16px] text-gray-600"> HTTPS Endpoints</span>
          </div>
        </div>

        <div className="flex justify-center w-full">
          <div className="h-15 w-30 md:w-70 rounded-bl-xl border-l-2 border-b-2 border-gray-800 relative scale-x-[-1]">
            <div className="flex border-t-2 border-r-2 border-gray-800 rounded-tr-xl w-20 h-8 absolute bottom-[-2rem] right-[-1rem]">
              <FaArrowUpLong className="text-gray-800 text-[18.5px] rotate-180 mt-[-2px] absolute right-[-0.64rem] bottom-[-1rem]" />
            </div>
          </div>
        </div>

        <div className="flex justify-start w-full pl-6">
          <div className="bg-tile dark:bg-[#ddd] border border-gray-800 min-w-60 h-40 rounded-md z-1000 flex gap-2 flex-col justify-center items-center p-2 mt-11.5">
            <span className="text-[20px] flex justify-center items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 glow mr-2"></div>
              <AnimatedNumber>
                <NumberCounter n={99.9} fixed={1} />
              </AnimatedNumber>
              %
            </span>
            <span className="text-[16px] text-gray-600">Up-Time</span>
          </div>
        </div>

        <div className="flex justify-center w-full">
          <div className="h-15 w-20 md:w-50 rounded-bl-xl border-l-2 border-b-2 border-gray-800 relative">
            <div className="flex border-t-2 border-r-2 border-gray-800 rounded-tr-xl w-20 h-8 absolute bottom-[-2rem] right-[-1rem]">
              <FaArrowUpLong className="text-gray-800 text-[18.5px] rotate-180 mt-[-2px] absolute right-[-0.64rem] bottom-[-1rem]" />
            </div>
          </div>
        </div>

        <div className="flex justify-end w-full pr-12">
          <div className="bg-tile dark:bg-[#ddd] border border-gray-800 min-w-60 h-40 rounded-md z-1000 flex gap-2 flex-col justify-center items-center p-2 mt-11.5">
            <span className="text-[20px] flex justify-center items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 glow"></div>
              $
              <AnimatedNumber>
                <NumberCounter n={10} fixed={0} />
              </AnimatedNumber>
              <span className="px-1 mr-[-6px]">to</span>$
              <AnimatedNumber>
                <NumberCounter n={20} fixed={0} />
              </AnimatedNumber>
            </span>
            <span className="text-[16px] text-gray-600">Referral Earnings</span>
          </div>
        </div>

        <div className="flex justify-center w-full">
          <div className="h-15 w-30 md:w-60 rounded-bl-xl border-l-2 border-b-2 border-gray-800 relative scale-x-[-1]">
            <div className="flex border-t-2 border-r-2 border-gray-800 rounded-tr-xl w-20 h-8 absolute bottom-[-2rem] right-[-1rem]">
              <FaArrowUpLong className="text-gray-800 text-[18.5px] rotate-180 mt-[-2px] absolute right-[-0.64rem] bottom-[-1rem]" />
            </div>
          </div>
        </div>

        <div className="flex justify-start w-full pl-5 md:pl-20">
          <div className="bg-tile dark:bg-[#ddd] border border-gray-800 min-w-60 h-40 rounded-md z-1000 mr-110 flex gap-2 flex-col justify-center items-center p-2 mt-11.5">
            <span className="text-[20px] flex justify-center items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 glow mr-2"></div>
              <AnimatedNumber>
                <NumberCounter n={0.5} fixed={1} />
              </AnimatedNumber>
              %
            </span>
            <span className="text-[16px] text-gray-600">Low Trade Fees</span>
          </div>
        </div>

        <div className="flex justify-center w-full">
          <div className="h-15 w-30 md:w-50 rounded-bl-xl border-l-2 border-b-2 border-gray-800 relative">
            <div className="flex border-t-2 border-r-2 border-gray-800 rounded-tr-xl w-20 h-8 absolute bottom-[-2rem] right-[-1rem]">
              <FaArrowUpLong className="text-gray-800 text-[18.5px] rotate-180 mt-[-2px] absolute right-[-0.64rem] bottom-[-1rem]" />
            </div>
          </div>
        </div>

        <div className="flex justify-end w-full pr-0 md:pr-10">
          <div className="bg-tile dark:bg-[#ddd] border border-gray-800 min-w-60 h-40 rounded-md z-1000 flex gap-2 flex-col justify-center items-center p-2 mt-11.5">
            <span className="text-[20px] flex justify-center items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 glow mr-2"></div>
              <AnimatedNumber>
                <NumberCounter n={landingData?.totalTraffic} fixed={0} />
              </AnimatedNumber>
            </span>
            <span className="text-[16px] text-gray-600">Requests Served</span>
          </div>
        </div>
      </div>

      <img
        src={Gradient}
        alt="Gradient"
        className="absolute inset-0 w-full h-full z-0 opacity-15 dark:opacity-0 object-cover"
        loading="eager"
        fetchPriority="high"
      />
    </div>
  );
};

export default Speed;
