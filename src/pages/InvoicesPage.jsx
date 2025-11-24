"use client"

import { useState, useEffect } from "react"
import Navbar from "../components/Navbar"
import { useIndexedDBStore } from "../hooks/useIndexedDB";

export default function InvoicesPage() {
  const { data: invoices, loading: loadingInvoices, addItem: addInvoice, refreshData: fetchInvoices } = useIndexedDBStore('invoices');
  const { data: orders, loading: loadingOrders, refreshData: fetchOrders } = useIndexedDBStore('orders');
  const { data: customers, loading: loadingCustomers, refreshData: fetchCustomers } = useIndexedDBStore('customers');

  const [showForm, setShowForm] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [invoiceData, setInvoiceData] = useState({
    discount: 0,
    tax: 0,
    notes: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchInvoices()
    fetchOrders()
    fetchCustomers()
  }, [])

  const handleCreateInvoice = async () => {
    if (!selectedOrder) {
      alert("Please select an order")
      return
    }

    setIsSubmitting(true)
    try {
      const subtotal = selectedOrder.totalAmount || 0
      const discount = invoiceData.discount || 0
      const tax = invoiceData.tax || 0
      const total = subtotal - discount + tax

      await addInvoice(
        {
          _id: Date.now().toString(),
          orderId: selectedOrder._id,
          customerId: selectedOrder.customerId,
          items: selectedOrder.items,
          subtotal,
          discount,
          tax,
          total,
          paid: 0,
          remaining: total,
          status: 'draft',
          notes: invoiceData.notes,
          invoiceNumber: `INV-${Date.now()}`
        },
      )

      alert("Invoice created successfully")
      setShowForm(false)
      setSelectedOrder(null)
      setInvoiceData({ discount: 0, tax: 0, notes: "" })
    } catch (error) {
      console.error("Failed to create invoice:", error)
      alert("Failed to create invoice")
    } finally {
      setIsSubmitting(false)
    }
  }

  const generatePDF = (invoice) => {
    const customer = customers.find(c => c._id === invoice.customerId);
    const content = `
INVOICE
========
Invoice #: ${invoice.invoiceNumber}
Date: ${new Date(invoice.createdAt).toLocaleDateString()}
Customer: ${customer?.name || "N/A"}

Items:
${
  invoice.items
    ? Object.entries(invoice.items)
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n")
    : "No items"
}

Subtotal: Rs. ${invoice.subtotal}
Discount: Rs. ${invoice.discount}
Tax: Rs. ${invoice.tax}
Total: Rs. ${invoice.total}

Notes: ${invoice.notes || "N/A"}
    `
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `invoice-${invoice.invoiceNumber}.txt`
    link.click()
  }

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c._id === customerId);
    return customer?.name || "N/A";
  }

  return (
    <div>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-slate-900">Invoices</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            {showForm ? "Cancel" : "Create Invoice"}
          </button>
        </div>

        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h3 className="text-xl font-bold mb-4 text-slate-900">Create New Invoice</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-700">Select Order</label>
                <select
                  value={selectedOrder?._id || ""}
                  onChange={(e) => {
                    const order = orders.find((o) => o._id === e.target.value)
                    setSelectedOrder(order)
                  }}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="">Choose an order</option>
                  {orders.map((order) => (
                    <option key={order._id} value={order._id}>
                      {order.orderNumber} - Rs. {order.totalAmount}
                    </option>
                  ))}
                </select>
              </div>

              {selectedOrder && (
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">Subtotal:</span> Rs. {selectedOrder.totalAmount}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700">Discount (Rs.)</label>
                  <input
                    type="number"
                    value={invoiceData.discount}
                    onChange={(e) => setInvoiceData({ ...invoiceData, discount: Number.parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700">Tax (Rs.)</label>
                  <input
                    type="number"
                    value={invoiceData.tax}
                    onChange={(e) => setInvoiceData({ ...invoiceData, tax: Number.parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-slate-700">Notes</label>
                <textarea
                  value={invoiceData.notes}
                  onChange={(e) => setInvoiceData({ ...invoiceData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  rows="3"
                />
              </div>

              <button
                onClick={handleCreateInvoice}
                disabled={isSubmitting || !selectedOrder}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-slate-400 transition"
              >
                {isSubmitting ? "Creating..." : "Create Invoice"}
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-100 border-b border-slate-300">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-bold text-slate-700">Invoice #</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-slate-700">Customer</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-slate-700">Total</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-slate-700">Paid</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-slate-700">Status</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-slate-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {(loadingInvoices || loadingOrders || loadingCustomers) ? (
                <tr><td colSpan="6" className="text-center py-8 text-slate-500">Loading...</td></tr>
              ) : invoices.map((invoice) => (
                <tr key={invoice._id} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="px-6 py-3 font-medium">{invoice.invoiceNumber}</td>
                  <td className="px-6 py-3">{getCustomerName(invoice.customerId)}</td>
                  <td className="px-6 py-3">Rs. {invoice.total}</td>
                  <td className="px-6 py-3">Rs. {invoice.paid}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        invoice.status === "paid"
                          ? "bg-green-100 text-green-700"
                          : invoice.status === "draft"
                            ? "bg-slate-100 text-slate-700"
                            : invoice.status === "overdue"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <button
                      onClick={() => generatePDF(invoice)}
                      className="text-blue-600 hover:text-blue-800 transition text-sm"
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {invoices.length === 0 && !loadingInvoices && <div className="text-center py-8 text-slate-500">No invoices yet</div>}
        </div>
      </div>
    </div>
  )
}
