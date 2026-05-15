import React, { useState, useEffect } from "react";
import api from "../api/client";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  Calendar,
  Edit3,
  Sliders,
  MapPin,
  DollarSign,
  X,
  Package,
  Layers,
  ArrowUpDown
} from "lucide-react";

const StockList = () => {
  const [batches, setBatches] = useState([]);
  const [expiring, setExpiring] = useState({ red: [], yellow: [] });
  const [lowStock, setLowStock] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustReason, setAdjustReason] = useState("");
  const [priceModal, setPriceModal] = useState(null);
  const [newPrice, setNewPrice] = useState("");

  useEffect(() => {
    fetchBatches();
    fetchExpiring();
    fetchLowStock();
  }, []);

  const fetchBatches = async () => {
    try {
      const { data } = await api.get("/stock");
      setBatches(data);
    } catch (error) {
      toast.error("Failed to load stock");
    }
  };

  const fetchExpiring = async () => {
    try {
      const { data } = await api.get("/stock/expiring");
      setExpiring(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchLowStock = async () => {
    try {
      const { data } = await api.get("/stock/low-stock");
      setLowStock(data);
    } catch (error) {
      console.error(error);
    }
  };

  const adjustStock = async (batchId) => {
    if (adjustQty === 0) {
      toast.error("Adjustment cannot be zero");
      return;
    }
    try {
      await api.post("/stock/adjust", {
        batchId,
        adjustment: adjustQty,
        reason: adjustReason,
      });
      toast.success("Stock adjusted");
      setSelectedBatch(null);
      setAdjustQty(0);
      setAdjustReason("");
      fetchBatches();
      fetchExpiring();
      fetchLowStock();
    } catch (error) {
      toast.error(error.response?.data?.message);
    }
  };

  const updateSellingPrice = async (batchId) => {
    const price = parseFloat(newPrice);
    if (isNaN(price) || price < 0) {
      toast.error("Enter a valid price");
      return;
    }
    try {
      await api.put("/stock/price", { batchId, sellingPrice: price });
      toast.success("Selling price updated");
      setPriceModal(null);
      setNewPrice("");
      fetchBatches();
    } catch (error) {
      toast.error(error.response?.data?.message);
    }
  };

  const getExpiryStatus = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return "expired";
    if (daysLeft <= 30) return "red";
    if (daysLeft <= 90) return "yellow";
    return "good";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8 font-sans antialiased">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="w-6 h-6 text-indigo-600" /> Stock & Inventory
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage batches, pricing, and stock adjustments
            </p>
          </div>
          <div className="inline-flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
            <Package className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-600">
              Total batches: <strong className="text-slate-900">{batches.length}</strong>
            </span>
          </div>
        </div>

        {/* Alerts Section - No scrollbars, just natural flow */}
        {(lowStock.length > 0 || expiring.red?.length > 0) && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            {lowStock.length > 0 && (
              <div className="bg-white border-l-4 border-l-rose-500 border border-slate-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                  <h3 className="font-bold text-slate-800">Critical Low Stock</h3>
                </div>
                <ul className="space-y-2">
                  {lowStock.map((item) => (
                    <li key={item.drug} className="flex justify-between items-center bg-slate-50 rounded-lg px-3 py-2 text-sm">
                      <span className="font-medium text-slate-700">{item.drug}</span>
                      <span className="bg-rose-100 text-rose-700 font-mono font-bold px-2 py-0.5 rounded">
                        {item.currentStock} left
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {expiring.red?.length > 0 && (
              <div className="bg-white border-l-4 border-l-amber-500 border border-slate-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-slate-800">Expiring Soon (&lt;30 days)</h3>
                </div>
                <ul className="space-y-2">
                  {expiring.red.map((b) => (
                    <li key={b._id} className="bg-slate-50 rounded-lg px-3 py-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-700">{b.drugName?.name}</span>
                        <span className="text-amber-700 font-mono text-xs bg-amber-50 px-2 py-0.5 rounded">
                          {new Date(b.expiryDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">Batch: {b.batchNumber}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Batches Grid - Responsive, no internal scrollbars */}
        <div className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Active Batches</h2>
          {batches.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 font-medium shadow-sm">
              No batches found.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {batches.map((batch) => {
                const status = getExpiryStatus(batch.expiryDate);
                let statusColor = {
                  text: "Stable",
                  bg: "bg-emerald-100 text-emerald-700",
                };
                if (status === "red") statusColor = { text: "Critical", bg: "bg-rose-100 text-rose-700" };
                if (status === "yellow") statusColor = { text: "Near expiry", bg: "bg-amber-100 text-amber-700" };
                if (status === "expired") statusColor = { text: "Expired", bg: "bg-slate-200 text-slate-600" };

                const unitLabel = batch.unitType
                  ? `${batch.remainingQty} ${batch.unitType}${batch.remainingQty !== 1 ? "s" : ""}`
                  : batch.remainingQty;

                return (
                  <div
                    key={batch._id}
                    className={`bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-all flex flex-col ${
                      status === "expired" ? "opacity-70 border-slate-200" : "border-slate-200"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{batch.drugName?.name}</h3>
                        {batch.drugName?.brand && (
                          <span className="text-xs text-indigo-600">{batch.drugName.brand}</span>
                        )}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor.bg}`}>
                        {statusColor.text}
                      </span>
                    </div>

                    <div className="space-y-2 my-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Batch #</span>
                        <span className="font-mono font-medium text-slate-800">{batch.batchNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Expiry</span>
                        <span className="font-mono text-slate-800">{new Date(batch.expiryDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> Shelf</span>
                        <span className="text-slate-800">{batch.shelfLocation || "—"}</span>
                      </div>
                    </div>

                    <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="text-xs text-slate-400 uppercase tracking-wider">Stock / Price</div>
                        <div className="flex items-baseline gap-2 mt-0.5">
                          <span className="font-bold font-mono text-slate-900">{unitLabel}</span>
                          <button
                            onClick={() => {
                              setPriceModal(batch._id);
                              setNewPrice(batch.sellingPrice?.toString() || "");
                            }}
                            className="flex items-center gap-1 text-slate-900 font-mono font-bold hover:text-indigo-600 transition"
                          >
                            ${batch.sellingPrice?.toFixed(2)}
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedBatch(batch)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 text-white hover:bg-indigo-600 rounded-lg text-xs font-semibold transition"
                      >
                        <ArrowUpDown className="w-3.5 h-3.5" /> Adjust
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {selectedBatch && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-auto overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-800">
                <Sliders className="w-5 h-5 text-indigo-500" /> Adjust Stock
              </h3>
              <button onClick={() => setSelectedBatch(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 text-sm">
                <p className="text-slate-500 text-xs uppercase">Product</p>
                <p className="font-bold text-slate-800">{selectedBatch.drugName?.name}</p>
                <p className="text-slate-600 mt-1">Current stock: <strong className="font-mono">{selectedBatch.remainingQty} units</strong></p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Adjustment (positive or negative)</label>
                <input
                  type="number"
                  step="any"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(parseFloat(e.target.value))}
                  className="w-full rounded-lg border-slate-200 p-2 text-sm"
                  placeholder="e.g., +10 or -5"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Reason</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full rounded-lg border-slate-200 p-2 text-sm"
                  placeholder="e.g., damaged, restock"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 bg-slate-50 border-t border-slate-100">
              <button onClick={() => setSelectedBatch(null)} className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-white transition">
                Cancel
              </button>
              <button onClick={() => adjustStock(selectedBatch._id)} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                Apply Adjustment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Price Modal */}
      {priceModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-auto overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-800">
                <DollarSign className="w-5 h-5 text-indigo-500" /> Update Price
              </h3>
              <button onClick={() => setPriceModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <label className="block text-xs font-semibold text-slate-500 mb-1">New selling price (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full rounded-lg border-slate-200 pl-7 p-2 text-sm"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 bg-slate-50 border-t border-slate-100">
              <button onClick={() => setPriceModal(null)} className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-white transition">
                Cancel
              </button>
              <button onClick={() => updateSellingPrice(priceModal)} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                Save Price
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockList;
