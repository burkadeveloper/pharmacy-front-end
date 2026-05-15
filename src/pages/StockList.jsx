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
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-8 font-sans antialiased selection:bg-indigo-100 bg-slate-50/50 min-h-screen">
      
      {/* Mini clean overview header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" /> Stock Metrics & Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit configurations, pricing adjustments, and live batch monitoring.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs self-start sm:self-auto">
          <Package className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-medium text-slate-600">
            Total Logs: <strong className="text-slate-900 font-mono font-bold">{batches.length}</strong>
          </span>
        </div>
      </div>

      {/* High-Alert Dashboard Cards Grid */}
      {(lowStock.length > 0 || expiring.red?.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Low Stock Panel */}
          {lowStock.length > 0 && (
            <div className="bg-white border-l-4 border-l-rose-500 border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <h3 className="font-bold text-slate-900 text-sm">Critical Low Stock</h3>
              </div>
              <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
                {lowStock.map((item) => (
                  <div key={item.drug} className="flex justify-between items-center text-xs bg-slate-50 border border-slate-150 rounded-lg p-2.5">
                    <span className="font-semibold text-slate-800">{item.drug}</span>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-bold font-mono">
                        {item.currentStock} left
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Critical Expiry Alerts */}
          {expiring.red?.length > 0 && (
            <div className="bg-white border-l-4 border-l-amber-500 border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-slate-900 text-sm">Approaching Expiration (&lt;30 days)</h3>
              </div>
              <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
                {expiring.red.map((b) => (
                  <div key={b._id} className="flex justify-between items-center text-xs bg-slate-50 border border-slate-150 rounded-lg p-2.5">
                    <div>
                      <span className="font-semibold text-slate-800 block">{b.drugName?.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">Batch: {b.batchNumber}</span>
                    </div>
                    <span className="text-amber-700 font-bold font-mono bg-amber-50 px-2 py-0.5 rounded">
                      {new Date(b.expiryDate).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Grid Matrix Items Layout */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-1">Active Batches In Store</h2>
        
        {batches.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-sm text-slate-400 font-medium shadow-2xs">
            No active drug validation batches logged within current store instance.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {batches.map((batch) => {
              const status = getExpiryStatus(batch.expiryDate);
              
              // Clean card layouts based on tier conditions
              let statusLabel = { text: "Stable Asset", style: "bg-emerald-50 text-emerald-700 border-emerald-200" };
              if (status === "red") statusLabel = { text: "Critical Expiry", style: "bg-rose-50 text-rose-700 border-rose-200" };
              if (status === "yellow") statusLabel = { text: "Near Expiry", style: "bg-amber-50 text-amber-700 border-amber-200" };
              if (status === "expired") statusLabel = { text: "Expired Item", style: "bg-slate-100 text-slate-600 border-slate-300 opacity-60" };

              const unitLabel = batch.unitType
                ? `${batch.remainingQty} ${batch.unitType}${batch.remainingQty !== 1 ? "s" : ""}`
                : batch.remainingQty;

              return (
                <div 
                  key={batch._id} 
                  className={`bg-white rounded-xl border p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between ${
                    status === "expired" ? "border-slate-200 bg-slate-50/50" : "border-slate-200"
                  }`}
                >
                  <div>
                    {/* Card Label and Expiry Badges */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-bold text-slate-900 text-base tracking-tight leading-snug">
                          {batch.drugName?.name}
                        </h3>
                        {batch.drugName?.brand && (
                          <span className="text-xs text-indigo-600 font-medium">
                            {batch.drugName.brand}
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border tracking-wide whitespace-nowrap ${statusLabel.style}`}>
                        {statusLabel.text}
                      </span>
                    </div>

                    {/* Meta rows block layout */}
                    <div className="space-y-2 my-4 pt-1 text-xs text-slate-600">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                        <span className="text-slate-400">Batch Code</span>
                        <span className="font-mono font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">{batch.batchNumber}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                        <span className="text-slate-400">Expiration</span>
                        <span className="font-mono font-bold text-slate-900">{new Date(batch.expiryDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                        <span className="text-slate-400">Location Shelf</span>
                        <span className="flex items-center gap-1 font-medium text-slate-800">
                          <MapPin className="w-3 h-3 text-slate-400" /> {batch.shelfLocation || "-"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions and Metrics dynamic row footer */}
                  <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Inventory / Price</span>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="font-bold font-mono text-slate-900 text-sm">{unitLabel}</span>
                        <span className="text-slate-300 text-xs">|</span>
                        <button
                          onClick={() => {
                            setPriceModal(batch._id);
                            setNewPrice(batch.sellingPrice);
                          }}
                          className="group flex items-center gap-1 text-slate-900 font-bold font-mono hover:text-indigo-600 transition-colors"
                        >
                          ${batch.sellingPrice?.toFixed(2)}
                          <Edit3 className="w-3 h-3 text-slate-400 group-hover:text-indigo-500" />
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedBatch(batch)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 text-white hover:bg-indigo-600 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                    >
                      <ArrowUpDown className="w-3 h-3" /> Adjust
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Adjust Stock Audit Modal */}
      {selectedBatch && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full border border-slate-200 flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-150 flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-indigo-500" /> Inventory Audit Adjustment
              </h3>
              <button onClick={() => setSelectedBatch(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs">
                <span className="text-slate-400 uppercase tracking-wider font-semibold block text-[10px]">Product Context</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">{selectedBatch.drugName?.name}</span>
                <span className="text-slate-500 block mt-1">Current Balanced Quantity: <strong className="font-mono text-slate-900 font-bold">{selectedBatch.remainingQty} units</strong></span>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Delta Modifier (+ / -)</label>
                <input
                  type="number"
                  step="any"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(parseFloat(e.target.value))}
                  className="w-full rounded-lg border-slate-300 font-bold font-mono text-sm p-2"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Log Action Reason</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full rounded-lg border-slate-300 text-xs p-2"
                  placeholder="e.g., damaged, inventory balancing audit"
                />
              </div>
            </div>
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-150 flex justify-end gap-2">
              <button onClick={() => setSelectedBatch(null)} className="px-3 py-1.5 border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 font-semibold text-xs rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={() => adjustStock(selectedBatch._id)} className="px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 font-semibold text-xs rounded-lg transition-colors">
                Save Adjustment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Selling Price Modal */}
      {priceModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-xs w-full border border-slate-200 flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-150 flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-indigo-500" /> Modify Market Rate
              </h3>
              <button onClick={() => setPriceModal(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <span className="text-slate-400 text-xs font-bold">$</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full rounded-lg border-slate-300 pl-6 pr-3 py-2 font-bold font-mono text-sm text-slate-900 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-150 flex justify-end gap-2">
              <button onClick={() => setPriceModal(null)} className="px-3 py-1.5 border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 font-semibold text-xs rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={() => updateSellingPrice(priceModal)} className="px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 font-semibold text-xs rounded-lg transition-colors">
                Update Rate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockList;
