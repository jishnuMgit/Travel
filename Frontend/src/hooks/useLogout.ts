import { useState } from "react";
import { API_BASE_URL } from "../config/api";
import { clearStoredUser } from "../utils/authStorage";

export const useLogout = () => {
  const [loading, setLoading] = useState(false);

  const logout = async (): Promise<boolean> => {
    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Logout failed");
      }

      clearStoredUser();

      return true;
    } catch (error) {
      console.error("Logout error:", error);

      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    logout,
    loading,
  };
};
