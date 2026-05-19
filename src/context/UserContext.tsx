import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "../api";

interface UserStatus {
    plan: string;
    is_premium: boolean;
    is_pro: boolean;
    subscription_expires: string | null;
    messages_remaining: number;
    messages_limit: number;
    full_name: string | null;
}

interface UserContextType {
    status: UserStatus | null;
    loading: boolean;
    refreshStatus: () => Promise<void>;
    isPremium: boolean;
    isPro: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [status, setStatus] = useState<UserStatus | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshStatus = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setStatus(null);
            setLoading(false);
            return;
        }

        try {
            const data = await api.consultant.getStatus();
            setStatus({
                plan: data.plan,
                is_premium: data.premium,
                is_pro: data.pro,
                subscription_expires: data.subscription_expires,
                messages_remaining: data.messages_remaining,
                messages_limit: data.messages_limit,
                full_name: data.full_name
            });
        } catch (err) {
            console.error("Failed to fetch user status", err);
            setStatus({
                plan: "free",
                is_premium: false,
                is_pro: false,
                subscription_expires: null,
                messages_remaining: 0,
                messages_limit: 0,
                full_name: null
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshStatus();
    }, []);

    // Also refresh status when token changes (e.g. login/logout)
    useEffect(() => {
        const handleStorageChange = () => {
            refreshStatus();
        };
        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    const isPremium = true;
    const isPro = true;

    const modifiedStatus = status ? { ...status, plan: "pro" } : null;

    return (
        <UserContext.Provider value={{ status: modifiedStatus, loading, refreshStatus, isPremium, isPro }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
};
