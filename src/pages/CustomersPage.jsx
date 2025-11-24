"use client";

import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getAllData, deleteData, updateData, addData } from "@/lib/indexedDB";

import CustomerCard from "../components/CustomerCard";
import AddCustomerModal from "../components/AddCustomerModal";
import OrderModal from "../components/OrderModal";
import HistoryModal from "../components/HistoryModal";
import FiltersBar from "../components/FiltersBar";
import { useToast } from "@/hooks/use-toast";
import ViewMeasurementsModal from "../components/ViewMeasurementsModal";
import { Button } from "@/components/ui/button";
import MessageModal from "../components/MessageModal";
import InvoiceModal from "../components/InvoiceModal";

export default function CustomersPage() {
  console.log("Rendering CustomersPage");
  const { toast } = useToast();
  const navigate = useNavigate();

  // Data states
  const [customers, setCustomers] = useState([]);
  const [families, setFamilies] = useState([]);
  const [orders, setOrders] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filteredCustomers, setFilteredCustomers] = useState([]);

  // UI states
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderCustomer, setOrderCustomer] = useState(null);
  const [orderIdToEdit, setOrderIdToEdit] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyCustomer, setHistoryCustomer] = useState(null);
  const [showMeasurementsModal, setShowMeasurementsModal] = useState(false);
  const [measurementsCustomer, setMeasurementsCustomer] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageCustomer, setMessageCustomer] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceCustomer, setInvoiceCustomer] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFamily, setSelectedFamily] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [customersData, familiesData, ordersData, measurementsData] = await Promise.all([
        getAllData('customers'),
        getAllData('families'),
        getAllData('orders'),
        getAllData('measurements'),
      ]);
      setCustomers(customersData);
      setFamilies(familiesData);
      setOrders(ordersData);
      setMeasurements(measurementsData);
      setError("");
    } catch (err) {
      console.error("Data fetching error:", err);
      setError("Failed to load data from the local database.");
      toast({ title: "Error", description: "Failed to load local data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtering logic
  useEffect(() => {
    let filtered = [...customers];

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          (c.name || "").toLowerCase().includes(lower) ||
          (c.phone || "").includes(lower)
      );
    }

    if (selectedFamily) {
      filtered = filtered.filter((c) => c.familyId === selectedFamily);
    }
    
    const customersWithDetails = filtered.map(c => {
      const customerOrders = orders.filter(o => o.customerId === c._id);
      const latestOrder = customerOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
      const hasMeasurement = measurements.some(m => m.customerId === c._id);
      return { ...c, latestOrder, hasMeasurement, orderCount: customerOrders.length };
    }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    if (statusFilter) {
        filtered = customersWithDetails.filter((c) => {
            return c.latestOrder && c.latestOrder.status.toLowerCase() === statusFilter.toLowerCase();
        });
    } else {
        filtered = customersWithDetails;
    }


    setFilteredCustomers(filtered);
  }, [searchTerm, selectedFamily, statusFilter, customers, orders, measurements]);

  // Delete customer
  const deleteCustomer = async (customerId) => {
    if (!confirm("Are you sure you want to delete this customer and all their associated orders and measurements?"))
      return;
    try {
      // Also delete related data
      const relatedOrders = orders.filter(o => o.customerId === customerId);
      const relatedMeasurements = measurements.filter(m => m.customerId === customerId);
      
      await Promise.all([
          ...relatedOrders.map(o => deleteData('orders', o._id)),
          ...relatedMeasurements.map(m => deleteData('measurements', m._id)),
          deleteData('customers', customerId)
      ]);

      toast({ title: "Success", description: "Customer deleted successfully." });
      fetchData();
    } catch (err) {
      console.error("Delete customer error:", err);
      toast({ title: "Error", description: "Failed to delete customer", variant: "destructive" });
    }
  };

  // Modals
  const openOrderModal = (customer, orderId = null) => {
    setOrderCustomer(customer);
    setOrderIdToEdit(orderId);
    setShowOrderModal(true);
  };

  const handleEditLastOrder = (customer) => {
    if (!customer.latestOrder) {
      toast({ title: "No Order Found", description: "No order found for this customer.", variant: "destructive" });
      return;
    }
    openOrderModal(customer, customer.latestOrder._id);
  };

  const openHistoryModal = (customer) => {
    setHistoryCustomer(customer);
    setShowHistoryModal(true);
  };

  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    setShowAddCustomer(true);
  };

  const openMeasurementsModal = (customer) => {
    setMeasurementsCustomer(customer);
    setShowMeasurementsModal(true);
  };

  const handleSendMessage = (customer) => {
    setMessageCustomer(customer);
    setShowMessageModal(true);
  };

  const handleAddMeasurement = (customer) => {
    navigate("/measurements", { state: { customer } });
  };

  const handleOrderDelivered = async (customer) => {
    if (!customer.latestOrder) {
      toast({ title: "No Order Found", variant: "destructive" });
      return;
    }
    if (window.confirm("Mark the last order as delivered and create a full payment record?")) {
      try {
        const orderPayload = { ...customer.latestOrder, status: "delivered", synced: false };
        const paymentPayload = { 
            _id: `local-${Date.now()}`,
            customerId: customer._id, 
            orderId: customer.latestOrder._id, 
            amount: customer.latestOrder.totalAmount - (customer.latestOrder.advancePayment || 0), 
            type: "full", 
            method: "cash",
            synced: false
        };
        await updateData('orders', orderPayload);
        await addData('payments', paymentPayload);
        toast({ title: "Success", description: "Order marked as delivered." });
        fetchData();
      } catch (err) {
        console.error("Order delivered error:", err);
        toast({ title: "Error", description: "Failed to update order status.", variant: "destructive" });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Customers ({filteredCustomers.length})
          </h1>
          <div className="flex items-center gap-2">
            <Button onClick={() => { setEditingCustomer(null); setShowAddCustomer(true); }}>
              ➕ Add Customer
            </Button>
            <Button variant="outline" onClick={fetchData} disabled={loading}>
              🔄 Refresh
            </Button>
          </div>
        </div>

        <FiltersBar
          families={families}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedFamily={selectedFamily}
          setSelectedFamily={setSelectedFamily}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading customers…</div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 p-4 rounded-md text-red-700 text-center">
            {error} <Button onClick={fetchData} className="ml-4">Retry</Button>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No customers found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCustomers.map((c) => (
              <CustomerCard
                key={c._id}
                customer={c}
                onAddOrder={() => openOrderModal(c)}
                onEditLastOrder={() => handleEditLastOrder(c)}
                onViewHistory={() => openHistoryModal(c)}
                onDelete={() => deleteCustomer(c._id)}
                onAddMeasurement={() => handleAddMeasurement(c)}
                onViewMeasurement={() => openMeasurementsModal(c)}
                onOrderDelivered={() => handleOrderDelivered(c)}
                onEditCustomer={() => openEditModal(c)}
                onSendMessage={() => handleSendMessage(c)}
              />
            ))}
          </div>
        )}
      </div>

      <AddCustomerModal
        open={showAddCustomer}
        onClose={() => setShowAddCustomer(false)}
        families={families}
        onSaved={fetchData}
        customerToEdit={editingCustomer}
      />

      <OrderModal
        open={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        customer={orderCustomer}
        editOrderId={orderIdToEdit}
        onSaved={fetchData}
      />

      <HistoryModal
        open={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        customer={historyCustomer}
        orders={orders.filter(o => o.customerId === historyCustomer?._id)}
      />

      <ViewMeasurementsModal
        open={showMeasurementsModal}
        onClose={() => setShowMeasurementsModal(false)}
        customer={measurementsCustomer}
      />

      <MessageModal
        open={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        customer={messageCustomer}
        onSend={(message) => { console.log("Sending message:", message); setShowMessageModal(false); }}
        onConfirmOrder={() => {setShowMessageModal(false);}}
      />

      <InvoiceModal
        open={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        customer={invoiceCustomer}
      />
    </div>
  );
}