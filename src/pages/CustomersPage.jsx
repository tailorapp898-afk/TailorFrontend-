"use client";

import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getAllData, deleteData, updateData, addData } from "@/lib/indexedDB";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

// Modals
import AddCustomerModal from "../components/AddCustomerModal";
import OrderModal from "../components/OrderModal";
import HistoryModal from "../components/HistoryModal";
import ViewMeasurementsModal from "../components/ViewMeasurementsModal";
import InvoiceModal from "../components/InvoiceModal";

// Icons
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Phone,
  Ruler,
  History,
  ShoppingBag,
  Send,
  Trash2,
  User,
  CheckCircle,
  AlertCircle,
  FileText,
  Pencil,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function CustomersPage() {
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
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceCustomer, setInvoiceCustomer] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFamily, setSelectedFamily] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // --- Data Fetching ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [customersData, familiesData, ordersData, measurementsData] =
        await Promise.all([
          getAllData("customers"),
          getAllData("families"),
          getAllData("orders"),
          getAllData("measurements"),
        ]);
      setCustomers(customersData);
      setFamilies(familiesData);
      setOrders(ordersData);
      setMeasurements(measurementsData);
      setError("");
    } catch (err) {
      console.error("Data fetching error:", err);
      setError("Failed to load data.");
      toast({
        title: "Error",
        description: "Failed to load data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Filtering Logic ---
  useEffect(() => {
    let filtered = [...customers];

    // 1. Search
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          (c.name || "").toLowerCase().includes(lower) ||
          (c.phone || "").includes(lower)
      );
    }

    // 2. Family
    if (selectedFamily && selectedFamily !== "all") {
      filtered = filtered.filter((c) => c.familyId === selectedFamily);
    }

    // 3. Attach Details & Sort
    const customersWithDetails = filtered
      .map((c) => {
        const customerOrders = orders.filter((o) => o.customerId === c._id);
        const latestOrder = customerOrders.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        )[0];
        const hasMeasurement = measurements.some((m) => m.customerId === c._id);
        return {
          ...c,
          latestOrder,
          hasMeasurement,
          orderCount: customerOrders.length,
        };
      })
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    // 4. Status Filter
    if (statusFilter && statusFilter !== "all") {
      filtered = customersWithDetails.filter((c) => {
        return (
          c.latestOrder &&
          c.latestOrder.status.toLowerCase() === statusFilter.toLowerCase()
        );
      });
    } else {
      filtered = customersWithDetails;
    }

    setFilteredCustomers(filtered);
  }, [
    searchTerm,
    selectedFamily,
    statusFilter,
    customers,
    orders,
    measurements,
  ]);

  // --- Actions ---
  const deleteCustomer = async (customerId) => {
    if (
      !confirm("Are you sure? This will delete the customer and all history.")
    )
      return;
    try {
      const relatedOrders = orders.filter((o) => o.customerId === customerId);
      const relatedMeasurements = measurements.filter(
        (m) => m.customerId === customerId
      );

      await Promise.all([
        ...relatedOrders.map((o) => deleteData("orders", o._id)),
        ...relatedMeasurements.map((m) => deleteData("measurements", m._id)),
        deleteData("customers", customerId),
      ]);

      toast({
        title: "Deleted",
        description: "Customer removed successfully.",
      });
      fetchData();
    } catch (err) {
      toast({
        title: "Error",
        description: "Delete failed",
        variant: "destructive",
      });
    }
  };

  const handleOrderDelivered = async (customer) => {
    if (!customer.latestOrder) return;
    if (window.confirm("Mark order as delivered and record full payment?")) {
      try {
        const orderPayload = {
          ...customer.latestOrder,
          status: "delivered",
          synced: false,
        };
        const paymentPayload = {
          _id: `local-${Date.now()}`,
          customerId: customer._id,
          orderId: customer.latestOrder._id,
          amount:
            customer.latestOrder.totalAmount -
            (customer.latestOrder.advancePayment || 0),
          type: "full",
          method: "cash",
          synced: false,
        };
        await updateData("orders", orderPayload);
        await addData("payments", paymentPayload);
        toast({ title: "Success", description: "Order marked as delivered." });
        fetchData();
      } catch (err) {
        toast({ title: "Error", variant: "destructive" });
      }
    }
  };

  // --- Render Helpers ---
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return "bg-green-100 text-green-700 border-green-200";
      case "processing":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "pending":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-blue-950 tracking-tight">
              Customers
            </h1>
            <p className="text-blue-600/80 mt-1">
              Manage orders, measurements, and history.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-lg border border-blue-100 shadow-sm flex items-center">
              <span className="px-3 text-sm font-medium text-slate-500">
                Total: {filteredCustomers.length}
              </span>
            </div>
            <Button
              onClick={() => {
                setEditingCustomer(null);
                setShowAddCustomer(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Customer
            </Button>
          </div>
        </div>

        {/* Search & Filters Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
              <select
                value={selectedFamily}
                onChange={(e) => setSelectedFamily(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:border-blue-500 min-w-[140px]"
              >
                <option value="all">All Families</option>
                {families.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.name}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:border-blue-500 min-w-[140px]"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="delivered">Delivered</option>
              </select>

              <Button
                variant="ghost"
                size="icon"
                onClick={fetchData}
                className="text-slate-400 hover:text-blue-600"
              >
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-blue-300 animate-pulse">
            <div className="w-12 h-12 bg-blue-100 rounded-full mb-4"></div>
            <p>Loading customers...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-center">
            {error}{" "}
            <Button variant="link" onClick={fetchData}>
              Retry
            </Button>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-blue-300" />
            </div>
            <h3 className="text-lg font-medium text-slate-700">
              No customers found
            </h3>
            <p className="text-slate-400 text-sm mt-1 mb-4">
              Try adjusting your filters or add a new customer.
            </p>
            <Button onClick={() => setShowAddCustomer(true)} variant="outline">
              Add New Customer
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCustomers.map((c) => (
              <div
                key={c._id}
                className="group bg-white rounded-xl border border-blue-50 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 flex flex-col"
              >
                {/* Card Header */}
                <div className="p-5 border-b border-slate-50">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 text-lg leading-tight">
                          {c.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                          <Phone className="w-3 h-3" /> {c.phone}
                        </div>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-blue-600 -mr-2"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>

                        <DropdownMenuItem
                          onClick={() => {
                            setEditingCustomer(c);
                            setShowAddCustomer(true);
                          }}
                        >
                          <User className="w-4 h-4 mr-2" /> Edit Profile
                        </DropdownMenuItem>

                        {/* ⭐ NEW: Edit Last Order */}
                        <DropdownMenuItem
                          onClick={() => {
                            setOrderIdToEdit(c.latestOrder?._id);
                            setOrderCustomer(c);
                            setShowOrderModal(true);
                          }}
                          disabled={!c.latestOrder}
                        >
                          <Pencil className="w-4 h-4 mr-2" /> Edit Last Order
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => handleOrderDelivered(c)}
                          disabled={
                            !c.latestOrder ||
                            c.latestOrder.status === "delivered"
                          }
                        >
                          <CheckCircle className="w-4 h-4 mr-2" /> Mark
                          Delivered
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          onClick={() => deleteCustomer(c._id)}
                          className="text-red-600 focus:text-red-700"
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete Customer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Badges Row */}
                  <div className="flex items-center gap-2 mt-4">
                    {c.latestOrder ? (
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusColor(
                          c.latestOrder.status
                        )}`}
                      >
                        {c.latestOrder.status.toUpperCase()}
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                        NO ORDERS
                      </span>
                    )}

                    {c.hasMeasurement ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-100 flex items-center gap-1">
                        <Ruler className="w-3 h-3" /> SIZE SAVED
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-100 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> NO SIZE
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body - Latest Info */}
                <div className="p-5 pt-4 flex-1">
                  {c.latestOrder ? (
                    <div className="bg-slate-50 rounded-lg p-3 text-sm border border-slate-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-500 text-xs">
                          Latest Order
                        </span>
                        <span className="text-blue-600 font-medium">
                          #{c.latestOrder._id.slice(-4)}
                        </span>
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <div className="font-semibold text-slate-700">
                            {new Date(
                              c.latestOrder.createdAt
                            ).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {c.latestOrder.items?.length || 0} items
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-slate-800">
                            ${c.latestOrder.totalAmount}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
                      No recent activity
                    </div>
                  )}
                </div>

                {/* Card Footer - Primary Actions */}
                <div className="p-4 border-t border-slate-50 grid grid-cols-2 gap-2 bg-slate-50/50 rounded-b-xl">
                  <Button
                    variant="outline"
                    className="bg-white border-blue-200 text-blue-600 hover:bg-blue-50 h-9 text-xs"
                    onClick={() => {
                      setOrderCustomer(c);
                      setOrderIdToEdit(null);
                      setShowOrderModal(true);
                    }}
                  >
                    <Plus className="w-3 h-3 mr-1" /> New Order
                  </Button>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      className="flex-1 h-9 px-0 text-slate-500 hover:text-blue-600"
                      onClick={() => {
                        setHistoryCustomer(c);
                        setShowHistoryModal(true);
                      }}
                      title="History"
                    >
                      <History className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      className={`flex-1 h-9 px-0 ${
                        c.hasMeasurement
                          ? "text-purple-500 hover:text-purple-700"
                          : "text-slate-400 hover:text-purple-500"
                      }`}
                      onClick={() => {
                        if (c.hasMeasurement) {
                          setMeasurementsCustomer(c);
                          setShowMeasurementsModal(true);
                        } else {
                          navigate("/measurements", { state: { customer: c } });
                        }
                      }}
                      title="Measurements"
                    >
                      <Ruler className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      className="flex-1 h-9 px-0 text-slate-500 hover:text-blue-600"
                      onClick={() => {
                        setInvoiceCustomer(c);
                        setShowInvoiceModal(true);
                      }}
                      title="Invoice"
                    >
                      <FileText className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* --- Modals --- */}
      <AddCustomerModal
        open={showAddCustomer}
        onClose={() => setShowAddCustomer(false)}
        families={families}
        onSaved={fetchData}
        customerToEdit={editingCustomer}
      />
      <OrderModal
        open={showOrderModal}
        onClose={() => {
          setShowOrderModal(false);
          setOrderIdToEdit(null);
        }}
        customer={orderCustomer}
        editOrderId={orderIdToEdit} // 👈 Yeh BOHOT important hai
        onSaved={fetchData} // reload function
      />

      <HistoryModal
        open={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        customer={historyCustomer}
        orders={orders.filter((o) => o.customerId === historyCustomer?._id)}
      />
      <ViewMeasurementsModal
        open={showMeasurementsModal}
        onClose={() => setShowMeasurementsModal(false)}
        customer={measurementsCustomer}
        onEdit={() => {
          setShowMeasurementsModal(false);
          navigate("/measurements", {
            state: { customer: measurementsCustomer },
          });
        }}
      />
      <InvoiceModal
        open={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        customer={invoiceCustomer}
      />
    </div>
  );
}
