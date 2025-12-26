import { Routes, Route, useLocation } from "react-router-dom";
import { Suspense, lazy, useState } from "react";
import ScrollToTop from "./utils/ScrollToTop";
import TopNav from "./components/TopNav/TopNav";
import SideBar from "./components/SideBar/SideBar";
import Footer from "./components/Footer/Footer";
import CookieBanner from "./components/CookieBanner/CookieBanner";
import { Helmet } from "react-helmet";

// Lazy-loaded components
const Home = lazy(() => import("./components/Routes/Home/Home"));
const VanityGrinder = lazy(() =>
  import("./components/Routes/Tools/VanityGrinder")
);
const SignIn = lazy(() => import("./components/SignIn/SignIn"));
const Dashboard = lazy(() => import("./components/Dashboard/Dashboard"));
const Introduction = lazy(() =>
  import("./components/Routes/HTTPS/Introduction")
);
const GenerateWallets = lazy(() =>
  import("./components/Routes/HTTPS/GenerateWallets")
);
const FundWallets = lazy(() => import("./components/Routes/HTTPS/FundWallets"));
const ClaimProfits = lazy(() =>
  import("./components/Routes/HTTPS/ClaimProfits")
);
const CreateIPFS = lazy(() => import("./components/Routes/HTTPS/CreateIPFS"));
const CreateLookupTable = lazy(() =>
  import("./components/Routes/HTTPS/CreateLookupTable")
);
const PumpChart = lazy(() => import("./components/Routes/HTTPS/PumpChart"));
const PumpTokenInfo = lazy(() =>
  import("./components/Routes/HTTPS/PumpTokenInfo")
);

const PumpTokenInfoApp = lazy(() =>
  import("./components/Routes/tools/PumpTokenInfo")
);
const PumpBondingCurve = lazy(() =>
  import("./components/Routes/HTTPS/PumpBondingCurve")
);
const PumpTokenBump = lazy(() =>
  import("./components/Routes/HTTPS/PumpTokenBump")
);
const PumpSingleBuy = lazy(() =>
  import("./components/Routes/HTTPS/PumpSingleBuy")
);
const PumpSingleSell = lazy(() =>
  import("./components/Routes/HTTPS/PumpSingleSell")
);
const PumpMultiBuy = lazy(() =>
  import("./components/Routes/HTTPS/PumpMultiBuy")
);
const PumpMultiSell = lazy(() =>
  import("./components/Routes/HTTPS/PumpMultiSell")
);
const PumpDumpAll = lazy(() => import("./components/Routes/HTTPS/PumpDumpAll"));
const PumpLaunchToken = lazy(() =>
  import("./components/Routes/HTTPS/PumpLaunchToken")
);
const PumpLaunchBundle = lazy(() =>
  import("./components/Routes/HTTPS/PumpLaunchBundle")
);
const DexSingleBuy = lazy(() =>
  import("./components/Routes/HTTPS/DexSingleBuy")
);
const DexSingleSell = lazy(() =>
  import("./components/Routes/HTTPS/DexSingleSell")
);
const DexPaid = lazy(() => import("./components/Routes/HTTPS/DexPaid"));
const WebSocketIntroduction = lazy(() =>
  import("./components/Routes/WebSocket/WebSocketIntroduction")
);
const TokenMigration = lazy(() =>
  import("./components/Routes/WebSocket/TokenMigration")
);
const TokenCreation = lazy(() =>
  import("./components/Routes/WebSocket/TokenCreation")
);
const TokenTrades = lazy(() =>
  import("./components/Routes/WebSocket/TokenTrades")
);
const UserTrades = lazy(() =>
  import("./components/Routes/WebSocket/UserTrades")
);
const KOLTrades = lazy(() => import("./components/Routes/WebSocket/KOLTrades"));
const PoolCreation = lazy(() =>
  import("./components/Routes/WebSocket/PoolCreation")
);
const PoolTrades = lazy(() =>
  import("./components/Routes/WebSocket/PoolTrades")
);
const PoolKOLTrades = lazy(() =>
  import("./components/Routes/WebSocket/PoolKOLTrades")
);
const LamportConverter = lazy(() =>
  import("./components/Routes/Tools/LamportConverter")
);
const WalletGenerator = lazy(() =>
  import("./components/Routes/Tools/WalletGenerator")
);
const Fees = lazy(() => import("./components/Routes/Fees/Fees"));
const Privacy = lazy(() => import("./components/Routes/Privacy/Privacy"));

// Lazy-loaded apps
const KOLTrader = lazy(() =>
  import("./components/Routes/Apps/KOLTrader/KOLTrader")
);
const DexV2 = lazy(() => import("./components/Routes/Apps/DexV2/DexV2"));
const Bundler = lazy(() => import("./components/Routes/Apps/Bundler/Bundler"));
const Bump = lazy(() => import("./components/Routes/Apps/Bump/Bump"));

