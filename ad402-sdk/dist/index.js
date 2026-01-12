// Main exports
export { MantleAdsProvider, useMantleAdsContext, useMantleAdsConfig, useMantleAdsApi } from './components/Ad402Provider';
export { MantleAdsSlot } from './components/Ad402Slot';
// Utility exports
export { createDefaultConfig, validateConfig, isValidUrl, isValidColor, formatPrice, formatTimeRemaining, generateCheckoutUrl, generateUploadUrl, fetchAdData, fetchQueueInfo, createAdDataHook, generateSlotId, parseSlotConfigFromUrl, trackAdEvent } from './utils';
// Default export
export { MantleAdsProvider as default } from './components/Ad402Provider';
