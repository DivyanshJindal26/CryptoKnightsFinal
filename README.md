# 🏆 Ticket Booking System on Aptos Blockchain

## 📌 1. Command to Run Code

### 🔹 Prerequisites
Ensure you have the following installed:
- ✅ *Node.js* (Latest LTS version recommended)
- ✅ *npm* (Comes with Node.js)
- ✅ *Aptos CLI* (For blockchain interaction)
- ✅ *Petra Wallet Account* (Required for authentication and transactions)

### 🚀 Installation & Running the Frontend
sh
cd client
npm install
npm run dev

This will start the frontend development server.

### Youtube demonstration video : https://youtu.be/URwhuox4pbQ
### Our Website link deployed live : http://20.191.66.216:5173/

#### If you face any issues with the live deployed website please localhost the website please.....

---

## 📂 2. Repository Structure
![image](https://github.com/user-attachments/assets/ed4fd6b8-ef48-45c2-b448-05c179127acd)


---

## 📝 3. Summary of the Code
This project is a *decentralized ticket booking system* built on the *Aptos blockchain. It enables users to **buy and sell tickets securely*, ensuring transparency and trust through blockchain technology. The key components of the system are:

### 🔹 *Solution Overview*
Our solution ensures complete *integrity and authenticity* of event tickets by *minting each ticket as a unique NFT* on the *Aptos blockchain. The metadata of each ticket—such as event details, seat numbers, and ownership history—is securely stored on-chain, making it **tamper-proof* and impossible to alter without authorization. This guarantees that every ticket is *genuine*, significantly reducing the risks of counterfeit tickets.

### 🎨 *Frontend (Web Application)*

![Alt Text](https://github.com/RandomYapper/CryptoKnights/blob/main/image_assets/home.jpeg)
![Alt Text](https://github.com/RandomYapper/CryptoKnights/blob/main/image_assets/Dashboard.jpeg)

📌 *Tech Stack:* React (with Vite), Tailwind CSS, JavaScript

🔹 *Responsibilities:*
- 🎟️ *User Interface:* Intuitive event listing, ticket purchase, and resale interface.
- 🔗 *Wallet Integration:* Integration with *Petra Wallet* for authentication and transactions.
- ⛓️ *Blockchain Interaction:* Uses *Aptos SDK* and *Move contract APIs* to interact with the blockchain.


### 🔑 *Admin Panel (Movie Management)*

🔹 *Functionality:*
- 🎬 *Create Movies:* Admins can create new movie listings for ticket sales.

- 📝 *Manage Events:* Modify event details like title, description, pricing, and availability.

- 🎟 *Ticket Configuration:* Set limits on ticket quantities and pricing controls.

- 📊 *View Sales Data:* Track ticket sales and revenue generated from events.

### 🔗 *Smart Contracts (Move on Aptos)*
🔹 *Responsibilities:*
- 🏷 *NFT Ticket Minting:* Each ticket is minted as a *unique NFT* upon purchase.
- 🔍 *Ownership Validation:* Prevents *duplication* and ensures *verifiable ownership*.
- 💰 *Price Controls:* Enforces a *1.5x resale price cap* via smart contract logic.
- 🎶 *Royalty Enforcement:* Implements a *7.5% royalty* on every resale to benefit organizers.

### 🔑 *Wallet (Petra Wallet)*
🔹 *Functionality:*
- 🔐 *User Authentication:* Users *connect wallets* for login and transactions.
- ✍️ *Transaction Signing:* *Petra Wallet* handles user-side transaction approvals.
- 📖 *Onboarding Experience:* Provides guides for *non-crypto users* to set up and use *Petra Wallet*.

---

✅ Ensure your Aptos wallet is set up and configured before interacting with the system.
