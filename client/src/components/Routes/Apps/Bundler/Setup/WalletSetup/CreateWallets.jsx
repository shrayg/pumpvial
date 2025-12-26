import { useState, useEffect, useRef, useContext } from "react";
import { Keypair, PublicKey, VersionedTransaction } from "@solana/web3.js";
import { FaRegCopy } from "react-icons/fa6";
import bs58 from "bs58";
import { FaSave } from "react-icons/fa";
import FundWallets from "./FundWallets";
import { getWalletSolBalances } from "../../../../../../utils/functions";
import {
  devnetSolConnection,
  solConnection,
} from "../../../../../../../../server/utils/constants";
import Spinner from "../../../../../../assets/Spinner.svg";
import { AuthContext } from "../../../../../../utils/AuthProvider";
import { useNavigate } from "react-router-dom";

const CreateWallets = ({
  wallets,
  setWallets,
  form,
  setForm,
  userData,
  balances,
  setBalances,
  developerBalance,
  setDeveloperBalance,
}) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const funderInputRef = useRef(null);
  const developerInputRef = useRef(null);
  const [walletCount, setWalletCount] = useState(""); // Max 20
  const [isCheckboxChecked, setIsCheckboxChecked] = useState(false);
  const [createdLut, setCreatedLut] = useState("");
  const [modalState, setModalState] = useState(
    form.walletsSaved ? "Fund" : "Create"
  );
  const [commitLoad, setCommitLoad] = useState(false);

  useEffect(() => {
    if (wallets.bundle.length) setWalletCount(wallets.bundle.length);
  }, [wallets]);

  const loadFunderBalance = async () => {
    try {
      const funderKeypair = Keypair.fromSecretKey(bs58.decode(wallets.funder));
      const funderPublicKey = funderKeypair.publicKey.toBase58();
      return (await getWalletSolBalances([funderPublicKey]))[0];
    } catch (err) {
      console.error("Error fetching funder balance:", err);
    }
  };

  useEffect(() => {
    // Ensure `wallets.bundle` has the right length
    if (!walletCount) return;
    setWallets((prev) => {
      const updatedBundle = [];
      for (let i = 0; i < walletCount; i++) {
        updatedBundle.push(prev.bundle?.[i] || "");
      }
      return { ...prev, bundle: updatedBundle };
    });
  }, [walletCount, setWallets]);

  const handleSubmit = (e) => e.preventDefault();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setWallets((prev) => ({ ...prev, [name]: value }));
    setIsCheckboxChecked(false);
    setCreatedLut("");
  };

  const handleBundleInputChange = (index, value) => {
    const updated = [...(wallets.bundle || [])];
    updated[index] = value;
    setWallets((prev) => ({ ...prev, bundle: updated }));
    setIsCheckboxChecked(false);
    setCreatedLut("");
  };

  const autoFillWallets = () => {
    const generated = [];
    for (let i = 0; i < walletCount; i++) {
      const kp = Keypair.generate();
      const privKey = bs58.encode(kp.secretKey);
      generated.push(privKey);
    }
    setWallets((prev) => ({ ...prev, bundle: generated }));
  };

  const commitBundleWallets = async () => {
    if (!user) {
      localStorage.setItem("redirect", "/bundler");
      navigate("/signin");
      return;
    }

    setCommitLoad(true);
    if (!wallets.funder) {
      funderInputRef.current?.focus();
      setCommitLoad(false);
      return;
    }

    let funderKeypair;
    try {
      const secretKey = bs58.decode(wallets.funder);
      funderKeypair = Keypair.fromSecretKey(secretKey);
    } catch (err) {
      funderInputRef.current?.focus();
      setCommitLoad(false);
      return;
    }

    if (!wallets.developer) {
      developerInputRef.current?.focus();
      setCommitLoad(false);
      return;
    }

    let developerKeypair;
    try {
      const secretKey = bs58.decode(wallets.developer);
      developerKeypair = Keypair.fromSecretKey(secretKey);
    } catch (err) {
      developerInputRef.current?.focus();
      setCommitLoad(false);
      return;
    }

    // Check for duplicate funder/developer keys
    if (
      funderKeypair.publicKey.toBase58() ===
      developerKeypair.publicKey.toBase58()
    ) {
      alert("Funder and Developer keys must be different.");
      setCommitLoad(false);
      return;
    }

    const seenPublicKeys = new Set();
    const funderPubkey = funderKeypair.publicKey.toBase58();
    const developerPubkey = developerKeypair.publicKey.toBase58();

    for (let i = 0; i < wallets.bundle.length; i++) {
      const privateKeyBase58 = wallets.bundle[i];
      let keypair;

      try {
        const secretKey = bs58.decode(privateKeyBase58);
        keypair = Keypair.fromSecretKey(secretKey);
      } catch (err) {
        alert(`Wallet ${i + 1} has no or an invalid private key.`);
        setCommitLoad(false);
        return;
      }

      const pubkeyStr = keypair.publicKey.toBase58();

      if (seenPublicKeys.has(pubkeyStr)) {
        alert(`Duplicate public key found in bundle at wallet ${i + 1}.`);
        setCommitLoad(false);
        return;
      }

      if (pubkeyStr === funderPubkey || pubkeyStr === developerPubkey) {
        alert(`Bundle wallet ${i + 1} matches the funder or developer wallet.`);
        setCommitLoad(false);
        return;
      }

      seenPublicKeys.add(pubkeyStr);
    }

    const funderBalance = await loadFunderBalance();
    if (funderBalance < 0.025) {
      alert(
        "Insufficient funds to proceed, make sure the funder has enough SOL."
      );
      setCommitLoad(false);
      return;
    }

    extendLookupTable();
  };

  useEffect(() => {
    if (form.walletsSaved) {
      setModalState("Fund");
    } else {
      setModalState("Create");
    }
  }, [form]);

  const saveAsText = () => {
    const lines = [];

    const pushWallet = (label, priv) => {
      try {
        const kp = Keypair.fromSecretKey(bs58.decode(priv));
        lines.push(
          `${label}:\nPublic Key: ${kp.publicKey.toBase58()}\nPrivate Key: ${priv}\n`
        );
      } catch {
        lines.push(`${label}:\nNo/Invalid Private Key\n`);
      }
    };

    // Add funder and developer
    pushWallet("Funder", wallets.funder);
    pushWallet("Developer", wallets.developer);

    // Add bundle wallets
    (wallets.bundle || []).forEach((priv, index) => {
      pushWallet(`Wallet ${index + 1}`, priv);
    });

    const blob = new Blob([lines.join("\n")], {
      type: "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${form.name || "Bundle"}_bundle_wallets.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const createLut = async () => {
    const funderKeypair = Keypair.fromSecretKey(bs58.decode(wallets.funder));
    const funderPublicKey = funderKeypair.publicKey.toBase58();
    const URL = "https://api.pumpagent.com/create-lookup-table";
    try {
      const request = await fetch(URL, {
        method: "POST",
        body: JSON.stringify({
          creator: funderPublicKey,
          prioFee: "Medium",
        }),
        headers: {
          "Content-Type": "application/json",
          "x-api-key": userData?.api_key,
        },
      });

      const { serializedTransaction, lut } = await request.json();
      const serialized = Uint8Array.from(atob(serializedTransaction), (c) =>
        c.charCodeAt(0)
      );

      const transaction = VersionedTransaction.deserialize(serialized);
      transaction.sign([funderKeypair]);
      const signature = await solConnection().sendTransaction(transaction);
      console.log("Signature: ", signature);
      if (!signature) {
        // alert("Failed to create lookup table, please try again.");
        return null;
      }
      console.log("LUT: ", lut);
      setCreatedLut(lut);
      setForm((prev) => ({ ...prev, lut: lut }));
      setWallets((prev) => ({ ...prev, bundle: wallets.bundle }));
      return lut;
    } catch (err) {
      console.error(err);
      setCommitLoad(false);
    }
  };

  const extendLookupTable = async () => {
    try {
      const lut = form.lut || createdLut || (await createLut());
      if (!lut) {
        alert("Failed to create lookup table. Please try again.");
        return;
      }
      console.log("Attempting to extend...");
      await new Promise((resolve) => setTimeout(resolve, 17500));

      const funderKeypair = Keypair.fromSecretKey(bs58.decode(wallets.funder));
      const funderPublicKey = funderKeypair.publicKey.toBase58();
      const URL = "https://api.pumpagent.com/extend-lookup-table";

      const secretKey = bs58.decode(wallets.developer);
      const developerKeypair = Keypair.fromSecretKey(secretKey);

      const bundle = wallets.bundle.map((wallet) => {
        const keypair = Keypair.fromSecretKey(bs58.decode(wallet));
        return keypair.publicKey.toBase58();
      });

      bundle.push(developerKeypair.publicKey.toBase58(), funderPublicKey);

      const request = await fetch(URL, {
        method: "POST",
        body: JSON.stringify({
          creator: funderPublicKey,
          wallets: bundle,
          lut,
          prioFee: "Medium",
          mint: form.mintPub,
          platform: form.platform,
        }),
        headers: {
          "Content-Type": "application/json",
          "x-api-key": userData?.api_key,
        },
      });

      const { serializedTransaction } = await request.json();
      if (!serializedTransaction) return;
      console.log("Serialized tx: ", serializedTransaction);
      const serialized = Uint8Array.from(atob(serializedTransaction), (c) =>
        c.charCodeAt(0)
      );

      const transaction = VersionedTransaction.deserialize(serialized);
      transaction.sign([funderKeypair]);

      const signature = await solConnection().sendTransaction(transaction);
      console.log("Sig: ", signature);
      if (signature) {
        setForm((prev) => ({ ...prev, walletsSaved: true, lut }));
        setModalState("Fund");
        setCommitLoad(true);
      } else {
        alert("Failed to extend lookup table. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setCommitLoad(false);
    } finally {
      setCommitLoad(false);
    }
  };

  return (
    <>
      {modalState === "Create" && (
        <form
          onSubmit={handleSubmit}
          className="max-w-2xl border rounded-b border-t-none border-gray-800 w-full mx-auto p-6 space-y-4 flex flex-col max-h-170 h-full overflow-auto"
        >
          {/* Bundle Funder */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">
              Bundle Funder Private Key
            </label>
            <input
              ref={funderInputRef}
              type="text"
              name="funder"
              required
              placeholder="Enter private key"
              value={wallets.funder || ""}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-800 text-white p-2 h-[33px] text-[12px] focus:outline-green-300 focus:outline-1 focus:bg-[#23ff4011] placeholder:text-gray-700 "
            />
          </div>

          {/* Token Developer */}
          <div className="flex flex-col border-b border-gray-900 pb-8 mb-4">
            <label className="text-sm font-medium text-gray-700 mb-1">
              Token Developer Private Key
            </label>
            <div className="flex gap-2">
              <input
                ref={developerInputRef}
                type="text"
                name="developer"
                required
                placeholder="Enter private key"
                value={wallets.developer || ""}
                onChange={handleChange}
                className=" rounded-md border border-gray-800 text-white p-2 h-[33px] text-[12px] focus:outline-green-300 focus:outline-1 focus:bg-[#23ff4011] placeholder:text-gray-700 flex-1"
              />
              <button
                type="button"
                onClick={() => {
                  const kp = Keypair.generate();
                  setWallets((prev) => ({
                    ...prev,
                    developer: bs58.encode(kp.secretKey),
                  }));
                }}
                className="text-white px-3 rounded-md bg-[#222] hover:bg-[#333]  active:scale-99 cursor-pointer text-[12px]"
              >
                Generate
              </button>
            </div>
          </div>

          {/* Wallet Count Control */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-300">Bundle Wallets</span>
            <div className="flex rounded-md border border-gray-800 flex-1 justify-between">
              <input
                type="text"
                inputMode="numeric"
                placeholder="Enter wallet count"
                pattern="[0-9]*"
                value={walletCount}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "") {
                    setWalletCount("");
                  } else {
                    const num = Number(val);
                    if (!isNaN(num) && num >= 0 && num <= 20) {
                      setWalletCount(num);
                    }
                  }
                }}
                onBlur={() => {
                  if (!walletCount || walletCount < 1) {
                    setWalletCount(1);
                  }
                }}
                className="w-20  text-white p-1 text-sm pl-4 placeholder:text-[12px]  placeholder:text-gray-700 h-[33px] bg-black focus:outline-green-300 focus:outline-1 focus:bg-[#23ff4011] flex-1 mr-0.5 rounded-md"
              />
            </div>
            <button
              type="button"
              onClick={autoFillWallets}
              className=" text-white text-sm px-4 py-1 rounded-md bg-[#222] w-fit cursor-pointer text-[12px] hover:bg-[#333] active:scale-99 h-full"
            >
              Generate {walletCount} Private Key{walletCount > 1 ? "s" : ""}
            </button>
          </div>

          {/* Editable Bundle Wallet Inputs */}
          <div className="flex flex-col gap-2">
            {(wallets.bundle || []).map((privKey, index) => {
              let pubKey = "";
              try {
                const secretKey = bs58.decode(privKey);
                const kp = Keypair.fromSecretKey(secretKey);
                pubKey = kp.publicKey.toBase58();
              } catch {
                pubKey = "Enter valid private key";
              }

              return (
                <div
                  key={index}
                  className="flex gap-2 items-start border-b border-gray-800 pb-4"
                >
                  <div className="flex flex-col flex-1 w-1/2">
                    <label className="text-xs text-gray-500 mb-1">
                      Wallet {index + 1} Private Key
                    </label>
                    <input
                      type="text"
                      value={privKey}
                      onChange={(e) =>
                        handleBundleInputChange(index, e.target.value)
                      }
                      placeholder="Enter or generate private key"
                      className="w-full rounded-md border border-gray-800 text-white p-2 h-[33px] text-[12px] bg-black focus:outline-green-300 focus:outline-1 focus:bg-[#23ff4011]"
                    />
                  </div>
                  <div className="flex flex-col flex-1 w-1/2">
                    <label className="text-xs text-gray-500 mb-1">
                      Public Key
                    </label>
                    <span className=" rounded-md border border-gray-800 text-white p-2 h-[33px] text-[12px] bg-[#111] w-full overflow-hidden flex justify-start items-center">
                      {pubKey !== "Enter valid private key" && (
                        <button
                          className="p-0.5 mr-1 cursor-pointer text-gray-400 hover:text-white active:text-greener active:scale-99"
                          onClick={() => navigator.clipboard.writeText(pubKey)}
                          type="button"
                        >
                          <FaRegCopy />
                        </button>
                      )}
                      <span>{pubKey}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex flex-col border-b border-gray-900 pb-4 mb-4">
            <button
              type="button"
              onClick={saveAsText}
              className="bg-[#222] hover:bg-[#333] text-white px-4 py-2 rounded-md text-[12px] font-semibold cursor-pointer flex justify-center items-center gap-1 w-40"
            >
              <FaSave /> Save Bundle as .txt
            </button>
          </div>
          <div className="flex items-center gap-2">
            <label
              htmlFor="readyCheckbox"
              className="flex items-center gap-2 cursor-pointer"
            >
              <span className="relative inline-block w-4 h-4">
                <input
                  id="readyCheckbox"
                  type="checkbox"
                  checked={isCheckboxChecked}
                  onChange={(e) => setIsCheckboxChecked(e.target.checked)}
                  className="peer opacity-0 w-4 h-4 absolute cursor-pointer z-10"
                />
                <span className="w-4 h-4 block rounded border border-gray-500 bg-black peer-checked:bg-green-500 peer-checked:border-green-500" />
                <svg
                  className="absolute top-0 left-0 w-4 h-4 text-black pointer-events-none hidden peer-checked:block"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <path
                    d="M5 10.5L8.5 14L15 7"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="text-[12px] text-gray-600">
                I Saved My Wallets & I'm Ready To Start Funding
              </span>
            </label>
          </div>
          {/* Commit Bundle Wallets */}
          <button
            type="button"
            onClick={commitBundleWallets}
            disabled={!isCheckboxChecked || commitLoad}
            className={`px-4 py-2 rounded-md text-[12px] font-semibold h-[28px] transition-opacity duration-200 flex gap-1 justify-center items-center
          ${
            !isCheckboxChecked || commitLoad
              ? "bg-[#333] opacity-50 cursor-not-allowed"
              : "bg-green-600 opacity-100 cursor-pointer"
          }
          text-white`}
          >
            {!commitLoad && !user && "Sign In To Commit Bundle"}
            {!commitLoad && user && "Commit Bundle Wallets"}
            {commitLoad && user && (
              <>
                <img src={Spinner} alt="Spinner" className="w-4 h-4" /> may take
                a short while
              </>
            )}
          </button>
        </form>
      )}
      {modalState === "Fund" && (
        <FundWallets
          form={form}
          wallets={wallets}
          userData={userData}
          balances={balances}
          setBalances={setBalances}
          developerBalance={developerBalance}
          setDeveloperBalance={setDeveloperBalance}
          setWallets={setWallets}
        />
      )}
    </>
  );
};

export default CreateWallets;
