"use client";

import SuperAdminSidebar from "@/components/common/organisms/SuperAdminSideBar";
import { cn } from "@/lib/utils";
import { useState } from "react";

function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-background">
      <SuperAdminSidebar
        isOpen={isSidebarOpen}
        toggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div
        className={cn(
          "transition-all duration-300",
          // Align with sidebar: w-72 expanded, w-20 collapsed
          isSidebarOpen ? "ml-72" : "ml-20",
          "min-h-screen"
        )}
      >
        {children}
      </div>
    </div>
  );
}

export default SuperAdminLayout;
