"use client";

import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useIndexedDBStore } from "@/hooks/useIndexedDB";

export default function Dashboard() {
  const { data: customers, loading: loadingCustomers } = useIndexedDBStore("customers");
  const { data: orders, loading: loadingOrders } = useIndexedDBStore("orders");
  const { data: payments, loading: loadingPayments } = useIndexedDBStore("payments");

  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalOrders: 0,
    monthlyIncome: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loadingCustomers && !loadingOrders && !loadingPayments) {
      setLoading(true);

      // Compute total customers
      const totalCustomers = customers.length;

      // Compute total orders
      const totalOrders = orders.length;

      // Compute monthly income (current month)
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthlyPayments = payments.filter(p => new Date(p.createdAt) >= firstDayOfMonth);
      const monthlyIncome = monthlyPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

      // Compute recent orders (latest 5)
      const sortedOrders = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const recentOrdersWithCustomer = sortedOrders.slice(0, 5).map(order => {
        const customer = customers.find(c => c._id === order.customerId);
        return { ...order, customer };
      });

      setStats({ totalCustomers, totalOrders, monthlyIncome });
      setRecentOrders(recentOrdersWithCustomer);
      setLoading(false);
    }
  }, [customers, orders, payments, loadingCustomers, loadingOrders, loadingPayments]);

  return (
    <div>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900">Welcome back!</h2>
          <p className="text-slate-600 mt-1">Your dashboard (offline-ready)</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96 text-slate-600 font-medium">
            Loading dashboard...
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-600">
                <h3 className="text-slate-600 text-sm font-medium">Total Customers</h3>
                <p className="text-4xl font-bold text-blue-600 mt-2">{stats.totalCustomers}</p>
                <p className="text-xs text-slate-500 mt-2">Active customers</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-600">
                <h3 className="text-slate-600 text-sm font-medium">Total Orders</h3>
                <p className="text-4xl font-bold text-green-600 mt-2">{stats.totalOrders}</p>
                <p className="text-xs text-slate-500 mt-2">All time orders</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-600">
                <h3 className="text-slate-600 text-sm font-medium">Monthly Income</h3>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  Rs. {stats.monthlyIncome.toLocaleString()}
                </p>
                <p className="text-xs text-slate-500 mt-2">This month</p>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Orders</h3>
              {recentOrders.length === 0 ? (
                <p className="text-slate-500">No orders available offline.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2 text-slate-600">Order #</th>
                        <th className="text-left py-2 text-slate-600">Customer</th>
                        <th className="text-left py-2 text-slate-600">Amount</th>
                        <th className="text-left py-2 text-slate-600">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order, index) => (
                        <tr key={order._id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 font-medium text-slate-900">{index + 1}</td>
                          <td className="py-3 text-slate-600">{order.customer?.name || "N/A"}</td>
                          <td className="py-3 font-medium text-slate-900">Rs. {order.totalAmount || 0}</td>
                          <td className="py-3">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                order.status === "delivered"
                                  ? "bg-green-100 text-green-700"
                                  : order.status === "in-progress"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {order.status || "pending"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <a
                  href="/customers"
                  className="block bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-center text-sm font-medium transition"
                >
                  Add Customer
                </a>
                <a
                  href="/measurements"
                  className="block bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-center text-sm font-medium transition"
                >
                  Record Measurements
                </a>
                <a
                  href="/analytics"
                  className="block bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded text-center text-sm font-medium transition"
                >
                  View Analytics
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

