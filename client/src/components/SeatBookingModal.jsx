"use client";
import React, { useState, useRef } from "react";
import { IconX } from "@tabler/icons-react";
import { motion } from "framer-motion";
import { useOutsideClick } from "@/hooks/use-outside-click";
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


const SeatBookingModal = ({ card, layout, handleClose }) => {
  const [seatNumber, setSeatNumber] = useState("");
  const [userName, setUserName] = useState("");
  const [connected, setConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const containerRef = useRef(null);

  useOutsideClick(containerRef, () => handleClose());

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!seatNumber) {
      alert("Please fill in both fields.");
      return;
    }
  
    if (!window.aptos) {
      alert("Petra Wallet not found. Please install it and try again.");
      return;
    }
  
    try {
      const utf8Encoder = new TextEncoder();
      const payload = {
        type: "entry_function_payload",
        function: `${MODULE_ADDRESS}::nft_tickets::create_ticket`,
        type_arguments: [],
        arguments: [
          Math.floor(Math.random() * 100000) + 1,
          Array.from(utf8Encoder.encode(card.title)), // Movie title
          Array.from(utf8Encoder.encode(seatNumber)), // Seat number
          Math.floor(card.price*1e8),
          ADMIN_WALLET,
        ],
      };
  
      const response = await window.aptos.signAndSubmitTransaction(payload);
      console.log(response.hash);
      if (!(response.hash)) {
        alert("Transaction submission failed ❌");
        return;
      }
  
      await aptosClient.waitForTransaction({ transactionHash: response.hash });
      alert(`Seat ${seatNumber} booked! ✅ Transaction: ${response.hash}`);
  
      setSeatNumber("");
      setUserName("");
    } catch (error) {
      console.error("Transaction failed:", error);
      alert(`Transaction failed ❌: ${error.message || JSON.stringify(error)}`);
    }
  };
  

  return (
    <div className="fixed inset-0 h-screen z-50 overflow-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="bg-black/80 backdrop-blur-lg h-full w-full fixed inset-0"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        ref={containerRef}
        layoutId={layout ? `card-${card.title}` : undefined}
        className="max-w-5xl mx-auto bg-white dark:bg-neutral-900 h-fit z-[60] my-10 p-10 rounded-3xl font-sans relative"
      >
        <button
          className="sticky top-4 h-8 w-8 right-0 ml-auto bg-black dark:bg-white rounded-full flex items-center justify-center"
          onClick={handleClose}
        >
          <IconX className="h-6 w-6 text-neutral-100 dark:text-neutral-900" />
        </button>

        <motion.p
          layoutId={layout ? `category-${card.title}` : undefined}
          className="text-base text-5xl font-bold text-black dark:text-white"
        >
          {card.category}
        </motion.p>
        <motion.p
          layoutId={layout ? `category-${card.title}` : undefined}
          className="text-base text-4xl font-bold text-black dark:text-white"
        >
          {card.price}
        </motion.p>
        <motion.p className="text-base font-medium text-black dark:text-white">
          {card.date}
        </motion.p>

        {/* 💡 Form Section */}
        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div>
            <label className="block text-lg font-medium text-gray-700 dark:text-white">
              Seat Number
            </label>
            <input
              type="text"
              value={seatNumber}
              onChange={(e) => setSeatNumber(e.target.value)}
              placeholder="Enter Seat Number"
              style={{ color: "white" }}
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-neutral-800"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
          >
            BUY
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export { SeatBookingModal };
