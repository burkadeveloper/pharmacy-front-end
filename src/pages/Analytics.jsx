import React, { useState, useEffect } from "react";
import api from "../api/client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Truck,
  ArrowLeftRight,
  Calendar,
  DollarSign,
  Layers,
} from "lucide-react";

const Analytics = () => {
  const [orderReceiptData, setOrderReceiptData] = useState([]);
  const [supplierMetrics, setSupplierMetrics] = useState([]);
  const [statusFunnel, setStatusFunnel] = useState([]);
  const [topDrugs, setTopDrugs] = useState([]);
  const [selectedDrug, setSelectedDrug] = useState("");
  const [drugSupplierComp, setDrugSupplierComp] = useState([]);
  const [drugsList, setDrugsList] = useState([]);

  useEffect(() => {
    fetchData();
    fetchDrugs();
  }, []);

  const fetchData = async () => {
    try {
      const [orderReceiptRes, supplierRes, funnelRes, topDrugsRes] =
        await Promise.all([
          api.get("/analytics/monthly-order-receipt"),
          api.get("/companies/metrics/supplier"),
          api.get("/orders/status-funnel"),
          api.get("/analytics/top-drugs"),
        ]);
      setOrderReceiptData(orderReceiptRes.data);
      setSupplierMetrics(supplierRes.data);
      setStatusFunnel(funnelRes.data);
      setTopDrugs(topDrugsRes.data);
    } catch (error) {
      console.error("Error loading intelligence matrix", error);
    }
  };

  const fetchDrugs = async () => {
    try {
      const { data } = await api.get("/drugs");
      setDrugsList(data);
    } catch (error) {
      console.error(error);
    }
  };

  const compareSuppliersForDrug = async (drugId) => {
    if (!drugId) return;
    try {
      const { data: lines } = await api.get(`/orders/lines/drug/${drugId}`);
      const grouped = {};
      lines.forEach((line) => {
        const companyName = line.order?.company?.name || "Unknown";
        if (!grouped[companyName]) grouped[companyName] = [];
        grouped[companyName].push(line);
      });

      const result = Object.entries(grouped).map(([company, linesArr]) => {
        const totalOrdered = linesArr.reduce((s, l) => s + l.orderedQty, 0);
        const totalReceived = linesArr.reduce(
          (s, l) => s + (l.receivedQty || 0),
          0,
        );
        const avgCost =
          linesArr.reduce((s, l) => s + l.costPrice, 0) / linesArr.length;
        const avgSelling =
          linesArr.reduce((s, l) => s + l.sellingPrice, 0) / linesArr.length;
        const latestExpiry = linesArr.reduce(
          (latest, l) => (l.expiryDate > latest ? l.expiryDate : latest),
          "",
        );
        return {
          company,
          totalOrdered,
          totalReceived,
          avgCost,
          avgSelling,
          latestExpiry,
        };
      });
      setDrugSupplierComp(result);
    } catch (error) {
      console.error(error);
    }
  };

  const funnelColors = {
    Pending: "#f59e0b",
    Updated: "#f97316",
    Cancelled: "#ef4444",
    "Partially Received": "#3b82f6",
    Completed: "#10b981",
  };

  const pieData = statusFunnel.map((item) => ({
    name: item._id,
    value: item.count,
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6 font-sans antialiased selection:bg-indigo-100">
      {/* Dashboard Section Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 tracking-tight leading-none flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" /> Operational
            Analytics
          </h1>
          <p className="text-base text-slate-500 mt-2 font-normal leading-relaxed">
            Real-time supply chain oversight, fulfillment margins, and
            enterprise vendor tracking metrics.
          </p>
        </div>
      </div>

      {/* Primary Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order vs Receipt Chart Container */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-950 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" /> Procurement vs
              Intake Valuation
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Monthly summary tracking asset capital configurations
            </p>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={orderReceiptData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  className="font-mono"
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  className="font-mono"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderRadius: "8px",
                    border: "none",
                  }}
                  labelStyle={{
                    color: "#94a3b8",
                    fontWeight: "bold",
                    fontFamily: "monospace",
                  }}
                  itemStyle={{ color: "#fff", fontSize: "13px" }}
                />
                <Line
                  type="monotone"
                  dataKey="ordered"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Ordered Capital"
                />
                <Line
                  type="monotone"
                  dataKey="received"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Received Asset"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Distribution Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-950 tracking-tight flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-indigo-500" /> Status
              Distribution
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Funnel breakdown across open purchase lifecycles
            </p>
          </div>
          <div className="h-[200px] w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  innerRadius={45}
                  paddingAngle={3}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={funnelColors[entry.name] || "#8884d8"}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1.5 justify-center border-t border-slate-100 pt-3">
            {pieData.map((entry, index) => (
              <div
                key={index}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    backgroundColor: funnelColors[entry.name] || "#8884d8",
                  }}
                />
                <span>
                  {entry.name}:{" "}
                  <strong className="text-slate-950 font-mono">
                    {entry.value}
                  </strong>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Global Supplier Performance Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-950 tracking-tight flex items-center gap-2">
            <Truck className="w-4 h-4 text-indigo-500" /> Supplier Performance
            Framework
          </h3>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Aggregated logistics compliance analytics indexes
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4 text-left">Supplier Account</th>
                <th className="px-6 py-4 text-left">Fulfillment Rate</th>
                <th className="px-6 py-4 text-left">On-Time Accuracy</th>
                <th className="px-6 py-4 text-left">Discrepancy Deviation</th>
                <th className="px-6 py-4 text-right">Avg Lead Matrix</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white text-slate-800">
              {supplierMetrics.map((s) => (
                <tr
                  key={s.id}
                  className="hover:bg-slate-50/50 transition-colors align-middle text-sm"
                >
                  <td className="px-6 py-4 font-bold text-slate-950">
                    {s.name}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 w-10">
                        {s.fulfilmentRate}%
                      </span>
                      <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{ width: `${s.fulfilmentRate}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 w-10">
                        {s.onTimeRate}%
                      </span>
                      <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full rounded-full"
                          style={{ width: `${s.onTimeRate}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 font-mono text-xs font-bold rounded-md ${
                        s.discrepancyRate > 5
                          ? "bg-rose-50 text-rose-700 border border-rose-100"
                          : "bg-slate-50 text-slate-600 border border-slate-200/60"
                      }`}
                    >
                      {s.discrepancyRate}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">
                    {s.avgLeadTime}{" "}
                    <span className="font-sans font-medium text-xs text-slate-400 lowercase">
                      days
                    </span>
                  </td>
                </tr>
              ))}
              {supplierMetrics.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="text-center p-12 text-slate-400 font-semibold"
                  >
                    No matching compliance metrics captured for current timeline
                    parameters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Granular Compound Variant Cross Comparison Module */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-950 tracking-tight flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-indigo-500" /> Deep-Dive
            Compound Comparison
          </h3>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Evaluate acquisition variations and pricing margins across active
            vendors
          </p>
        </div>

        <div className="max-w-md">
          <select
            value={selectedDrug}
            onChange={(e) => {
              setSelectedDrug(e.target.value);
              compareSuppliersForDrug(e.target.value);
            }}
            className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2.5 font-semibold text-slate-800"
          >
            <option value="">Choose drug to compare...</option>
            {drugsList.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {drugSupplierComp.length > 0 ? (
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs mt-2">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-xs">
                  <tr>
                    <th className="px-6 py-3.5 text-left">Supplier Partner</th>
                    <th className="px-6 py-3.5 text-left">Avg Cost Basis</th>
                    <th className="px-6 py-3.5 text-left">Avg Market Index</th>
                    <th className="px-6 py-3.5 text-left">
                      Latest Batch Expiry
                    </th>
                    <th className="px-6 py-3.5 text-right">
                      Fulfillment Metric
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white text-slate-800">
                  {drugSupplierComp.map((s) => (
                    <tr
                      key={s.company}
                      className="hover:bg-slate-50/40 transition-colors align-middle text-sm"
                    >
                      <td className="px-6 py-4 font-bold text-slate-950">
                        {s.company}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-slate-900 font-mono font-bold text-sm">
                          <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                          {s.avgCost.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-slate-900 font-mono font-bold text-sm">
                          <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                          {s.avgSelling.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 font-mono font-bold text-slate-700 text-xs">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {s.latestExpiry
                            ? new Date(s.latestExpiry).toLocaleDateString()
                            : "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 rounded-md text-xs shadow-3xs">
                          {((s.totalReceived / s.totalOrdered) * 100).toFixed(
                            1,
                          )}
                          %
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          selectedDrug && (
            <div className="text-center p-8 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-400 font-medium text-sm">
              <Layers className="w-6 h-6 text-slate-300 mx-auto mb-2" /> No
              purchase line history detected across validation companies for
              this drug parameter.
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Analytics;
