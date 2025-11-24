import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { addData, getData, updateData } from "@/lib/indexedDB";

const initialItem = { description: "", quantity: 1, rate: 0, deliveryDate: "", status: "pending" };

const initialFormState = {
  _id: null,
  customerId: null,
  items: [initialItem],
  notes: "",
  advancePayment: 0,
  status: "draft",
  deliveryDate: ""
};

export default function OrderModal({ open, onClose, customer, editOrderId = null, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState(initialFormState);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      // Reset form when modal is not open
      setForm(initialFormState);
      return;
    }

    const init = async () => {
      setLoading(true);
      if (editOrderId) {
        try {
          const order = await getData('orders', editOrderId);
          if (order) {
            setForm({
              ...order,
              items: (order.items || []).map(it => ({ ...it, deliveryDate: it.deliveryDate ? it.deliveryDate.split("T")[0] : "" })),
              deliveryDate: order.deliveryDate ? order.deliveryDate.split("T")[0] : ""
            });
          } else {
            toast({ title: "Error", description: "Order not found locally.", variant: "destructive" });
            onClose();
          }
        } catch (err) {
          console.error("Fetch order error:", err);
          toast({ title: "Error", description: "Failed to load order for edit.", variant: "destructive" });
        }
      } else {
        setForm({
          ...initialFormState,
          customerId: customer?._id,
        });
      }
      setLoading(false);
    };

    init();
  }, [open, editOrderId, customer, toast, onClose]);

  const addItem = () => setForm(prev => ({ ...prev, items: [...prev.items, { ...initialItem }] }));
  const removeItem = (i) => setForm(prev => ({ ...prev, items: prev.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i, field, value) => setForm(prev => {
    const items = [...prev.items];
    items[i] = { ...items[i], [field]: value };
    return { ...prev, items };
  });

  const calcTotal = () => form.items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.rate) || 0), 0);

  const submit = async (e) => {
    e?.preventDefault();
    if (!customer && !form.customerId) {
      toast({ title: "Error", description: "Customer not defined", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const totalAmount = calcTotal();
      const payload = {
        ...form,
        customerId: form.customerId || customer._id,
        items: form.items.map(it => ({ ...it, amount: (Number(it.quantity) || 0) * (Number(it.rate) || 0) })),
        totalAmount,
        advancePayment: Number(form.advancePayment) || 0,
        synced: false,
      };

      if (form._id) {
        await updateData('orders', payload);
        toast({ title: "Success", description: "Order updated" });
      } else {
        await addData('orders', { ...payload, _id: `local-${Date.now()}` });
        toast({ title: "Success", description: "Order created" });
      }
      onSaved && onSaved();
      onClose();
    } catch (err) {
      console.error("Save order error:", err);
      toast({ title: "Error", description: "Failed to save order", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-3xl rounded-lg shadow-lg overflow-auto max-h-[90vh]">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">{form._id ? "Edit Order" : `Add Order for ${customer?.name}`}</h3>
          <button onClick={onClose} className="text-gray-600">Close</button>
        </div>

        {loading ? <div className="p-6 text-center">Loading...</div> : (
          <form onSubmit={submit} className="p-6 space-y-4">
            {form.items.map((item, idx) => (
              <div key={idx} className="p-3 border rounded-md bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input required placeholder="Description" className="p-2 border rounded" value={item.description} onChange={(e) => updateItem(idx, "description", e.target.value)} />
                  <input required type="number" placeholder="Qty" min={1} className="p-2 border rounded" value={item.quantity} onChange={(e) => updateItem(idx, "quantity", e.target.value)} />
                  <input required type="number" placeholder="Rate" min={0} className="p-2 border rounded" value={item.rate} onChange={(e) => updateItem(idx, "rate", e.target.value)} />
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Rs. {((item.quantity || 0) * (item.rate || 0)).toFixed(2)}</div>
                  </div>
                </div>
                <div className="mt-2 flex gap-2">
                  <input type="date" value={item.deliveryDate || ""} onChange={(e) => updateItem(idx, "deliveryDate", e.target.value)} className="p-2 border rounded flex-1" />
                  <select value={item.status || "pending"} onChange={(e) => updateItem(idx, "status", e.target.value)} className="p-2 border rounded w-44">
                    <option value="pending">pending</option>
                    <option value="cutting">cutting</option>
                    <option value="stitching">stitching</option>
                    <option value="finishing">finishing</option>
                    <option value="ready">ready</option>
                    <option value="delivered">delivered</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                  {form.items.length > 1 && <button type="button" onClick={() => removeItem(idx)} className="text-red-600">Remove</button>}
                </div>
              </div>
            ))}

            <div>
              <button type="button" onClick={addItem} className="w-full py-2 rounded bg-gray-700 text-white">+ Add Item</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 border rounded">
                <div className="text-sm text-gray-500">Order Total</div>
                <div className="text-2xl font-bold">Rs. {calcTotal().toFixed(2)}</div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm">Advance Payment</label>
                <input type="number" className="p-2 border rounded w-full" value={form.advancePayment || 0} onChange={(e) => setForm(prev => ({ ...prev, advancePayment: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select value={form.status} onChange={(e) => setForm(p => ({ ...p, status: e.target.value }))} className="p-2 border rounded">
                <option value="draft">draft</option>
                <option value="confirmed">confirmed</option>
                <option value="in-progress">in-progress</option>
                <option value="ready">ready</option>
                <option value="delivered">delivered</option>
                <option value="cancelled">cancelled</option>
              </select>
              <input type="date" placeholder="Overall Delivery Date" value={form.deliveryDate || ""} onChange={(e) => setForm(p => ({ ...p, deliveryDate: e.target.value }))} className="p-2 border rounded" />
            </div>

            <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} className="w-full p-2 border rounded h-28" />

            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="flex-1 py-2 bg-gray-100 rounded">Cancel</button>
              <button type="submit" disabled={loading} className="flex-1 py-2 bg-blue-600 text-white rounded">{loading ? "Saving..." : form._id ? "Update Order" : "Create Order"}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}