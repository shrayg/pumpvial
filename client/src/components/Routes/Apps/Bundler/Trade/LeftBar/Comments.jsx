import { useState, useEffect } from "react";
import { FaRegHeart } from "react-icons/fa";
import SOL from "../../../../../../assets/SOL.png";

const Comments = ({ userData, leftBarHeight, ca }) => {
  const [showReplies, setShowReplies] = useState(false);
  const toggleCommentsTab = () => setShowReplies((prev) => !prev);
  const [enlargedImages, setEnlargedImages] = useState({});
  const [replies, setReplies] = useState([]);

  const toggleEnlarge = (img) => {
    setEnlargedImages((prev) => ({
      ...prev,
      [img]: !prev[img],
    }));
  };

  useEffect(() => {
    if (!ca || !userData) return;
    const fetchReplies = async () => {
      try {
        const response = await fetch(
          "https://api.pumpagent.com/comment-thread",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": userData?.api_key,
            },
            body: JSON.stringify({ ca }),
          }
        );

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        setReplies(data.replies);
      } catch (error) {
        console.error("Error fetching replies:", error);
      }
    };

    fetchReplies(); // Initial fetch

    const intervalId = setInterval(fetchReplies, 15000); // Every 15 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [ca, userData]);

  return (
    <div className="h-1/2">
      <div className={`top-[30px] h-full z-1000 w-full`}>
        <div className="z-100" style={{ height: `${leftBarHeight / 2}px` }}>
          <button
            className="text-white absolute text-[12px] pl-1 left-0 top-[-1.85rem] h-[30px] w-full bg-black cursor-pointer border-r border-b border-gray-900"
            onClick={toggleCommentsTab}
          >
            x
          </button>
          <div className="overflow-auto h-full relative">
            {replies.length && (
              <ul className="flex flex-col border border-gray-900 h-full ">
                {[...replies].reverse().map((reply, i) => (
                  <li
                    key={i}
                    className="text-[12px] text-gray-500 flex flex-col justify-start items-start gap-2 p-2"
                  >
                    <div className="flex flex-col">
                      {reply.is_buy && (
                        <div className="flex justify-center items-center gap-1 mt-1">
                          <img src={SOL} alt="Solana" className="w-5 h-5" />
                          <span>{reply.sol_amount}</span>
                        </div>
                      )}
                      <div className="flex justify-center items-center gap-1">
                        <img
                          src={reply.profile_image || "/Pepe.png"}
                          alt="Profile"
                          className="w-5 h-5 object-contain mr-0.5 rounded-sm"
                        />
                        <span
                          className="text-greener mr-1 hover:underline cursor-pointer"
                          onClick={() =>
                            window.open(
                              `https://pump.fun/profile/${reply.user}`,
                              "_blank"
                            )
                          }
                        >
                          {reply.username || reply.user.slice(0, 5)}
                        </span>
                        <span className="mr-1">
                          {new Date(reply.timestamp).toLocaleTimeString(
                            "en-US",
                            {
                              hour12: false,
                            }
                          )}
                        </span>
                        <span className="flex justify-center items-center gap-1.5 select-none">
                          <FaRegHeart className="cursor-not-allowed" />
                          {reply.total_likes}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-white w-full break-all">
                        {reply.text}
                      </span>
                      {reply.file_uri && (
                        <img
                          key={reply.file_uri}
                          src={reply.file_uri}
                          alt="Attachment"
                          className={`mt-2 mx-1 rounded-md cursor-pointer transition-all duration-300 ${
                            enlargedImages[reply.file_uri]
                              ? "w-full h-auto"
                              : "w-32"
                          }`}
                          onClick={() => toggleEnlarge(reply.file_uri)}
                          style={{ objectFit: "contain" }}
                        />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {!replies.length && (
              <div className="flex-1  absolute h-full w-full inset-0 flex justify-center items-center">
                <span className="text-[12px] text-gray-700 select-none">
                  No replies
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Comments;
