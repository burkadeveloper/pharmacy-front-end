import React, { useState, useEffect } from "react";
import api from "../api/client";
import { Link } from "react-router-dom";
import { Plus, Eye, Trash2, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [drugs, setDrugs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showCustomDrugForm, setShowCustomDrugForm] = useState(false);
  const [customDrug, setCustomDrug] = useState({
    name: "",
    brand: "",
    category: "",
    shelfLocation: "",
    minStockThreshold: 10,
  });
  const [form, setForm] = useState({
    company: "",
    orderDate: "",
    expectedDeliveryDate: "",
    notes: "",
    lines: [],
  });
  const [lineForm, setLineForm] = useState({
    drugName: "",
    orderedQty: 1,
    unitType: "Tablet",
    unitSize: "",
    batchNumber: "",
    expiryDate: "",
    costPrice: 0,
    sellingPrice: 0,
  });

  useEffect(() => {
    fetchOrders();
    fetchCompanies();
    fetchDrugs();
    fetchCategories();
  }, []);

  const fetchOrders = async () => {
    const { data } = await api.get("/orders");
    setOrders(data);
  };
  const fetchCompanies = async () => {
    const { data } = await api.get("/companies");
    setCompanies(data);
  };
  const fetchDrugs = async () => {
    const { data } = await api.get("/drugs");
    setDrugs(data);
  };
  const fetchCategories = async () => {
    const { data } = await api.get("/drugs/categories");
    setCategories(data);
  };

  const addLine = () => {
    if (!lineForm.drugName || lineForm.orderedQty <= 0) {
      toast.error("Select a drug and positive quantity");
      return;
    }
    setForm({
      ...form,
      lines: [...form.lines, { ...lineForm }],
    });
    setLineForm({
      drugName: "",
      orderedQty: 1,
      unitType: "Tablet",
      unitSize: "",
      batchNumber: "",
      expiryDate: "",
      costPrice: 0,
      sellingPrice: 0,
    });
  };

  const removeLine = (index) => {
    const newLines = [...form.lines];
    newLines.splice(index, 1);
    setForm({ ...form, lines: newLines });
  };

  const createCustomDrug = async () => {
    if (!customDrug.name || !customDrug.category) {
      toast.error("Drug name and category required");
      return;
    }
    try {
      const { data } = await api.post("/drugs", customDrug);
      toast.success("Drug created");
      setDrugs([...drugs, data]);
      setLineForm({ ...lineForm, drugName: data._id });
      setShowCustomDrugForm(false);
      setCustomDrug({
        name: "",
        brand: "",
        category: "",
        shelfLocation: "",
        minStockThreshold: 10,
      });
    } catch (error) {
      toast.error(error.response?.data?.message);
    }
  };

  const createOrder = async () => {
    if (!form.company || form.lines.length === 0) {
      toast.error("Please select company and add at least one line");
      return;
    }
    try {
      await api.post("/orders", form);
      toast.success("Order created");
      setShowModal(false);
      setForm({
        company: "",
        orderDate: "",
        expectedDeliveryDate: "",
        notes: "",
        lines: [],
      });
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error creating order");
    }
  };

  const cancelOrder = async (id) => {
    if (window.confirm("Cancel this order?")) {
      await api.delete(`/orders/${id}`);
      toast.success("Order cancelled");
      fetchOrders();
    }
  };

  // Fixed the raw interpolation bug so Tailwind compiles structural class definitions safely
  const getStatusColor = (status) => {
    const colors = {
      Pending: "bg-amber-50 text-amber-800 border-amber-200",
      Updated: "bg-orange-50 text-orange-800 border-orange-200",
      Cancelled: "bg-rose-50 text-rose-800 border-rose-200",
      "Partially Received": "bg-sky-50 text-sky-800 border-sky-200",
      Completed: "bg-emerald-50 text-emerald-800 border-emerald-200",
    };
    return colors[status] || "bg-slate-50 text-slate-800 border-slate-200";
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
      {/* Top Bar Banner Section */}
      <div className="sm:flex sm:items-center sm:justify-between bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Purchase Orders
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage vendor supply receipts, log item data lines, and oversee
            fulfillment processes.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="mt-4 sm:mt-0 inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 shadow-sm transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus size={18} /> Create Order
        </button>
      </div>

      {/* Primary Data Listing Grid Layout */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4 text-left">Order #</th>
                <th className="px-6 py-4 text-left">Supplier</th>
                <th className="px-6 py-4 text-left">Date</th>
                <th className="px-6 py-4 text-left">Total</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
              {orders.map((order) => (
                <tr
                  key={order._id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-6 py-4 font-mono font-semibold text-slate-900">
                    {order.orderNumber}
                  </td>
                  <td className="px-6 py-4 font-medium">
                    {order.company?.name}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(order.orderDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    ${order.totalOrderedValue?.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      <Link
                        to={`/orders/${order._id}`}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Eye size={18} />
                      </Link>
                      {order.status !== "Completed" &&
                        order.status !== "Cancelled" && (
                          <button
                            onClick={() => cancelOrder(order._id)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="text-center p-12 text-slate-400 bg-white font-medium"
                  >
                    No active documentation workflows discovered.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Form Creation Sheet Model Overlay */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h2 className="text-lg font-bold text-slate-900">
                Create Purchase Order
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Supplier
                </label>
                <select
                  value={form.company}
                  onChange={(e) =>
                    setForm({ ...form, company: e.target.value })
                  }
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2 bg-white"
                >
                  <option value="">Select</option>
                  {companies.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Order Date
                  </label>
                  <input
                    type="date"
                    value={form.orderDate}
                    onChange={(e) =>
                      setForm({ ...form, orderDate: e.target.value })
                    }
                    className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Expected Delivery
                  </label>
                  <input
                    type="date"
                    value={form.expectedDeliveryDate}
                    onChange={(e) =>
                      setForm({ ...form, expectedDeliveryDate: e.target.value })
                    }
                    className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2"
                  rows="2"
                ></textarea>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                <h3 className="text-sm font-bold text-slate-800">
                  Order Lines
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="sm:col-span-2 flex gap-2 items-end">
                    <div className="flex-1">
                      <select
                        value={lineForm.drugName}
                        onChange={(e) =>
                          setLineForm({ ...lineForm, drugName: e.target.value })
                        }
                        className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2 bg-white"
                      >
                        <option value="">Select Drug</option>
                        {drugs.map((d) => (
                          <option key={d._id} value={d._id}>
                            {d.name} {d.brand ? `(${d.brand})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCustomDrugForm(true)}
                      className="px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold rounded-lg border border-emerald-200 h-[38px] transition-colors whitespace-nowrap"
                    >
                      + New Drug
                    </button>
                  </div>

                  <div>
                    <input
                      type="number"
                      placeholder="Qty"
                      value={lineForm.orderedQty}
                      onChange={(e) =>
                        setLineForm({
                          ...lineForm,
                          orderedQty: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2"
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Unit Type"
                      value={lineForm.unitType}
                      onChange={(e) =>
                        setLineForm({ ...lineForm, unitType: e.target.value })
                      }
                      className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2"
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Unit Size (e.g., 12 tabs)"
                      value={lineForm.unitSize}
                      onChange={(e) =>
                        setLineForm({ ...lineForm, unitSize: e.target.value })
                      }
                      className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2"
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Batch number (optional)"
                      value={lineForm.batchNumber}
                      onChange={(e) =>
                        setLineForm({
                          ...lineForm,
                          batchNumber: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2"
                    />
                  </div>

                  <div>
                    <input
                      type="date"
                      placeholder="Expiry date"
                      value={lineForm.expiryDate}
                      onChange={(e) =>
                        setLineForm({ ...lineForm, expiryDate: e.target.value })
                      }
                      className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-1.5"
                    />
                  </div>

                  <div>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Cost Price"
                      value={lineForm.costPrice}
                      onChange={(e) =>
                        setLineForm({
                          ...lineForm,
                          costPrice: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2"
                    />
                  </div>

                  <div>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Selling Price"
                      value={lineForm.sellingPrice}
                      onChange={(e) =>
                        setLineForm({
                          ...lineForm,
                          sellingPrice: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={addLine}
                    className="w-full sm:w-auto text-center px-5 py-2 bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-semibold rounded-lg transition-colors shadow-xs"
                  >
                    Add Line
                  </button>
                </div>
              </div>

              {/* Added Row Sub-Matrix Content Area */}
              {form.lines.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600 divide-y divide-slate-200">
                      <thead className="bg-slate-100 font-semibold text-slate-700">
                        <tr>
                          <th className="p-3">Drug</th>
                          <th className="p-3">Brand</th>
                          <th className="p-3">Qty</th>
                          <th className="p-3">Unit</th>
                          <th className="p-3">Batch</th>
                          <th className="p-3">Expiry</th>
                          <th className="p-3">Cost</th>
                          <th className="p-3">Selling</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {form.lines.map((line, idx) => {
                          const drug = drugs.find(
                            (d) => d._id === line.drugName,
                          );
                          return (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="p-3 font-medium text-slate-900">
                                {drug?.name || "Unknown"}
                              </td>
                              <td className="p-3 text-slate-500">
                                {drug?.brand || "-"}
                              </td>
                              <td className="p-3 font-semibold text-slate-900">
                                {line.orderedQty}
                              </td>
                              <td className="p-3">{line.unitType}</td>
                              <td className="p-3 font-mono">
                                {line.batchNumber || "N/A"}
                              </td>
                              <td className="p-3">
                                {line.expiryDate
                                  ? new Date(
                                      line.expiryDate,
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </td>
                              <td className="p-3 font-medium text-slate-900">
                                ${line.costPrice?.toFixed(2)}
                              </td>
                              <td className="p-3 font-medium text-indigo-600">
                                ${line.sellingPrice?.toFixed(2)}
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => removeLine(idx)}
                                  className="text-rose-600 hover:text-rose-800 font-semibold text-xs rounded hover:underline"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 rounded-b-xl">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 font-medium text-sm rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={createOrder}
                className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 font-semibold text-sm rounded-lg shadow-sm transition-colors"
              >
                Create Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auxiliary Internal Modal for Creating On-The-Fly Drug Items */}
      {showCustomDrugForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 rounded-t-xl">
              <h2 className="text-base font-bold text-slate-900">
                Add New Drug
              </h2>
            </div>

            <div className="p-5 space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="Drug Name *"
                  value={customDrug.name}
                  onChange={(e) =>
                    setCustomDrug({ ...customDrug, name: e.target.value })
                  }
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2"
                />
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Brand"
                  value={customDrug.brand}
                  onChange={(e) =>
                    setCustomDrug({ ...customDrug, brand: e.target.value })
                  }
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2"
                />
              </div>

              <div>
                <select
                  value={customDrug.category}
                  onChange={(e) =>
                    setCustomDrug({ ...customDrug, category: e.target.value })
                  }
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2 bg-white"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Shelf Location"
                  value={customDrug.shelfLocation}
                  onChange={(e) =>
                    setCustomDrug({
                      ...customDrug,
                      shelfLocation: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2"
                />
              </div>

              <div>
                <input
                  type="number"
                  placeholder="Min Stock Threshold"
                  value={customDrug.minStockThreshold}
                  onChange={(e) =>
                    setCustomDrug({
                      ...customDrug,
                      minStockThreshold: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2"
                />
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 rounded-b-xl">
              <button
                type="button"
                onClick={() => setShowCustomDrugForm(false)}
                className="px-3 py-1.5 border border-slate-300 text-slate-600 bg-white hover:bg-slate-50 text-xs font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={createCustomDrug}
                className="px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-bold rounded-lg shadow-sm transition-colors"
              >
                Create & Select
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
