import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import {
  clearAndBulkAdd,
  loadSampleData,
  syncAllToBackend,
} from "@/lib/indexedDB";
import axios from "axios";
import Navbar from "@/components/Navbar";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function SettingsPage() {
  const { toast } = useToast();
  const { user, token } = useAuth();

  const [loadingSync, setLoadingSync] = useState(false);
  const [loadingLoad, setLoadingLoad] = useState(false);
  const [lastSync, setLastSync] = useState(localStorage.getItem("lastSync"));

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    username: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
  });

  // Populate form when user data is available
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        email: user.email || "",
        username: user.username || "",
      });
    }
  }, [user]);

  // --- Input Handlers ---
  const handleProfileFormChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };
  const handlePasswordFormChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  // --- Sync Data ---
  const handleSync = async () => {
    setLoadingSync(true);
    const syncFn = async (unsyncedData) => {
      try {
        const response = await axios.post(
          `${API_URL}/sync/syncAllToMongo`,
          unsyncedData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return { success: true, syncedIds: response.data.syncedIds };
      } catch (error) {
        console.error("Network sync failed:", error);
        return { success: false, error };
      }
    };

    try {
      const result = await syncAllToBackend(syncFn);
      if (result.success) {
        const now = new Date().toLocaleString();
        localStorage.setItem("lastSync", now);
        setLastSync(now);
        toast({
          title: "Success",
          description: "Data synced to cloud successfully.",
        });
      } else if (result.reason === "offline") {
        toast({
          title: "Offline",
          description: "You are offline. Sync will be attempted later.",
          variant: "destructive",
        });
      } else {
        throw new Error("Sync failed");
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to sync data.",
        variant: "destructive",
      });
    } finally {
      setLoadingSync(false);
    }
  };

const handleLoad = async () => {
  setLoadingLoad(true);
  let dataLoadedFromServer = false;

  try {
    const response = await axios.get(`${API_URL}/sync/loadAllFromMongo`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const serverData = response.data?.data;
    console.log(response);    
    

    if (serverData && typeof serverData === "object") {
      // Normalize structure (ensure arrays always exist)
      const normalizedData = {
        users: serverData.users || [],
        customers: serverData.customers || [],
        families: serverData.families || serverData.familys || [], // <-- fix here
        orders: serverData.orders || [],
        invoices: serverData.invoices || [],
        payments: serverData.payments || [],
        measurements: serverData.measurements || [],
        templates: serverData.templates || [],
      };

      // Total items count from backend
      const totalRecords = Object.values(normalizedData)
        .map((arr) => arr?.length || 0)
        .reduce((a, b) => a + b, 0);

      console.log("Backend total records:", totalRecords);

      // Backend has valid data
      if (totalRecords > 0) {
        await clearAndBulkAdd(normalizedData);
        dataLoadedFromServer = true;

        toast({
          title: "Success",
          description: "Data loaded from cloud into the app.",
        });
      } else {
        console.warn("Backend returned ZERO records. Skipping DB clear.");
      }
    }
  } catch (error) {
    console.error("Load from server error:", error);

    toast({
      title: "Server Error",
      description: "Could not fetch data from cloud. Loading sample data.",
      variant: "destructive",
    });
  }

  // Fallback: Only load sample data if backend 0 data was received
  if (!dataLoadedFromServer) {
    try {
      await loadSampleData(user?._id);

      toast({
        title: "Sample Data Loaded",
        description: "Offline sample data is now available.",
      });
    } catch (fallbackError) {
      console.error("Fallback load error:", fallbackError);
      toast({
        title: "Critical Error",
        description: "Failed to load any data.",
        variant: "destructive",
      });
    }
  }

  setLoadingLoad(false);
};


  // --- Profile Update ---
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoadingProfile(true);
    try {
      await axios.put(`${API_URL}/user/updateProfile`, profileForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ title: "Success", description: "Profile updated successfully." });
    } catch (error) {
      console.error("Profile update error:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setLoadingProfile(false);
    }
  };

  // --- Change Password ---
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }
    setLoadingPassword(true);
    try {
      await axios.put(`${API_URL}/user/changePassword`, passwordForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({
        title: "Success",
        description: "Password changed successfully.",
      });
      setPasswordForm({ oldPassword: "", newPassword: "" });
    } catch (error) {
      console.error("Password change error:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.error || "Failed to change password.",
        variant: "destructive",
      });
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-8">Settings</h2>

        {/* Data Sync */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4 text-slate-900">Data Sync</h3>
          <p className="text-slate-600 mb-4">
            Last sync: {lastSync || "Never"}
          </p>
          <div className="flex flex-wrap gap-4">
            <Button onClick={handleSync} disabled={loadingSync || loadingLoad}>
              {loadingSync ? "Syncing..." : "Sync to Cloud"}
            </Button>
            <Button
              onClick={handleLoad}
              disabled={loadingLoad || loadingSync}
              variant="outline"
            >
              {loadingLoad ? "Loading..." : "Load from Cloud"}
            </Button>
          </div>
        </div>

        {/* Profile Settings */}
        {/* <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4 text-slate-900">
            Profile Settings
          </h3>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={profileForm.name}
                onChange={handleProfileFormChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={profileForm.email}
                onChange={handleProfileFormChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                value={profileForm.username}
                onChange={handleProfileFormChange}
              />
            </div>
            <Button type="submit" disabled={loadingProfile || loadingPassword}>
              {loadingProfile ? "Saving..." : "Save Profile"}
            </Button>
          </form>
        </div> */}

        {/* Change Password */}
        {/* <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4 text-slate-900">
            Change Password
          </h3>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="oldPassword">Old Password</Label>
              <Input
                id="oldPassword"
                name="oldPassword"
                type="password"
                value={passwordForm.oldPassword}
                onChange={handlePasswordFormChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={handlePasswordFormChange}
              />
            </div>
            <Button
              type="submit"
              disabled={loadingPassword || loadingProfile}
              variant="outline"
            >
              {loadingPassword ? "Changing..." : "Change Password"}
            </Button>
          </form>
        </div> */}
      </div>
    </div>
  );
}
