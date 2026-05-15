import React, { useState } from "react";
import api from "../api/client";
import toast from "react-hot-toast";
import QrScanner from "../components/QrScanner";

const Dispense = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [drugs, setDrugs] = useState([]);
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [scanQR, setScanQR] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [loading, setLoading] = useState(false);

  const searchDrugs = async () => {
    if (searchTerm.length < 2) return;
    const { data } = await api.get(`/dispense/search?name=${searchTerm}`);
    setDrugs(data);
  };

  const selectDrug = async (drug) => {
    setSelectedDrug(drug);
    const { data } = await api.get(`/dispense/batches/${drug._id}`);
    setBatches(data);
    setSelectedBatch(null);
    setQuantity("");
  };

  const handleQRScan = async (qrData) => {
    try {
      const { data } = await api.get(`/stock/qr/${qrData}`);
      setSelectedBatch(data);
      setSelectedDrug(data.drugName);
      const batchesRes = await api.get(
        `/dispense/batches/${data.drugName._id}`,
      );
      setBatches(batchesRes.data);
      setShowScanner(false);
      toast.success("Batch loaded");
    } catch (error) {
      toast.error("Batch not found");
    }
  };

  const dispense = async () => {
    if (!selectedBatch) {
      toast.error("Select a batch");
      return;
    }
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Enter valid quantity");
      return;
    }
    if (qty > selectedBatch.remainingQty) {
      toast.error(
        `Only ${selectedBatch.remainingQty} ${selectedBatch.unitType}s available`,
      );
      return;
    }
    setLoading(true);
    try {
      await api.post("/dispense", {
        batchId: selectedBatch._id,
        quantity: qty,
      });
      toast.success(
        `Dispensed ${qty} ${selectedBatch.unitType}${qty !== 1 ? "s" : ""}`,
      );
      // Refresh batches
      const { data } = await api.get(`/dispense/batches/${selectedDrug._id}`);
      setBatches(data);
      setSelectedBatch(null);
      setQuantity("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Dispensing failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dispense Medication</h1>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">1. Search Drug</h2>
          <input
            type="text"
            placeholder="Type drug name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyUp={searchDrugs}
            className="w-full border rounded p-2 mb-4"
          />
          {drugs.length > 0 && (
            <div className="border rounded max-h-60 overflow-y-auto">
              {drugs.map((drug) => (
                <div
                  key={drug._id}
                  onClick={() => selectDrug(drug)}
                  className={`p-2 cursor-pointer hover:bg-gray-100 ${selectedDrug?._id === drug._id ? "bg-indigo-50" : ""}`}
                >
                  {drug.name} {drug.brand ? `(${drug.brand})` : ""}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">2. Scan QR Code</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Scan or enter QR code"
              value={scanQR}
              onChange={(e) => setScanQR(e.target.value)}
              className="flex-1 border rounded p-2"
            />
            <button
              onClick={() => handleQRScan(scanQR)}
              className="bg-indigo-600 text-white px-4 py-2 rounded"
            >
              Find
            </button>
            <button
              onClick={() => setShowScanner(true)}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Scan
            </button>
          </div>
        </div>
      </div>

      {showScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-96">
            <QrScanner
              onScan={handleQRScan}
              onClose={() => setShowScanner(false)}
            />
          </div>
        </div>
      )}

      {selectedDrug && (
        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">
            Batches for {selectedDrug.name}{" "}
            {selectedDrug.brand ? `(${selectedDrug.brand})` : ""} (Sorted by
            Expiry)
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Batch</th>
                  <th className="text-left py-2">Expiry</th>
                  <th className="text-left py-2">Remaining</th>
                  <th className="text-left py-2">Selling Price</th>
                  <th className="text-left py-2">Location</th>
                  <th className="text-left py-2">Select</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => {
                  const unitLabel = `${batch.remainingQty} ${batch.unitType}${batch.remainingQty !== 1 ? "s" : ""}`;
                  return (
                    <tr
                      key={batch._id}
                      className={`border-b ${selectedBatch?._id === batch._id ? "bg-green-50" : ""}`}
                    >
                      <td className="py-2">{batch.batchNumber}</td>
                      <td className="py-2">
                        {new Date(batch.expiryDate).toLocaleDateString()}
                      </td>
                      <td className="py-2 font-medium">{unitLabel}</td>
                      <td className="py-2">${batch.sellingPrice}</td>
                      <td className="py-2">{batch.shelfLocation || "-"}</td>
                      <td className="py-2">
                        <button
                          onClick={() => setSelectedBatch(batch)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {selectedBatch && (
            <div className="mt-4 p-4 border rounded bg-gray-50">
              <p>
                <strong>Selected Batch:</strong> {selectedBatch.batchNumber}
              </p>
              <p>
                <strong>Drug:</strong> {selectedBatch.drugName?.name}{" "}
                {selectedBatch.drugName?.brand
                  ? `(${selectedBatch.drugName.brand})`
                  : ""}
              </p>
              <p>
                <strong>Expiry:</strong>{" "}
                {new Date(selectedBatch.expiryDate).toLocaleDateString()}
              </p>
              <p>
                <strong>Price:</strong> ${selectedBatch.sellingPrice} per{" "}
                {selectedBatch.unitType}
              </p>
              <p>
                <strong>Available:</strong> {selectedBatch.remainingQty}{" "}
                {selectedBatch.unitType}
                {selectedBatch.remainingQty !== 1 ? "s" : ""}
              </p>
              <div className="mt-2 flex gap-2 items-end">
                <div className="flex-1">
                  <label>
                    Quantity to dispense (in {selectedBatch.unitType}s):
                  </label>
                  <input
                    type="number"
                    step={selectedBatch.unitType === "Tablet" ? "1" : "0.1"}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full border rounded p-2"
                  />
                </div>
                <button
                  onClick={dispense}
                  disabled={loading}
                  className="bg-green-600 text-white px-6 py-2 rounded"
                >
                  {loading ? "Processing..." : "Dispense"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dispense;
