import React, { useState, useEffect } from "react";
import api from "../api/client";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  Layers,
  Calendar,
  Edit3,
  Sliders,
  MapPin,
  DollarSign,
  X,
  TrendingUp,
  Package,
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
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6 font-sans antialiased selection:bg-indigo-100">
      {/* Dynamic Dashboard Section Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 tracking-tight leading-none">
            Stock Batches
          </h1>
          <p className="text-base text-slate-500 mt-2 font-normal leading-relaxed">
            Monitor storage configurations, maintain unit pricing structures,
            and handle audit adjustments.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-4 text-sm font-medium text-slate-600">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-lg">
            <Package className="w-4 h-4 text-indigo-500" />
            <span>
              Total Records:{" "}
              <strong className="text-slate-950 font-bold font-mono">
                {batches.length}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Critical Insights Engine Section */}
      {(lowStock.length > 0 || expiring.red?.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Low Stock Panel Card */}
          {lowStock.length > 0 && (
            <div className="bg-rose-50/60 border border-rose-100 rounded-xl p-6 shadow-xs">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="p-2 bg-rose-100 rounded-lg text-rose-700">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-rose-950 text-base leading-none">
                  Low Stock Alert
                </h3>
              </div>
              <div className="max-h-48 overflow-y-auto pr-1">
                <ul className="space-y-2.5">
                  {lowStock.map((item) => (
                    <li
                      key={item.drug}
                      className="flex justify-between items-center text-sm bg-white border border-rose-200/60 rounded-lg p-3 shadow-2xs"
                    >
                      <span className="font-bold text-slate-900 tracking-tight">
                        {item.drug}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 rounded-md bg-rose-100 text-rose-900 font-bold font-mono text-xs">
                          {item.currentStock} units
                        </span>
                        <span className="text-slate-500 font-medium font-mono text-xs">
                          (threshold {item.threshold})
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Critical Expiry Alerts Panel Card */}
          {expiring.red?.length > 0 && (
            <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-6 shadow-xs">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-amber-950 text-base leading-none">
                  Expiring in &lt;30 days (Red Alert)
                </h3>
              </div>
              <div className="max-h-48 overflow-y-auto pr-1">
                <div className="space-y-2.5">
                  {expiring.red.map((b) => (
                    <div
                      key={b._id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm bg-white border border-amber-200/60 rounded-lg p-3 gap-2 shadow-2xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900 tracking-tight">
                          {b.drugName?.name}
                        </span>
                        {b.drugName?.brand && (
                          <span className="text-slate-500 font-normal ml-1.5 text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                            ({b.drugName.brand})
                          </span>
                        )}
                        <div className="text-xs text-slate-500 font-mono mt-1">
                          Batch: {b.batchNumber}
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 text-right">
                        <div className="text-left sm:text-right">
                          <span className="text-xs text-amber-800 font-bold font-mono block">
                            Expires{" "}
                            {new Date(b.expiryDate).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-slate-600 block font-semibold font-mono mt-0.5">
                            Qty {b.remainingQty} {b.unitType}s
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Stock Inventory Ledger Data Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4 text-left">Drug</th>
                <th className="px-6 py-4 text-left">Brand</th>
                <th className="px-6 py-4 text-left">Batch</th>
                <th className="px-6 py-4 text-left">Expiry</th>
                <th className="px-6 py-4 text-left">Qty Left</th>
                <th className="px-6 py-4 text-left">Selling Price</th>
                <th className="px-6 py-4 text-left">Location</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white text-slate-800">
              {batches.map((batch) => {
                const status = getExpiryStatus(batch.expiryDate);

                let conditionalRowStyle = "hover:bg-slate-50/50";
                if (status === "red")
                  conditionalRowStyle =
                    "bg-rose-50/40 hover:bg-rose-50/70 border-l-4 border-l-rose-500";
                if (status === "yellow")
                  conditionalRowStyle =
                    "bg-amber-50/40 hover:bg-amber-50/70 border-l-4 border-l-amber-500";
                if (status === "expired")
                  conditionalRowStyle =
                    "bg-slate-100 hover:bg-slate-200/70 opacity-70";

                const unitLabel = batch.unitType
                  ? `${batch.remainingQty} ${batch.unitType}${batch.remainingQty !== 1 ? "s" : ""}`
                  : batch.remainingQty;

                return (
                  <tr
                    key={batch._id}
                    className={`transition-colors align-middle text-sm ${conditionalRowStyle}`}
                  >
                    <td className="px-6 py-4.5">
                      <div className="font-bold text-slate-950 text-[15px] tracking-tight">
                        {batch.drugName?.name}
                      </div>
                    </td>
                    <td className="px-6 py-4.5 text-slate-600 font-semibold">
                      {batch.drugName?.brand || "-"}
                    </td>
                    <td className="px-6 py-4.5">
                      <span className="font-mono bg-slate-100 px-2.5 py-1 rounded text-xs font-bold text-slate-700 border border-slate-200/60 shadow-2xs">
                        {batch.batchNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4.5">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 font-mono">
                          {new Date(batch.expiryDate).toLocaleDateString()}
                        </span>
                        {status === "red" && (
                          <span className="text-[10px] text-rose-700 font-extrabold uppercase tracking-widest mt-1">
                            Critical Expiry
                          </span>
                        )}
                        {status === "yellow" && (
                          <span className="text-[10px] text-amber-700 font-extrabold uppercase tracking-widest mt-1">
                            Near Expiry
                          </span>
                        )}
                        {status === "expired" && (
                          <span className="text-[10px] text-slate-700 font-extrabold uppercase tracking-widest mt-1">
                            Expired Asset
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4.5">
                      <span className="font-bold text-slate-950 font-mono bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/40 shadow-2xs">
                        {unitLabel}
                      </span>
                    </td>
                    <td className="px-6 py-4.5">
                      <div className="flex items-center gap-1.5 group">
                        <span className="font-bold text-slate-950 font-mono text-[15px]">
                          ${batch.sellingPrice?.toFixed(2)}
                        </span>
                        <button
                          onClick={() => {
                            setPriceModal(batch._id);
                            setNewPrice(batch.sellingPrice);
                          }}
                          className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors opacity-80 group-hover:opacity-100"
                          title="Modify Pricing Index"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4.5">
                      <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{batch.shelfLocation || "-"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4.5 text-right">
                      <button
                        onClick={() => setSelectedBatch(batch)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-950 text-white font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-indigo-600 transition-colors shadow-sm focus:ring-2 focus:ring-slate-900 focus:ring-offset-1"
                      >
                        <Sliders className="w-3.5 h-3.5" /> Adjust
                      </button>
                    </td>
                  </tr>
                );
              })}
              {batches.length === 0 && (
                <tr>
                  <td
                    colSpan="8"
                    className="text-center p-16 text-slate-400 font-semibold text-base"
                  >
                    No active drug validation batches logged within current
                    instance framework.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Audit Modal Overlay Sheet */}
      {selectedBatch && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 flex flex-col transform transition-all scale-100">
            <div className="px-6 py-4.5 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h3 className="text-base font-bold text-slate-950 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-500" /> Audit Inventory
                Control
              </h3>
              <button
                onClick={() => setSelectedBatch(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4.5">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Target Variant
                </div>
                <div className="text-base font-bold text-slate-950 mt-1 tracking-tight">
                  {selectedBatch.drugName?.name}
                  {selectedBatch.drugName?.brand && (
                    <span className="font-semibold text-sm text-slate-500 ml-1.5">
                      ({selectedBatch.drugName.brand})
                    </span>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200/60 flex justify-between items-center text-sm font-medium text-slate-600">
                  <span>Current Balanced Quantity:</span>
                  <strong className="text-slate-950 bg-white px-2.5 py-1 rounded border font-bold font-mono text-xs">
                    {selectedBatch.remainingQty} {selectedBatch.unitType}s
                  </strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Adjustment (+/-) in {selectedBatch.unitType}s
                </label>
                <input
                  type="number"
                  step="any"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(parseFloat(e.target.value))}
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base p-2.5 font-bold font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Reason
                </label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2.5 font-medium"
                  placeholder="e.g., damaged, expiry adjustment"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 rounded-b-xl">
              <button
                onClick={() => setSelectedBatch(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 font-bold text-sm rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => adjustStock(selectedBatch._id)}
                className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 font-bold text-sm rounded-lg shadow-sm transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Selling Price Modal Overlay Sheet */}
      {priceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full border border-slate-200 flex flex-col">
            <div className="px-6 py-4.5 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h3 className="text-base font-bold text-slate-950 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-indigo-500" /> Edit Selling
                Price
              </h3>
              <button
                onClick={() => setPriceModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-slate-400 text-base font-bold">$</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full rounded-lg border-slate-300 pl-8 pr-4 py-2.5 focus:border-indigo-500 focus:ring-indigo-500 text-base font-bold font-mono text-slate-950"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 rounded-b-xl">
              <button
                onClick={() => setPriceModal(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 font-bold text-sm rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => updateSellingPrice(priceModal)}
                className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 font-bold text-sm rounded-lg shadow-sm transition-colors"
              >
                Update Index
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockList;
