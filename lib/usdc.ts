import { createPublicClient, createWalletClient, http, parseUnits, formatUnits, keccak256, getContract, getAddress, type Hash, type Address, defineChain } from 'viem';

// Mantle Chain definition
export const mantle = defineChain({
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

// MNT Contract Addresses - MNT is native token, using wrapped MNT (WMNT) for ERC20 operations
// Note: For native MNT transfers, use direct ETH-style transfers instead of ERC20
// WMNT Contract Address on Mantle: 0x78c1b0c915c4faa5fffa6cabf0219da63d7f4cb8
export const MNT_CONTRACTS = {
  mantle: getAddress('0x78c1b0c915c4faa5fffa6cabf0219da63d7f4cb8'), // Wrapped MNT (WMNT) on Mantle Mainnet
};

// MNT Configuration with correct EIP-712 details
// Using wrapped MNT (WMNT) for ERC20 compatibility
export const MNT_CONFIG = {
  5000: { // Mantle Mainnet
    address: getAddress('0x78c1b0c915c4faa5fffa6cabf0219da63d7f4cb8'), // Wrapped MNT (WMNT)
    name: 'Wrapped Mantle',
    version: '1',
    decimals: 18 // MNT uses 18 decimals
  }
} as const;

// MNT Contract ABI (minimal for transferWithAuthorization)
// Using ERC20 ABI for wrapped MNT (WMNT)
export const USDC_ABI = [
  {
    "inputs": [
      { "name": "from", "type": "address" },
      { "name": "to", "type": "address" },
      { "name": "value", "type": "uint256" },
      { "name": "validAfter", "type": "uint256" },
      { "name": "validBefore", "type": "uint256" },
      { "name": "nonce", "type": "bytes32" },
      { "name": "v", "type": "uint8" },
      { "name": "r", "type": "bytes32" },
      { "name": "s", "type": "bytes32" }
    ],
    "name": "transferWithAuthorization",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "name": "account", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "owner", "type": "address" },
      { "name": "spender", "type": "address" }
    ],
    "name": "allowance",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{ "name": "", "type": "uint8" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [{ "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "version",
    "outputs": [{ "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export interface TransferWithAuthorizationParams {
  from: Address;
  to: Address;
  value: string; // Amount in MNT (18 decimals)
  validAfter: bigint;
  validBefore: bigint;
  nonce: Hash;
  v: number;
  r: Hash;
  s: Hash;
}

export class MNTService {
  private publicClient: any;
  private walletClient: any;
  private contract: any;
  private chainId: number;
  private config: typeof MNT_CONFIG[5000];

  constructor(publicClient: any, walletClient: any, chainId: number) {
    this.publicClient = publicClient;
    this.walletClient = walletClient;
    this.chainId = chainId;
    
    // Get configuration for this chain
    this.config = this.getMNTConfig(chainId);
    
    this.contract = getContract({
      address: this.config.address as Address,
      abi: USDC_ABI,
      client: {
        public: publicClient,
        wallet: walletClient
      }
    });
  }

  private getMNTConfig(chainId: number) {
    const config = MNT_CONFIG[chainId as keyof typeof MNT_CONFIG];
    if (!config) {
      throw new Error(`Unsupported chain ID: ${chainId}. Supported chains: 5000 (Mantle)`);
    }
    return config;
  }

  // Static method to check if chain is supported
  static isSupportedChain(chainId: number): boolean {
    return chainId === 5000;
  }

  // Static method to get MNT config
  static getMNTConfig(chainId: number) {
    return MNT_CONFIG[chainId as keyof typeof MNT_CONFIG] || null;
  }

  async getBalance(address: Address): Promise<string> {
    try {
      console.log('Fetching MNT balance for address:', address);
      console.log('Using contract address:', this.contract.address);
      console.log('Chain ID:', this.chainId);
      
      const balance = await this.contract.read.balanceOf([address]);
      console.log('Raw balance from contract:', balance.toString());
      
      const formattedBalance = formatUnits(balance, this.config.decimals);
      console.log('Formatted balance:', formattedBalance);
      
      return formattedBalance;
    } catch (error) {
      console.error('Error fetching MNT balance:', error);
      return '0';
    }
  }

  async getAllowance(owner: Address, spender: Address): Promise<string> {
    const allowance = await this.contract.read.allowance([owner, spender]);
    return formatUnits(allowance, this.config.decimals);
  }

  async transferWithAuthorization(params: TransferWithAuthorizationParams): Promise<Hash> {
    const {
      from,
      to,
      value,
      validAfter,
      validBefore,
      nonce,
      v,
      r,
      s
    } = params;

    // Convert value to wei (18 decimals for MNT)
    const valueInWei = parseUnits(value, this.config.decimals);

    return await this.contract.write.transferWithAuthorization([
      from,
      to,
      valueInWei,
      validAfter,
      validBefore,
      nonce,
      v,
      r,
      s
    ]);
  }

  // Generate EIP-712 signature for transferWithAuthorization with correct domain details
  async generateTransferWithAuthorizationSignature(
    from: Address,
    to: Address,
    value: string,
    validAfter: bigint,
    validBefore: bigint,
    nonce: Hash
  ): Promise<{ v: number; r: Hash; s: Hash; signature: Hash }> {
    // Use correct EIP-712 domain based on chain
    const domain = {
      name: this.config.name, // "Wrapped Mantle" for Mantle
      version: this.config.version, // "1" for Mantle
      chainId: this.chainId,
      verifyingContract: this.config.address
    };

    const types = {
      TransferWithAuthorization: [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'validAfter', type: 'uint256' },
        { name: 'validBefore', type: 'uint256' },
        { name: 'nonce', type: 'bytes32' }
      ]
    };

    const message = {
      from,
      to,
      value: parseUnits(value, this.config.decimals),
      validAfter,
      validBefore,
      nonce
    };

    console.log('EIP-712 Domain:', domain);
    console.log('EIP-712 Message:', message);

    const signature = await this.walletClient.signTypedData({
      domain,
      types,
      primaryType: 'TransferWithAuthorization',
      message
    });

    // Parse the signature to get v, r, s
    const sig = signature.slice(2); // Remove 0x prefix
    const r = `0x${sig.slice(0, 64)}` as Hash;
    const s = `0x${sig.slice(64, 128)}` as Hash;
    const v = parseInt(sig.slice(128, 130), 16);

    return {
      v,
      r,
      s,
      signature: signature as Hash
    };
  }

  // Generate a random nonce (browser-compatible)
  generateNonce(): Hash {
    // Use crypto.getRandomValues instead of Node.js randomBytes for browser compatibility
    const randomArray = new Uint8Array(32);
    crypto.getRandomValues(randomArray);
    
    // Convert to hex string
    const hexString = '0x' + Array.from(randomArray)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return keccak256(hexString as Hash);
  }

  // Get current timestamp
  getCurrentTimestamp(): bigint {
    return BigInt(Math.floor(Date.now() / 1000));
  }

  // Get token info
  getTokenInfo() {
    return {
      name: this.config.name,
      address: this.config.address,
      decimals: this.config.decimals,
      version: this.config.version,
      chainId: this.chainId
    };
  }

  // Validate transfer parameters
  validateTransferParams(
    from: Address,
    to: Address,
    value: string,
    validAfter: bigint,
    validBefore: bigint
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate addresses
    if (!from || from.length !== 42 || !from.startsWith('0x')) {
      errors.push('Invalid from address');
    }
    if (!to || to.length !== 42 || !to.startsWith('0x')) {
      errors.push('Invalid to address');
    }

    // Validate value
    try {
      const valueNum = parseFloat(value);
      if (valueNum <= 0) {
        errors.push('Value must be greater than 0');
      }
      if (valueNum > 1000000) { // Arbitrary large number check
        errors.push('Value seems too large');
      }
    } catch (e) {
      errors.push('Invalid value format');
    }

    // Validate timestamps
    const currentTime = this.getCurrentTimestamp();
    if (validBefore <= currentTime) {
      errors.push('validBefore must be in the future');
    }
    if (validAfter >= validBefore) {
      errors.push('validAfter must be before validBefore');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Helper method to format amounts for display
  formatAmount(amount: string): string {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(num);
  }

  // Helper method to get network name
  getNetworkName(): string {
    switch (this.chainId) {
      case 5000:
        return 'Mantle';
      default:
        return `Chain ${this.chainId}`;
    }
  }
}