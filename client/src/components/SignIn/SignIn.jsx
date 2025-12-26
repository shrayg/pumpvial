import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../../utils/supabase";
import Spinner from "../../assets/Spinner.svg";
import { Helmet } from "react-helmet";

const SignIn = () => {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [referral, setReferral] = useState(ref || "");
  const navigate = useNavigate();
  const passwordRef = useRef();
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    const savedUsername = localStorage.getItem("cachedUsername");
    if (savedUsername) {
      setUsername(savedUsername.toLowerCase()); // enforce lowercase
      passwordRef.current?.focus();
    }
  }, [isLogin]);

  const handleUsernameChange = (e) => {
    const value = e.target.value.toLowerCase(); // always lowercase
    const clean = value.replace(/[^a-zA-Z0-9]/g, "");
    setUsername(clean);
    localStorage.setItem("cachedUsername", clean);
  };

  const toggleForm = () => setIsLogin(!isLogin);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: username + "@gmail.com",
        password: password,
      });

      if (error) {
        throw new Error(error.message);
      }

      const nav = localStorage.getItem("redirect");
      if (nav) {
        localStorage.removeItem("redirect");
        navigate(nav);
        return;
      }

      navigate("/");
    } catch (error) {
      console.error(error.message);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: username + "@gmail.com",
        password,
      });
      if (error) throw new Error(error);

      const request = await fetch("https://api.pumpagent.com/sign-up", {
        method: "POST",
        body: JSON.stringify({
          username,
          data,
          referral,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const response = await request.json();
      if (!response.success) throw new Error(response.error);

      const nav = localStorage.getItem("redirect");
      if (nav) {
        localStorage.removeItem("redirect");
        navigate(nav);
        return;
      }

      navigate("/");
    } catch (err) {
      alert(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex items-center justify-center bg-black text-white">
      <Helmet>
        <title>PumpAgent - Sign In</title>
        <link rel="canonical" href="https://pumpagent.com/signin" />
        <meta property="og:title" content="PumpAgent - Sign In" />
        <meta property="og:url" content="https://pumpagent.com/signin" />
      </Helmet>
      <form className="w-[300px] text-[12px] border border-gray-800 dark:border-gray-200 bg-tile dark:bg-white rounded-md p-4 flex relative flex-col items-center gap-8 mb-20">
        <h2 className="text-2xl font-bold mb-2 text-center">
          {isLogin ? "Sign In" : "New User"}
        </h2>

        <input
          type="text"
          placeholder="Username"
          className="w-full p-2 border-b border-b-gray-600 text-white focus:outline-none focus:border-b-green-500"
          value={username}
          onChange={handleUsernameChange}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 border-b border-b-gray-600 text-white focus:outline-none focus:border-b-green-500"
          value={password}
          ref={passwordRef}
          onChange={(e) => setPassword(e.target.value)}
        />
        {!isLogin && (
          <div className="relative w-full">
            {referral && (
              <span className="text-[12px] text-gray-600 absolute right-0 top-2 select-none">
                Referral
              </span>
            )}
            <input
              type="text"
              placeholder="Referral name"
              className={`w-full p-2 border-b border-b-gray-600 text-gray-400 focus:outline-none focus:border-b-green-500 ${
                ref ? "pointer-events-none" : ""
              }`}
              value={referral}
              onChange={(e) => setReferral(e.target.value)}
            />
          </div>
        )}
        <button
          className=" bg-green-900 hover:bg-green-700 py-3 rounded font-semibold cursor-pointer w-[266px] max-h-[36px] flex justify-center items-center"
          onClick={(e) => (isLogin ? handleLogin(e) : handleRegister(e))}
          disabled={loading ? true : false}
        >
          {loading && <img src={Spinner} alt="Spinner" />}
          {!loading && <>{isLogin ? "Sign In" : "Sign Up"}</>}
        </button>

        <p className="text-center text-sm mt-2">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={toggleForm}
            className="text-greener hover:underline cursor-pointer"
            type="button"
          >
            {isLogin ? "Sign up" : "Sign In"}
          </button>
        </p>
      </form>
    </div>
  );
};

export default SignIn;
