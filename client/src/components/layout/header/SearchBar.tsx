"use client";

import { Search, X, Mic, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface SearchBarProps {
  variant?: "desktop" | "mobile";
  onSearch?: (query: string) => void;
}

export function SearchBar({ variant = "desktop", onSearch }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const router = useRouter();

  const popularSearches = [
    "iPhone 15 Pro",
    "MacBook Air M2",
    "Wireless Earbuds",
    "Gaming Laptop",
    "Smart Watch",
    "4K TV",
    "Camera DSLR",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/products?search=${encodeURIComponent(query)}`);
      setQuery("");
      setShowSuggestions(false);
      onSearch?.(query);
    }
  };

  const handleVoiceSearch = () => {
    // Implement voice search functionality
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.lang = 'en-US';
      recognition.start();
      recognition.onresult = (event: any) => {
        setQuery(event.results[0][0].transcript);
      };
    }
  };

  return (
    <div className={`relative ${variant === 'desktop' ? 'w-full max-w-2xl' : 'w-full'}`}>
      <form onSubmit={handleSubmit} className="relative">
        <Input
          type="search"
          placeholder="Search for products, brands, and categories..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          className={`pr-24 bg-background border-2 border-border hover:border-primary/50 focus:border-primary ${
            variant === 'desktop' ? 'rounded-full h-12' : 'rounded-lg h-11'
          }`}
        />
        
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={handleVoiceSearch}
            className="h-8 w-8 rounded-full"
            title="Voice search"
          >
            <Mic className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-full"
            title="Image search"
          >
            <Camera className="h-4 w-4" />
          </Button>
          
          <Button
            type="submit"
            size="icon"
            className="h-9 w-9 rounded-full bg-primary hover:bg-primary/90"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {query && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => setQuery("")}
            className="absolute right-28 top-1/2 -translate-y-1/2 h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </form>

      {/* Search Suggestions */}
      {showSuggestions && query && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-5">
          <div className="p-4">
            {/* Trending Searches */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-2">Trending Searches</h4>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((item) => (
                  <Button
                    key={item}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setQuery(item);
                      handleSubmit(new Event('submit') as any);
                    }}
                    className="rounded-full text-xs"
                  >
                    {item}
                  </Button>
                ))}
              </div>
            </div>

            {/* Suggested Categories */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Suggested Categories</h4>
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm"
                  onClick={() => router.push(`/products?mainCategory=Electronics&search=${encodeURIComponent(query)}`)}
                >
                  Electronics › {query}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm"
                  onClick={() => router.push(`/products?mainCategory=Fashion&search=${encodeURIComponent(query)}`)}
                >
                  Fashion › {query}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}