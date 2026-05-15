import React, { useState, useEffect } from "react";
import api from "../api/client";
import toast from "react-hot-toast";
import {
  Building2,
  Plus,
  Edit3,
  Trash2,
  User,
  FileText,
  FileSpreadsheet,
  X,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

const Companies = () => {
  const [companies, setCompanies] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    contact: "",
    taxId: "",
    notes: "",
  });

  useEffect(() => {
    fetchCompanies();
    fetchMetrics();
  }, []);

  const fetchCompanies = async () => {
    try {
      const { data } = await api.get("/companies");
      setCompanies(data);
    } catch (error) {
      toast.error("Failed to fetch companies list");
    }
  };

  const fetchMetrics = async () => {
    try {
      const { data } = await api.get("/companies/metrics/supplier");
      setMetrics(data);
    } catch (error) {
      console.error("Could not populate metric overlays", error);
    }
  };

  const saveCompany = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Company name is required");

    try {
      if (editing) {
        await api.put(`/companies/${editing}`, form);
        toast.success("Supplier profiles updated successfully");
      } else {
        await api.post("/companies", form);
        toast.success("New corporate supplier registered");
      }
      closeModal();
      fetchCompanies();
      fetchMetrics();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "An operational failure occurred",
      );
    }
  };

  const deleteCompany = async (id) => {
    if (
      window.confirm(
        "Are you sure you want to permanently delete this supplier? This action cannot be reversed.",
      )
    ) {
      try {
        await api.delete(`/companies/${id}`);
        toast.success("Supplier profile deleted");
        fetchCompanies();
        fetchMetrics();
      } catch (error) {
        toast.error(
          "Could not remove entity. Check for active purchase linkages.",
        );
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm({ name: "", contact: "", taxId: "", notes: "" });
  };

  const getMetric = (companyId) =>
    metrics.find((m) => m.id === companyId) || {};

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6 font-sans antialiased selection:bg-indigo-100">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-600" /> Vendor Registry
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your network of commercial distributors, legal tax entities,
            and logistics execution ratios.
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setForm({ name: "", contact: "", taxId: "", notes: "" });
            setShowModal(true);
          }}
          className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Register Supplier
        </button>
      </div>

      {/* Main Directory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4 text-left">Company Identity</th>
                <th className="px-6 py-4 text-left">Primary Contact</th>
                <th className="px-6 py-4 text-left">Tax ID</th>
                <th className="px-6 py-4 text-left">Fulfillment Rate</th>
                <th className="px-6 py-4 text-left">On-Time Matrix</th>
                <th className="px-6 py-4 text-left">Deviation Rate</th>
                <th className="px-6 py-4 text-right">Control Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white text-slate-800">
              {companies.map((company) => {
                const m = getMetric(company._id);
                return (
                  <tr
                    key={company._id}
                    className="hover:bg-slate-50/40 transition-colors align-middle"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-950">
                        {company.name}
                      </div>
                      {company.notes && (
                        <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[200px] font-medium">
                          {company.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {company.contact || (
                        <span className="text-slate-300 italic">
                          None Provided
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-500 font-semibold text-xs">
                      {company.taxId || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-slate-900">
                        {m.fulfilmentRate || 0}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-slate-900">
                        {m.onTimeRate || 0}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 font-mono text-xs font-bold rounded-md ${
                          (m.discrepancyRate || 0) > 5
                            ? "bg-rose-50 text-rose-700 border border-rose-100"
                            : "bg-slate-50 text-slate-600 border border-slate-200/60"
                        }`}
                      >
                        {m.discrepancyRate || 0}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setEditing(company._id);
                          setForm(company);
                          setShowModal(true);
                        }}
                        className="inline-flex items-center justify-center p-1.5 text-slate-500 hover:text-indigo-600 rounded-md hover:bg-slate-100 transition-colors"
                        title="Edit Supplier"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteCompany(company._id)}
                        className="inline-flex items-center justify-center p-1.5 text-slate-500 hover:text-rose-600 rounded-md hover:bg-slate-100 transition-colors"
                        title="Delete Supplier"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {companies.length === 0 && (
                <tr>
                  <td
                    colSpan="7"
                    className="text-center p-12 text-slate-400 font-medium"
                  >
                    <AlertCircle className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                    No registered companies found in current ledger.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modern Modal Overlay Component */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-opacity">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-base font-bold text-slate-950 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-500" />
                {editing
                  ? "Modify Supplier Matrix"
                  : "Create Enterprise Account"}
              </h2>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={saveCompany}>
              <div className="p-6 space-y-4">
                {/* Name Field */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Company Legal Name *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      placeholder="e.g. Acme Pharmaceuticals Inc."
                      className="w-full pl-9 rounded-lg border-slate-200 text-sm focus:border-indigo-500 focus:ring-indigo-500 shadow-3xs placeholder-slate-400 font-semibold"
                      required
                    />
                  </div>
                </div>

                {/* Contact Field */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Point of Contact / Channels
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={form.contact}
                      onChange={(e) =>
                        setForm({ ...form, contact: e.target.value })
                      }
                      placeholder="Email, name or phone listings"
                      className="w-full pl-9 rounded-lg border-slate-200 text-sm focus:border-indigo-500 focus:ring-indigo-500 shadow-3xs placeholder-slate-400"
                    />
                  </div>
                </div>

                {/* Tax ID Field */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Corporate Tax ID / Registration
                  </label>
                  <div className="relative">
                    <FileSpreadsheet className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={form.taxId}
                      onChange={(e) =>
                        setForm({ ...form, taxId: e.target.value })
                      }
                      placeholder="e.g. EIN-XX-XXXXXXX"
                      className="w-full pl-9 rounded-lg border-slate-200 text-sm focus:border-indigo-500 focus:ring-indigo-500 shadow-3xs font-mono tracking-wide placeholder-slate-400"
                    />
                  </div>
                </div>

                {/* Notes Textarea */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Internal Reference Notes
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <textarea
                      value={form.notes}
                      onChange={(e) =>
                        setForm({ ...form, notes: e.target.value })
                      }
                      placeholder="Add strategic account variables or delivery conditions..."
                      className="w-full pl-9 rounded-lg border-slate-200 text-sm focus:border-indigo-500 focus:ring-indigo-500 shadow-3xs placeholder-slate-400"
                      rows="3"
                    />
                  </div>
                </div>
              </div>

              {/* Form Action Controls */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors"
                >
                  {editing ? "Apply Changes" : "Commit Entity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Companies;
