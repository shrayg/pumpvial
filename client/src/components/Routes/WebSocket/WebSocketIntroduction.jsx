import BlogNav from "../../BlogNav/BlogNav.jsx";
import Pagination from "../../Pagination/Pagination.jsx";
import { Helmet } from "react-helmet";

const WebSocketIntroduction = () => {
  return (
    <article className="pt-0 text-[12px] text-white px-5 md:px-10 lg:px-10 flex-1 w-[97vw] xl:max-w-[950px] lg:mx-auto">
      <Helmet>
        <title>PumpAgent - WebSocket Introduction</title>
        <link
          rel="canonical"
          href="https://pumpagent.com/websocket/introduction"
        />
        <meta property="og:title" content="PumpAgent - WebSocket Introduction" />
        <meta
          property="og:url"
          content="https://pumpagent.com/websocket/introduction"
        />
      </Helmet>
      <Pagination />
      <h1 className="text-5xl lg:text-6xl dark:text-black pb-8">
        WebSocket Introduction
      </h1>
      <div className="text-[20px] font-light leading-7 mb-8 dark:text-black">
        Lightning fast pump.fun data through our secure{" "}
        <pre className="bg-tile-green dark:bg-[rgba(78,255,87,0.23)] inline p-1 px-2 dark:text-black text-base">
          wss://
        </pre>{" "}
        WebSocket connection.
      </div>
      <div className="text-[20px] font-light leading-7 mb-0 dark:text-black">
        Establish a long-lived connection and receive data as soon as it becomes
        available on-chain.
      </div>
      <p className="text-[20px] font-light leading-7 mb-8 dark:text-black">
        Monitor newly created tokens in your terminal with low latency — even
        before they appear on the official pump.fun frontend.
      </p>
      <p className="text-[20px] font-light leading-7 mb-8 dark:text-black">
        We also track trades for specific mints and users. Our personal
        favorite: KOL Trades — get comprehensive trade logs when a key opinion
        leader makes a market move.
      </p>

      <p className="text-[20px] font-light pt-4 mb-8 dark:text-black">
        Our WebSocket accepts connections from both frontend (browser-based) and
        backend (server-side) environments. This provides flexibility whether
        you're building real-time web apps or backend services.
      </p>

      <BlogNav />
    </article>
  );
};

export default WebSocketIntroduction;
