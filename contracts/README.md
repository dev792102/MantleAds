# AdRegistry Smart Contract

This directory contains the Solidity smart contract for storing ad submission details and payment records on the blockchain.

## Contract Overview

The `AdRegistry.sol` contract provides functionality to:

- Store ad submission details (slot ID, content URL, price, duration, etc.)
- Track payment records for each user
- Query ad submissions and payment history
- Deactivate ads when needed

## Contract Functions

### Writing Functions
- `submitAd()` - Submit a new ad with details
- `recordPayment()` - Record a payment (only callable by owner)
- `deactivateAd()` - Deactivate an existing ad

### Reading Functions
- `getUserAdSubmissions()` - Get all ads submitted by a user
- `getUserPayments()` - Get all payments made by a user
- `getUserActiveAds()` - Get IDs of active ads for a user
- `getUserAdCount()` - Get total number of ads submitted by a user
- `getUserTotalPayments()` - Get total amount paid by a user
- `getAdById()` - Get details of a specific ad

## Deployment Instructions

### Prerequisites
- Node.js and npm
- Hardhat or similar Ethereum development framework
- Wallet with testnet funds (for Mantle Sepolia)

### 1. Install Dependencies
```bash
cd contracts
npm install
```

### 2. Set Environment Variables
Create a `.env` file in the contracts directory:
```env
PRIVATE_KEY=your_private_key_without_0x_prefix
MANTLESCAN_API_KEY=your_mantlescan_api_key
```

### 3. Compile Contract
```bash
npm run compile
```

### 4. Deploy to Mantle Sepolia Testnet
```bash
npm run deploy:sepolia
```

### 4. Update Configuration
After deployment, update `config/contracts.ts`:

```typescript
export const CONTRACT_CONFIG = {
  AD_REGISTRY_ADDRESS: '0xYOUR_DEPLOYED_CONTRACT_ADDRESS',
  // ... rest of config
};
```

### 5. Run Tests
```bash
npm test
```

### 6. Generate ABI
The ABI is already included in `config/contracts.ts`. If you modify the contract, regenerate it:

```bash
npm run compile
# Copy the ABI from artifacts/contracts/AdRegistry.sol/AdRegistry.json
```

## Contract Usage

### Submitting an Ad
```typescript
import { adRegistryService } from '@/lib/adRegistry';

const result = await adRegistryService.submitAd(
  'header-banner',
  'https://example.com/ad-image.jpg',
  'image',
  'Product Launch Ad',
  '0.25',
  24 // hours
);
```

### Getting User Ads
```typescript
const ads = await adRegistryService.getUserAdSubmissions(userWalletAddress);
```

### Recording Payments (Owner Only)
```typescript
await adRegistryService.recordPayment(
  userWallet,
  ethers.parseEther('0.25'),
  'MNT',
  '0x123...abc',
  'Mantle Sepolia'
);
```

## Security Considerations

- Only the contract owner can record payments
- Users can only deactivate their own ads
- All monetary values are stored in wei/smallest unit
- Contract includes proper access controls and input validation

## Testing

Create comprehensive tests for:
- Ad submission functionality
- Payment recording
- Access control
- Data retrieval
- Edge cases (expired ads, invalid inputs)

## Network Support

Currently configured for:
- Mantle Sepolia Testnet (Chain ID: 5003)
- Mantle Mainnet (Chain ID: 5000)

Update `config/contracts.ts` to add support for additional networks.