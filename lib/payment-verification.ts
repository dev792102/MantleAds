/**
 * Payment Verification Service
 * Verifies blockchain transactions to prevent fraud
 */

import { createPublicClient, http, getAddress, type Address, type Hash, defineChain } from 'viem';

// Mantle Chain definition
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

// Network configurations
const NETWORKS = {
  mantle: {
    chain: mantle,
    rpcUrl: process.env.MANTLE_RPC_URL || 'https://rpc.mantle.xyz',
  },
} as const;

// MNT contract addresses on different networks (using wrapped MNT for ERC20 compatibility)
// WMNT Contract Address on Mantle: 0x78c1b0c915c4faa5fffa6cabf0219da63d7f4cb8
const MNT_ADDRESSES = {
  mantle: getAddress('0x78c1b0c915c4faa5fffa6cabf0219da63d7f4cb8'), // Wrapped MNT (WMNT) on Mantle
} as const;

export interface PaymentVerificationParams {
  transactionHash: Hash;
  network: 'mantle';
  expectedAmount: string; // Amount in MNT (e.g., "10.50")
  expectedRecipient: Address;
  expectedPayer: Address;
}

export interface PaymentVerificationResult {
  verified: boolean;
  amount?: string;
  from?: Address;
  to?: Address;
  blockNumber?: bigint;
  timestamp?: number;
  error?: string;
}

/**
 * Verify a MNT payment transaction on the blockchain
 */
export async function verifyPayment(
  params: PaymentVerificationParams
): Promise<PaymentVerificationResult> {
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

    // Verify the transaction is a MNT transfer
    const mntAddress = MNT_ADDRESSES[network];

    // Check if transaction is to the MNT contract
    if (transaction.to?.toLowerCase() !== mntAddress.toLowerCase()) {
      return {
        verified: false,
        error: 'Transaction is not a MNT transfer',
      };
    }

    // Decode the transfer event from logs
    // MNT Transfer event: Transfer(address indexed from, address indexed to, uint256 value)
    const transferEvent = receipt.logs.find(
      (log) =>
        log.address.toLowerCase() === mntAddress.toLowerCase() &&
        log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef' // Transfer event signature
    );

    if (!transferEvent || !transferEvent.topics[1] || !transferEvent.topics[2]) {
      return {
        verified: false,
        error: 'No valid MNT transfer event found',
      };
    }

    // Decode transfer parameters from event
    const from = `0x${transferEvent.topics[1].slice(26)}` as Address; // Remove padding
    const to = `0x${transferEvent.topics[2].slice(26)}` as Address; // Remove padding
    const amount = BigInt(transferEvent.data);

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
    console.error('Payment verification error:', error);
    return {
      verified: false,
      error: error instanceof Error ? error.message : 'Unknown verification error',
    };
  }
}

/**
 * Check if a transaction has been confirmed with a minimum number of blocks
 */
export async function isTransactionConfirmed(
  transactionHash: Hash,
  network: 'mantle',
  minConfirmations: number = 3
): Promise<boolean> {
  try {
    const networkConfig = NETWORKS[network];
    if (!networkConfig) {
      return false;
    }

    const client = createPublicClient({
      chain: networkConfig.chain,
      transport: http(networkConfig.rpcUrl),
    });

    const receipt = await client.getTransactionReceipt({
      hash: transactionHash,
    });

    const currentBlock = await client.getBlockNumber();
    const confirmations = currentBlock - receipt.blockNumber;

    return confirmations >= BigInt(minConfirmations);
  } catch (error) {
    console.error('Error checking transaction confirmations:', error);
    return false;
  }
}

/**
 * Get transaction details for debugging
 */
export async function getTransactionDetails(
  transactionHash: Hash,
  network: 'mantle'
): Promise<{
  success: boolean;
  transaction?: any;
  receipt?: any;
  error?: string;
}> {
  try {
    const networkConfig = NETWORKS[network];
    if (!networkConfig) {
      return {
        success: false,
        error: `Unsupported network: ${network}`,
      };
    }

    const client = createPublicClient({
      chain: networkConfig.chain,
      transport: http(networkConfig.rpcUrl),
    });

    const [transaction, receipt] = await Promise.all([
      client.getTransaction({ hash: transactionHash }),
      client.getTransactionReceipt({ hash: transactionHash }),
    ]);

    return {
      success: true,
      transaction,
      receipt,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
