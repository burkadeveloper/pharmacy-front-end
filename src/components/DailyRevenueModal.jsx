import React, { useState, useEffect } from "react";
import api from "../api/client";
import toast from "react-hot-toast";

const DailyRevenueModal = ({ onClose, onSaved }) => {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [existingRevenue, setExistingRevenue] = useState(null);
  const [checking, setChecking] = useState(false);

  // Check if revenue already exists for the selected date
  useEffect(() => {
    const checkExisting = async () => {
      if (!date) return;
      setChecking(true);
      try {
        const { data } = await api.get(`/revenue/by-date/${date}`);
        setExistingRevenue(data);
        if (data) {
          setAmount(data.amount);
          setNotes(data.notes || "");
        } else {
          setAmount("");
          setNotes("");
        }
      } catch (error) {
        console.error("Error checking revenue:", error);
      } finally {
        setChecking(false);
      }
    };
    checkExisting();
  }, [date]);

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) < 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setLoading(true);
    try {
      await api.post("/revenue/daily", {
        date,
        amount: parseFloat(amount),
        notes,
      });
      toast.success(existingRevenue ? "Revenue updated" : "Revenue saved");
      if (onSaved) onSaved();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  // Prevent future dates (optional)
  const maxDate = new Date().toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h2 className="text-xl font-bold mb-4">
          {existingRevenue ? "Update Daily Revenue" : "Add Daily Revenue"}
        </h2>
        <div className="mb-3">
          <label>Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={maxDate}
            className="w-full border rounded p-2"
          />
        </div>
        <div className="mb-3">
          <label>Amount (ETB)</label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border rounded p-2"
            placeholder="0.00"
            disabled={checking}
          />
        </div>
        <div className="mb-4">
          <label>Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border rounded p-2"
            rows="2"
            disabled={checking}
          />
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || checking}
            className="px-4 py-2 bg-indigo-600 text-white rounded"
          >
            {loading ? "Saving..." : existingRevenue ? "Update" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyRevenueModal;
