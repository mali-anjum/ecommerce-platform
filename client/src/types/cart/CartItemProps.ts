export interface CartItemProps {
  item: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string | null;
    color?: string | null;
    size?: string | null;
    originalPrice?: number;
  };
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onUpdateQuantity: (id: string, quantity: number) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  isUpdating: boolean;
}
