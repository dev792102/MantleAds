/**
 * Direct Payment Verification Service
 * Verifies native MNT transfers (not ERC20 tokens)
 */

import { createPublicClient, http, type Address, type Hash, defineChain } from 'viem';

// Mantle Mainnet Chain definition
const mantle = defineChain({
  id: 5000,
  name: 'Mantle',
  nativeCurrency: {
    decimals: 18,
    name: 'Mantle',
    symbol: 'MNT',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.mantle.xyz'],
      webSocket: ['wss://rpc.mantle.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Mantle Explorer',
      url: 'https://mantlescan.xyz',
    },
  },
});

// Mantle Sepolia Testnet Chain definition
const mantleSepolia = defineChain({
  id: 5003,
  name: 'Mantle Sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Mantle',
    symbol: 'MNT',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.sepolia.mantle.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Mantle Sepolia Explorer',
      url: 'https://sepolia.mantlescan.xyz',
    },
  },
});

// Network configurations
const NETWORKS = {
  mantle: {
    chain: mantle,
    rpcUrl: process.env.MANTLE_RPC_URL || 'https://rpc.mantle.xyz',
  },
  'mantle-sepolia': {
    chain: mantleSepolia,
    rpcUrl: process.env.MANTLE_SEPOLIA_RPC_URL || 'https://rpc.sepolia.mantle.xyz',
  },
} as const;

export interface DirectPaymentVerificationParams {
  transactionHash: Hash;
  network: 'mantle' | 'mantle-sepolia';
  expectedAmount: string; // Amount in MNT (e.g., "10.50")
  expectedRecipient: Address;
  expectedPayer: Address;
}

export interface DirectPaymentVerificationResult {
  verified: boolean;
  amount?: string;
  from?: Address;
  to?: Address;
  blockNumber?: bigint;
  timestamp?: number;
  error?: string;
}

/**
 * Verify a native MNT payment transaction on the blockchain
 * This verifies direct ETH-style transfers, not ERC20 token transfers
 */
export async function verifyDirectPayment(
  params: DirectPaymentVerificationParams
): Promise<DirectPaymentVerificationResult> {
  try {
    const { transactionHash, network, expectedAmount, expectedRecipient, expectedPayer } = params;

    // Get network configuration
    const networkConfig = NETWORKS[network];
    if (!networkConfig) {
      return {
        verified: false,
        error: `Unsupported network: ${network}`,
      };
    }

    // Create public client for blockchain queries
    const client = createPublicClient({
      chain: networkConfig.chain,
      transport: http(networkConfig.rpcUrl),
    });

    // Get transaction receipt
    const receipt = await client.getTransactionReceipt({
      hash: transactionHash,
    });

    // Check if transaction was successful
    if (receipt.status !== 'success') {
      return {
        verified: false,
        error: 'Transaction failed on blockchain',
      };
    }

    // Get full transaction details
    const transaction = await client.getTransaction({
      hash: transactionHash,
    });

    // Get block for timestamp
    const block = await client.getBlock({
      blockNumber: receipt.blockNumber,
    });

    // For native transfers, check the transaction directly
    // Native MNT transfers have:
    // - transaction.from = sender
    // - transaction.to = recipient
    // - transaction.value = amount in wei

    const from = transaction.from;
    const to = transaction.to;
    const amount = transaction.value;

    if (!to || !amount) {
      return {
        verified: false,
        error: 'Transaction is not a native transfer',
      };
    }

    // MNT has 18 decimals
    const amountInMnt = Number(amount) / 1_000_000_000_000_000_000;
    const expectedAmountInMnt = parseFloat(expectedAmount);

    // Verify payer
    if (from.toLowerCase() !== expectedPayer.toLowerCase()) {
      return {
        verified: false,
        error: `Payer mismatch. Expected: ${expectedPayer}, Got: ${from}`,
        from,
        to,
        amount: amountInMnt.toString(),
      };
    }

    // Verify recipient
    if (to.toLowerCase() !== expectedRecipient.toLowerCase()) {
      return {
        verified: false,
        error: `Recipient mismatch. Expected: ${expectedRecipient}, Got: ${to}`,
        from,
        to,
        amount: amountInMnt.toString(),
      };
    }

    // Verify amount (with small tolerance for floating point errors)
    const tolerance = 0.000000000000000001; // 1 wei of MNT (18 decimals)
    if (Math.abs(amountInMnt - expectedAmountInMnt) > tolerance) {
      return {
        verified: false,
        error: `Amount mismatch. Expected: ${expectedAmountInMnt}, Got: ${amountInMnt}`,
        from,
        to,
        amount: amountInMnt.toString(),
      };
    }

    // All checks passed
    return {
      verified: true,
      amount: amountInMnt.toString(),
      from,
      to,
      blockNumber: receipt.blockNumber,
      timestamp: Number(block.timestamp),
    };
  } catch (error) {
    console.error('Direct payment verification error:', error);
    return {
      verified: false,
      error: error instanceof Error ? error.message : 'Unknown verification error',
    };
  }
}

