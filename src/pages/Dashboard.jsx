import React, { useState, useEffect } from "react";
import api from "../api/client";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  DollarSign,
  Package,
  AlertTriangle,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Plus,
} from "lucide-react";
import DailyRevenueModal from "../components/DailyRevenueModal";

const Dashboard = () => {
  const [kpis, setKpis] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [topDrugs, setTopDrugs] = useState([]);
  const [slowestDrugs, setSlowestDrugs] = useState([]);
  const [expiryForecast, setExpiryForecast] = useState([]);
  const [revenueSummary, setRevenueSummary] = useState({
    todayRevenue: 0,
    monthRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRevenueModal, setShowRevenueModal] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [kpisRes, revenueRes, topDrugsRes, slowestRes, expiryRes] =
        await Promise.all([
          api.get("/analytics/kpis"),
          api.get("/revenue/summary"),
          api.get("/analytics/top-drugs"),
          api.get("/analytics/slowest-drugs"),
          api.get("/analytics/expiry-forecast"),
        ]);
      setKpis(kpisRes.data);
      setRevenueSummary(revenueRes.data);
      setTopDrugs(topDrugsRes.data);
      setSlowestDrugs(slowestRes.data);
      setExpiryForecast(expiryRes.data);
      // For revenue chart, we keep using sales data (still meaningful)
      const chartRes = await api.get("/analytics/revenue-chart");
      setRevenueData(chartRes.data);
    } catch (err) {
      console.error("Dashboard error:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const KpiCard = ({ title, value, icon: Icon, subtitle, color }) => {
    const borderColorClass =
      {
        green: "border-l-green-500",
        blue: "border-l-blue-500",
        purple: "border-l-purple-500",
        red: "border-l-red-500",
        orange: "border-l-orange-500",
      }[color] || "border-l-gray-500";

    return (
      <div
        className={`bg-white rounded-lg shadow p-4 border-l-4 ${borderColorClass}`}
      >
        <div className="flex justify-between items-start">
          <div>
            <p className="text-gray-500 text-sm">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
            )}
          </div>
          {Icon && <Icon size={24} className={`text-${color}-500`} />}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button
          onClick={() => setShowRevenueModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <Plus size={18} /> Add Daily Revenue
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <KpiCard
          title="Today's Revenue"
          value={formatCurrency(revenueSummary.todayRevenue)}
          icon={DollarSign}
          color="green"
        />
        <KpiCard
          title="Month Revenue"
          value={formatCurrency(revenueSummary.monthRevenue)}
          icon={DollarSign}
          color="blue"
        />
        <KpiCard
          title="Stock Value (Cost)"
          value={formatCurrency(kpis?.totalStockValue || 0)}
          icon={Package}
          color="purple"
        />
        <KpiCard
          title="Expiring &lt;30 days"
          value={`${kpis?.expiringSoonCount || 0} batches`}
          icon={AlertTriangle}
          subtitle={`Value: ${formatCurrency(kpis?.expiringSoonValue || 0)}`}
          color="red"
        />
        <KpiCard
          title="Pending Orders"
          value={kpis?.pendingOrders || 0}
          icon={ShoppingCart}
          color="orange"
        />
      </div>

      {/* Revenue Chart (based on sales data) */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">
          Daily Sales Revenue (Last 30 Days)
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#4f46e5"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top and Slowest Drugs */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Top Drugs */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="text-green-500" size={20} />
            Top 10 Drugs by Sales
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Drug</th>
                  <th className="text-right py-2">Quantity Sold</th>
                  <th className="text-right py-2">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topDrugs.length > 0 ? (
                  topDrugs.map((drug, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="py-2">
                        {drug.drug?.name || "Unknown"}
                        {drug.drug?.brand ? ` (${drug.drug.brand})` : ""}
                      </td>
                      <td className="text-right">{drug.totalQty}</td>
                      <td className="text-right">
                        {formatCurrency(drug.totalRevenue)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="py-4 text-center text-gray-500">
                      No sales data yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Slowest Drugs */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingDown className="text-red-500" size={20} />
            Bottom 5 Slowest Drugs (Least Dispensed)
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Drug</th>
                  <th className="text-right py-2">Total Sold</th>
                </tr>
              </thead>
              <tbody>
                {slowestDrugs.length > 0 ? (
                  slowestDrugs.map((drug, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="py-2">
                        {drug.drug?.name || "Unknown"}
                        {drug.drug?.brand ? ` (${drug.drug.brand})` : ""}
                      </td>
                      <td className="text-right">{drug.totalSold || 0}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2" className="py-4 text-center text-gray-500">
                      No drug data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Expiry Forecast Chart */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-4">Expiry Forecast</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={expiryForecast}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="range" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="quantity" fill="#f59e0b" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Modal */}
      {showRevenueModal && (
        <DailyRevenueModal
          onClose={() => setShowRevenueModal(false)}
          onSaved={fetchDashboardData}
        />
      )}
    </div>
  );
};

export default Dashboard;
