"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DepartmentOptionGroup } from "@/components/layout/site-header/types/site-header.types";

type HeaderDesktopSearchBarProps = {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  selectedDepartment: string;
  onDepartmentSelect: (value: string) => void;
  departmentOptions: DepartmentOptionGroup[];
  onSubmit: (e: React.FormEvent) => void;
};

/** Desktop search: department filter + query field. */
export function HeaderDesktopSearchBar({
  searchQuery,
  onSearchQueryChange,
  selectedDepartment,
  onDepartmentSelect,
  departmentOptions,
  onSubmit,
}: HeaderDesktopSearchBarProps) {
  return (
    <div className="mx-8 hidden max-w-3xl flex-1 lg:flex">
      <form onSubmit={onSubmit} className="relative flex w-full items-center">
        <select
          value={selectedDepartment}
          onChange={(e) => onDepartmentSelect(e.target.value)}
          className="h-10 min-w-[220px] rounded-l-full border border-r-0 border-border/50 bg-card px-3 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">All Departments</option>
          {departmentOptions.map((group) => (
            <optgroup key={group.categoryTitle} label={group.categoryTitle}>
              {group.subcategories.map((sub) => (
                <option key={sub.value} value={sub.value}>
                  {sub.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        <Input
          type="search"
          placeholder="Search futuristic products..."
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          className="rounded-none rounded-r-full border-border/50 bg-card pr-12 focus:border-primary/50"
        />
        <Button
          type="submit"
          size="icon"
          className="absolute right-1 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full"
        >
          <Search className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
