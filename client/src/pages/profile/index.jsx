"use client";
import Photo from "@/assets/premium_photo-1710961232986-36cead00da3c.avif";
import React, { useState } from "react";
import { Carousel, Card } from "./constants/cardBluePrint.jsx";
import { RiWallet3Fill } from "react-icons/ri";
import { AnimatedModalDemo } from "./constants/button";

// import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { FcGoogle } from "react-icons/fc";
import Chat from "@/pages/chat/index.jsx";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { useUser } from "../../context/UserContext";
import { useEffect } from "react";

import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

const NODE_URL = "https://fullnode.testnet.aptoslabs.com";
const MODULE_ADDRESS = import.meta.env.VITE_MODULE_ADDRESS;

// const config = new AptosConfig({ network: Network.TESTNET });
// const aptosClient = new Aptos(config);

function hexToString(hex) {
  try {
    if (hex.startsWith("0x")) {
      hex = hex.slice(2);
    }
    return decodeURIComponent(
      hex
        .match(/.{1,2}/g)
        .map((byte) => "%" + byte)
        .join("")
    );
  } catch (error) {
    console.error("Invalid hex input:", hex, error);
    return "";
  }
}

const aptosClient = new Aptos({ nodeUrl: NODE_URL });
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const AppleCardsCarouselDemo = () => {
  const [email, setEmail] = useState("");
  const { walletAddress, setWalletAddress } = useUser();

  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState("");
  const [movies, setMovies] = useState([]);

  const handleConnectWallet = () => {
    // if (!email) {
    //   alert(
    //     "⚠️ Please sign in with Google before connecting your Petra Wallet."
    //   );
    //   return;
    // }
    connectWallet();
  };

  useEffect(() => {
    const checkWalletConnection = async () => {
      const storedWallet = localStorage.getItem("walletAddress"); // ✅ Check localStorage
      if (storedWallet) {
        setWalletAddress(storedWallet);
        setConnected(true);
      } else if (window.aptos) {
        try {
          const account = await window.aptos.account();
          if (account) {
            setWalletAddress(account.address);
            localStorage.setItem("walletAddress", account.address); // ✅ Store if not already
            setConnected(true);
          }
        } catch (error) {
          console.error("No wallet connected:", error);
        }
      }
    };
    checkWalletConnection();
  }, []);

  useEffect(() => {
    if (walletAddress) {
      fetchMovies();
    }
  }, [walletAddress]);
  
  const fetchMovies = async () => {
    try {
      const baseURL = "https://api.testnet.staging.aptoslabs.com/v1/view";
      const commonArgs = [
        import.meta.env.VITE_APP_ADMIN_WALLET,
      ];

      // Define all payloads for fetching different movie attributes
      const payloads = {
        titles: {
          function:
            "0x20650f016e8cf109b197528a28f4b2f3f574008fe69b24c3e2b75bd1b8a8aecd::nft_tickets::get_movie_titles",
          type_arguments: [],
          arguments: commonArgs,
        },
        images: {
          function:
            "0x20650f016e8cf109b197528a28f4b2f3f574008fe69b24c3e2b75bd1b8a8aecd::nft_tickets::get_movie_image_urls",
          type_arguments: [],
          arguments: commonArgs,
        },
        locations: {
          function:
            "0x20650f016e8cf109b197528a28f4b2f3f574008fe69b24c3e2b75bd1b8a8aecd::nft_tickets::get_movie_locations",
          type_arguments: [],
          arguments: commonArgs,
        },
        prices: {
          function:
            "0x20650f016e8cf109b197528a28f4b2f3f574008fe69b24c3e2b75bd1b8a8aecd::nft_tickets::get_movie_prices",
          type_arguments: [],
          arguments: commonArgs,
        },
        dates: {
          function:
            "0x20650f016e8cf109b197528a28f4b2f3f574008fe69b24c3e2b75bd1b8a8aecd::nft_tickets::get_movie_dates",
          type_arguments: [],
          arguments: commonArgs,
        },
      };

      // Fetch all data in parallel
      const responses = await Promise.all(
        Object.values(payloads).map((payload) =>
          fetch(baseURL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }).then((res) => res.json())
        )
      );
      // console.log("Responses:", responses);
      // Extract data from responses
      const [titles, images, locations, prices, dates] = responses.map(
        (res) => res[0]
      );

      // Validate data structure
      if (
        !Array.isArray(titles) ||
        !Array.isArray(images) ||
        !Array.isArray(locations) ||
        !Array.isArray(prices) ||
        !Array.isArray(dates)
      ) {
        throw new Error("Unexpected response format from API");
      }
      // console.log(prices);
      // Combine all data into a single movies array
      const moviesArray = titles.map((title, index) => ({
        title: hexToString(title),
        src: hexToString(images[index]),
        location: hexToString(locations[index]),
        price: prices[index] / 1e8,
        date: hexToString(dates[index]),
      }));

      setMovies(moviesArray);
      console.log("Updated movies state:", moviesArray);
    } catch (error) {
      console.error("Error fetching movie data:", error);
      setMovies([]);
    }
  };

  const fetchUserTickets = async (userAddress) => {
    try {
      const payload = {
        function: `${MODULE_ADDRESS}::ticket::nft_tickets::get_user_ticket_movies`,
        type_arguments: [],
        arguments: [userAddress],
      };

      const response = await aptosClient.view({ payload });
      console.log("User's Tickets:", response);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    }
  };

  const purchaseTicket = async (ticketId, seller, amount) => {
    try {
      const payload = {
        function: `${MODULE_ADDRESS}::ticket::nft_tickets::purchase_ticket`,
        type_arguments: [],
        arguments: [seller, ticketId, amount],
      };

      const response = await window.aptos.signAndSubmitTransaction(payload);
      console.log("Transaction submitted:", response);
    } catch (error) {
      console.error("Error purchasing ticket:", error);
    }
  };

  const setMovieFun = async (data, dataImage) => {
    try {
      setMovies(
        data.map((movie, index) => ({
          // category: convertU8ArrayToString(movie.title), // Convert from u8[] to string
          title: toString(movie.title),
          date: null, // Replace with actual data if available
          src: dataImage, // Placeholder image

          price: null, // Replace with actual price if available
        }))
      );
    } catch (error) {
      console.error("Error connecting to Petra Wallet:", error);
    }
  };

  const connectWallet = async () => {
    try {
      if (!window.aptos) {
        setStatus("Petra Wallet not found. Install it and try again.");
        return;
      }
      const response = await window.aptos.connect();
      setWalletAddress(response.address);
      localStorage.setItem("walletAddress", response.address); // ✅ Store in localStorage
      setConnected(true);
      setMovies(response.address);
    } catch (error) {
      console.error("Error connecting to Petra Wallet:", error);
    }
  };

  const parseJwt = (token) => {
    try {
      const base64Url = token.split(".")[1]; // Extract the payload part of the JWT.
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/"); // Adjust for Base64 URL encoding.
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
          .join("")
      );

      return JSON.parse(jsonPayload); // Return the payload as a JSON object.
    } catch (error) {
      console.error("Invalid JWT token", error);
      return null; // Return null if decoding fails.
    }
  };

  const disconnectWallet = async () => {
    try {
      if (!window.aptos) {
        setStatus("Petra Wallet not found.");
        return;
      }
      await window.aptos.disconnect();
      
      setWalletAddress("");
      localStorage.removeItem("walletAddress"); // ✅ Remove from localStorage
      setConnected(false);
      // setMovies([]);
    } catch (error) {
      console.error("Error disconnecting from Petra Wallet:", error);
    }
  };
  const decodeUtf8 = (u8Array) =>
    new TextDecoder().decode(new Uint8Array(u8Array));
  const formatDate = (timestamp) =>
    new Date(timestamp * 1000).toLocaleDateString();
  console.log("MOVIES: ", movies);
  console.log("MOVIES: ", data);
  const cards = movies.map((movie, index) => (
    <Card key={index} card={movie} index={index} />
  ));

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div
        className="flex-col h-screen w-screen py-10 px-10"
        style={{
          backgroundImage: `url('https://plus.unsplash.com/premium_photo-1668800128890-bc8d2bf9af7e?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D.jpg')`, // Replace with your network image URL
        }}
      >
        <div className="flex-row">
          <div className="flex justify-end">
            <AnimatedModalDemo />
          </div>
          <div className="flex-col py-5 px-5">
            <div className="flex flex-row">
              <div className="w-[65%] ">
                <Carousel items={cards} />
              </div>
              <div className="flex flex-col justify-evenly  w-[35%] py-5 px-5">
                <div className="flex flex-row justify-evenly">
                  <div>
                    {walletAddress ? (
                      <>
                        {/* <p className="text-white mb-2">
                          Connected Wallet: {walletAddress}
                        </p> */}
                        <button
                          onClick={disconnectWallet}
                          className="px-8 py-2 rounded-full bg-gradient-to-b from-red-500 to-red-600 text-white focus:ring-2 focus:ring-blue-400 hover:shadow-xl transition duration-200"
                        >
                          Disconnect Wallet
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleConnectWallet}
                        className="px-8 py-2 flex items-center space-x-2 rounded-full bg-gradient-to-b from-red-500 to-red-600 text-white focus:ring-2 focus:ring-blue-400 hover:shadow-xl transition duration-200"
                      >
                        <RiWallet3Fill size={20} />
                        <span>Connect Wallet</span>
                      </button>
                    )}
                  </div>
                  <GoogleLogin
                    onSuccess={(credentialResponse) => {
                      const decoded = parseJwt(credentialResponse.credential);
                      setEmail(decoded.email);
                    }}
                    onError={() => console.log("Google Login Failed")}
                    render={(renderProps) => (
                      <Button
                        className="w-40 h-10 flex items-center justify-center space-x-2 bg-white border border-gray-300 text-gray-600 hover:bg-gray-200"
                        onClick={renderProps.onClick}
                        disabled={renderProps.disabled}
                      >
                        <FcGoogle size={20} />
                        <span>Google Signup</span>
                      </Button>
                    )}
                  />
                </div>
                <div>
                  {/*chat goes here */}
                  <Chat />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

