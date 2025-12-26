import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../utils/AuthProvider";
import { useNavigate } from "react-router-dom";
import SideBar from "./SideBar";
import APIKey from "./APIKey/APIKey";
import supabase from "../../utils/supabase";
import FeeEarnings from "./FeeEarnings/FeeEarnings";
import Landing from "./Landing/Landing";
import Footer from "../Footer/Footer";
import Tiers from "./Tiers/Tiers";
import Referrals from "./Referrals/Referrals";
import { Helmet } from "react-helmet";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, authenticated, loading } = useContext(AuthContext);
  const [menu, setMenu] = useState("Dashboard");
  const [userData, setUserData] = useState(null);
  const [fundWalletBalance, setFundWalletBalance] = useState({
    SOL: 0,
    USDC: 0,
  });

  useEffect(() => {
    if (loading) return; // ← Wait until auth state is loaded
    if (!authenticated) navigate("/");
  }, [authenticated, loading]);

  useEffect(() => {
    if (userData || !user) return;
    // Function to fetch user data based on username
    const fetchUserData = async () => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("username", user);

        if (error) throw new Error(error);
        setUserData(data[0]);

        const wallet = data[0]?.api_key?.split("-").slice(1, -1).join("");
        const apiKey = data[0]?.api_key;
        const request = await fetch("https://api.pumpagent.com/get-balance", {
          method: "POST",
          body: JSON.stringify({
            wallet,
          }),
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
        });
        const response = await request.json();

        setFundWalletBalance(response);
      } catch (err) {
        console.error(err);
        alert(err);
      }
    };

    fetchUserData();
  }, [user]);

  return (
    <>
      <div
        className={`text-white flex w-full flex-1 ${
          !user ? "opacity-0" : "opacity-100"
        }`}
      >
        <Helmet>
          <title>PumpAgent - Dashboard</title>
          <link rel="canonical" href="https://pumpagent.com/dashboard" />
          <meta property="og:title" content="PumpAgent - Dashboard" />
          <meta property="og:url" content="https://pumpagent.com/dashboard" />
        </Helmet>
        <SideBar menu={menu} setMenu={setMenu} />
        {menu === "Dashboard" && (
          <Landing
            setMenu={setMenu}
            fundWalletBalance={fundWalletBalance}
            userData={userData}
          />
        )}
        {menu === "API Key" && (
          <APIKey userData={userData} setUserData={setUserData} />
        )}
        {menu === "Fee Earnings" && (
          <FeeEarnings
            userData={userData}
            setUserData={setUserData}
            fundWalletBalance={fundWalletBalance}
            setFundWalletBalance={setFundWalletBalance}
          />
        )}
        {menu === "Tiers" && (
          <Tiers
            userData={userData}
            setUserData={setUserData}
            fundWalletBalance={fundWalletBalance}
            setFundWalletBalance={setFundWalletBalance}
          />
        )}
        {menu === "Referrals" && (
          <Referrals
            userData={userData}
            setUserData={setUserData}
            fundWalletBalance={fundWalletBalance}
            setFundWalletBalance={setFundWalletBalance}
          />
        )}
      </div>
    </>
  );
};

export default Dashboard;
