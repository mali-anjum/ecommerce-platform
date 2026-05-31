"use client";

import { useAuthStore } from "@/components/auth/state/useAuthStore";
import React from "react";

export function ProductTableSkeleton() {
  const { user } = useAuthStore();

  if (user?.role === "SUPER_ADMIN" || user?.role === "SELLER") {
    return <AdminProductTableSkeleton />;
  }

  return <ProductPageSkeleton />;
}

function AdminProductTableSkeleton() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-40 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="rounded-lg border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {[...Array(5)].map((_, i) => (
                  <th key={i} className="h-12 px-4 text-left">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="border-t">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-15 h-15 bg-gray-200 rounded animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-32" />
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-24" />
                      </div>
                    </div>
                  </td>
                  {[...Array(4)].map((_, j) => (
                    <td key={j} className="p-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function ProductPageSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {[...Array(6)].map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="bg-gray-200 aspect-[3/4] mb-4 rounded" />
          <div className="h-4 bg-gray-200 rounded mb-2" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}
