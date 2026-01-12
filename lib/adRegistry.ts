import { ethers } from 'ethers';
import { CONTRACT_CONFIG, AdSubmission, PaymentRecord } from '../../config/contracts';

// Mantle Sepolia network configuration
const MANTLE_SEPOLIA_NETWORK = {
  chainId: 5003,
  name: 'Mantle Sepolia',
  ensAddress: null, // Disable ENS for this network
};

/**
 * Validate and checksum an Ethereum address
 */
export function validateAddress(address: string): string {
  try {
    return ethers.getAddress(address);
  } catch (error) {
    throw new Error(`Invalid Ethereum address: ${address}`);
  }
}

/**
 * Check if an address looks like a valid Ethereum address (basic validation)
 */
export function isValidAddressFormat(address: string): boolean {
  return address &&
         typeof address === 'string' &&
         address.startsWith('0x') &&
         address.length === 42 &&
         /^[0-9a-fA-F]+$/.test(address.slice(2));
}

/**
 * Get contract status information for debugging
 */
export async function getContractStatus(): Promise<{
  address: string;
  isValidFormat: boolean;
  networkCheck: string;
  contractAccessible: boolean;
  error?: string;
}> {
  const address = CONTRACT_CONFIG.AD_REGISTRY_ADDRESS;
  const isValidFormat = isValidAddressFormat(address);

  let networkCheck = 'Not connected';
  let contractAccessible = false;
  let error: string | undefined;

  try {
    if (typeof window !== 'undefined' && window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum, MANTLE_SEPOLIA_NETWORK);
      const network = await provider.getNetwork();
      networkCheck = `Chain ${network.chainId} (${network.name})`;

      if (network.chainId === 5003n && isValidFormat) {
        try {
          const contract = new ethers.Contract(address, CONTRACT_CONFIG.AD_REGISTRY_ABI, provider);
          await contract.owner();
          contractAccessible = true;
        } catch (contractError: any) {
          error = contractError.message;
        }
      }
    }
  } catch (networkError: any) {
    networkCheck = 'Connection failed';
    error = networkError.message;
  }

  return {
    address,
    isValidFormat,
    networkCheck,
    contractAccessible,
    error
  };
}

/**
 * AdRegistry contract service for interacting with the deployed contract
 */
export class AdRegistryService {
  private contract: ethers.Contract | null = null;
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;

  constructor() {
    this.initializeContract();
  }

  /**
   * Initialize the contract with provider
   */
  private async initializeContract() {
    try {
      // For browser environment, use window.ethereum
      if (typeof window !== 'undefined' && window.ethereum) {
        // Create provider with Mantle Sepolia network config to avoid ENS issues
        this.provider = new ethers.BrowserProvider(window.ethereum, MANTLE_SEPOLIA_NETWORK);
        this.signer = await this.provider.getSigner();

        // Ensure contract address is properly formatted
        let contractAddress: string = CONTRACT_CONFIG.AD_REGISTRY_ADDRESS;

        // Basic validation - check if it looks like an Ethereum address
        if (!contractAddress || !contractAddress.startsWith('0x') || contractAddress.length !== 42) {
          const errorMsg = `Contract address must be a valid Ethereum address (42 characters starting with 0x). Got: "${contractAddress}" (length: ${contractAddress?.length || 0})`;
          throw new Error(errorMsg);
        }

        // Check if it's still the placeholder address
        if (contractAddress.toLowerCase() === '0x0000000000000000000000000000000000000000') {
          throw new Error('Contract address not configured. Please update AD_REGISTRY_ADDRESS in config/contracts.ts with your deployed contract address');
        }

        // Try to checksum the address, but don't fail if it doesn't work
        try {
          contractAddress = ethers.getAddress(contractAddress);
          console.log('Contract address validated:', contractAddress);
        } catch (checksumError: any) {
          console.warn('Address checksum validation failed, using as-is:', contractAddress, checksumError.message);
          // Continue with the address as provided - it might still work
        }

        this.contract = new ethers.Contract(
          contractAddress,
          CONTRACT_CONFIG.AD_REGISTRY_ABI,
          this.signer
        );

        console.log('AdRegistry contract initialized successfully at:', contractAddress);

        // Try to call a simple view function to verify the contract exists
        try {
          const owner = await this.contract.owner();
          console.log('Contract owner verified:', owner);
        } catch (contractError: any) {
          console.warn('Contract verification failed - it may not be deployed or accessible:', contractError.message);
          // Don't throw here - the contract object is still created, it just might not work
        }
      }
    } catch (error: any) {
      console.error('Failed to initialize AdRegistry contract:', error);

      // Check if it's an ENS-related error
      if (error?.code === 'UNSUPPORTED_OPERATION' && error?.info?.network) {
        console.error('ENS not supported on this network. Make sure you are connected to the correct network.');
      }
    }
  }

