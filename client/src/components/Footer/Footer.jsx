import { useNavigate } from "react-router-dom";
import Vial from "../../assets/Logo.webp";
import { FaXTwitter } from "react-icons/fa6";
import { FaMediumM } from "react-icons/fa";
import { IoLogoGithub } from "react-icons/io";
import { FaDiscord } from "react-icons/fa";

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="bg-black dark:bg-transparent border-t border-t-gray-800 text-gray-500 py-4 md:py-4 select-none">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex  flex-col md:flex-row justify-between items-center gap-2  md:gap-4">
          <div className="text-sm flex justify-center items-center">
            <img src={Vial} alt="Vial" className="w-3 h-3 mr-2" /> ©{" "}
            {new Date().getFullYear()} PumpAgent. All rights reserved.
          </div>

          <div className="flex justify-center items-center gap-2 bg-black dark:bg-transparent">
            <button
              className="text-gray-700 text-sm p-2.5 border border-gray-900 rounded-md cursor-pointer hover:text-white hover:border-gray-700 hover:bg-[#111]"
              onClick={() => window.open("https://x.com/PumpAgent", "_blank")}
              aria-label="Twitter Link"
            >
              <FaXTwitter />
            </button>
            <button
              className="text-gray-700 text-sm p-2.5 border border-gray-900 rounded-md cursor-pointer hover:text-white hover:border-gray-700 hover:bg-[#111]"
              onClick={() =>
                window.open("https://discord.gg/WBmZss3jQq", "_blank")
              }
              aria-label="Discord Link"
            >
              <FaDiscord />
            </button>
            <button
              className="text-gray-700 text-sm p-2.5 border border-gray-900 rounded-md cursor-pointer hover:text-white hover:border-gray-700 hover:bg-[#111]"
              onClick={() =>
                window.open("https://medium.com/@PumpAgent", "_blank")
              }
              aria-label="Twitter Link"
            >
              <FaMediumM />
            </button>
            <button
              className="text-gray-700 text-sm p-2.5 border border-gray-900 rounded-md cursor-pointer hover:text-white hover:border-gray-700 hover:bg-[#111]"
              onClick={() =>
                window.open("https://github.com/PumpAgent", "_blank")
              }
              aria-label="GitHub Link"
            >
              <IoLogoGithub />
            </button>
          </div>
          <div className="flex space-x-6 text-sm">
            <a
              href="/privacy"
              className="hover:text-white transition-colors"
              onClick={() => navigate("/privacy")}
            >
              Privacy
            </a>
            <a
              href="mailto:contact@pumpagent.com"
              className="hover:text-white transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
