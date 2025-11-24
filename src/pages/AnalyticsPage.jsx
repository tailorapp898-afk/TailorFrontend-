"use client"

import { useState, useEffect } from "react"
import Navbar from "../components/Navbar"
import { useIndexedDBStore } from "@/hooks/useIndexedDB";

export default function AnalyticsPage() {
  const { data: customers, loading: loadingCustomers } = useIndexedDBStore('customers');
  const { data: orders, loading: loadingOrders } = useIndexedDBStore('orders');
  const { data: payments, loading: loadingPayments } = useIndexedDBStore('payments');

  const [analytics, setAnalytics] = useState({
    totalCustomers: 0,
    totalOrders: 0,
    monthlyIncome: 0,
    monthlyOrders: 0,
    averageOrderValue: 0,
  });
  const [monthlyData, setMonthlyData] = useState([]);
  const [timeRange, setTimeRange] = useState("month");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loadingCustomers && !loadingOrders && !loadingPayments) {
      setLoading(true);
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      let filteredOrders = orders;
      let filteredPayments = payments;

      if (timeRange === "month") {
        filteredOrders = orders.filter((o) => new Date(o.createdAt) >= thisMonth);
        filteredPayments = payments.filter((p) => new Date(p.createdAt) >= thisMonth);
      } else if (timeRange === "quarter") {
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        filteredOrders = orders.filter((o) => new Date(o.createdAt) >= threeMonthsAgo);
        filteredPayments = payments.filter((p) => new Date(p.createdAt) >= threeMonthsAgo);
      }

      const monthlyIncome = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
      const averageOrderValue =
        filteredOrders.length > 0
          ? filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) / filteredOrders.length
          : 0;

      setAnalytics({
        totalCustomers: customers.length,
        totalOrders: orders.length,
        monthlyIncome,
        monthlyOrders: filteredOrders.length,
        averageOrderValue,
      });

      const monthlyData = filteredPayments.reduce((acc, p) => {
        const month = new Date(p.createdAt).toLocaleString('default', { month: 'short' });
        const existingMonth = acc.find(m => m.month === month);
        if (existingMonth) {
          existingMonth.income += p.amount;
        } else {
          acc.push({ month, income: p.amount });
        }
        return acc;
      }, []);

      setMonthlyData(monthlyData);
      setLoading(false);
    }
  }, [timeRange, customers, orders, payments, loadingCustomers, loadingOrders, loadingPayments]);

  return (
    <div>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h2 className="text-3xl font-bold text-slate-900">Analytics</h2>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="month">This Month</option>
            <option value="quarter">Last 3 Months</option>
            <option value="all">All Time</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96 text-slate-600 font-medium">
            Loading analytics...
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              {[
                { label: "Total Customers", value: analytics.totalCustomers, color: "text-blue-600" },
                { label: "Total Orders", value: analytics.totalOrders, color: "text-green-600" },
                { label: "Monthly Orders", value: analytics.monthlyOrders, color: "text-purple-600" },
                {
                  label: "Monthly Income",
                  value: `Rs. ${analytics.monthlyIncome.toLocaleString()}`,
                  color: "text-orange-600",
                },
                {
                  label: "Avg Order Value",
                  value: `Rs. ${analytics.averageOrderValue.toLocaleString("en-IN", {
                    maximumFractionDigits: 0,
                  })}`,
                  color: "text-red-600",
                },
              ].map((item, idx) => (
                <div key={idx} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
                  <h3 className="text-slate-600 text-sm font-medium">{item.label}</h3>
                  <p className={`text-2xl font-bold mt-2 ${item.color}`}>{item.value}</p>
                  <p className="text-xs text-slate-500 mt-1">This period</p>
                </div>
              ))}
            </div>

            {/* Monthly Income Trend */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Monthly Income Trend</h3>
                <div className="space-y-3">
                  {monthlyData.length > 0 ? (
                    monthlyData.map((data, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm text-slate-600 w-10">{data.month}</span>
                        <div className="flex-1 bg-slate-100 rounded-full h-5 mx-4 relative overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full"
                            style={{
                              width: `${Math.min(100, (data.income / (analytics.monthlyIncome + 5000)) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium text-slate-900 w-24 text-right">
                          Rs. {data.income.toLocaleString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 text-sm">No monthly data found</p>
                  )}
                </div>
              </div>

              {/* Business Summary */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Business Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b">
                    <span className="text-slate-600">Average Daily Income</span>
                    <span className="font-bold text-lg">
                      Rs. {(analytics.monthlyIncome / 30).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b">
                    <span className="text-slate-600">Total Suits/Orders</span>
                    <span className="font-bold text-lg">{analytics.monthlyOrders}</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b">
                    <span className="text-slate-600">Customer Base</span>
                    <span className="font-bold text-lg">{analytics.totalCustomers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Average Order Value</span>
                    <span className="font-bold text-lg">
                      Rs. {analytics.averageOrderValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Insights Section */}
            <div className="mt-6 bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
              <h4 className="font-bold text-blue-900 mb-2">Insights</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>
                  Your average order value is Rs.{" "}
                  {analytics.averageOrderValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}. Consider upselling
                  services.
                </li>
                <li>
                  You’ve completed {analytics.monthlyOrders} orders this period from {analytics.totalCustomers} total
                  customers.
                </li>
                <li>
                  Daily income average: Rs.{" "}
                  {(analytics.monthlyIncome / 30).toLocaleString("en-IN", { maximumFractionDigits: 0 })} -{" "}
                  {analytics.monthlyIncome > 50000 ? "Excellent performance!" : "Room to grow!"}
                </li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
