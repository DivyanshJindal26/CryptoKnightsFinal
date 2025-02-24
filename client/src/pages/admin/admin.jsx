import { useState, useEffect } from "react";
import {
  Aptos,
  AptosConfig,
  Network,
  NetworkToNetworkName,
} from "@aptos-labs/ts-sdk";

const ADMIN_WALLET = import.meta.env.VITE_APP_ADMIN_WALLET;
// Fetch Admin Wallet from .env
const NODE_URL = "https://fullnode.testnet.aptoslabs.com";
const MODULE_ADDRESS = import.meta.env.VITE_MODULE_ADDRESS;

const APTOS_NETWORK = NetworkToNetworkName[Network.TESTNET];
const config = new AptosConfig({ network: APTOS_NETWORK });
const aptosClient = new Aptos(config);

const Admin = () => {
  const [connected, setConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [isAdmin, setIsAdmin] = useState(false); // Track if the user is the admin
  const [movieTitle, setMovieTitle] = useState("");
  const [movieDate, setMovieDate] = useState("");
  const [movieLocation, setMovieLocation] = useState("");
  const [moviePrice, setMoviePrice] = useState("");
  const [movieImageUrl, setMovieImageUrl] = useState("");
  const [status, setStatus] = useState("");
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    const checkConnection = async () => {
      if (window.aptos) {
        try {
          const response = await window.aptos.account();
          setWalletAddress(response.address);
          setConnected(true);

          // Check if the connected wallet is the admin
          setIsAdmin(
            response.address.toLowerCase() === ADMIN_WALLET.toLowerCase()
          );

          await fetchMovies(response.address);
        } catch (error) {
          console.log("No wallet connected");
        }
      }
    };
    checkConnection();
  }, []);

  const connectWallet = async () => {
    try {
      if (!window.aptos) {
        setStatus("Petra Wallet not found. Install it and try again.");
        return;
      }
      const response = await window.aptos.connect();
      setWalletAddress(response.address);
      setConnected(true);

      // Check if connected wallet is admin
      setIsAdmin(response.address.toLowerCase() === ADMIN_WALLET.toLowerCase());

      await fetchMovies(response.address);
    } catch (error) {
      console.error("Error connecting to Petra Wallet:", error);
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
      setConnected(false);
      setMovies([]);
      setIsAdmin(false);
    } catch (error) {
      console.error("Error disconnecting from Petra Wallet:", error);
    }
  };

  const storeMovie = async () => {
    if (!connected) {
      setStatus("Please connect your wallet first.");
      return;
    }
    if (!isAdmin) {
      setStatus("Unauthorized: Only the admin can add movies.");
      return;
    }
    if (!movieTitle.trim()) {
      setStatus("Enter a movie title.");
      return;
    }

    try {
      const utf8Encoder = new TextEncoder();
      const payload = {
        type: "entry_function_payload",
        function: `${MODULE_ADDRESS}::nft_tickets::store_movie`,
        type_arguments: [],
        arguments: [
          Array.from(utf8Encoder.encode(movieTitle)),
          Array.from(utf8Encoder.encode(movieDate)),
          Array.from(utf8Encoder.encode(movieLocation)),
          moviePrice,
          Array.from(utf8Encoder.encode(movieImageUrl)),
        ],
      };

      const response = await window.aptos.signAndSubmitTransaction(payload);
      if (!response?.hash) {
        // setStatus("Transaction submission failed ❌");
        // return;
      }

      await aptosClient.waitForTransaction(response.hash);
      setStatus(`Movie "${movieTitle}" added successfully! ✅`);
      await fetchMovies(walletAddress);
    } catch (error) {
      setStatus();
      // `Transaction failed ❌: ${error.message || JSON.stringify(error)}`
    }
  };

  const fetchMovies = async (owner) => {
    if (!owner) return;

    const payload = {
      function: `${MODULE_ADDRESS}::movie::get_movie_titles`,
      type_arguments: [],
      arguments: [
        "0x7cf868fdbd92b783c32efb661aa4c6c09cf6ff5f847a91a57986bf4cc594168b",
      ],
    };

    try {
      const response = await aptosClient.view({ payload });
      const decodedMovies = response.map((movieBytes) =>
        new TextDecoder().decode(new Uint8Array(movieBytes))
      );
      setMovies(decodedMovies);
    } catch (error) {
      setMovies([]);
    }
  };

  return (
    <div className="w-screen h-screen justify-center bg-gray-100 p-6 flex flex-col items-center">
      <h1 className="text-3xl font-bold text-blue-600 mb-4">
        Aptos NFT Ticketing Admin Panel
      </h1>

      {connected ? (
        <div className="w-full max-w-xl bg-white shadow-lg rounded-lg p-6">
          <p className="text-gray-700 text-center mb-4">
            Connected Wallet:{" "}
            <span className="font-semibold">{walletAddress}</span>
          </p>
          <button
            onClick={disconnectWallet}
            className="bg-red-500 text-white px-4 py-2 rounded-md mb-4 w-full"
          >
            Disconnect Wallet
          </button>

          {isAdmin ? (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Movie Title"
                value={movieTitle}
                onChange={(e) => setMovieTitle(e.target.value)}
                style={{ color: "white" }}
                className="w-full border p-2 rounded-md"
              />
              <input
                type="text"
                placeholder="Movie Date"
                value={movieDate}
                onChange={(e) => setMovieDate(e.target.value)}
                style={{ color: "white" }}
                className="w-full border p-2 rounded-md"
              />
              <input
                type="text"
                placeholder="Movie Location"
                value={movieLocation}
                onChange={(e) => setMovieLocation(e.target.value)}
                style={{ color: "white" }}
                className="w-full border p-2 rounded-md"
              />
              <input
                type="text"
                placeholder="Movie Price"
                value={moviePrice}
                onChange={(e) => setMoviePrice(e.target.value)}
                style={{ color: "white" }}
                className="w-full border p-2 rounded-md"
              />
              <input
                type="text"
                placeholder="Movie Image URL"
                value={movieImageUrl}
                onChange={(e) => setMovieImageUrl(e.target.value)}
                style={{ color: "white" }}
                className="w-full border p-2 rounded-md"
              />
              <button
                onClick={storeMovie}
                className="bg-green-500 text-white px-4 py-2 rounded-md w-full"
              >
                Add Movie
              </button>
            </div>
          ) : (
            <p className="text-red-500 text-center font-bold">
              ❌ Access Denied: You are not the admin.
            </p>
          )}

          {status && <p className="mt-4 text-center text-gray-700">{status}</p>}
        </div>
      ) : (
        <button
          onClick={connectWallet}
          className="bg-blue-500 text-white px-4 py-2 rounded-md"
        >
          Connect Petra Wallet (Admin)
        </button>
      )}
    </div>
  );
};

export default Admin;
