import React, { useState, useEffect } from "react";
import api from "../api/client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import toast from "react-hot-toast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const Reports = () => {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [expiryData, setExpiryData] = useState([]);
  const [revenueAnalysis, setRevenueAnalysis] = useState(null);

  useEffect(() => {
    if (year && month) {
      fetchRevenueAnalysis();
    }
  }, [year, month]);

  const fetchRevenueAnalysis = async () => {
    try {
      const { data } = await api.get(
        `/reports/revenue-analysis?year=${year}&month=${month}`,
      );
      setRevenueAnalysis(data);
    } catch (error) {
      console.error("Revenue analysis error:", error);
    }
  };

  const generateMonthlyReport = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(
        `/reports/monthly?year=${year}&month=${month}`,
      );
      setReportData(data);
      const expiryRes = await api.get("/reports/expiry");
      setExpiryData(expiryRes.data);
      generatePDF(data, expiryRes.data);
    } catch (error) {
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = (monthly, expiry) => {
    const doc = new jsPDF();
    doc.text(`Pharmacy Management Report - ${year}-${month}`, 14, 20);

    doc.text("Financial Summary", 14, 35);
    autoTable(doc, {
      startY: 40,
      head: [["Metric", "Value (ETB)"]],
      body: [
        ["Manual Revenue", monthly.totalManualRevenue?.toFixed(2)],
        [
          "Sales Revenue (Dispensing)",
          monthly.totalRevenueFromSales?.toFixed(2),
        ],
        ["Total Revenue", monthly.totalRevenue?.toFixed(2)],
        ["Cost of Goods Sold", monthly.totalCost?.toFixed(2)],
        ["Gross Profit", monthly.grossProfit?.toFixed(2)],
        ["Total Ordered Value", monthly.totalOrdered?.toFixed(2)],
        ["Total Received Value", monthly.totalReceived?.toFixed(2)],
        ["Discrepancy Value", monthly.discrepancyValue?.toFixed(2)],
      ],
    });

    if (revenueAnalysis) {
      let y = doc.lastAutoTable.finalY + 10;
      doc.text("Revenue Analysis", 14, y);
      autoTable(doc, {
        startY: y + 5,
        head: [["Metric", "Value"]],
        body: [
          [
            "Total Revenue (Manual)",
            `${revenueAnalysis.summary.totalRevenue.toFixed(2)} ETB`,
          ],
          [
            "Average Daily Revenue",
            `${revenueAnalysis.summary.averageDailyRevenue.toFixed(2)} ETB`,
          ],
          [
            "Highest Revenue Day",
            `${revenueAnalysis.summary.highestRevenueDay.date} - ${revenueAnalysis.summary.highestRevenueDay.amount.toFixed(2)} ETB`,
          ],
          [
            "Days Recorded",
            `${revenueAnalysis.summary.daysRecorded} / ${new Date(year, month, 0).getDate()}`,
          ],
          ["Submission Rate", `${revenueAnalysis.summary.submissionRate}%`],
        ],
      });
    }

    y = doc.lastAutoTable.finalY + 10;
    doc.text("Expiry Report (Next 90 Days)", 14, y);
    const expiryBody = expiry.map((b) => [
      b.drugName?.name || "Unknown",
      b.batchNumber,
      new Date(b.expiryDate).toLocaleDateString(),
      b.remainingQty,
      b.unitType || "unit",
    ]);
    autoTable(doc, {
      startY: y + 5,
      head: [["Drug", "Batch", "Expiry", "Qty Left", "Unit"]],
      body: expiryBody,
    });

    doc.save(`pharmacy_report_${year}_${month}.pdf`);
  };

  const formatCurrency = (value) => `ETB ${value.toFixed(2)}`;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Reports</h1>

      {/* Revenue Analysis Card */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">
          Daily Revenue Analysis - {year}/{month}
        </h2>
        {revenueAnalysis ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-green-50 p-3 rounded">
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-xl font-bold">
                  {formatCurrency(revenueAnalysis.summary.totalRevenue)}
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded">
                <p className="text-sm text-gray-600">Average Daily</p>
                <p className="text-xl font-bold">
                  {formatCurrency(revenueAnalysis.summary.averageDailyRevenue)}
                </p>
              </div>
              <div className="bg-yellow-50 p-3 rounded">
                <p className="text-sm text-gray-600">Highest Day</p>
                <p className="text-xl font-bold">
                  {formatCurrency(
                    revenueAnalysis.summary.highestRevenueDay.amount,
                  )}
                </p>
                <p className="text-xs text-gray-500">
                  {revenueAnalysis.summary.highestRevenueDay.date}
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded">
                <p className="text-sm text-gray-600">Submission Rate</p>
                <p className="text-xl font-bold">
                  {revenueAnalysis.summary.submissionRate}%
                </p>
                <p className="text-xs text-gray-500">
                  {revenueAnalysis.summary.daysRecorded} /{" "}
                  {new Date(year, month, 0).getDate()} days
                </p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Daily Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueAnalysis.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#4f46e5"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <p className="text-gray-500">No revenue data for selected month.</p>
        )}
      </div>

      {/* Monthly Report Generation */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">
          Generate Complete Monthly Report (PDF)
        </h2>
        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <label className="block text-sm">Year</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="border rounded p-2 w-24"
            />
          </div>
          <div>
            <label className="block text-sm">Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="border rounded p-2"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {new Date(2000, m - 1, 1).toLocaleString("default", {
                    month: "long",
                  })}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={generateMonthlyReport}
              disabled={loading}
              className="bg-indigo-600 text-white px-6 py-2 rounded"
            >
              {loading ? "Generating..." : "Generate PDF Report"}
            </button>
          </div>
        </div>
        {reportData && (
          <div className="border-t pt-4 mt-4">
            <h3 className="font-semibold mb-2">Financial Preview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div>
                Manual Revenue: {reportData.totalManualRevenue?.toFixed(2)} ETB
              </div>
              <div>
                Sales Revenue: {reportData.totalRevenueFromSales?.toFixed(2)}{" "}
                ETB
              </div>
              <div>
                Total Revenue: {reportData.totalRevenue?.toFixed(2)} ETB
              </div>
              <div>Gross Profit: {reportData.grossProfit?.toFixed(2)} ETB</div>
              <div>
                Ordered Value: {reportData.totalOrdered?.toFixed(2)} ETB
              </div>
              <div>
                Received Value: {reportData.totalReceived?.toFixed(2)} ETB
              </div>
              <div>
                Discrepancy: {reportData.discrepancyValue?.toFixed(2)} ETB
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
