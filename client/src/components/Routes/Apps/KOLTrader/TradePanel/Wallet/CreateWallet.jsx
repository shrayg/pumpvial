import { useEffect, useState } from "react";
import { FaRegCopy } from "react-icons/fa6";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import Spinner from "../../../../../../assets/Spinner.svg";

const CreateWallet = ({
  copied,
  handleCopy,
  complete,
  loading,
  privkey,
  setPrivkey,
  pubkey,
  setPubkey,
}) => {
  const [sliderValue, setSliderValue] = useState(0);

  const [privRevealed, setPrivRevealed] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (!unlocked) return;
    const kp = Keypair.generate();
    const pub = kp.publicKey.toBase58();
    const priv = bs58.encode(kp.secretKey);
    setPubkey(pub);
    setPrivkey(priv);
  }, [unlocked]);

  return (
    <div className="absolute top-[34px] bg-black h-[490px] w-full z-6000  flex flex-col select-none">
      <div className="h-full w-full flex justify-start pt-25 items-center pb-20 flex-col mt-4 p-4">
        {!unlocked ? (
          <>
            <span className="text-white mb-4 pt-15">
              Slide To Generate Wallet
            </span>
            <div className="flex buygrad px-2 p-4 rounded-full w-50">
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={sliderValue}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setSliderValue(val); // update slider value
                  if (val === 100) {
                    setUnlocked(true);
                  }
                }}
                className="w-full accent-green-600 cursor-pointer custom-slider"
              />
            </div>
          </>
        ) : (
          <div className="w-full flex flex-col text-[12px]">
            <span className="text-center mb-6 text-white text-[14px]">
              PumpAgent DEX Wallet
            </span>

            <span className="text-gray-500 pb-2 pl-2">Public Key</span>
            <div className="rounded-full border text-white border-gray-800 w-ful pl-4 p-4 mb-4 relative flex justify-start items-center gap-2 overflow-hidden h-[46px]">
              {copied === "Public" && (
                <span className="text-center w-full">Copied</span>
              )}
              {copied !== "Public" && (
                <span className="text-[10px]">{pubkey}</span>
              )}
              <FaRegCopy
                className="text-greener text-[16px] absolute right-0 top-3.5 bg-black w-12 cursor-pointer"
                onClick={() => handleCopy("Public")}
              />
            </div>
            <span className="text-gray-500 pb-2 pl-2">Private Key</span>
            {!privRevealed && (
              <div
                className="rounded-full border text-white border-gray-800 w-full p-4 hover:bg-purple-500 bg-purple-600 text-center cursor-pointer active:scale-99 transition ease-in-out "
                onClick={() => setPrivRevealed(true)}
              >
                Reveal
              </div>
            )}
            {privRevealed && (
              <div className="flex flex-col">
                <div className="rounded-full border text-white border-gray-800 w-ful pl-4 p-4  relative flex justify-start items-center gap-2 overflow-hidden h-[46px]">
                  {copied === "Private" && (
                    <span className="text-center w-full">Copied</span>
                  )}
                  {copied !== "Private" && (
                    <span className="text-[10px]">{privkey || "123"}</span>
                  )}
                  <FaRegCopy
                    className="text-greener text-[16px] absolute right-0 top-3.5 bg-black w-12 cursor-pointer"
                    onClick={() => handleCopy("Private")}
                  />
                </div>

                <button
                  className="w-full bg-green-600 text-white p-3 mt-4 rounded-full cursor-pointer hover:bg-green-700 h-[46px] flex justify-center items-center"
                  onClick={complete}
                  disabled={loading ? true : false}
                >
                  {!loading && "I Saved My Private Key"}
                  {loading && <img src={Spinner} alt="Spinner" />}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateWallet;
