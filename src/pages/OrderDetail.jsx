import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/client";
import toast from "react-hot-toast";

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editLines, setEditLines] = useState([]);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const { data } = await api.get(`/orders/${id}`);
      setOrder(data.order);
      setLines(data.lines);
      setEditLines(
        data.lines.map((l) => ({
          ...l,
          _id: l._id,
          orderedQty: l.orderedQty,
          costPrice: l.costPrice,
          sellingPrice: l.sellingPrice,
          batchNumber: l.batchNumber || "",
          expiryDate: l.expiryDate || "",
        })),
      );
      setLoading(false);
    } catch (error) {
      toast.error("Failed to load order");
      navigate("/orders");
    }
  };

  const updateLine = (index, field, value) => {
    const updated = [...editLines];
    updated[index][field] = value;
    setEditLines(updated);
  };

  const saveChanges = async () => {
    try {
      await api.put(`/orders/${id}`, { status: "Updated" });
      await Promise.all(
        editLines.map((line) =>
          api.put(`/orders/lines/${line._id}`, {
            orderedQty: line.orderedQty,
            costPrice: line.costPrice,
            sellingPrice: line.sellingPrice,
            batchNumber: line.batchNumber,
            expiryDate: line.expiryDate,
          }),
        ),
      );
      toast.success("Order updated");
      setEditing(false);
      fetchOrder();
    } catch (error) {
      toast.error("Update failed");
    }
  };

  const cancelOrder = async () => {
    if (window.confirm("Cancel this order?")) {
      await api.delete(`/orders/${id}`);
      toast.success("Order cancelled");
      navigate("/orders");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Order {order?.orderNumber}</h1>
        <div className="space-x-2">
          {order?.status === "Pending" && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="bg-yellow-600 text-white px-4 py-2 rounded"
            >
              Edit Order
            </button>
          )}
          {editing && (
            <>
              <button
                onClick={saveChanges}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                Save Changes
              </button>
              <button
                onClick={() => setEditing(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
            </>
          )}
          {(order?.status === "Pending" || order?.status === "Updated") && (
            <button
              onClick={cancelOrder}
              className="bg-red-600 text-white px-4 py-2 rounded"
            >
              Cancel Order
            </button>
          )}

          {/* Updated Condition for Receiving Button */}
          {order?.status !== "Completed" && order?.status !== "Cancelled" && (
            <button
              onClick={() => navigate("/receive")}
              className="bg-indigo-600 text-white px-4 py-2 rounded"
            >
              Go to Receiving
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="font-semibold">Supplier:</span>{" "}
            {order?.company?.name}
          </div>
          <div>
            <span className="font-semibold">Order Date:</span>{" "}
            {new Date(order?.orderDate).toLocaleDateString()}
          </div>
          <div>
            <span className="font-semibold">Expected Delivery:</span>{" "}
            {order?.expectedDeliveryDate
              ? new Date(order?.expectedDeliveryDate).toLocaleDateString()
              : "N/A"}
          </div>
          <div>
            <span className="font-semibold">Status:</span>{" "}
            <span className="px-2 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
              {order?.status}
            </span>
          </div>
          <div>
            <span className="font-semibold">Total Ordered Value:</span> $
            {order?.totalOrderedValue?.toFixed(2)}
          </div>
          <div>
            <span className="font-semibold">Notes:</span>{" "}
            {order?.notes || "None"}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Drug
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Ordered Qty
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Unit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Batch
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Expiry
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Cost Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Selling Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Received
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Verified
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {(editing ? editLines : lines).map((line, idx) => (
              <tr key={line._id || idx}>
                <td className="px-6 py-4">
                  {line.drugName?.name || "Unknown"}
                </td>
                <td className="px-6 py-4">
                  {editing ? (
                    <input
                      type="number"
                      value={line.orderedQty}
                      onChange={(e) =>
                        updateLine(idx, "orderedQty", parseInt(e.target.value))
                      }
                      className="border rounded w-20 p-1"
                    />
                  ) : (
                    line.orderedQty
                  )}
                </td>
                <td className="px-6 py-4">
                  {line.unitType} {line.unitSize}
                </td>
                <td className="px-6 py-4">
                  {editing ? (
                    <input
                      type="text"
                      value={line.batchNumber || ""}
                      onChange={(e) =>
                        updateLine(idx, "batchNumber", e.target.value)
                      }
                      className="border rounded w-32 p-1"
                    />
                  ) : (
                    line.batchNumber || "N/A"
                  )}
                </td>
                <td className="px-6 py-4">
                  {editing ? (
                    <input
                      type="date"
                      value={
                        line.expiryDate ? line.expiryDate.split("T")[0] : ""
                      }
                      onChange={(e) =>
                        updateLine(idx, "expiryDate", e.target.value)
                      }
                      className="border rounded p-1"
                    />
                  ) : line.expiryDate ? (
                    new Date(line.expiryDate).toLocaleDateString()
                  ) : (
                    "N/A"
                  )}
                </td>
                <td className="px-6 py-4">
                  {editing ? (
                    <input
                      type="number"
                      step="0.01"
                      value={line.costPrice}
                      onChange={(e) =>
                        updateLine(idx, "costPrice", parseFloat(e.target.value))
                      }
                      className="border rounded w-24 p-1"
                    />
                  ) : (
                    `$${line.costPrice}`
                  )}
                </td>
                <td className="px-6 py-4">
                  {editing ? (
                    <input
                      type="number"
                      step="0.01"
                      value={line.sellingPrice}
                      onChange={(e) =>
                        updateLine(
                          idx,
                          "sellingPrice",
                          parseFloat(e.target.value),
                        )
                      }
                      className="border rounded w-24 p-1"
                    />
                  ) : (
                    `$${line.sellingPrice}`
                  )}
                </td>
                <td className="px-6 py-4">{line.receivedQty || 0}</td>
                <td className="px-6 py-4">{line.verified ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderDetail;
