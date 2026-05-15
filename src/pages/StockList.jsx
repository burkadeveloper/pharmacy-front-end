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
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  TrendingDown,
  Clock,
  Search,
  SortAsc,
  SortDesc
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
  const [showLowStock, setShowLowStock] = useState(true);
  const [showExpiring, setShowExpiring] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("expiry");
  const [sortOrder, setSortOrder] = useState("asc");

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

  // Filter & sort batches
  const filteredBatches = batches.filter((batch) =>
    batch.drugName?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedBatches = [...filteredBatches].sort((a, b) => {
    if (sortBy === "name") {
      const nameA = a.drugName?.name || "";
      const nameB = b.drugName?.name || "";
      return sortOrder === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    } else if (sortBy === "stock") {
      return sortOrder === "asc" ? a.remainingQty - b.remainingQty : b.remainingQty - a.remainingQty;
    } else if (sortBy === "expiry") {
      return sortOrder === "asc"
        ? new Date(a.expiryDate) - new Date(b.expiryDate)
        : new Date(b.expiryDate) - new Date(a.expiryDate);
    }
    return 0;
  });

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const toggleLowStock = () => setShowLowStock(!showLowStock);
  const toggleExpiring = () => setShowExpiring(!showExpiring);

  return (
    <div className="min-h-screen bg-gray-50 font-sans antialiased">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Layers className="w-7 h-7 text-indigo-600" />
              Stock Management
            </h1>
            <p className="text-gray-500 mt-1">Monitor batches, adjust inventory, and update pricing</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-4 py-2 flex items-center gap-2">
            <Package className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              Total batches: <strong className="text-gray-900 font-mono">{batches.length}</strong>
            </span>
          </div>
        </div>

        {/* Alerts Section */}
        {(lowStock.length > 0 || expiring.red?.length > 0) && (
          <div className="space-y-4 mb-8">
            {lowStock.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <button
                  onClick={toggleLowStock}
                  className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-rose-50 to-white hover:bg-rose-50/50 transition"
                >
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-rose-500" />
                    <h3 className="font-semibold text-gray-800">Low Stock Alert</h3>
                    <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      {lowStock.length} item{lowStock.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {showLowStock ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </button>
                {showLowStock && (
                  <div className="border-t border-gray-100 divide-y divide-gray-50">
                    {lowStock.map((item) => (
                      <div key={item.drug} className="flex justify-between items-center p-4 hover:bg-gray-50">
                        <div>
                          <p className="font-medium text-gray-800">{item.drug}</p>
                          <p className="text-xs text-gray-400">Minimum threshold: {item.minStock || 10}</p>
                        </div>
                        <div className="bg-rose-100 text-rose-700 font-bold font-mono px-3 py-1 rounded-full text-sm">
                          {item.currentStock} left
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {expiring.red?.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <button
                  onClick={toggleExpiring}
                  className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-white hover:bg-amber-50/50 transition"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-600" />
                    <h3 className="font-semibold text-gray-800">Expiring Soon (≤30 days)</h3>
                    <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      {expiring.red.length} batch{expiring.red.length !== 1 ? "es" : ""}
                    </span>
                  </div>
                  {showExpiring ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </button>
                {showExpiring && (
                  <div className="border-t border-gray-100 divide-y divide-gray-50">
                    {expiring.red.map((batch) => (
                      <div key={batch._id} className="p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-800">{batch.drugName?.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">Batch: {batch.batchNumber}</p>
                          </div>
                          <span className="text-amber-700 font-mono text-sm bg-amber-50 px-2 py-1 rounded">
                            {new Date(batch.expiryDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Active Batches Section */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-500" />
              Active Batches
            </h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by drug or batch..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-64"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleSort("name")}
                  className={`px-3 py-2 text-sm rounded-xl border transition ${
                    sortBy === "name"
                      ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                      : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Name {sortBy === "name" && (sortOrder === "asc" ? <SortAsc className="inline w-3 h-3 ml-1" /> : <SortDesc className="inline w-3 h-3 ml-1" />)}
                </button>
                <button
                  onClick={() => toggleSort("stock")}
                  className={`px-3 py-2 text-sm rounded-xl border transition ${
                    sortBy === "stock"
                      ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                      : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Stock {sortBy === "stock" && (sortOrder === "asc" ? <SortAsc className="inline w-3 h-3 ml-1" /> : <SortDesc className="inline w-3 h-3 ml-1" />)}
                </button>
                <button
                  onClick={() => toggleSort("expiry")}
                  className={`px-3 py-2 text-sm rounded-xl border transition ${
                    sortBy === "expiry"
                      ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                      : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Expiry {sortBy === "expiry" && (sortOrder === "asc" ? <SortAsc className="inline w-3 h-3 ml-1" /> : <SortDesc className="inline w-3 h-3 ml-1" />)}
                </button>
              </div>
            </div>
          </div>

          {sortedBatches.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
              No batches found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedBatches.map((batch) => {
                const status = getExpiryStatus(batch.expiryDate);
                let statusBadge = { label: "Stable", classes: "bg-emerald-100 text-emerald-700" };
                if (status === "red") statusBadge = { label: "Critical", classes: "bg-rose-100 text-rose-700" };
                if (status === "yellow") statusBadge = { label: "Near expiry", classes: "bg-amber-100 text-amber-700" };
                if (status === "expired") statusBadge = { label: "Expired", classes: "bg-gray-200 text-gray-600" };

                const isLowStockItem = lowStock.some((item) => item.drug === batch.drugName?.name);
                const unitLabel = batch.unitType
                  ? `${batch.remainingQty} ${batch.unitType}${batch.remainingQty !== 1 ? "s" : ""}`
                  : batch.remainingQty;

                return (
                  <div
                    key={batch._id}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group relative flex flex-col h-full"
                  >
                    {isLowStockItem && (
                      <div className="absolute top-0 right-0 mt-2 mr-2 z-10">
                        <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-1 rounded-full">Low stock</span>
                      </div>
                    )}
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 text-lg break-words">{batch.drugName?.name}</h3>
                          {batch.drugName?.brand && (
                            <p className="text-sm text-indigo-600 break-words">{batch.drugName.brand}</p>
                          )}
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap ${statusBadge.classes}`}>
                          {statusBadge.label}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 shrink-0">Batch #</span>
                          <span className="font-mono text-gray-700 text-right break-all ml-2">{batch.batchNumber}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 shrink-0">Expiry</span>
                          <span className="font-mono text-gray-700 whitespace-nowrap">{new Date(batch.expiryDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 flex items-center gap-1 shrink-0">
                            <MapPin className="w-3 h-3" /> Shelf
                          </span>
                          <span className="text-gray-700 truncate ml-2">{batch.shelfLocation || "—"}</span>
                        </div>
                      </div>

                      <div className="border-t border-gray-100 pt-4 mt-auto flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-xs text-gray-400 uppercase tracking-wide">Stock / Price</p>
                          <div className="flex flex-wrap items-baseline gap-2 mt-1">
                            <span className="font-bold font-mono text-gray-900 break-words">{unitLabel}</span>
                            <button
                              onClick={() => {
                                setPriceModal(batch._id);
                                setNewPrice(batch.sellingPrice?.toString() || "");
                              }}
                              className="flex items-center gap-1 text-gray-600 font-mono hover:text-indigo-600 transition shrink-0"
                            >
                              ${batch.sellingPrice?.toFixed(2)}
                              <Edit3 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedBatch(batch)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-900 text-white hover:bg-indigo-600 rounded-xl text-xs font-semibold transition shrink-0"
                        >
                          <ArrowUpDown className="w-3.5 h-3.5" /> Adjust
                        </button>
                      </div>
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
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-500" /> Adjust Inventory
              </h3>
              <button onClick={() => setSelectedBatch(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 uppercase">Product</p>
                <p className="font-bold text-gray-800">{selectedBatch.drugName?.name}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Current stock: <strong className="font-mono">{selectedBatch.remainingQty} units</strong>
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Adjustment amount (+ / -)</label>
                <input
                  type="number"
                  step="any"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(parseFloat(e.target.value))}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., +10 or -5"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Reason</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., damaged, restock, wastage"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 bg-gray-50 border-t border-gray-100">
              <button onClick={() => setSelectedBatch(null)} className="px-4 py-2 text-sm border border-gray-300 rounded-xl hover:bg-white transition">
                Cancel
              </button>
              <button onClick={() => adjustStock(selectedBatch._id)} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition">
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
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-indigo-500" /> Update Selling Price
              </h3>
              <button onClick={() => setPriceModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <label className="block text-xs font-semibold text-gray-500 mb-1">New price (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl pl-7 p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 bg-gray-50 border-t border-gray-100">
              <button onClick={() => setPriceModal(null)} className="px-4 py-2 text-sm border border-gray-300 rounded-xl hover:bg-white transition">
                Cancel
              </button>
              <button onClick={() => updateSellingPrice(priceModal)} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition">
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
