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
// --- Sync Data Function ---
  const handleSync = async () => {
    setLoadingSync(true);

    // Yeh function `syncAllToBackend` ko pass hoga
    const syncFn = async (unsyncedData) => {
      
      // 👇 STEP 1: Check karein ke Users ke ilawa koi data hai?
      const hasBusinessData = Object.entries(unsyncedData).some(([key, arr]) => {
        if (key === 'users') return false; // Users ko count na karein
        return Array.isArray(arr) && arr.length > 0; // Baqi arrays check karein
      });

      // 👇 STEP 2: Agar Business Data nahi hai to ruk jayen
      if (!hasBusinessData) {
        console.log("⚠️ Only User data found. Skipping server sync to keep local DB dirty.");
        
        // IMPORTANT: Success FALSE return karein taake 
        // `syncAllToBackend` items ko local DB se delete/update na kare.
        return { success: false, reason: "skipped" }; 
      }

      // 👇 STEP 3: API Call (Sab kuch bhejein, Users samait)
      try {
        const response = await axios.post(
          `${API_URL}/sync/syncAllToMongo`,
          unsyncedData, // Pura packet jayega
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return { success: true, syncedIds: response.data.syncedIds };
      } catch (error) {
        console.error("Network sync failed:", error);
        return { success: false, error };
      }
    };

    // --- Execution ---
    try {
      // Wrapper function call
      const result = await syncAllToBackend(syncFn);

      if (result.success) {
        // ✅ Case 1: Data Successfully Server par gaya
        const now = new Date().toLocaleString();
        localStorage.setItem("lastSync", now);
        setLastSync(now);
        toast({
          title: "Success",
          description: "Data synced to cloud successfully.",
        });

      } else if (result.reason === "skipped") {
        // ⚠️ Case 2: Data tha lekin sirf Users ka tha, isliye humne roka
        console.log("Sync skipped. Waiting for business data.");
        toast({
            title: "Up to Date",
            description: "No new business data (Orders/Customers) to sync.",
            variant: "default", 
        });

      } else if (result.reason === "offline") {
        // ❌ Case 3: Internet nahi hai
        toast({
          title: "Offline",
          description: "You are offline. Sync will be attempted later.",
          variant: "destructive",
        });

      } else {
        // ❌ Case 4: Koi aur error (API fail etc)
        throw new Error("Sync failed");
      }

    } catch (error) {
      console.error(error);
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
          families: serverData.families || serverData.familys || [],
          orders: serverData.orders || [],
          invoices: serverData.invoices || [],
          payments: serverData.payments || [],
          measurements: serverData.measurements || [],
          templates: serverData.templates || [],
        };

        // 🔴 CHANGE HERE:
        // Sirf Business Data ka count check karein (Users ko count mein shamil na karein)
        const businessDataCount =
          (normalizedData.customers.length || 0) +
          (normalizedData.families.length || 0) +
          (normalizedData.orders.length || 0) +
          (normalizedData.invoices.length || 0) +
          (normalizedData.payments.length || 0) +
          (normalizedData.measurements.length || 0) +
          (normalizedData.templates.length || 0);

        console.log(
          "Business Data Records (excluding users):",
          businessDataCount
        );

        // 🔴 CHECK: Agar business data 0 se zyada hai tabhi load karein
        if (businessDataCount > 0) {
          await clearAndBulkAdd(normalizedData);
          dataLoadedFromServer = true;

          toast({
            title: "Success",
            description: "Data loaded from cloud into the app.",
          });
        } else {
          console.warn(
            "Backend returned ZERO business records. Skipping DB clear."
          );

          // Optional: Agar aap chahtay hain ke agar data khali ho to user ko bata den
          toast({
            title: "No Data Found",
            description: "Cloud contains only user info but no business data.",
            variant: "warning",
          });
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

    // Fallback: Only load sample data if backend data was NOT loaded
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

  // // --- Profile Update ---
  // const handleProfileUpdate = async (e) => {
  //   e.preventDefault();
  //   setLoadingProfile(true);
  //   try {
  //     await axios.put(`${API_URL}/user/updateProfile`, profileForm, {
  //       headers: { Authorization: `Bearer ${token}` },
  //     });
  //     toast({ title: "Success", description: "Profile updated successfully." });
  //   } catch (error) {
  //     console.error("Profile update error:", error);
  //     toast({
  //       title: "Error",
  //       description: error.response?.data?.error || "Failed to update profile.",
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setLoadingProfile(false);
  //   }
  // };

  // // --- Change Password ---
  // const handlePasswordChange = async (e) => {
  //   e.preventDefault();
  //   if (passwordForm.newPassword.length < 6) {
  //     toast({
  //       title: "Error",
  //       description: "Password must be at least 6 characters.",
  //       variant: "destructive",
  //     });
  //     return;
  //   }
  //   setLoadingPassword(true);
  //   try {
  //     await axios.put(`${API_URL}/user/changePassword`, passwordForm, {
  //       headers: { Authorization: `Bearer ${token}` },
  //     });
  //     toast({
  //       title: "Success",
  //       description: "Password changed successfully.",
  //     });
  //     setPasswordForm({ oldPassword: "", newPassword: "" });
  //   } catch (error) {
  //     console.error("Password change error:", error);
  //     toast({
  //       title: "Error",
  //       description:
  //         error.response?.data?.error || "Failed to change password.",
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setLoadingPassword(false);
  //   }
  // };

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
