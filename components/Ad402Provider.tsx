'use client';

import React, { useEffect } from 'react';
import Script from 'next/script';

interface Ad402ProviderProps {
  publisherWallet: string;
  websiteId?: string;
  network?: string;
  currency?: string;
  apiBaseUrl?: string;
  children: React.ReactNode;
}

// Create context for websiteId
const Ad402Context = React.createContext<{ websiteId?: string }>({});

export const Ad402Provider: React.FC<Ad402ProviderProps> = ({
  publisherWallet,
  websiteId,
  network = 'base',
  currency = 'MNT',
  apiBaseUrl = '/api',
  children
}) => {
  useEffect(() => {
    const initMantleAds = () => {
      if ((window as any).MantleAds) {
        (window as any).MantleAds.init({
          publisherWallet,
          network,
          currency,
          apiBaseUrl
        });
      }
    };

    if ((window as any).MantleAds) {
      initMantleAds();
    } else {
      const checkInterval = setInterval(() => {
        if ((window as any).MantleAds) {
          initMantleAds();
          clearInterval(checkInterval);
        }
      }, 100);

      return () => clearInterval(checkInterval);
    }
  }, [publisherWallet, network, currency, apiBaseUrl]);

  return (
    <Ad402Context.Provider value={{ websiteId }}>
      {/* Disabled MantleAds SDK to prevent modal conflicts with MNT payments */}
      {/* <Script
        src="/js/ad402-sdk.js"
        strategy="beforeInteractive"
        onLoad={() => {
          console.log('MantleAds SDK loaded');
        }}
      /> */}
      {children}
    </Ad402Context.Provider>
  );
};

// Export hook to use context
export const useAd402Context = () => React.useContext(Ad402Context);