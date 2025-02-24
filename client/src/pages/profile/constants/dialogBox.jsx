"use client";
import React, { useState } from "react";
import QRCode from "react-qr-code";
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
const QRCodeDialog = ({ isOpen, onClose, seatno, user, price, movie, seatid }) => {
  const [sellPrice, setSellPrice] = useState(""); // Define state inside component

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg text-center">
        <h2 className="text-lg font-semibold mb-4">Scan QR Code</h2>
        <QRCode
          value={`Seat No. ${seatno} | User ID: ${user} | Price: ${price} | Movie: ${movie}`}
          size={150}
        />

        <input
          type="number"
          className="bg-white mt-4 px-2 py-1 border rounded w-full"
          placeholder="Enter sell price"
          value={sellPrice} // Use state variable
          onChange={(e) => setSellPrice(e.target.value)}
        />

        <button
          className="mt-4 px-4 py-2 bg-green-500 text-white rounded"
          onClick={async () => {
            const utf8Encoder = new TextEncoder();
            const payload = {
              type: "entry_function_payload",
              function: `${MODULE_ADDRESS}::nft_tickets::listNewTicket`,
              type_arguments: [],
              arguments: [seatid, utf8Encoder.encode(movie), utf8Encoder.encode(seatno), Math.floor(sellPrice), Math.floor(price*1e8), import.meta.env.VITE_APP_123],
            };
            const response = await window.aptos.signAndSubmitTransaction(payload);
            if (!(response.hash)) {
              alert("Transaction submission failed ❌");
              return;
            }
            await aptosClient.waitForTransaction({ transactionHash: response.hash });

          }
          
        }
        >
          Sell
        </button>

        <button
          className="mt-4 ml-2 px-4 py-2 bg-red-500 text-white rounded"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default QRCodeDialog;
