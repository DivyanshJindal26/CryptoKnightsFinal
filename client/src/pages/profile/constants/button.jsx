"use client";
import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalTrigger,
} from "@/components/ui/animated-modal";
import { motion } from "framer-motion";
import { SiHiveBlockchain } from "react-icons/si";
import QRCodeDialog from "./dialogBox";

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
const images = [
  "https://img.freepik.com/free-psd/retro-futurism-ticket-template-design_23-2151894030.jpg?ga=GA1.1.1451144990.1740340154&semt=ais_hybrid",
  "https://img.freepik.com/free-vector/hand-drawn-nft-style-ape-illustration_23-2149611030.jpg?ga=GA1.1.1451144990.1740340154&semt=ais_hybrid",
  "https://img.freepik.com/free-vector/hand-drawn-nft-style-ape-illustration_23-2149611054.jpg?ga=GA1.1.1451144990.1740340154&semt=ais_hybrid",
  "https://img.freepik.com/free-vector/hand-drawn-nft-style-ape-illustration_23-2149622021.jpg?ga=GA1.1.1451144990.1740340154&semt=ais_hybrid",
  "https://img.freepik.com/free-psd/cyber-monday-template-design_23-2151905261.jpg?ga=GA1.1.1451144990.1740340154&semt=ais_hybrid",
];

const fetchUserTickets = async (setUserTickets) => {
  try {
    const baseURL = "https://api.testnet.staging.aptoslabs.com/v1/view";
    const commonArgs = [
      localStorage.getItem("walletAddress"),
    ];

    const userTicketPayloads = {
      ticketIds: {
        function:
          "0x20650f016e8cf109b197528a28f4b2f3f574008fe69b24c3e2b75bd1b8a8aecd::nft_tickets::get_user_ticket_ids",
        type_arguments: [],
        arguments: commonArgs,
      },
      ticketMovies: {
        function:
          "0x20650f016e8cf109b197528a28f4b2f3f574008fe69b24c3e2b75bd1b8a8aecd::nft_tickets::get_user_ticket_movies",
        type_arguments: [],
        arguments: commonArgs,
      },
      ticketPrices: {
        function:
          "0x20650f016e8cf109b197528a28f4b2f3f574008fe69b24c3e2b75bd1b8a8aecd::nft_tickets::get_user_ticket_prices",
        type_arguments: [],
        arguments: commonArgs,
      },
      ticketSeats: {
        function:
          "0x20650f016e8cf109b197528a28f4b2f3f574008fe69b24c3e2b75bd1b8a8aecd::nft_tickets::get_user_ticket_seats",
        type_arguments: [],
        arguments: commonArgs,
      },
    };

    const responses = await Promise.all(
      Object.values(userTicketPayloads).map((payload) =>
        fetch(baseURL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).then((res) => res.json())
      )
    );

    const [ticketIds, ticketMovies, ticketPrices, ticketSeats] = responses.map(
      (res) => res[0]
    );

    if (
      !Array.isArray(ticketIds) ||
      !Array.isArray(ticketMovies) ||
      !Array.isArray(ticketPrices) ||
      !Array.isArray(ticketSeats)
    ) {
      throw new Error("Unexpected response format from API for user tickets");
    }

    const userTicketsArray = ticketIds.map((id, index) => ({
      id,
      movie: hexToString(ticketMovies[index]),
      price: ticketPrices[index] / 1e8,
      seat: hexToString(ticketSeats[index]),
    }));
    console.log(userTicketsArray);
    setUserTickets(userTicketsArray);
  } catch (error) {
    console.error("Error fetching user ticket data:", error);
    setUserTickets([]);
  }
};

export function AnimatedModalDemo() {
  const [showDialog, setShowDialog] = useState(false);
  const [userTickets, setUserTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    fetchUserTickets(setUserTickets);
  }, []);

  return (
    <div className="flex items-center justify-center">
      <Modal>
        <ModalTrigger className="bg-yellow-500 dark:bg-yellow-400 dark:text-black text-black flex justify-center group/modal-btn">
          <span className="group-hover/modal-btn:translate-x-40 text-center transition duration-500">
            Dashboard
          </span>
          <div className="-translate-x-40 group-hover/modal-btn:translate-x-0 flex items-center justify-center absolute inset-0 transition duration-500 text-white z-20">
            <SiHiveBlockchain color="black" />
          </div>
        </ModalTrigger>
        <ModalBody>
          <ModalContent>
            <h4 className="text-lg md:text-5xl text-neutral-600 dark:text-neutral-100 font-bold text-center mb-8">
              Dashboard
            </h4>

            <div className="flex justify-center items-center flex-wrap">

              {userTickets.length > 0 ? (
                userTickets.map((ticket, idx) => (
                  <motion.div
                    key={`ticket-${idx}`}
                    whileHover={{ scale: 1.1, rotate: 0, zIndex: 100 }}
                    whileTap={{ scale: 1.1, rotate: 0, zIndex: 100 }}
                    className="rounded-xl -mr-4 mt-4 p-1 bg-white dark:bg-neutral-800 border border-neutral-100 flex-shrink-0 overflow-hidden"
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setShowDialog(true);
                    }}
                  >
                    <img
                      src={images[idx % images.length]} // Keeping existing images
                      alt="ticket"
                      width="500"
                      height="500"
                      className="rounded-lg h-20 w-20 md:h-40 md:w-40 object-cover flex-shrink-0"
                    />
                    <div className="p-2 text-center text-sm text-neutral-700 dark:text-neutral-300">
                      <p>
                        <strong>Movie:</strong> {ticket.movie}
                      </p>
                      <p>
                        <strong>Seat:</strong> {ticket.seat}
                      </p>
                      <p>
                        <strong>Price:</strong> {ticket.price} APT
                      </p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <p className="text-neutral-700 dark:text-neutral-300">
                  No tickets found
                </p>
              )}
              {selectedTicket && (
                <QRCodeDialog
                  isOpen={showDialog}
                  onClose={() => setShowDialog(false)}
                  seatno={selectedTicket.seat}
                  movie={selectedTicket.movie}
                  user={localStorage.getItem("walletAddress") || "Unknown"}
                  price={selectedTicket.price}
                  seatid={selectedTicket.id}
                />
              )}
            </div>
          </ModalContent>
        </ModalBody>
      </Modal>
    </div>
  );
}
