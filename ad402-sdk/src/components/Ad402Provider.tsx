'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { MantleAdsConfig, MantleAdsContextType, MantleAdsError } from '../types';

// Create the context
const MantleAdsContext = createContext<MantleAdsContextType | null>(null);

// Provider component
export const MantleAdsProvider: React.FC<{
  config: MantleAdsConfig;
  children: React.ReactNode;
}> = ({ config, children }) => {
  const [error, setError] = useState<MantleAdsError | null>(null);

  // Validate configuration
  useEffect(() => {
    if (!config.websiteId) {
      setError({
        code: 'MISSING_WEBSITE_ID',
        message: 'websiteId is required in MantleAdsConfig'
      });
      return;
    }

    if (!config.walletAddress) {
      setError({
        code: 'MISSING_WALLET_ADDRESS',
        message: 'walletAddress is required in MantleAdsConfig'
      });
      return;
    }

    // Basic wallet address validation (Ethereum address format)
    if (!/^0x[a-fA-F0-9]{40}$/.test(config.walletAddress)) {
      setError({
        code: 'INVALID_WALLET_ADDRESS',
        message: 'walletAddress must be a valid Ethereum address (0x...)'
      });
      return;
    }

    // Reset error if config is valid
    setError(null);
  }, [config]);

  // Default configuration values
  const defaultConfig: MantleAdsConfig = {
    apiBaseUrl: config.apiBaseUrl || 'https://mantleads.io', // Use provided apiBaseUrl or default
    theme: {
      primaryColor: '#000000',
      backgroundColor: '#ffffff',
      textColor: '#000000',
      borderColor: '#e5e5e5',
      fontFamily: 'JetBrains Mono, monospace',
      borderRadius: 0
    },
    payment: {
      networks: ['mantle'],
      defaultNetwork: 'mantle',
      recipientAddress: config.walletAddress // Use the provided wallet address
    },
    ...config
  };

  const contextValue: MantleAdsContextType = {
    config: defaultConfig,
    apiBaseUrl: defaultConfig.apiBaseUrl || 'https://mantleads.io'
  };

  // If there's a configuration error, show it
  if (error) {
    return (
      <div style={{
        padding: '16px',
        backgroundColor: '#fee',
        border: '1px solid #fcc',
        borderRadius: '4px',
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#c00'
      }}>
        <strong>MantleAds Configuration Error:</strong> {error.message}
      </div>
    );
  }

  return (
    <MantleAdsContext.Provider value={contextValue}>
      {children}
    </MantleAdsContext.Provider>
  );
};

// Hook to use the context
export const useMantleAdsContext = (): MantleAdsContextType => {
  const context = useContext(MantleAdsContext);
  
  if (!context) {
    throw new Error('useMantleAdsContext must be used within a MantleAdsProvider');
  }
  
  return context;
};

// Hook to get configuration
export const useMantleAdsConfig = (): MantleAdsConfig => {
  const { config } = useMantleAdsContext();
  return config;
};

// Hook to get API base URL
export const useMantleAdsApi = (): string => {
  const { apiBaseUrl } = useMantleAdsContext();
  return apiBaseUrl;
};
