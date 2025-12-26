import { useEffect } from "react";
import io from "socket.io-client";

const mints = [
  "AYmkmffpEJg59f3BhirAUcGpoxdcingYFRjPp1hxpump",
  "H3SHzDWbk5HPCLzseaW8unyJQFZRiQQnBVtqzNq9pump",
];

const users = [
  "J95FHyvCKo7rkU2UeRNV69HymE3qCozHZYZBfneDdHQz",
  "D9orvgvgxTxv1nuNE7aLcrLVS9TT9WPh4fq8owMbUsw2",
  "2Ttzp7pNJ3vUgdTwemMFXUUnV73HuYt8RBvqUpATQPNN",
  "9VehQcWfWPu8dtiK4r2HtPnUk7m1ox35aifpDPchFG9w",
];

// const socket = io("wss://ws.pumpagent.com", {
//   query: {
//     // mints: JSON.stringify(mints),
//     // users: JSON.stringify(users),
//   },
// });

const SocketListener = () => {
  return;
  useEffect(() => {
    const socket = io("https://ws.pumpagent.com");
    // socket.on("tokenMigration", (payload) => {
    //   console.log("New migration:", payload);
    // });
    // socket.on("tokenTrades", (payload) => {
    //   console.log("New Trade:", payload);
    // });

    // socket.on("userTrades", (payload) => {
    //   console.log("New Trade:", payload);
    // });
    socket.on("kolTrade", (payload) => {
      console.log("KOL Trade:", payload);
    });
    // socket.on("tokenCreation", (payload) => {
    //   console.log("New Token:", payload);
    // });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      console.log("Socket Disconnected");
    };
  }, []);

  return <div className="p-4"></div>;
};

export default SocketListener;
