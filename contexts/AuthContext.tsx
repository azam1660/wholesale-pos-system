"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface UserSession {
  username: string;
  role: "pos" | "admin";
}

interface AuthContextProps {
  user: UserSession | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Restore session on client mount
    try {
      const savedSession = localStorage.getItem("pos_session");
      if (savedSession) {
        setUser(JSON.parse(savedSession));
      }
    } catch (error) {
      console.error("Failed to restore auth session:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const session: UserSession = data.user;
        setUser(session);
        localStorage.setItem("pos_session", JSON.stringify(session));
        return { success: true };
      } else {
        return { success: false, error: data.error || "Login failed" };
      }
    } catch (error: any) {
      console.error("Login request error:", error);
      return { success: false, error: error.message || "An unexpected error occurred" };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("pos_session");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
