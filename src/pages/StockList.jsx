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

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem 1rem" }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.875rem", fontWeight: "bold", color: "#111827", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Layers size={28} color="#4f46e5" /> Stock Management
            </h1>
            <p style={{ color: "#6b7280", marginTop: "0.25rem" }}>Monitor batches, adjust inventory, and update pricing</p>
          </div>
          <div style={{ backgroundColor: "white", borderRadius: "0.75rem", border: "1px solid #e5e7eb", padding: "0.5rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Package size={16} color="#9ca3af" />
            <span style={{ fontSize: "0.875rem", color: "#4b5563" }}>Total batches: <strong style={{ color: "#111827" }}>{batches.length}</strong></span>
          </div>
        </div>

        {/* Alerts - collapsible (same as before, but I'll keep it concise) */}
        {(lowStock.length > 0 || expiring.red?.length > 0) && (
          <div style={{ marginBottom: "2rem" }}>
            {lowStock.length > 0 && (
              <div style={{ backgroundColor: "white", borderRadius: "0.75rem", border: "1px solid #e5e7eb", marginBottom: "1rem" }}>
                <button onClick={() => setShowLowStock(!showLowStock)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", background: "linear-gradient(to right, #fff1f2, white)", border: "none", cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <TrendingDown size={20} color="#f43f5e" />
                    <span style={{ fontWeight: "600" }}>Low Stock Alert</span>
                    <span style={{ backgroundColor: "#ffe4e6", color: "#be123c", fontSize: "0.75rem", fontWeight: "bold", padding: "0.125rem 0.5rem", borderRadius: "9999px" }}>{lowStock.length} items</span>
                  </div>
                  {showLowStock ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                {showLowStock && (
                  <div style={{ borderTop: "1px solid #f3f4f6" }}>
                    {lowStock.map((item) => (
                      <div key={item.drug} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", borderBottom: "1px solid #f9fafb" }}>
                        <div><p style={{ fontWeight: "500" }}>{item.drug}</p><p style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Min: {item.minStock || 10}</p></div>
                        <span style={{ backgroundColor: "#ffe4e6", color: "#be123c", fontWeight: "bold", padding: "0.25rem 0.75rem", borderRadius: "9999px" }}>{item.currentStock} left</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {expiring.red?.length > 0 && (
              <div style={{ backgroundColor: "white", borderRadius: "0.75rem", border: "1px solid #e5e7eb" }}>
                <button onClick={() => setShowExpiring(!showExpiring)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", background: "linear-gradient(to right, #fffbeb, white)", border: "none", cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Clock size={20} color="#d97706" />
                    <span style={{ fontWeight: "600" }}>Expiring Soon (≤30 days)</span>
                    <span style={{ backgroundColor: "#fef3c7", color: "#b45309", fontSize: "0.75rem", fontWeight: "bold", padding: "0.125rem 0.5rem", borderRadius: "9999px" }}>{expiring.red.length} batches</span>
                  </div>
                  {showExpiring ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                {showExpiring && (
                  <div style={{ borderTop: "1px solid #f3f4f6" }}>
                    {expiring.red.map((batch) => (
                      <div key={batch._id} style={{ padding: "1rem", borderBottom: "1px solid #f9fafb" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <div><p style={{ fontWeight: "500" }}>{batch.drugName?.name}</p><p style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Batch: {batch.batchNumber}</p></div>
                          <span style={{ color: "#b45309", fontSize: "0.875rem", backgroundColor: "#fffbeb", padding: "0.25rem 0.5rem", borderRadius: "0.375rem" }}>{new Date(batch.expiryDate).toLocaleDateString()}</span>
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
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", gap: "1rem" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "0.5rem" }}><Package size={20} color="#4f46e5" /> Active Batches</h2>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <div style={{ position: "relative" }}>
                <Search size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                <input type="text" placeholder="Search drug or batch..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: "0.5rem 0.75rem 0.5rem 2rem", border: "1px solid #d1d5db", borderRadius: "0.75rem", fontSize: "0.875rem", width: "100%", minWidth: "200px" }} />
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {["name", "stock", "expiry"].map((field) => (
                  <button key={field} onClick={() => toggleSort(field)} style={{ padding: "0.5rem 0.75rem", fontSize: "0.875rem", borderRadius: "0.75rem", border: "1px solid #d1d5db", backgroundColor: sortBy === field ? "#eef2ff" : "white", color: sortBy === field ? "#4f46e5" : "#4b5563", cursor: "pointer" }}>
                    {field === "name" ? "Name" : field === "stock" ? "Stock" : "Expiry"}
                    {sortBy === field && (sortOrder === "asc" ? <SortAsc size={12} style={{ display: "inline", marginLeft: "0.25rem" }} /> : <SortDesc size={12} style={{ display: "inline", marginLeft: "0.25rem" }} />)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {sortedBatches.length === 0 ? (
            <div style={{ backgroundColor: "white", borderRadius: "0.75rem", border: "1px solid #e5e7eb", padding: "3rem", textAlign: "center", color: "#9ca3af" }}>No batches found.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
              {sortedBatches.map((batch) => {
                const status = getExpiryStatus(batch.expiryDate);
                let statusBadge = { label: "Stable", style: { backgroundColor: "#d1fae5", color: "#065f46" } };
                if (status === "red") statusBadge = { label: "Critical", style: { backgroundColor: "#ffe4e6", color: "#be123c" } };
                if (status === "yellow") statusBadge = { label: "Near expiry", style: { backgroundColor: "#fef3c7", color: "#92400e" } };
                if (status === "expired") statusBadge = { label: "Expired", style: { backgroundColor: "#e5e7eb", color: "#4b5563" } };
                const isLowStockItem = lowStock.some(item => item.drug === batch.drugName?.name);
                const unitLabel = batch.unitType ? `${batch.remainingQty} ${batch.unitType}${batch.remainingQty !== 1 ? "s" : ""}` : batch.remainingQty;

                return (
                  <div key={batch._id} style={{ display: "flex", flexDirection: "column", height: "100%", backgroundColor: "white", borderRadius: "1rem", border: "1px solid #e5e7eb", boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)", transition: "box-shadow 0.2s", position: "relative" }}>
                    {isLowStockItem && <span style={{ position: "absolute", top: "0.5rem", right: "0.5rem", backgroundColor: "#ffe4e6", color: "#be123c", fontSize: "0.625rem", fontWeight: "bold", padding: "0.25rem 0.5rem", borderRadius: "9999px", zIndex: 10 }}>Low stock</span>}
                    <div style={{ padding: "1.25rem", flex: 1, display: "flex", flexDirection: "column" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem", marginBottom: "0.75rem" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3 style={{ fontWeight: "bold", fontSize: "1.125rem", wordBreak: "break-word" }}>{batch.drugName?.name}</h3>
                          {batch.drugName?.brand && <p style={{ fontSize: "0.875rem", color: "#4f46e5", wordBreak: "break-word" }}>{batch.drugName.brand}</p>}
                        </div>
                        <span style={{ fontSize: "0.625rem", fontWeight: "bold", padding: "0.25rem 0.5rem", borderRadius: "9999px", whiteSpace: "nowrap", ...statusBadge.style }}>{statusBadge.label}</span>
                      </div>
                      <div style={{ fontSize: "0.875rem", marginBottom: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#9ca3af" }}>Batch #</span><span style={{ fontFamily: "monospace", wordBreak: "break-all", textAlign: "right", marginLeft: "0.5rem" }}>{batch.batchNumber}</span></div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#9ca3af" }}>Expiry</span><span style={{ fontFamily: "monospace", whiteSpace: "nowrap" }}>{new Date(batch.expiryDate).toLocaleDateString()}</span></div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ color: "#9ca3af", display: "flex", alignItems: "center", gap: "0.25rem" }}><MapPin size={12} /> Shelf</span><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginLeft: "0.5rem" }}>{batch.shelfLocation || "—"}</span></div>
                      </div>
                      <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "1rem", marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: "0.75rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Stock / Price</p>
                          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "0.5rem", marginTop: "0.25rem" }}>
                            <span style={{ fontWeight: "bold", fontFamily: "monospace", wordBreak: "break-word" }}>{unitLabel}</span>
                            <button onClick={() => { setPriceModal(batch._id); setNewPrice(batch.sellingPrice?.toString() || ""); }} style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", color: "#4b5563", fontFamily: "monospace", background: "none", border: "none", cursor: "pointer" }}>
                              ${batch.sellingPrice?.toFixed(2)} <Edit3 size={12} />
                            </button>
                          </div>
                        </div>
                        <button onClick={() => setSelectedBatch(batch)} style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 0.75rem", backgroundColor: "#111827", color: "white", border: "none", borderRadius: "0.75rem", fontSize: "0.75rem", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap" }}>
                          <ArrowUpDown size={14} /> Adjust
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

      {/* Adjust Modal - same as before, but simplified */}
      {selectedBatch && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "1rem" }}>
          <div style={{ backgroundColor: "white", borderRadius: "1rem", maxWidth: "28rem", width: "100%", overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem", borderBottom: "1px solid #f3f4f6" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "0.5rem" }}><Sliders size={20} color="#4f46e5" /> Adjust Inventory</h3>
              <button onClick={() => setSelectedBatch(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
            </div>
            <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ backgroundColor: "#f9fafb", padding: "1rem", borderRadius: "0.75rem" }}>
                <p style={{ fontSize: "0.75rem", color: "#6b7280", textTransform: "uppercase" }}>Product</p>
                <p style={{ fontWeight: "bold" }}>{selectedBatch.drugName?.name}</p>
                <p style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}>Current stock: <strong>{selectedBatch.remainingQty} units</strong></p>
              </div>
              <div><label style={{ fontSize: "0.75rem", fontWeight: "600", color: "#6b7280" }}>Adjustment (+ / -)</label><input type="number" step="any" value={adjustQty} onChange={(e) => setAdjustQty(parseFloat(e.target.value))} style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: "0.75rem", padding: "0.5rem", marginTop: "0.25rem" }} /></div>
              <div><label style={{ fontSize: "0.75rem", fontWeight: "600", color: "#6b7280" }}>Reason</label><input type="text" value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: "0.75rem", padding: "0.5rem", marginTop: "0.25rem" }} placeholder="e.g., damaged, restock" /></div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", padding: "1.25rem", backgroundColor: "#f9fafb", borderTop: "1px solid #f3f4f6" }}>
              <button onClick={() => setSelectedBatch(null)} style={{ padding: "0.5rem 1rem", border: "1px solid #d1d5db", borderRadius: "0.75rem", background: "white", cursor: "pointer" }}>Cancel</button>
              <button onClick={() => adjustStock(selectedBatch._id)} style={{ padding: "0.5rem 1rem", backgroundColor: "#4f46e5", color: "white", border: "none", borderRadius: "0.75rem", cursor: "pointer" }}>Apply</button>
            </div>
          </div>
        </div>
      )}

      {/* Price Modal */}
      {priceModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "1rem" }}>
          <div style={{ backgroundColor: "white", borderRadius: "1rem", maxWidth: "28rem", width: "100%", overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem", borderBottom: "1px solid #f3f4f6" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "0.5rem" }}><DollarSign size={20} color="#4f46e5" /> Update Price</h3>
              <button onClick={() => setPriceModal(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
            </div>
            <div style={{ padding: "1.25rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: "600", color: "#6b7280" }}>New price (USD)</label>
              <div style={{ position: "relative", marginTop: "0.25rem" }}>
                <span style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}>$</span>
                <input type="number" step="0.01" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: "0.75rem", padding: "0.5rem 0.5rem 0.5rem 1.75rem" }} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", padding: "1.25rem", backgroundColor: "#f9fafb", borderTop: "1px solid #f3f4f6" }}>
              <button onClick={() => setPriceModal(null)} style={{ padding: "0.5rem 1rem", border: "1px solid #d1d5db", borderRadius: "0.75rem", background: "white", cursor: "pointer" }}>Cancel</button>
              <button onClick={() => updateSellingPrice(priceModal)} style={{ padding: "0.5rem 1rem", backgroundColor: "#4f46e5", color: "white", border: "none", borderRadius: "0.75rem", cursor: "pointer" }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockList;
