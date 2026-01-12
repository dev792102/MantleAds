# 🚀 MantleAds - Decentralized Advertising Platform

> **A next-generation Web3 advertising ecosystem that unifies on-chain payments, decentralized IPFS storage via Pinata, and a competitive bidding model to enable transparent, trustless ad slot management.**

## 🎯 **What is MantleAds?**

MantleAds is a fully decentralized advertising platform designed to transform how publishers monetize traffic and how advertisers acquire visibility. Built for the Web3 ecosystem, it delivers:

- **🔗 On-chain Payments**: Direct, secure MNT token transactions on the Mantle network
- **🌐 IPFS Storage**: Decentralized, persistent ad storage via Pinata
- **⚡ Competitive Bidding Engine**: Fair, real-time bidding for ad slots
- **📱 Modern UI**: Beautiful, responsive interface with Web3 integration
- **🛠️ Plug-and-Play SDK**: Simple developer tools for quick website integration


## 🏗️ **Architecture Overview**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Payment       │    │   Storage       │
│   (Next.js)     │◄──►│   (MNT Direct)  │◄──►│   (IPFS/Pinata) │
│   React App     │    │   Blockchain    │    │   Decentralized │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   MantleAds SDK │    │   API Routes    │    │   Queue System  │
│   Integration   │    │   Serverless    │    │   Bidding       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 **Key Features**

### 💰 **Payment System**
- **MNT Payments**: Direct MNT token transfers for ad purchases
- **Mantle Network**: High-performance, low-cost L2 blockchain
- **Multi-wallet Support**: MetaMask, WalletConnect, and more

### 🎯 **Ad Slot Management**
- **Predefined Sizes**: Banner (728x90), Square (300x250), Mobile (320x60), Sidebar (160x600)
- **Categories**: Technology, General, Demo slots
- **Real-time Status**: Live ad availability and expiration
- **Automatic Expiration**: Time-based ad lifecycle management

### ⚡ **Bidding System**
- **Available Slots**: Immediate purchase at base price
- **Occupied Slots**: Competitive bidding for next available slot
- **Queue Management**: Higher bids get priority
- **Automatic Activation**: Ads activate when current ad expires

### 🌐 **Decentralized Storage**
- **IPFS Integration**: All ads stored on IPFS via Pinata
- **Persistent Storage**: Data survives server restarts and deployments
- **Global Distribution**: Content delivered from IPFS network
- **Caching Strategy**: Optimized performance with IPFS gateways

## 📦 **MantleAds SDK**

The MantleAds SDK makes it incredibly easy to integrate decentralized advertising into any website:

### 🎯 **Quick Integration**

```tsx
// 1. Install the SDK
npm install mantleads-sdk

// 2. Wrap your app with MantleAdsProvider
import { MantleAdsProvider } from 'mantleads-sdk';

export default function RootLayout({ children }) {
  return (
    <MantleAdsProvider
      config={{
        websiteId: 'your-website-id',
        walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        apiBaseUrl: 'https://mantleads.io',
      }}
    >
      {children}
    </MantleAdsProvider>
  );
}

// 3. Add ad slots to your pages
import { MantleAdsSlot } from 'mantleads-sdk';

export default function HomePage() {
  return (
    <div>
      <h1>Welcome to My Website</h1>
      
      {/* Header banner ad */}
      <MantleAdsSlot
        slotId="header-banner"
        size="banner"
        price="0.25"
        category="technology"
      />
      
      <main>
        <p>Your content here...</p>
      </main>
      
      {/* Sidebar ad */}
      <MantleAdsSlot
        slotId="sidebar-ad"
        size="sidebar"
        price="0.15"
        category="general"
      />
    </div>
  );
}
```

### 🔧 **Available Ad Slot Sizes**

| Size | Dimensions | Best For |
|------|------------|----------|
| **banner** | 728x90px | Headers, footers |
| **square** | 300x250px | Sidebars, mid-content |
| **mobile** | 320x60px | Mobile devices |
| **sidebar** | 160x600px | Vertical sidebars |

## 🛠️ **Technical Implementation**

### 🔗 **Blockchain Integration**
- **MNT Token**: Native currency for all transactions
- **Direct Transfers**: Simplified payment flow with direct MNT transfers
- **Mantle Network**: Fast, low-cost L2 blockchain
- **Wallet Integration**: MetaMask and other Web3 wallets

### 🌐 **Storage Architecture**
- **Pinata/IPFS**: Decentralized storage for all ad content
- **HTTP-based Storage**: Efficient ad retrieval via Pinata gateway
- **Persistent Data**: Survives serverless function invocations
- **Global CDN**: Content delivered from IPFS network

### ⚡ **API Endpoints**
- `GET /api/ads/[slotId]` - Retrieve active ad for slot
- `POST /api/upload-ad` - Upload new ad placement
- `GET /api/queue-info/[slotId]` - Get bidding queue information
- `POST /api/analytics/ad-view` - Track ad views
- `POST /api/analytics/ad-click` - Track ad clicks
- `GET /api/health` - System health monitoring
