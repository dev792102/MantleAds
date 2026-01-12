# 🚀 MantleAds - Main Application

This is the main Next.js application for the MantleAds platform. It provides the publisher dashboard, ad upload interface, checkout for advertisers, and the API backend for ad management.

## 🛠️ Built With

- **Next.js 15**: Modern React framework for high-performance web applications.
- **Mantle Network**: High-performance L2 blockchain for direct MNT token transfers.
- **Pinata IPFS**: Decentralized storage for ad assets.
- **Prisma**: Type-safe database client for PostgreSQL.
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development.
- **Shadcn UI**: Beautifully designed accessible components.

## 🚀 Features

- **Direct MNT Payments**: Simplified ad purchasing with direct token transfers.
- **Pinata Integration**: Reliable decentralized storage for ad images and metadata.
- **Real-time Bidding**: Competitive ad slot management with automated queues.
- **Publisher Dashboard**: Track performance and manage ad slots.
- **Seamless Integration**: Ready to be consumed by the MantleAds SDK.

## 🏁 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Pinata API credentials (JWT)
- Mantle network wallet with MNT tokens

### Installation

1. **Clone and Navigate**:
   ```bash
   cd app
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   Create a `.env.local` file with the following:
   ```bash
   DATABASE_URL="postgresql://..."
   PINATA_JWT="your_pinata_jwt"
   PINATA_GATEWAY="https://gateway.pinata.cloud/ipfs/"
   ```

4. **Database Setup**:
   ```bash
   npx prisma db push
   ```

5. **Run Development Server**:
   ```bash
   npm run dev
   ```

## 📂 Project Structure

- `app/api/`: Serverless API routes for ad retrieval, uploads, and bidding.
- `app/checkout/`: Payment and bidding interface for advertisers.
- `app/upload/`: Ad content upload interface.
- `app/dashboard/`: Publisher analytics and management.
- `components/`: Reusable React components (MantleAdsSlot, WalletConnectModal).
- `lib/`: Core logic for Pinata, MNT transfers, and ad services.

## 📄 License

This project is licensed under the MIT License.