const DummyContent = () => {
  return (
    <>
      {[...new Array(3).fill(1)].map((_, index) => {
        return (
          <div
            key={"dummy-content" + index}
            className="bg-[#F5F5F7] dark:bg-neutral-800 p-8 md:p-14 rounded-3xl mb-4"
          >
            <p className="text-neutral-600 dark:text-neutral-400 text-base md:text-2xl font-sans max-w-3xl mx-auto">
              <span className="font-bold text-neutral-700 dark:text-neutral-200">
                The first rule of Apple club is that you boast about Apple club.
              </span>{" "}
              Keep a journal, quickly jot down a grocery list, and take amazing
              class notes. Want to convert those notes to text? No problem.
              Langotiya jeetu ka mara hua yaar is ready to capture every
              thought.
            </p>
            <Image
              src="https://assets.aceternity.com/macbook.png"
              alt="Macbook mockup from Aceternity UI"
              height="500"
              width="500"
              className="md:w-1/2 md:h-1/2 h-full w-full mx-auto object-contain"
            />
          </div>
        );
      })}
    </>
  );
};

const data = [
  {
    category: "Interstellar",
    title: "You can do more with AI.",
    src: "https://imgs.search.brave.com/Y0CAXN6OKePmVjiEV6xd3va3eDTCG4GPYNkNYVK-Kbo/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9maWxt/YXJ0Z2FsbGVyeS5j/b20vY2RuL3Nob3Av/ZmlsZXMvSW50ZXJz/dGVsbGFyLVZpbnRh/Z2UtTW92aWUtUG9z/dGVyLU9yaWdpbmFs/LmpwZz92PTE3Mzg5/MTM0MjMmd2lkdGg9/MTIwMA",
    date: "22/10/18",
    content: "Put something here",
    price: "69$",
  },
  {
    category: "Tennet",
    title: "Enhance your productivity.",
    date: "22/10/18",
    src: "https://imgs.search.brave.com/H0Ar-H-J-0rmWVT2MgH7fLn_ftSbNhP8m6RaMdwj08E/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tLm1l/ZGlhLWFtYXpvbi5j/b20vaW1hZ2VzL0kv/NzFXMmFFY3J4eEwu/anBn",
    content: "hello",
    price: "69$",
  },
  {
    category: "Batman Begins",
    title: "Launching the new Apple Vision Pro.",
    date: "22/10/18",
    src: "https://imgs.search.brave.com/abD98ptMoRK7hdpeGC7gccSMogU7y_IfO5WEdRhS__Q/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pbWFn/ZXMtbmEuc3NsLWlt/YWdlcy1hbWF6b24u/Y29tL2ltYWdlcy9J/LzQxOUJLVEdxUnRM/LmpwZw",
    content: "hello",
    price: "69$",
  },

  {
    category: "Batman The dark knight",
    title: "Maps for your iPhone 15 Pro Max.",
    date: "22/10/18",
    src: "https://imgs.search.brave.com/kzBEaQetOH1_Wu6LUoWqvgyMRTQxgyqd6rW_yX9DR-8/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YXByb3h5LnR2dHJv/cGVzLm9yZy93aWR0/aC8xMjAwL2h0dHBz/Oi8vc3RhdGljLnR2/dHJvcGVzLm9yZy9w/bXdpa2kvcHViL2lt/YWdlcy90aGVfZGFy/a19rbmlnaHRfcG9z/dGVyLmpwZw",
    content: "hello",
    price: "69$",
  },
];

export default AppleCardsCarouselDemo;
