"use client";

import { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";
import { putData, clearAndBulkAdd ,clearDB} from "../lib/indexedDB";

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// 🔥 FIX NO 1: Component ke bahar hi check kar lo (Sabse Fast Tarika)
// Taake React ke render hone se pehle hi Token Axios mein lag jaye
if (typeof window !== "undefined") {
  const storedToken = localStorage.getItem("token");
  if (storedToken) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
  }
}

export function AuthProvider({ children }) {
  // 1. State Initialization
  const [token, setToken] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token") || null;
    }
    return null;
  });

  const [user, setUser] = useState(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    }
    return null;
  });

  const [loading, setLoading] = useState(false);

  // 2. Token Sync Listener
  // Ye tab kaam aayega jab banda login/logout karega bina page refresh kiye
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      localStorage.setItem("token", token);
    } else {
      delete axios.defaults.headers.common["Authorization"];
      localStorage.removeItem("token");
    }
  }, [token]);

  // 3. INTERCEPTOR (Smart Wala)
  // Ye ab har choti baat pe logout nahi karega.
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        // Agar 401 aaya, to check karo ke kya ye waqai logout wala issue hai?
        if (error.response && error.response.status === 401) {
          const currentToken = localStorage.getItem("token");

          // Agar token hai hi nahi, to waise hi logout hona chahiye
          // Lekin agar token hai, aur phir bhi 401 aaya, matlab token expire ho gaya
          if (currentToken) {
            console.warn("Token invalid or expired. Logging out...");
            // Logout logic yahan manually run karein taake loop na bane
            setToken(null);
            setUser(null);
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            // Redirect logic agar zaroorat ho:
            // window.location.href = "/login";
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  // Login Function
  const login = async (email, password) => {
    clearDB(); // Clear old DB data on new login
    if (!navigator.onLine) {
      throw new Error("Internet connection required for login.");
    }

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/login`,
        { email, password }
      );

      const { message, token: receivedToken, user: receivedUser } = res.data;

      if (!receivedUser._id && receivedUser.id) {
        receivedUser._id = receivedUser.id;
      }

      // 🔥 Important: Pehle variables set karein
      localStorage.setItem("token", receivedToken); // Direct Storage
      localStorage.setItem("user", JSON.stringify(receivedUser));

      // Phir Axios Header set karein (fauran)
      axios.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${receivedToken}`;

      setToken(receivedToken);
      setUser(receivedUser);

      // Backup Data
      try {
        await putData("users", receivedUser);
      } catch (e) {
        console.warn("DB Save failed", e);
      }

      return { message, token: receivedToken, user: receivedUser };
    } catch (err) {
      throw new Error(err.response?.data?.message || "Login failed.");
    }
  };

  // Register Function
  const register = async (name, email, password, shop_name) => {
    if (!navigator.onLine) throw new Error("No Internet.");

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/register`,
        { name, email, password, shop_name }
      );

      const { token: newToken, user: newUser } = response.data;

      // Pehle DB ka kaam
      await putData("users", newUser);
      await clearAndBulkAdd(newUser._id);

      // Phir Session ka kaam
      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(newUser));

      // Fauran Header Set
      axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

      setToken(newToken);
      setUser(newUser);

      return { success: true, user: newUser };
    } catch (err) {
      throw new Error(err.response?.data?.message || "Registration failed.");
    }
  };

  // Logout Function
  const logout = async () => {
    try {
      if (navigator.onLine && token) {
        await axios.post(`${import.meta.env.VITE_API_URL}/auth/logout`);
      }
    } catch (e) {
      // Ignore API errors during logout
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      delete axios.defaults.headers.common["Authorization"];
      return { success: true };
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
