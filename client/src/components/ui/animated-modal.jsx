"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { FcGoogle } from "react-icons/fc";

/**
 * Modal Context to manage modal state
 */
const ModalContext = createContext(undefined);

export const ModalProvider = ({ children }) => {
  const [open, setOpen] = useState(false);
  return (
    <ModalContext.Provider value={{ open, setOpen }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) throw new Error("useModal must be used within a ModalProvider");
  return context;
};

/**
 * Modal Wrapper
 */
export const Modal = ({ children }) => (
  <ModalProvider>{children}</ModalProvider>
);

/**
 * Modal Trigger Button
 */
export const ModalTrigger = ({ children, className }) => {
  const { setOpen } = useModal();
  return (
    <button
      className={cn(
        "px-4 py-2 rounded-md text-black dark:text-white text-center relative overflow-hidden",
        className
      )}
      onClick={() => setOpen(true)}
    >
      {children}
    </button>
  );
};

/**
 * Modal Body with animations and outside click detection
 */
export const ModalBody = ({ children, className }) => {
  const { open, setOpen } = useModal();
  const modalRef = useRef(null);
  useOutsideClick(modalRef, () => setOpen(false));

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, backdropFilter: "blur(10px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          className="fixed inset-0 flex items-center justify-center z-50 h-full w-full"
        >
          <Overlay />
          <motion.div
            ref={modalRef}
            className={cn(
              "min-h-[50%] max-h-[90%] md:max-w-[40%] bg-white dark:bg-neutral-950 border dark:border-neutral-800 md:rounded-2xl relative z-50 flex flex-col flex-1 overflow-hidden",
              className
            )}
            initial={{ opacity: 0, scale: 0.5, rotateX: 40, y: 40 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, rotateX: 10 }}
            transition={{ type: "spring", stiffness: 260, damping: 15 }}
          >
            <CloseIcon />
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Modal Content Wrapper
 */
export const ModalContent = ({ children, className }) => (
  <div className={cn("flex flex-col flex-1 p-8 md:p-10", className)}>
    {children}
  </div>
);

/**
 * Modal Footer Section
 */
export const ModalFooter = ({ children, className }) => (
  <div
    className={cn(
      "flex justify-end p-4 bg-gray-100 dark:bg-neutral-900",
      className
    )}
  >
    {children}
  </div>
);

/**
 * Modal Overlay with animation
 */
const Overlay = ({ className }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1, backdropFilter: "blur(10px)" }}
    exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
    className={`fixed inset-0 h-full w-full bg-black bg-opacity-50 z-40 ${className}`}
  />
);

/**
 * Close Icon (X) Button
 */
const CloseIcon = () => {
  const { setOpen } = useModal();
  return (
    <button
      onClick={() => setOpen(false)}
      className="absolute top-4 right-4 group"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-black dark:text-white h-4 w-4 group-hover:scale-125 group-hover:rotate-3 transition duration-200"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M18 6l-12 12" />
        <path d="M6 6l12 12" />
      </svg>
    </button>
  );
};

/**
 * Hook to detect clicks outside of modal content
 */
export const useOutsideClick = (ref, callback) => {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) return;
      callback(event);
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, callback]);
};

/**
 * Default export for easy imports
 */
export default {
  Modal,
  ModalProvider,
  ModalTrigger,
  ModalBody,
  ModalContent,
  ModalFooter,
};
