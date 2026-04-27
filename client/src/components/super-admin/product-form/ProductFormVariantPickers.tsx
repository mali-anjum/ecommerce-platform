"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { colors, sizes } from "@/utils/config";
import { Palette, Ruler } from "lucide-react";

interface ProductFormSizePickerProps {
  selectedSizes: string[];
  onToggleSize: (size: string) => void;
}

export function ProductFormSizePicker({
  selectedSizes,
  onToggleSize,
}: ProductFormSizePickerProps) {
  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <Ruler className="h-4 w-4 text-secondary" />
        Sizes
      </Label>
      <div className="flex flex-wrap gap-2">
        {sizes.map((item) => (
          <Button
            key={item}
            type="button"
            onClick={() => onToggleSize(item)}
            variant="outline"
            size="sm"
            className={`rounded-full transition-all duration-300 ${
              selectedSizes.includes(item)
                ? "bg-primary text-primary-foreground border-primary hover:bg-primary-light"
                : "border-border hover:border-primary"
            }`}
          >
            {item}
          </Button>
        ))}
      </div>
    </div>
  );
}

interface ProductFormColorPickerProps {
  selectedColors: string[];
  onToggleColor: (color: string) => void;
}

export function ProductFormColorPicker({
  selectedColors,
  onToggleColor,
}: ProductFormColorPickerProps) {
  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <Palette className="h-4 w-4 text-accent" />
        Colors
      </Label>
      <div className="flex flex-wrap gap-3">
        {colors.map((color) => (
          <button
            key={color.name}
            type="button"
            onClick={() => onToggleColor(color.name)}
            className={`relative h-12 w-12 rounded-full transition-all duration-300 hover:scale-110 ${
              color.class
            } ${
              selectedColors.includes(color.name)
                ? "ring-3 ring-primary ring-offset-2 ring-offset-card"
                : "ring-1 ring-border"
            }`}
            aria-label={`Select ${color.name} color`}
          >
            {selectedColors.includes(color.name) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center">
                  <div className="h-3 w-3 rounded-full bg-white"></div>
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
      {selectedColors.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Selected: {selectedColors.join(", ")}
        </p>
      )}
    </div>
  );
}
