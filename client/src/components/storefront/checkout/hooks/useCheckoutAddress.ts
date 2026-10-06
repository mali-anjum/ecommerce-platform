import { useState, useCallback, useMemo } from 'react';
import type { Address } from '@/components/storefront/checkout/types';

/** Default address first, otherwise the first saved one; "" when there are none. */
export function pickDefaultAddressId(addresses: Address[]): string {
  return (addresses.find((addr) => addr.isDefault) ?? addresses[0])?.id ?? "";
}

export const useCheckoutAddress = (addresses: Address[]) => {
  // Only the shopper's explicit choice is state; the default is derived during render.
  const [chosenAddressId, setChosenAddressId] = useState<string | null>(null);

  const selectedAddress = useMemo(() => {
    const stillExists = chosenAddressId !== null && addresses.some((addr) => addr.id === chosenAddressId);
    return stillExists ? chosenAddressId : pickDefaultAddressId(addresses);
  }, [addresses, chosenAddressId]);

  const handleAddressSelect = useCallback((addressId: string) => {
    setChosenAddressId(addressId);
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