const App = () => {
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState(
    localStorage.getItem("activeMenu") || "Developer"
  );

  const path = location.pathname;
  const dashboard = path === "/dashboard";
  const kolTrader =
    path === "/dex" ||
    path === "/bundler" ||
    path === "/dexv2" ||
    path === "/bump";
  const showForDashboard = dashboard && window.innerWidth < 1200 && navOpen;
  const isLogin = path === "/signin";
  const homepage = !dashboard && !kolTrader;

  return (
    <div className="bg-black dark:bg-white text-6xl font-bold font-regular min-h-screen flex flex-col">
      <Helmet>
        <title>PumpAgent - Pump.fun API Toolkit | Build Faster</title>
        <link rel="canonical" href="https://pumpagent.com" />
        <meta
          name="description"
          content="Build Solana pump.fun applications with PumpAgent's API toolkit. Generate wallets, create tokens, bump visibility, and access real-time data feeds. Free developer tools."
        />
        <meta
          name="keywords"
          content="solana api, pump.fun api, solana toolkit, crypto api, blockchain development, solana wallet generator, token bump bot"
        />
        <meta property="og:title" content="PumpAgent - Pump.fun API Toolkit" />
        <meta property="og:image" content="https://pumpagent.com/Social.png" />
        <meta property="og:site_name" content="PumpAgent" />
        <meta
          property="og:description"
          content="Build Solana pump.fun applications with PumpAgent's comprehensive API toolkit. Generate wallets, create tokens, and access real-time data."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://pumpagent.com" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="PumpAgent - Pump.fun API Toolkit" />
        <meta
          name="twitter:description"
          content="Build powerful Solana pump.fun applications with our free API toolkit. Generate wallets, bump tokens, real-time data feeds."
        />
        <meta name="twitter:site" content="@PumpAgent" />
        <meta name="twitter:creator" content="@PumpAgent" />
        <meta name="twitter:image" content="https://pumpagent.com/Social.png" />
      </Helmet>

      <CookieBanner />
      <TopNav navOpen={navOpen} setNavOpen={setNavOpen} />
      <ScrollToTop />

      <div className="flex flex-col flex-1 w-full">
        <div className="flex flex-1 pt-[70px]">
          {(navOpen || homepage || showForDashboard) && !isLogin && (
            <SideBar
              navOpen={navOpen}
              setNavOpen={setNavOpen}
              activeMenu={activeMenu}
              setActiveMenu={setActiveMenu}
            />
          )}

          <main className="flex-1 flex flex-col pt-0 border-l border-gray-900 dark:border-gray-200">
            <Suspense fallback={<div className="text-white p-4"></div>}>
              <Routes>
                <Route path="/" element={<Home activeMenu={activeMenu} />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/signin" element={<SignIn />} />

                {/* Apps */}
                <Route path="/dex" element={<KOLTrader />} />
                <Route path="/dexv2" element={<DexV2 />} />
                <Route path="/bundler" element={<Bundler />} />
                <Route path="/bump" element={<Bump />} />

                {/* HTTPS Routes */}
                <Route path="/https/introduction" element={<Introduction />} />
                <Route
                  path="/https/generate-wallets"
                  element={<GenerateWallets />}
                />
                <Route path="/https/fund-wallets" element={<FundWallets />} />
                <Route path="/https/claim-profits" element={<ClaimProfits />} />
                <Route path="/https/create-ipfs" element={<CreateIPFS />} />
                <Route
                  path="/https/create-lookup-table"
                  element={<CreateLookupTable />}
                />
                <Route path="/https/pump-chart" element={<PumpChart />} />
                <Route
                  path="/https/pump-token-info"
                  element={<PumpTokenInfo />}
                />
                <Route
                  path="/https/pump-bonding-curve"
                  element={<PumpBondingCurve />}
                />
                <Route
                  path="/https/pump-token-bump"
                  element={<PumpTokenBump />}
                />
                <Route
                  path="/https/pump-single-buy"
                  element={<PumpSingleBuy />}
                />
                <Route
                  path="/https/pump-single-sell"
                  element={<PumpSingleSell />}
                />
                <Route
                  path="/https/pump-multi-buy"
                  element={<PumpMultiBuy />}
                />
                <Route
                  path="/https/pump-multi-sell"
                  element={<PumpMultiSell />}
                />
                <Route path="/https/pump-dump-all" element={<PumpDumpAll />} />
                <Route
                  path="/https/pump-launch-token"
                  element={<PumpLaunchToken />}
                />
                <Route
                  path="/https/pump-launch-bundle"
                  element={<PumpLaunchBundle />}
                />
                <Route
                  path="/https/dex-single-buy"
                  element={<DexSingleBuy />}
                />
                <Route
                  path="/https/dex-single-sell"
                  element={<DexSingleSell />}
                />
                <Route path="/https/dex-paid" element={<DexPaid />} />

                {/* WebSocket Routes */}
                <Route
                  path="/websocket/introduction"
                  element={<WebSocketIntroduction />}
                />
                <Route
                  path="/websocket/token-migration"
                  element={<TokenMigration />}
                />
                <Route
                  path="/websocket/token-creation"
                  element={<TokenCreation />}
                />
                <Route
                  path="/websocket/token-trades"
                  element={<TokenTrades />}
                />
                <Route path="/websocket/user-trades" element={<UserTrades />} />
                <Route path="/websocket/kol-trades" element={<KOLTrades />} />
                <Route
                  path="/websocket/pool-creation"
                  element={<PoolCreation />}
                />
                <Route path="/websocket/pool-trades" element={<PoolTrades />} />
                <Route
                  path="/websocket/pool-kol-trades"
                  element={<PoolKOLTrades />}
                />

                {/* Tools */}
                <Route
                  path="/tools/lamport-converter"
                  element={<LamportConverter />}
                />
                <Route
                  path="/tools/wallet-generator"
                  element={<WalletGenerator />}
                />
                <Route
                  path="/tools/pump-token-info"
                  element={<PumpTokenInfoApp />}
                />
                <Route
                  path="/tools/vanity-grinder"
                  element={<VanityGrinder />}
                />

                {/* Misc */}
                <Route path="/fees" element={<Fees />} />
                <Route path="/privacy" element={<Privacy />} />
              </Routes>
            </Suspense>
          </main>
        </div>
        {!kolTrader && <Footer />}
      </div>
    </div>
  );
};

export default App;
