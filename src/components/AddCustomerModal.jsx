import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { addData, updateData } from "@/lib/indexedDB";

export default function AddCustomerModal({
  open,
  onClose,
  families = [],
  onSaved,
  customerToEdit,
}) {
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [familyId, setFamilyId] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const isEditMode = Boolean(customerToEdit);

  useEffect(() => {
    if (isEditMode) {
      setName(customerToEdit.name || "");
      setPhone(customerToEdit.phone || "");
      const initialFamilyId = customerToEdit.familyId;
      if (initialFamilyId && families.some(f => f._id === initialFamilyId)) {
        setFamilyId(initialFamilyId);
      } else {
        setFamilyId("none");
      }
      setAddress(customerToEdit.address || "");
    } else {
      setName("");
      setPhone("");
      setFamilyId("");
      setAddress("");
    }
  }, [customerToEdit, isEditMode, families]);

  const handleSubmit = async () => {
    if (!name || !phone) {
      toast({
        title: "Missing Information",
        description: "Please provide name and phone.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);

    const customerData = {
      name,
      phone,
      address,
      familyId: familyId === "none" ? null : familyId,
      synced: false,
    };

    try {
      if (isEditMode) {
        // Mark edited customer as unsynced so it will be picked up by sync later
        await updateData('customers', { ...customerToEdit, ...customerData, synced: false });
        toast({ title: "Success", description: "Customer updated successfully." });
      } else {
        await addData('customers', { ...customerData, _id: `local-${Date.now()}` });
        toast({ title: "Success", description: "Customer created successfully." });
      }
      onSaved && onSaved();
      onClose();
    } catch (err) {
      console.error("Save customer error:", err);
      toast({
        title: "Error",
        description: "Failed to save customer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-lg">
        <div className="px-6 py-4 border-b">
          <h3 className="text-xl font-semibold">
            {isEditMode ? "Edit Customer" : "Add New Customer"}
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Customer's full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Family</label>
            <Select value={familyId} onValueChange={setFamilyId}>
              <SelectTrigger>
                <SelectValue placeholder="Assign to a family" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No family</SelectItem>
                {families.map((f) => (
                  <SelectItem key={f._id} value={f._id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address (optional)</label>
            <Textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Customer's address"
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : isEditMode ? "Save Changes" : "Create Customer"}
          </Button>
        </div>
      </div>
    </div>
  );
}