  /**
   * Get contract instance
   */
  private getContract(): ethers.Contract {
    if (!this.contract) {
      throw new Error('Contract not initialized. Make sure wallet is connected to Mantle Sepolia network.');
    }
    return this.contract;
  }

  /**
   * Check if contract is properly initialized and connected to correct network
   */
  async isReady(): Promise<boolean> {
    try {
      if (!this.contract || !this.provider) {
        console.log('Contract or provider not initialized');
        return false;
      }

      // Check network
      const network = await this.provider.getNetwork();
      console.log('Connected to network:', network.name, 'Chain ID:', network.chainId);

      // Mantle Sepolia chain ID is 5003
      if (network.chainId !== 5003n) {
        console.warn(`Wrong network. Expected Mantle Sepolia (5003), got ${network.chainId}`);
        return false;
      }

      // Try to call a simple function to verify contract is accessible
      try {
        await this.contract.owner();
        console.log('Contract is accessible and responding');
        return true;
      } catch (contractError: any) {
        console.warn('Contract call failed - contract may not be deployed:', contractError.message);
        return false;
      }
    } catch (error: any) {
      console.error('Error checking contract readiness:', error.message);
      return false;
    }
  }

  /**
   * Submit a new ad to the contract
   */
  async submitAd(
    slotId: string,
    contentUrl: string,
    contentType: string,
    description: string,
    price: string,
    duration: number
  ): Promise<{ success: boolean; adId?: bigint; error?: string }> {
    try {
      console.log('AdRegistry: Submitting ad to contract', { slotId, contentUrl, price, duration });

      // Ensure contract is initialized
      if (!this.contract) {
        console.log('AdRegistry: Initializing contract...');
        await this.initializeContract();
      }

      const contract = this.getContract();
      console.log('AdRegistry: Contract ready, proceeding with submission');

      // Convert price to wei (assuming MNT has 18 decimals)
      const priceWei = ethers.parseEther(price);

      // Convert duration to seconds (assuming input is in hours)
      const durationSeconds = duration * 60 * 60;

      const tx = await contract.submitAd(
        slotId,
        contentUrl,
        contentType,
        description,
        priceWei,
        durationSeconds
      );

      const receipt = await tx.wait();

      // Extract ad ID from the event
      const event = receipt.logs.find((log: any) => {
        try {
          return contract.interface.parseLog(log)?.name === 'AdSubmitted';
        } catch {
          return false;
        }
      });

      let adId: bigint | undefined;
      if (event) {
        const parsedEvent = contract.interface.parseLog(event);
        adId = parsedEvent?.args[0];
      }

      return { success: true, adId };
    } catch (error) {
      console.error('Failed to submit ad:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get all ad submissions for a user
   */
  async getUserAdSubmissions(userWallet: string): Promise<AdSubmission[]> {
    try {
      // Ensure contract is initialized
      if (!this.contract) {
        await this.initializeContract();
      }

      const contract = this.getContract();

      // Validate user wallet address
      const validatedAddress = ethers.getAddress(userWallet);

      const submissions = await contract.getUserAdSubmissions(validatedAddress);

      return submissions.map((submission: any) => ({
        id: submission.id,
        userWallet: submission.userWallet,
        slotId: submission.slotId,
        contentUrl: submission.contentUrl,
        contentType: submission.contentType,
        description: submission.description,
        price: submission.price,
        duration: submission.duration,
        submittedAt: submission.submittedAt,
        expiresAt: submission.expiresAt,
        paidAt: submission.paidAt,
        transactionHash: submission.transactionHash,
        isActive: submission.isActive,
        isPaid: submission.isPaid,
      }));
    } catch (error) {
      console.error('Failed to get user ad submissions:', error);
      return [];
    }
  }

  /**
   * Get all payment records for a user
   */
  async getUserPayments(userWallet: string): Promise<PaymentRecord[]> {
    try {
      // Ensure contract is initialized
      if (!this.contract) {
        await this.initializeContract();
      }

      const contract = this.getContract();

      // Validate user wallet address
      const validatedAddress = ethers.getAddress(userWallet);

      const payments = await contract.getUserPayments(validatedAddress);

      return payments.map((payment: any) => ({
        amount: payment.amount,
        timestamp: payment.timestamp,
        currency: payment.currency,
        transactionHash: payment.transactionHash,
        network: payment.network,
      }));
    } catch (error) {
      console.error('Failed to get user payments:', error);
      return [];
    }
  }

  /**
   * Get active ads for a user
   */
  async getUserActiveAds(userWallet: string): Promise<bigint[]> {
    try {
      // Ensure contract is initialized
      if (!this.contract) {
        await this.initializeContract();
      }

      const contract = this.getContract();

      // Validate user wallet address
      const validatedAddress = ethers.getAddress(userWallet);

      return await contract.getUserActiveAds(validatedAddress);
    } catch (error) {
      console.error('Failed to get user active ads:', error);
      return [];
    }
  }

  /**
   * Get ad count for a user
   */
  async getUserAdCount(userWallet: string): Promise<bigint> {
    try {
      // Ensure contract is initialized
      if (!this.contract) {
        await this.initializeContract();
      }

      const contract = this.getContract();

      // Validate user wallet address
      const validatedAddress = ethers.getAddress(userWallet);

      return await contract.getUserAdCount(validatedAddress);
    } catch (error) {
      console.error('Failed to get user ad count:', error);
      return 0n;
    }
  }

  /**
   * Get total payments for a user
   */
  async getUserTotalPayments(userWallet: string): Promise<bigint> {
    try {
      // Ensure contract is initialized
      if (!this.contract) {
        await this.initializeContract();
      }

      const contract = this.getContract();

      // Validate user wallet address
      const validatedAddress = ethers.getAddress(userWallet);

      return await contract.getUserTotalPayments(validatedAddress);
    } catch (error) {
      console.error('Failed to get user total payments:', error);
      return 0n;
    }
  }

  /**
   * Mark an ad as paid
   */
  async markAdAsPaid(adId: bigint, transactionHash: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('AdRegistry: Marking ad as paid', { adId: adId.toString(), transactionHash });

      const contract = this.getContract();

      const tx = await contract.markAdAsPaid(adId, transactionHash);
      await tx.wait();

      return { success: true };
    } catch (error) {
      console.error('Failed to mark ad as paid:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Deactivate an ad
   */
  async deactivateAd(adId: bigint): Promise<{ success: boolean; error?: string }> {
    try {
      const contract = this.getContract();

      const tx = await contract.deactivateAd(adId);
      await tx.wait();

      return { success: true };
    } catch (error) {
      console.error('Failed to deactivate ad:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get ad by ID
   */
  async getAdById(adId: bigint): Promise<AdSubmission | null> {
    try {
      const contract = this.getContract();
      const ad = await contract.getAdById(adId);

      return {
        id: ad.id,
        userWallet: ad.userWallet,
        slotId: ad.slotId,
        contentUrl: ad.contentUrl,
        contentType: ad.contentType,
        description: ad.description,
        price: ad.price,
        duration: ad.duration,
        submittedAt: ad.submittedAt,
        expiresAt: ad.expiresAt,
        paidAt: ad.paidAt,
        transactionHash: ad.transactionHash,
        isActive: ad.isActive,
        isPaid: ad.isPaid,
      };
    } catch (error) {
      console.error('Failed to get ad by ID:', error);
      return null;
    }
  }

  /**
   * Format price from wei to MNT
   */
  static formatPrice(priceWei: bigint): string {
    return ethers.formatEther(priceWei);
  }

  /**
   * Format timestamp to readable date
   */
  static formatTimestamp(timestamp: bigint): string {
    return new Date(Number(timestamp) * 1000).toISOString();
  }

  /**
   * Check if ad is expired
   */
  static isAdExpired(expiresAt: bigint): boolean {
    return BigInt(Math.floor(Date.now() / 1000)) > expiresAt;
  }

  /**
   * Get time remaining for ad in hours
   */
  static getTimeRemaining(expiresAt: bigint): number {
    const now = BigInt(Math.floor(Date.now() / 1000));
    if (now >= expiresAt) return 0;

    const remaining = expiresAt - now;
    return Number(remaining) / 3600; // Convert to hours
  }
}

// Singleton instance
export const adRegistryService = new AdRegistryService();

// Helper functions for dashboard
export interface DashboardStats {
  totalRevenue: number;
  activeAds: number;
  totalViews: number;
  totalClicks: number;
}

export interface AdPlacement {
  id: string;
  slotId: string;
  advertiserWallet: string;
  contentType: string;
  description: string;
  price: string;
  status: string;
  viewCount: number;
  clickCount: number;
  expiresAt: string;
  isPaid: boolean;
  transactionHash: string;
  paidAt?: string;
}

/**
 * Get dashboard stats from contract
 */
export async function getDashboardStats(userWallet: string): Promise<DashboardStats> {
  try {
    // Check if contract is ready
    const isReady = await adRegistryService.isReady();
    if (!isReady) {
      console.warn('Contract not ready - wrong network or not initialized');
      return {
        totalRevenue: 0,
        activeAds: 0,
        totalViews: 0,
        totalClicks: 0,
      };
    }

    const [activeAds, totalPayments] = await Promise.all([
      adRegistryService.getUserActiveAds(userWallet),
      adRegistryService.getUserTotalPayments(userWallet),
    ]);

    // Mock data for views and clicks (would come from analytics API)
    const totalViews = 1234;
    const totalClicks = 89;

    return {
      totalRevenue: parseFloat(AdRegistryService.formatPrice(totalPayments)),
      activeAds: activeAds.length,
      totalViews,
      totalClicks,
    };
  } catch (error) {
    console.error('Failed to get dashboard stats:', error);
    return {
      totalRevenue: 0,
      activeAds: 0,
      totalViews: 0,
      totalClicks: 0,
    };
  }
}

/**
 * Get ad placements from contract
 */
export async function getAdPlacements(userWallet: string): Promise<AdPlacement[]> {
  try {
    // Check if contract is ready
    const isReady = await adRegistryService.isReady();
    if (!isReady) {
      console.warn('Contract not ready - wrong network or not initialized');
      return [];
    }

    const submissions = await adRegistryService.getUserAdSubmissions(userWallet);

    return submissions.map((submission) => ({
      id: submission.id.toString(),
      slotId: submission.slotId,
      advertiserWallet: userWallet,
      contentType: submission.contentType,
      description: submission.description,
      price: AdRegistryService.formatPrice(submission.price),
      status: submission.isActive && !AdRegistryService.isAdExpired(submission.expiresAt) ? 'active' : 'expired',
      viewCount: Math.floor(Math.random() * 1000), // Mock data
      clickCount: Math.floor(Math.random() * 100), // Mock data
      expiresAt: AdRegistryService.formatTimestamp(submission.expiresAt),
      isPaid: submission.isPaid,
      transactionHash: submission.transactionHash,
      paidAt: submission.paidAt > 0n ? AdRegistryService.formatTimestamp(submission.paidAt) : undefined,
    }));
  } catch (error) {
    console.error('Failed to get ad placements:', error);
    return [];
  }
}