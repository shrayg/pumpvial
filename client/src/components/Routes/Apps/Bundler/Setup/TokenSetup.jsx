import { useState, useRef } from "react";
import { FiUpload } from "react-icons/fi";
import { IoMdSave } from "react-icons/io";
import { FaTrash } from "react-icons/fa6";
import Toast from "../Toast";
import { useNavigate } from "react-router-dom";
import Spinner from "../../../../../assets/Spinner.svg";
import { Keypair, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import Pump from "../../../../../assets/Pump.png";
import Bonk from "../../../../../assets/Bonk.png";

const TokenSetup = ({ form, setForm, userData }) => {
  const navigate = useNavigate();
  const imageInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const originalFormRef = useRef(JSON.stringify(form));

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleChange = async (e) => {
    const { name, value, files } = e.target;
    const file = files ? files[0] : null;
    if (file?.size > 4000000) {
      alert("File size too large.");
      return;
    }

    if (file) {
      const base64 = await fileToBase64(file); // Convert to Base64
      setForm((prev) => ({
        ...prev,
        [name]: base64,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(userData);
    if (!userData) {
      localStorage.setItem("redirect", "/bundler");
      navigate("/signin");
      return;
    }

    const currentFormString = JSON.stringify(form);
    if (currentFormString === originalFormRef.current) {
      setMessage("No Changes To Save");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setLoading(true);
    // You can now upload `form.image` and save the other values as needed
    try {
      const { name, symbol, image, description, twitter, telegram, website } =
        form;

      // const request = await fetch("https://api.pumpagent.com/create-ipfs", {
      const request = await fetch("http://localhost:3000/create-ipfs", {
        method: "POST",
        body: JSON.stringify({
          image,
          name,
          symbol,
          description,
          twitter,
          telegram,
          website,
        }),
        headers: {
          "Content-Type": "application/json",
          "x-api-key": userData?.api_key,
        },
      });
      const response = await request.json();

      const updatedForm = { ...form, metadata: response };

      const uri = response?.uri;
      if (!uri) {
        setMessage("Failed To Update Info. Contact The Dev Team.");
        return;
      }

      if (form.vanity) {
        try {
          const keypair = Keypair.fromSecretKey(bs58.decode(form.vanity));
          const mint = keypair.publicKey.toBase58();
          const priv = bs58.encode(keypair.secretKey);
          updatedForm.mintPub = mint;
          updatedForm.mintPriv = priv;
        } catch (e) {
          console.error(e);

          const keyPair = Keypair.generate();
          updatedForm.mintPub = keyPair.publicKey.toBase58();
          updatedForm.mintPriv = bs58.encode(keyPair.secretKey);
        }
      } else {
        if (!form.mintPub) {
          const keyPair = Keypair.generate();
          updatedForm.mintPub = keyPair.publicKey.toBase58();
          updatedForm.mintPriv = bs58.encode(keyPair.secretKey);
        }
      }

      const [bondingCurve] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("bonding-curve"),
          new PublicKey(updatedForm.mintPub).toBytes(),
        ],
        new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P") //PF
      );
      updatedForm.curveAddress = bondingCurve.toBase58();

      setForm(updatedForm);
      originalFormRef.current = JSON.stringify(updatedForm);

      setMessage("Token Info Updated");
      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (err) {
      setMessage("Failed To Update Info");
      setTimeout(() => {
        setMessage("");
      }, 3000);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = () => {
    imageInputRef.current?.click();
  };
  const handleBannerClick = () => {
    bannerInputRef.current?.click();
  };

  return (
    <form
      className="max-w-2xl border rounded-b border-t-none border-gray-800 w-full mx-auto p-6 space-y-2 flex flex-col max-h-170 overflow-auto bg-black"
      onSubmit={(e) => e.preventDefault()}
    >
      {message && <Toast message={message} />}

      <div className="flex justify-start gap-26 items-center">
        <label className="block text-sm font-medium text-gray-700">
          Token Image
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Token Banner (optional)
        </label>
      </div>

      <input
        type="file"
        name="image"
        accept="image/*"
        ref={imageInputRef}
        onChange={handleChange}
        style={{ display: "none" }}
      />
      <input
        type="file"
        name="banner"
        accept="image/*"
        ref={bannerInputRef}
        onChange={handleChange}
        style={{ display: "none" }}
      />

      <div className="flex gap-8">
        {/* Image Upload */}
        <div
          onClick={handleImageClick}
          className="flex cursor-pointer flex-col border border-dotted border-gray-700 rounded-md w-[150px] h-[150px] text-sm font-semibold text-gray-700 hover:text-white transition justify-center items-center gap-2"
        >
          {!form.image && !form.metadata?.image && (
            <div className="flex justify-center flex-col items-center gap-2">
              <FiUpload />
              <span>Upload Image</span>
              <span className="text-[10px] text-center leading-3">
                Max. 4MB
                <br /> .JPG, .GIF, .PNG
              </span>
            </div>
          )}

          {(form.image || form.metadata?.image) && (
            <div className="relative w-full h-full group transition">
              <FaTrash
                className="absolute top-2 left-2 cursor-pointer hover:text-red-500  text-gray-700 z-10"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    image: null,
                    metadata: {
                      ...prev.metadata,
                      image: null,
                    },
                  }))
                }
              />
              <img
                src={form.image || form.metadata?.image}
                alt="Preview"
                className="w-full h-full object-contain rounded-md opacity-100 group-hover:opacity-30 transition"
              />
              <FiUpload className="absolute top-16 right-16 text-gray-800 text-[18px] opacity-0 group-hover:opacity-100 group-hover:text-white transition " />
            </div>
          )}
        </div>

        {/* Banner Upload */}
        <div
          // onClick={handleBannerClick}
          className="flex select-none flex-1 flex-col border border-dotted border-gray-700 rounded-md w-[150px] h-[150px] text-sm font-semibold text-gray-700 transition justify-center items-center gap-2"
        >
          {!form.banner && (
            <div className="flex justify-center items-center flex-col gap-2">
              <span>Unavailable</span>
              {/* <span>Upload Banner</span>
                <FiUpload /> */}
              {/* <span className="text-[10px] text-center leading-3">
                  Max. 5MB
                  <br /> 3:1 / 1500x1500px
                </span> */}
            </div>
          )}

          {form.banner && (
            <div className="relative w-full h-full group transition">
              <FaTrash
                className="absolute top-2 left-2 cursor-pointer hover:text-red-500  text-gray-700 z-10"
                onClick={() => setForm((prev) => ({ ...prev, banner: null }))}
              />
              <img
                src={form.banner}
                alt="Preview"
                className="w-full h-full object-cover rounded-md opacity-100 group-hover:opacity-30 transition"
              />
              <FiUpload className="absolute top-16 left-1/2 text-gray-800 text-[18px] opacity-0 group-hover:opacity-100 group-hover:text-white transition " />
            </div>
          )}
        </div>
      </div>

      {/* Text Inputs */}
      <div className="flex flex-col">
        <label className="block mb-1 text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          className="w-full rounded-md border border-gray-800 text-white p-2 h-[33px] text-[12px] focus:outline-green-300 focus:outline-1 focus:bg-[#23ff4011] placeholder:text-gray-700"
          required
          placeholder="Enter token name"
          maxLength={30}
        />
      </div>

      <div className="flex flex-col">
        <label className="block mb-1 text-sm font-medium text-gray-700">
          Symbol
        </label>
        <input
          type="text"
          name="symbol"
          value={form.symbol}
          onChange={handleChange}
          className="w-full rounded-md border border-gray-800 text-white p-2 h-[33px] text-[12px] focus:outline-green-300 focus:outline-1 focus:bg-[#23ff4011] placeholder:text-gray-700"
          required
          placeholder="Enter token symbol"
          maxLength={6}
        />
      </div>

      <div className="flex flex-col">
        <label className="block mb-1 text-sm font-medium text-gray-700">
          Description (optional)
        </label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          className="w-full rounded-md border border-gray-800 text-white p-2 h-20 text-[12px] focus:outline-green-300 focus:outline-1 focus:bg-[#23ff4011] placeholder:text-gray-700"
          rows={4}
          placeholder="Enter token description"
          maxLength={400}
        />
      </div>

      <div className="flex flex-col">
        <label className="block mb-1 text-sm font-medium text-gray-700">
          Website (optional)
        </label>
        <input
          type="text"
          name="website"
          value={form.website}
          onChange={handleChange}
          className="w-full rounded-md border border-gray-800 text-white p-2 h-[33px] text-[12px] focus:outline-green-300 focus:outline-1 focus:bg-[#23ff4011] placeholder:text-gray-700"
          placeholder="https://yourwebsite.com"
        />
      </div>

      <div className="flex flex-col">
        <label className="block mb-1 text-sm font-medium text-gray-700">
          Telegram (optional)
        </label>
        <input
          type="text"
          name="telegram"
          value={form.telegram}
          onChange={handleChange}
          className="w-full rounded-md border border-gray-800 text-white p-2 h-[33px] text-[12px] focus:outline-green-300 focus:outline-1 focus:bg-[#23ff4011] placeholder:text-gray-700"
          placeholder="https://t.me/yourtelegram"
        />
      </div>

      <div className="flex flex-col">
        <label className="block mb-1 text-sm font-medium text-gray-700 pl-1">
          X (optional)
        </label>
        <input
          type="text"
          name="twitter"
          value={form.twitter}
          onChange={handleChange}
          className="w-full rounded-md border border-gray-800 text-white p-2 h-[33px] text-[12px] focus:outline-green-300 focus:outline-1 focus:bg-[#23ff4011] placeholder:text-gray-700 "
          placeholder="https://x.com/youraccount"
        />
      </div>

      <div className="flex flex-col">
        <label className="block mb-1 text-sm font-medium text-gray-700 pl-1">
          Vanity Private Key (optional)
        </label>
        <input
          type="text"
          name="vanity"
          value={form.vanity}
          onChange={handleChange}
          className="w-full rounded-md border border-gray-800 text-white p-2 h-[33px] text-[12px] focus:outline-green-300 focus:outline-1 focus:bg-[#23ff4011] placeholder:text-gray-700 "
          placeholder="Enter Vanity Private Key"
        />
      </div>

      <div className="flex flex-col">
        <label className="block mb-1 text-sm font-medium text-gray-700 pl-1">
          Launch Platform
        </label>
        <div className="flex gap-2">
          <button
            className={`w-1/2 h-15 text-[12px]  ${
              form.platform === "Pump"
                ? "text-white bg-[#00ff2a18]"
                : "text-gray-500"
            } border border-gray-800 rounded-md flex items-center justify-center gap-2 cursor-pointer transition `}
            onClick={() => setForm((prev) => ({ ...prev, platform: "Pump" }))}
            role="button"
          >
            <span>Pump.fun</span>
            <img src={Pump} alt="Pump.fun" className="w-5 h-5" />
          </button>
          <button
            className={`w-1/2 h-15 text-[12px] ${
              form.platform === "Bonk"
                ? "text-white bg-[#00ff2a18]"
                : "text-gray-500"
            } border border-gray-800 rounded-md flex flex-col items-center justify-center cursor-pointer transition`}
            onClick={() => setForm((prev) => ({ ...prev, platform: "Bonk" }))}
            role="button"
          >
            <div className="flex items-center gap-1">
              <span>Bonk.fun</span>
              <img src={Bonk} alt="Bonk.fun" className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-gray-600">
              Trading interface for Bonk coming soon
            </span>
          </button>
        </div>
      </div>

      <button
        className={`${
          loading ? "bg-green-800" : "bg-green-500"
        } text-black text-[12px] rounded-md py-2.5 cursor-pointer flex justify-center items-center gap-1 mt-4 hover:text-white h-[32px]`}
        disabled={loading ? true : false}
        onClick={handleSubmit}
      >
        {!loading && userData && (
          <>
            <IoMdSave /> Update Info
          </>
        )}
        {!loading && !userData && <>Sign In To Update Info</>}
        {loading && <img src={Spinner} alt="Spinner" className="w-5 h-5" />}
      </button>
    </form>
  );
};

export default TokenSetup;
