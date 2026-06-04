"use client";

import type { AdminCatalogDepartment } from "@/components/products/utils/inferSubcategoryFromTitle";
import axios from "axios";
import { useEffect, useState } from "react";
import { sentryTracker } from "@/lib/monitoring";

export function useProductCatalog() {
  const [catalogDepartments, setCatalogDepartments] = useState<
    AdminCatalogDepartment[]
  >([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchCatalog = async () => {
      setCatalogLoading(true);
      setCatalogError(null);
      try {
        const response = await axios.get("/api/catalog/structure", {
          withCredentials: true,
        });
        const rows = response.data?.data ?? [];
        if (!cancelled && Array.isArray(rows)) {
          setCatalogDepartments(rows as AdminCatalogDepartment[]);
        }
      } catch (err) {
    sentryTracker(err, { source: "useProductCatalog" });
        if (!cancelled) {
          const message = axios.isAxiosError(err)
            ? err.response?.data?.message ||
              err.response?.data?.error ||
              err.message
            : "Could not load departments.";
          setCatalogError(message);
          if (process.env.NODE_ENV === "development") {
            console.error("Failed to fetch catalog structure", err);
          }
        }
      } finally {
        if (!cancelled) {
          setCatalogLoading(false);
        }
      }
    };

    void fetchCatalog();
    return () => {
      cancelled = true;
    };
  }, []);

  return { catalogDepartments, catalogLoading, catalogError };
}
