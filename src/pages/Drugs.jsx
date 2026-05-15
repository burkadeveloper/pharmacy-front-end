import React, { useState, useEffect } from "react";
import api from "../api/client";
import toast from "react-hot-toast";

const Drugs = () => {
  const [drugs, setDrugs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showDrugModal, setShowDrugModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingDrug, setEditingDrug] = useState(null);
  const [drugForm, setDrugForm] = useState({
    name: "",
    brand: "",
    category: "",
    shelfLocation: "",
    minStockThreshold: 10,
  });
  const [catForm, setCatForm] = useState({ name: "", description: "" });

  useEffect(() => {
    fetchDrugs();
    fetchCategories();
  }, []);

  const fetchDrugs = async () => {
    try {
      const { data } = await api.get("/drugs");
      setDrugs(data);
    } catch (error) {
      toast.error("Failed to load drugs");
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await api.get("/drugs/categories");
      setCategories(data);
    } catch (error) {
      toast.error("Failed to load categories");
    }
  };

  const saveDrug = async () => {
    if (!drugForm.name || !drugForm.category) {
      toast.error("Drug name and category are required");
      return;
    }
    try {
      if (editingDrug) {
        await api.put(`/drugs/${editingDrug}`, drugForm);
        toast.success("Drug updated");
      } else {
        await api.post("/drugs", drugForm);
        toast.success("Drug created");
      }
      setShowDrugModal(false);
      setEditingDrug(null);
      setDrugForm({
        name: "",
        brand: "",
        category: "",
        shelfLocation: "",
        minStockThreshold: 10,
      });
      fetchDrugs();
    } catch (error) {
      toast.error(error.response?.data?.message || "Operation failed");
    }
  };

  const saveCategory = async () => {
    if (!catForm.name) {
      toast.error("Category name required");
      return;
    }
    try {
      await api.post("/drugs/categories", catForm);
      toast.success("Category created");
      setShowCatModal(false);
      setCatForm({ name: "", description: "" });
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message);
    }
  };

  const deleteDrug = async (id) => {
    if (window.confirm("Delete this drug? It may affect existing orders.")) {
      try {
        await api.delete(`/drugs/${id}`);
        toast.success("Deleted");
        fetchDrugs();
      } catch (error) {
        toast.error("Delete failed");
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Drugs & Categories</h1>
        <div className="space-x-2">
          <button
            onClick={() => {
              setEditingDrug(null);
              setDrugForm({
                name: "",
                brand: "",
                category: "",
                shelfLocation: "",
                minStockThreshold: 10,
              });
              setShowDrugModal(true);
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded"
          >
            Add Drug
          </button>
          <button
            onClick={() => setShowCatModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Add Category
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-2">Categories</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <span
              key={cat._id}
              className="bg-gray-200 px-3 py-1 rounded-full text-sm"
            >
              {cat.name}
            </span>
          ))}
        </div>
      </div>

      {/* Drugs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Drug Name</th>
              <th className="px-4 py-2 text-left">Brand</th>
              <th className="px-4 py-2 text-left">Category</th>
              <th className="px-4 py-2 text-left">Shelf Location</th>
              <th className="px-4 py-2 text-left">Min Stock</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {drugs.map((drug) => (
              <tr key={drug._id} className="border-t">
                <td className="px-4 py-2">{drug.name}</td>
                <td className="px-4 py-2">{drug.brand || "-"}</td>
                <td className="px-4 py-2">{drug.category?.name}</td>
                <td className="px-4 py-2">{drug.shelfLocation || "-"}</td>
                <td className="px-4 py-2">{drug.minStockThreshold}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => {
                      setEditingDrug(drug._id);
                      setDrugForm(drug);
                      setShowDrugModal(true);
                    }}
                    className="text-blue-600 mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteDrug(drug._id)}
                    className="text-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Drug Modal */}
      {showDrugModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4">
              {editingDrug ? "Edit Drug" : "Add Drug"}
            </h2>
            <div className="mb-3">
              <label>Drug Name *</label>
              <input
                type="text"
                value={drugForm.name}
                onChange={(e) =>
                  setDrugForm({ ...drugForm, name: e.target.value })
                }
                className="w-full border rounded p-2"
                required
              />
            </div>
            <div className="mb-3">
              <label>Brand</label>
              <input
                type="text"
                value={drugForm.brand || ""}
                onChange={(e) =>
                  setDrugForm({ ...drugForm, brand: e.target.value })
                }
                className="w-full border rounded p-2"
                placeholder="e.g., Pfizer, GSK"
              />
            </div>
            <div className="mb-3">
              <label>Category *</label>
              <select
                value={drugForm.category}
                onChange={(e) =>
                  setDrugForm({ ...drugForm, category: e.target.value })
                }
                className="w-full border rounded p-2"
              >
                <option value="">Select</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label>Shelf Location</label>
              <input
                type="text"
                value={drugForm.shelfLocation || ""}
                onChange={(e) =>
                  setDrugForm({ ...drugForm, shelfLocation: e.target.value })
                }
                className="w-full border rounded p-2"
                placeholder="Aisle 2, Shelf B"
              />
            </div>
            <div className="mb-3">
              <label>Min Stock Threshold</label>
              <input
                type="number"
                value={drugForm.minStockThreshold}
                onChange={(e) =>
                  setDrugForm({
                    ...drugForm,
                    minStockThreshold: parseInt(e.target.value),
                  })
                }
                className="w-full border rounded p-2"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDrugModal(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={saveDrug}
                className="px-4 py-2 bg-indigo-600 text-white rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4">Add Category</h2>
            <div className="mb-3">
              <label>Name</label>
              <input
                type="text"
                value={catForm.name}
                onChange={(e) =>
                  setCatForm({ ...catForm, name: e.target.value })
                }
                className="w-full border rounded p-2"
                required
              />
            </div>
            <div className="mb-3">
              <label>Description</label>
              <textarea
                value={catForm.description}
                onChange={(e) =>
                  setCatForm({ ...catForm, description: e.target.value })
                }
                className="w-full border rounded p-2"
                rows="2"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCatModal(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={saveCategory}
                className="px-4 py-2 bg-indigo-600 text-white rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Drugs;
