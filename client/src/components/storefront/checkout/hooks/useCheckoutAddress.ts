import { useState, useEffect, useCallback, useRef } from 'react';
import type { Address } from '@/components/storefront/checkout/types';

export function pickDefaultAddressId(addresses: Address[]): string {
  return addresses.find((address) => address.isDefault)?.id ?? addresses[0]?.id ?? "";
}

export const useCheckoutAddress = (addresses: Address[]) => {
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!hasInitialized.current && addresses.length > 0) {
      setSelectedAddress(pickDefaultAddressId(addresses));
      hasInitialized.current = true;
    }
  }, [addresses]);

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