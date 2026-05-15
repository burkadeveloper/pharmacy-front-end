import React, { useState, useEffect } from "react";
import api from "../api/client";
import toast from "react-hot-toast";

const ReceiveOrder = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [lines, setLines] = useState([]);
  const [verifyData, setVerifyData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReceivableOrders();
  }, []);

  const fetchReceivableOrders = async () => {
    const { data } = await api.get("/receiving/orders");
    setOrders(data);
  };

  const selectOrder = async (orderId) => {
    const { data } = await api.get(`/orders/${orderId}`);
    setSelectedOrder(data.order);
    setLines(data.lines);
    const init = {};
    data.lines.forEach((line) => {
      init[line._id] = {
        receivedQty: line.receivedQty || 0,
        actualBatchNumber: line.actualBatchNumber || line.batchNumber || "",
        actualExpiryDate: line.actualExpiryDate
          ? new Date(line.actualExpiryDate).toISOString().split("T")[0]
          : line.expiryDate
            ? new Date(line.expiryDate).toISOString().split("T")[0]
            : "",
        discrepancyNote: line.discrepancyNote || "",
        verified: line.verified || false,
      };
    });
    setVerifyData(init);
  };

  const updateField = (lineId, field, value) => {
    setVerifyData((prev) => ({
      ...prev,
      [lineId]: { ...prev[lineId], [field]: value },
    }));
  };

  const handleVerify = async (lineId) => {
    const v = verifyData[lineId];
    const line = lines.find((l) => l._id === lineId);

    if (v.receivedQty > line.orderedQty) {
      toast.error(`Received cannot exceed ${line.orderedQty}`);
      return;
    }
    if (v.verified && v.receivedQty === 0 && !v.discrepancyNote) {
      toast.error("If received 0, please add a discrepancy note");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        lineId,
        receivedQty: v.receivedQty,
        actualBatchNumber: v.actualBatchNumber,
        actualExpiryDate: v.actualExpiryDate,
        verified: v.verified,
        discrepancyNote: v.discrepancyNote,
      };
      console.log("Sending:", payload);
      await api.post("/receiving/verify-line", payload);
      toast.success("Verified & stock updated");
      // Refresh order data
      await selectOrder(selectedOrder._id);
      await fetchReceivableOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const completeAll = async () => {
    const pending = lines.filter((l) => !verifyData[l._id]?.verified);
    for (const line of pending) {
      await handleVerify(line._id);
    }
    setSelectedOrder(null);
    fetchReceivableOrders();
  };

  if (selectedOrder) {
    return (
      <div>
        <div className="bg-white p-4 shadow mb-4 flex justify-between">
          <div>
            <h2 className="text-xl font-bold">{selectedOrder.orderNumber}</h2>
            <p>
              {selectedOrder.company?.name} |{" "}
              {new Date(selectedOrder.orderDate).toLocaleDateString()}
            </p>
            <p>Status: {selectedOrder.status}</p>
          </div>
          <button
            onClick={() => setSelectedOrder(null)}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            Back
          </button>
          <button
            onClick={completeAll}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Complete All
          </button>
        </div>
        <div className="bg-white shadow overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th>Drug</th>
                <th>Ordered</th>
                <th>Received</th>
                <th>Batch</th>
                <th>Expiry</th>
                <th>Discrepancy</th>
                <th>Verified</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => {
                const v = verifyData[line._id];
                if (!v) return null;
                const isVerified = v.verified;
                return (
                  <tr key={line._id} className="border-t">
                    <td className="p-2">{line.drugName?.name}</td>
                    <td className="p-2">
                      {line.orderedQty} {line.unitType}s
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={v.receivedQty}
                        onChange={(e) =>
                          updateField(
                            line._id,
                            "receivedQty",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        className="border w-20 p-1"
                        disabled={isVerified}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={v.actualBatchNumber}
                        onChange={(e) =>
                          updateField(
                            line._id,
                            "actualBatchNumber",
                            e.target.value,
                          )
                        }
                        className="border w-32 p-1"
                        disabled={isVerified}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="date"
                        value={v.actualExpiryDate}
                        onChange={(e) =>
                          updateField(
                            line._id,
                            "actualExpiryDate",
                            e.target.value,
                          )
                        }
                        className="border p-1"
                        disabled={isVerified}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={v.discrepancyNote}
                        onChange={(e) =>
                          updateField(
                            line._id,
                            "discrepancyNote",
                            e.target.value,
                          )
                        }
                        className="border w-40 p-1"
                        disabled={isVerified}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={v.verified}
                        onChange={(e) =>
                          updateField(line._id, "verified", e.target.checked)
                        }
                        disabled={isVerified}
                      />
                    </td>
                    <td className="p-2">
                      <button
                        onClick={() => handleVerify(line._id)}
                        disabled={isVerified || loading}
                        className={`px-3 py-1 rounded text-sm ${isVerified ? "bg-gray-400" : "bg-blue-600 text-white"}`}
                      >
                        {isVerified ? "Verified" : "Save & Verify"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Receive Order</h1>
      <div className="bg-white shadow">
        {orders.map((order) => (
          <div
            key={order._id}
            className="p-4 border-b flex justify-between items-center"
          >
            <div>
              <div className="font-semibold">{order.orderNumber}</div>
              <div className="text-sm text-gray-500">
                {order.company?.name} -{" "}
                {new Date(order.orderDate).toLocaleDateString()}
              </div>
            </div>
            <button
              onClick={() => selectOrder(order._id)}
              className="bg-indigo-600 text-white px-4 py-2 rounded"
            >
              Receive
            </button>
          </div>
        ))}
        {orders.length === 0 && (
          <div className="p-4 text-gray-500">No pending orders.</div>
        )}
      </div>
    </div>
  );
};

export default ReceiveOrder;
