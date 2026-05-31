import { useState, useEffect, useCallback, useRef } from 'react';
import type { Address } from '@/types/checkout';

export const useCheckoutAddress = (addresses: Address[]) => {
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const hasInitialized = useRef(false); // ✅ Add initialization flag

  // ✅ FIX: Only run once when addresses are first loaded
  useEffect(() => {
    // Only set initial address once
    if (!hasInitialized.current && addresses.length > 0) {
      const defaultAddress = addresses.find((addr) => addr.isDefault);
      if (defaultAddress) {
        setSelectedAddress(defaultAddress.id);
      } else {
        setSelectedAddress(addresses[0].id);
      }
      hasInitialized.current = true; // Mark as initialized
    }
  }, [addresses]); // Still depends on addresses but won't run repeatedly

  const handleAddressSelect = useCallback((addressId: string) => {
    setSelectedAddress(addressId);
  }, []);

  const getSelectedAddressDetails = useCallback(() => {
    return addresses.find(addr => addr.id === selectedAddress);
  }, [addresses, selectedAddress]);

  return {
    selectedAddress,
    setSelectedAddress: handleAddressSelect,
    getSelectedAddressDetails,
  };
};