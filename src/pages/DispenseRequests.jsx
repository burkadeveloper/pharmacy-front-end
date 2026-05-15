import React, { useState, useEffect } from "react";
import api from "../api/client";
import toast from "react-hot-toast";
import {
  ClipboardList,
  Plus,
  X,
  CheckCircle,
  Trash2,
  Package,
  Calendar,
  Layers,
  DollarSign,
} from "lucide-react";

const DispenseRequests = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    drugName: "",
    requestedQuantity: "",
    notes: "",
  });
  const [drugs, setDrugs] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [recommendedBatches, setRecommendedBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [fulfillQty, setFulfillQty] = useState("");

  useEffect(() => {
    fetchPending();
    fetchAll();
    fetchDrugs();
  }, []);

  const fetchPending = async () => {
    const { data } = await api.get("/dispense/requests/pending");
    setPendingRequests(data);
  };
  const fetchAll = async () => {
    const { data } = await api.get("/dispense/requests/all");
    setAllRequests(data);
  };
  const fetchDrugs = async () => {
    const { data } = await api.get("/drugs");
    setDrugs(data);
  };

  const createRequest = async () => {
    if (!form.drugName || !form.requestedQuantity) {
      toast.error("Drug and quantity required");
      return;
    }
    try {
      await api.post("/dispense/requests", form);
      toast.success("Request created");
      setShowForm(false);
      setForm({
        drugName: "",
        requestedQuantity: "",
        notes: "",
      });
      fetchPending();
      fetchAll();
    } catch (error) {
      toast.error(error.response?.data?.message);
    }
  };

  const showRecommendations = async (request) => {
    setSelectedRequest(request);
    const { data } = await api.get(
      `/dispense/recommended/${request.drugName._id}`,
    );
    setRecommendedBatches(data);
    if (data.length > 0) {
      setSelectedBatch(data[0]); // auto‑select closest expiry
      setFulfillQty(request.requestedQuantity);
    } else {
      setSelectedBatch(null);
      toast.error("No available stock for this drug");
    }
  };

  const fulfill = async () => {
    if (!selectedBatch) {
      toast.error("No batch selected");
      return;
    }
    const qty = parseFloat(fulfillQty);
    if (isNaN(qty) || qty <= 0 || qty > selectedBatch.remainingQty) {
      toast.error(
        `Invalid quantity. Max: ${selectedBatch.remainingQty} ${selectedBatch.unitType}s`,
      );
      return;
    }
    try {
      await api.post("/dispense/requests/fulfill", {
        requestId: selectedRequest._id,
        batchId: selectedBatch._id,
        finalQuantity: qty,
      });
      toast.success("Request fulfilled");
      setSelectedRequest(null);
      fetchPending();
      fetchAll();
    } catch (error) {
      toast.error(error.response?.data?.message);
    }
  };

  const cancelRequest = async (id) => {
    if (window.confirm("Cancel this request?")) {
      await api.delete(`/dispense/requests/${id}`);
      toast.success("Cancelled");
      fetchPending();
      fetchAll();
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6 font-sans antialiased selection:bg-indigo-100">
      {/* Dynamic Header Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 tracking-tight leading-none">
            Dispense Requests (Pick List)
          </h1>
          <p className="text-base text-slate-500 mt-2 font-normal leading-relaxed">
            Manage allocations, verify pending batch assignments, and log
            tracking records.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Request
          </button>
        </div>
      </div>

      {/* Create Request Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 flex flex-col transform transition-all scale-100">
            <div className="px-6 py-4.5 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h3 className="text-base font-bold text-slate-950 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-indigo-500" /> Create
                Dispense Request
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Select Drug
                </label>
                <select
                  value={form.drugName}
                  onChange={(e) =>
                    setForm({ ...form, drugName: e.target.value })
                  }
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2.5 font-semibold text-slate-800"
                >
                  <option value="">Choose item...</option>
                  {drugs.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} {d.brand ? `(${d.brand})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Requested Quantity
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={form.requestedQuantity}
                  onChange={(e) =>
                    setForm({ ...form, requestedQuantity: e.target.value })
                  }
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base p-2.5 font-bold font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Internal Notes
                </label>
                <textarea
                  placeholder="Add administrative details or instructions..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2.5 font-medium"
                  rows="3"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 rounded-b-xl">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 font-bold text-sm rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createRequest}
                className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 font-bold text-sm rounded-lg shadow-sm transition-colors"
              >
                Create Asset Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pending Requests Panel Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-950 tracking-tight mb-4">
          Pending Requests Queue
        </h2>
        {pendingRequests.length === 0 ? (
          <p className="text-sm font-semibold text-slate-400 bg-slate-50 rounded-lg p-6 border border-dashed border-slate-200 text-center">
            No active pending queues documented within current framework status.
          </p>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((req) => {
              const requestedUnit = req.drugName?.unitType || "units";
              return (
                <div
                  key={req._id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between border border-slate-200 hover:border-slate-300 bg-white rounded-xl p-4 gap-4 transition-colors shadow-2xs"
                >
                  <div>
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="font-bold text-slate-950 text-base tracking-tight">
                        {req.drugName?.name}
                      </span>
                      {req.drugName?.brand && (
                        <span className="text-xs text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded">
                          {req.drugName.brand}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 font-medium">
                      <span className="font-mono text-slate-700 bg-slate-50 border border-slate-200/60 px-1.5 py-0.5 rounded">
                        ID: {req.requestNumber}
                      </span>
                      {req.notes && (
                        <span className="truncate max-w-xs italic text-slate-400">
                          Note: {req.notes}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                    <span className="font-mono font-bold text-slate-950 bg-indigo-50/60 border border-indigo-100 px-3 py-1.5 rounded-lg text-sm">
                      {req.requestedQuantity} {requestedUnit}s
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => showRecommendations(req)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-emerald-700 transition-colors shadow-2xs"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Pick & Dispense
                      </button>
                      <button
                        onClick={() => cancelRequest(req._id)}
                        className="inline-flex items-center p-2 text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg transition-colors"
                        title="Cancel Request"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fulfillment Allocation Panel Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full border border-slate-200 flex flex-col transform transition-all scale-100">
            <div className="px-6 py-4.5 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h3 className="text-base font-bold text-slate-950 flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-500" /> Fulfill
                Allocation Order:{" "}
                <span className="font-mono text-slate-600">
                  {selectedRequest.requestNumber}
                </span>
              </h3>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Target Compound
                  </span>
                  <span className="text-base font-bold text-slate-950 mt-0.5 block tracking-tight">
                    {selectedRequest.drugName?.name}{" "}
                    {selectedRequest.drugName?.brand
                      ? `(${selectedRequest.drugName.brand})`
                      : ""}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Requirement Target
                  </span>
                  <span className="text-base font-bold font-mono text-indigo-600 mt-0.5 block">
                    {selectedRequest.requestedQuantity}{" "}
                    {selectedRequest.drugName?.unitType || "units"}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-400" /> Recommended
                  Batches (Closest Expiry Pre-Selected)
                </h3>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 shadow-2xs">
                  {recommendedBatches.length === 0 ? (
                    <p className="text-sm font-semibold text-slate-400 p-4 italic text-center">
                      No structural batches linked with parameters.
                    </p>
                  ) : (
                    recommendedBatches.map((batch) => {
                      const isSelected = selectedBatch?._id === batch._id;
                      return (
                        <div
                          key={batch._id}
                          onClick={() => setSelectedBatch(batch)}
                          className={`p-3 cursor-pointer text-sm transition-colors flex items-center justify-between ${
                            isSelected
                              ? "bg-indigo-50/70 text-indigo-950 font-medium"
                              : "hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold font-mono bg-white px-1.5 py-0.5 border rounded shadow-3xs text-xs text-slate-800">
                                Batch: {batch.batchNumber}
                              </span>
                              <span
                                className={`text-xs font-semibold font-mono ${isSelected ? "text-indigo-600" : "text-slate-500"}`}
                              >
                                Stock: {batch.remainingQty} {batch.unitType}s
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 flex items-center gap-2">
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> Expiry:{" "}
                                {new Date(
                                  batch.expiryDate,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="text-right font-mono font-bold text-slate-900 text-sm flex items-center gap-0.5">
                            <DollarSign className="w-3.5 h-3.5 opacity-60 text-slate-500" />
                            {batch.sellingPrice?.toFixed(2)}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Quantity To Release (in {selectedBatch?.unitType || "units"})
                </label>
                <input
                  type="number"
                  step={selectedBatch?.unitType === "Tablet" ? "1" : "0.1"}
                  value={fulfillQty}
                  onChange={(e) => setFulfillQty(e.target.value)}
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base p-2.5 font-bold font-mono text-slate-950"
                  max={selectedBatch?.remainingQty}
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 rounded-b-xl">
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 font-bold text-sm rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={fulfill}
                className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 font-bold text-sm rounded-lg shadow-sm transition-colors"
              >
                Confirm Allocation Release
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit History Matrix Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-950 tracking-tight">
            System Request History Ledger
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4 text-left">Request #</th>
                <th className="px-6 py-4 text-left">Drug Asset Name</th>
                <th className="px-6 py-4 text-left">Quantity Value</th>
                <th className="px-6 py-4 text-left">Tracking Status</th>
                <th className="px-6 py-4 text-right">Logged Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white text-slate-800">
              {allRequests.map((req) => (
                <tr
                  key={req._id}
                  className="hover:bg-slate-50/60 transition-colors align-middle text-sm"
                >
                  <td className="px-6 py-4 font-mono font-bold text-slate-700">
                    {req.requestNumber}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-950 text-[15px] tracking-tight">
                      {req.drugName?.name}
                    </div>
                    {req.drugName?.brand && (
                      <div className="text-xs text-slate-500 font-semibold mt-0.5">
                        {req.drugName.brand}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-slate-950">
                    {req.requestedQuantity}{" "}
                    <span className="font-sans font-semibold text-xs text-slate-500 lowercase">
                      {req.drugName?.unitType || "units"}s
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider shadow-3xs border ${
                        req.status === "fulfilled"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200/60"
                          : req.status === "pending"
                            ? "bg-amber-50 text-amber-800 border-amber-200/60"
                            : "bg-slate-100 text-slate-700 border-slate-300/40"
                      }`}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-slate-600 font-bold">
                    {new Date(req.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {allRequests.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="text-center p-16 text-slate-400 font-semibold text-base"
                  >
                    No matching validation entities cataloged in the historical
                    sub-arrays.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DispenseRequests;
