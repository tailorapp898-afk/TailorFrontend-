import { useEffect, useState } from "react";
import { getAllData } from "@/lib/indexedDB";

export default function HistoryModal({ open, onClose, customer, orders: propOrders }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !customer) return;
    const load = async () => {
      setLoading(true);
      try {
        // Fetch all orders from IndexedDB and filter by customer ID
        const allOrders = await getAllData('orders');
        const customerOrders = allOrders.filter(order => order.customerId === customer._id);
        setOrders(customerOrders || []);
      } catch (err) {
        console.error("History fetch error:", err);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [open, customer]);

  if (!open || !customer) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-4xl rounded-lg shadow-lg overflow-auto max-h-[90vh]">
        <div className="px-6 py-4 border-b flex justify-between">
          <div>
            <h3 className="text-lg font-semibold">Order History — {customer.name}</h3>
            <p className="text-sm text-gray-500">Total: {orders.length}</p>
          </div>
          <div>
            <button onClick={onClose} className="text-gray-600">Close</button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {loading ? (
            <div className="text-center text-gray-500">Loading…</div>
          ) : orders.length === 0 ? (
            <div className="text-center text-gray-500">No orders yet.</div>
          ) : (
            orders.map((o) => (
              <div key={o._id} className="border rounded p-4 bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm text-gray-500">Order ID: {o._id}</div>
                    <div className="text-lg font-semibold mt-1">Status: <span className="capitalize">{o.status}</span></div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Total</div>
                    <div className="text-lg font-bold">Rs. {o.totalAmount?.toFixed(2) || "0.00"}</div>
                  </div>
                </div>

                {o.items && o.items.length > 0 && (
                  <div className="mt-3">
                    {o.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-sm py-1 border-b last:border-b-0">
                        <div>{it.description}</div>
                        <div>{it.quantity} × Rs. {it.rate} = Rs. {(it.quantity * it.rate).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
