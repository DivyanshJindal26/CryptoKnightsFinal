import { useState, useEffect } from "react";
import { Aptos } from "@aptos-labs/ts-sdk";
import "./App.css";

const NODE_URL = "https://fullnode.testnet.aptoslabs.com";
const MODULE_ADDRESS =
  "340b3ba2b30cf9a9b7380492fb5c3281d5ff1b8078623dbf9a247b1c9d1ed2cc";

function App() {
  const [connected, setConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [movieTitle, setMovieTitle] = useState("");
  const [movieDate, setMovieDate] = useState("");
  const [movieLocation, setMovieLocation] = useState("");
  const [moviePrice, setMoviePrice] = useState("");
  const [movieImageUrl, setMovieImageUrl] = useState("");
  const [status, setStatus] = useState("");
  const [movies, setMovies] = useState([]);

  const aptosClient = new Aptos({ nodeUrl: NODE_URL });

  useEffect(() => {
    const checkConnection = async () => {
      if (window.aptos) {
        try {
          const response = await window.aptos.account();
          setWalletAddress(response.address);
          setConnected(true);
          fetchMovies(response.address);
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
      fetchMovies(response.address);
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
    } catch (error) {
      console.error("Error disconnecting from Petra Wallet:", error);
    }
  };

  const storeMovie = async () => {
    if (!connected) {
      setStatus("Please connect your wallet first.");
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
          Array.from(utf8Encoder.encode(moviePrice)),
          Array.from(utf8Encoder.encode(movieImageUrl)),
        ],
      };

      console.log("Submitting transaction:", payload);
      const response = await window.aptos.signAndSubmitTransaction(payload);
      console.log("Transaction Response:", response.hash);

      if (!response?.hash) {
        setStatus("Transaction submission failed ❌");
        return;
      }

      await aptosClient.waitForTransaction(response.hash);
      setStatus(`Movie "${movieTitle}" added successfully! ✅`);
      fetchMovies(walletAddress);
    } catch (error) {
      console.error("Transaction failed:", error);
      setStatus(
        `Transaction failed ❌: ${error.message || JSON.stringify(error)}`
      );
    }
  };

  const fetchMovies = async (owner) => {
    try {
      const resource = await aptosClient.view({
        function: `${MODULE_ADDRESS}::nft_tickets::get_movie_titles`,
        type_arguments: [],
        arguments: [owner],
      });
      setMovies(resource);
    } catch (error) {
      console.error("Failed to fetch movies:", error);
    }
  };

  return (
    <div>
      <h1>Aptos NFT Ticketing</h1>
      {connected ? (
        <>
          <p>Connected Wallet: {walletAddress}</p>
          <button onClick={disconnectWallet}>Disconnect Wallet</button>

          <div>
            <input
              type="text"
              placeholder="Enter Movie Title"
              value={movieTitle}
              onChange={(e) => setMovieTitle(e.target.value)}
            />
            <input
              type="text"
              placeholder="Enter Movie Date"
              value={movieDate}
              onChange={(e) => setMovieDate(e.target.value)}
            />
            <input
              type="text"
              placeholder="Enter Movie Location"
              value={movieLocation}
              onChange={(e) => setMovieLocation(e.target.value)}
            />
            <input
              type="text"
              placeholder="Enter Movie Price"
              value={moviePrice}
              onChange={(e) => setMoviePrice(e.target.value)}
            />
            <input
              type="text"
              placeholder="Enter Movie Image URL"
              value={movieImageUrl}
              onChange={(e) => setMovieImageUrl(e.target.value)}
            />
            <button onClick={storeMovie}>Add Movie</button>
          </div>

          {status && <p>{status}</p>}

          <h2>Stored Movies</h2>
          <ul>
            {movies.length > 0 ? (
              movies.map((movie, index) => (
                <li key={index}>
                  {new TextDecoder().decode(new Uint8Array(movie))}
                </li>
              ))
            ) : (
              <p>No movies found.</p>
            )}
          </ul>
        </>
      ) : (
        <button onClick={connectWallet}>Connect Petra Wallet</button>
      )}
    </div>
  );
}

export default App;
