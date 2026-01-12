/**
 * Initialize default ad slots in the database
 * This ensures slots exist before the first ad purchase
 */

import { prisma } from '@/lib/prisma';

// Default slot configurations
const DEFAULT_SLOTS = [
  {
    slotIdentifier: 'header-banner',
    size: 'banner',
    width: 728,
    height: 90,
    basePrice: 0.25,
    category: 'technology',
    durations: ['5m', '10m', '30m', '1h'],
  },
  {
    slotIdentifier: 'sidebar',
    size: 'sidebar',
    width: 160,
    height: 600,
    basePrice: 0.20,
    category: 'general',
    durations: ['5m', '10m', '30m', '1h'],
  },
  {
    slotIdentifier: 'mid-article',
    size: 'square',
    width: 300,
    height: 250,
    basePrice: 0.15,
    category: 'technology',
    durations: ['5m', '10m', '30m', '1h'],
  },
  {
    slotIdentifier: 'footer-banner',
    size: 'banner',
    width: 728,
    height: 90,
    basePrice: 0.18,
    category: 'general',
    durations: ['5m', '10m', '30m', '1h'],
  },
];

/**
 * Initialize default slots for a publisher
 */
export async function initializeDefaultSlots(publisherWallet: string): Promise<void> {
  try {
    // Get or create publisher
    let publisher = await prisma.publisher.findUnique({
      where: { walletAddress: publisherWallet.toLowerCase() },
    });

    if (!publisher) {
      publisher = await prisma.publisher.create({
        data: {
          walletAddress: publisherWallet.toLowerCase(),
          websiteDomain: 'example.com',
        },
      });
      console.log(`Created publisher: ${publisherWallet}`);
    }

    // Create default slots if they don't exist
    for (const slotConfig of DEFAULT_SLOTS) {
      const existingSlot = await prisma.adSlot.findFirst({
        where: {
          publisherId: publisher.id,
          slotIdentifier: slotConfig.slotIdentifier,
        },
      });

      if (!existingSlot) {
        await prisma.adSlot.create({
          data: {
            publisherId: publisher.id,
            slotIdentifier: slotConfig.slotIdentifier,
            size: slotConfig.size,
            width: slotConfig.width,
            height: slotConfig.height,
            basePrice: slotConfig.basePrice,
            currency: 'MNT',
            network: 'mantle-sepolia', // Default to testnet
            durationOptions: slotConfig.durations,
            category: slotConfig.category,
            websiteUrl: 'https://example.com',
            active: true,
          },
        });
        console.log(`Created slot: ${slotConfig.slotIdentifier}`);
      } else {
        console.log(`Slot already exists: ${slotConfig.slotIdentifier}`);
      }
    }

    console.log('Default slots initialized successfully');
  } catch (error) {
    console.error('Error initializing default slots:', error);
    throw error;
  }
}

