"use client";
// import Image from "next/image";
import React, { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOutsideClick } from "@/hooks/use-outside-click";
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
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

const NODE_URL = "https://fullnode.testnet.aptoslabs.com";
const MODULE_ADDRESS = import.meta.env.VITE_MODULE_ADDRESS;
const aptosClient = new Aptos({ nodeUrl: NODE_URL });

const Chat = () => {
  const [active, setActive] = useState(null);
  const [marketTickets, setMarketTickets] = useState([]);

  const ref = useRef(null);
  const id = useId();
  useEffect(() => {
    fetchMarketTickets();
  }, []);

  const fetchMarketTickets = async () => {
    try {
      const baseURL = "https://api.testnet.staging.aptoslabs.com/v1/view";
      const commonArgs = [
        import.meta.env.VITE_APP_123,
      ];
  
      // Define payloads for fetching market ticket data
      const marketTicketPayloads = {
        ticketMovies: {
          function:
            "0x20650f016e8cf109b197528a28f4b2f3f574008fe69b24c3e2b75bd1b8a8aecd::nft_tickets::get_market_ticket_movies",
          type_arguments: [],
          arguments: commonArgs,
        },
        ticketPrices: {
          function:
            "0x20650f016e8cf109b197528a28f4b2f3f574008fe69b24c3e2b75bd1b8a8aecd::nft_tickets::get_market_ticket_prices",
          type_arguments: [],
          arguments: commonArgs,
        },
        ticketSeats: {
          function:
            "0x20650f016e8cf109b197528a28f4b2f3f574008fe69b24c3e2b75bd1b8a8aecd::nft_tickets::get_market_ticket_seats",
          type_arguments: [],
          arguments: commonArgs,
        },
        ticketIds: {
          function: "0x20650f016e8cf109b197528a28f4b2f3f574008fe69b24c3e2b75bd1b8a8aecd::nft_tickets::get_market_ticket_ids",
          type_arguments: [],
          arguments: commonArgs,
        }
      };
  
      // Fetch all market ticket data in parallel
      const responses = await Promise.all(
        Object.entries(marketTicketPayloads).map(([key, payload]) =>
          fetch(baseURL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
            .then((res) => res.json())
            .then((data) => ({ key, data })) // Store key along with data
        )
      );
      console.log("response13234s: ", responses)
      // Convert responses into an object
      const marketData = responses.reduce((acc, { key, data }) => {
        acc[key] = data;
        return acc;
      }, {});
  
      // Debug: Log responses
      console.log("Market Ticket API Responses:", marketData);
  
      // Ensure the API returned arrays
      let { ticketMovies, ticketPrices, ticketSeats, ticketIds } = marketData;
      ticketMovies = ticketMovies[0]
      ticketPrices = ticketPrices[0]
      ticketSeats = ticketSeats[0]
      ticketIds = ticketIds[0]
      if (
        !Array.isArray(ticketMovies) ||
        !Array.isArray(ticketPrices) ||
        !Array.isArray(ticketSeats) ||
        !Array.isArray(ticketIds)
      ) {
        throw new Error("Unexpected response format from API for market tickets");
      }
  
      // Process and store market ticket data
      const marketTicketsArray = ticketMovies.map((movie, index) => ({
        movie: hexToString(movie),
        price: ticketPrices[index] / 1e8,
        seat: hexToString(ticketSeats[index]),
        id: ticketIds[index],
      }));
  
      setMarketTickets(marketTicketsArray);
      console.log("Updated marketTickets state:", marketTicketsArray);
    } catch (error) {
      console.error("Error fetching market tickets:", error);
      setMarketTickets([]);
    }
  };
  

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") {
        setActive(false);
      }
    }

    if (active && typeof active === "object") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active]);
  const [email, setEmail] = useState("");
  useOutsideClick(ref, () => setActive(null));

  const formattedArray = marketTickets.map((ticket) => ({
    movie: ticket.movie,
    price: ticket.price,
    seat: ticket.seat,
    id: ticket.id,
  }));
  
  return (
    <>
      <AnimatePresence>
        {active && typeof active === "object" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 h-full w-full z-10"
          />
        )}
      </AnimatePresence>

      <ul className="max-w-2xl mx-auto w-full gap-4">
        {formattedArray.map((card, index) => (
          <motion.div
            layoutId={`card-${card.movie}-${index}`}
            key={`card-${card.movie}-${index}`}
            onClick={() => setActive(card)}
            className="p-4 flex flex-col md:flex-row justify-between items-center hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl cursor-pointer"
          >
            <div className="flex gap-4 flex-col md:flex-row ">
              <div className="">
                <motion.h3
                  layoutId={`title-${card.movie}-${index}`}
                  className="font-medium text-neutral-800 dark:text-neutral-200 text-center md:text-left"
                >
                  {card.movie}
                </motion.h3>
                <motion.p
                  layoutId={`description-${card.price}-${index}`}
                  className="text-neutral-600 dark:text-neutral-400 text-center md:text-left"
                >
                  Price: {card.price * 1e8} APT, Seat: {card.seat}
                </motion.p>
              </div>
            </div>
            <motion.button
              layoutId={`button-${card.movie}-${id}`}
              className="px-4 py-2 text-sm rounded-full font-bold bg-gray-100 hover:bg-green-500 hover:text-white text-black mt-4 md:mt-0"
              onClick={async (e) => {
                if (!id || !import.meta.env.VITE_APP_123) {
                  alert("Missing required transaction parameters ❌");
                  return;
                }
                if (!window.aptos) {
                  alert("Aptos wallet not detected ❌");
                  return;
                }
                try {
                  const payload = {
                    function: `${MODULE_ADDRESS}::nft_tickets::buy_market_ticket`,
                    type_arguments: [],
                    arguments: [card.id, import.meta.env.VITE_APP_123],
                  };
                  const response = await window.aptos.signAndSubmitTransaction(payload);
                  console.log("response: ", response);
                  if (!response.hash) {
                    alert("Transaction submission failed ❌");
                    return;
                  }
                  await aptosClient.waitForTransaction({ transactionHash: response.hash });
                  alert("Transaction successful ✅");
                } catch (error) {
                  console.error("Transaction error: ", error);
                  alert("Transaction failed ❌");
                }
              }}
            >
              Buy 
            </motion.button>
          </motion.div>
        ))}
      </ul>
    </>
  );
};

export default Chat;
