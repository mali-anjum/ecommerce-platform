import axios from "axios";
import { attachAxiosErrorReporting } from "@/lib/monitoring";

export const http = axios.create({
    baseURL: "/api",
    withCredentials: true,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

attachAxiosErrorReporting(http, "http");

http.interceptors.response.use(
    (res) => res,
    (err) => {
        console.error("HTTP error:", err.response?.status);
        return Promise.reject(err);
    }
);