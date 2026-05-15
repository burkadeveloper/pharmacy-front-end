import React, { useState, useEffect } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';

// Safe QR import
let QRCode;
try {
  QRCode = require('react-qr-code').default;
} catch (e) {
  QRCode = () => <span className="text-xs">QR unavailable</span>;
}

const StockList = () => {
  const [batches, setBatches] = useState([]);
  const [expiring, setExpiring] = useState({ red: [], yellow: [] });
  const [lowStock, setLowStock] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');
  const [priceModal, setPriceModal] = useState(null);
  const [newPrice, setNewPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchBatches(), fetchExpiring(), fetchLowStock()]);
    } catch (err) {
      console.error('Stock fetch error:', err);
      setError(err.message || 'Failed to load stock data');
      toast.error('Could not load stock page');
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const { data } = await api.get('/stock');
      setBatches(data || []);
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const fetchExpiring = async () => {
    try {
      const { data } = await api.get('/stock/expiring');
      setExpiring(data || { red: [], yellow: [] });
    } catch (err) {
      console.warn('Expiring fetch failed', err);
    }
  };

  const fetchLowStock = async () => {
    try {
      const { data } = await api.get('/stock/low-stock');
      setLowStock(data || []);
    } catch (err) {
      console.warn('Low stock fetch failed', err);
    }
  };

  const adjustStock = async (batchId) => {
    if (adjustQty === 0) {
      toast.error('Adjustment cannot be zero');
      return;
    }
    try {
      await api.post('/stock/adjust', { batchId, adjustment: adjustQty, reason: adjustReason });
      toast.success('Stock adjusted');
      setSelectedBatch(null);
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Adjustment failed');
    }
  };

  const updateSellingPrice = async (batchId) => {
    const price = parseFloat(newPrice);
    if (isNaN(price) || price < 0) {
      toast.error('Enter a valid price');
      return;
    }
    try {
      await api.put('/stock/price', { batchId, sellingPrice: price });
      toast.success('Price updated');
      setPriceModal(null);
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    }
  };

  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return 'good';
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return 'expired';
    if (daysLeft <= 30) return 'red';
    if (daysLeft <= 90) return 'yellow';
    return 'good';
  };

  if (loading) {
    return <div className="p-8 text-center">Loading stock data...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        <p>Error: {error}</p>
        <button onClick={fetchAllData} className="mt-2 bg-red-600 text-white px-3 py-1 rounded">Retry</button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Stock Batches</h1>

      {batches.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p>No stock batches found. Please receive an order to create stock.</p>
        </div>
      )}

      {lowStock.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-red-800 mb-2">Low Stock Alert</h3>
          <ul>
            {lowStock.map(item => (
              <li key={item.drug}>{item.drug}: {item.currentStock} units (threshold {item.threshold})</li>
            ))}
          </ul>
        </div>
      )}

      {expiring.red?.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-orange-800">Expiring &lt;30 days</h3>
          {expiring.red.map(b => (
            <div key={b._id}>{b.drugName?.name} - Batch {b.batchNumber} - Expires {new Date(b.expiryDate).toLocaleDateString()} - Qty {b.remainingQty} {b.unitType}s</div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Drug</th>
              <th className="px-4 py-2 text-left">Brand</th>
              <th className="px-4 py-2 text-left">Batch</th>
              <th className="px-4 py-2 text-left">Expiry</th>
              <th className="px-4 py-2 text-left">Qty Left</th>
              <th className="px-4 py-2 text-left">Selling Price</th>
              <th className="px-4 py-2 text-left">Location</th>
              <th className="px-4 py-2 text-left">QR</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {batches.map(batch => {
              const status = getExpiryStatus(batch.expiryDate);
              const rowClass = status === 'red' ? 'bg-red-50' : status === 'yellow' ? 'bg-yellow-50' : '';
              const unitLabel = batch.unitType ? `${batch.remainingQty} ${batch.unitType}${batch.remainingQty !== 1 ? 's' : ''}` : batch.remainingQty;
              return (
                <tr key={batch._id} className={`border-t ${rowClass}`}>
                  <td className="px-4 py-2">{batch.drugName?.name || 'Unknown'}</td>
                  <td className="px-4 py-2">{batch.drugName?.brand || '-'}</td>
                  <td className="px-4 py-2">{batch.batchNumber}</td>
                  <td className="px-4 py-2">{batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : 'N/A'}</td>
                  <td className="px-4 py-2 font-medium">{unitLabel}</td>
                  <td className="px-4 py-2">
                    ${batch.sellingPrice}
                    <button onClick={() => { setPriceModal(batch._id); setNewPrice(batch.sellingPrice); }} className="ml-2 text-blue-600 text-xs underline">edit</button>
                  </td>
                  <td className="px-4 py-2">{batch.shelfLocation || '-'}</td>
                  <td className="px-4 py-2">
                    {batch.qrCode ? <QRCode value={batch.qrCode} size={40} /> : <span className="text-xs">No QR</span>}
                  </td>
                  <td className="px-4 py-2">
                    <button onClick={() => setSelectedBatch(batch)} className="bg-yellow-600 text-white px-2 py-1 rounded text-sm">Adjust</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Adjust Modal */}
      {selectedBatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-bold mb-4">Adjust Stock: {selectedBatch.drugName?.name}</h3>
            <div className="mb-4">
              <label>Current: {selectedBatch.remainingQty} {selectedBatch.unitType}s</label>
            </div>
            <div className="mb-4">
              <label>Adjustment (+/-) in {selectedBatch.unitType}s</label>
              <input type="number" step="any" value={adjustQty} onChange={e => setAdjustQty(parseFloat(e.target.value))} className="w-full border rounded p-2" />
            </div>
            <div className="mb-4">
              <label>Reason</label>
              <input type="text" value={adjustReason} onChange={e => setAdjustReason(e.target.value)} className="w-full border rounded p-2" />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setSelectedBatch(null)} className="px-4 py-2 border rounded">Cancel</button>
              <button onClick={() => adjustStock(selectedBatch._id)} className="px-4 py-2 bg-indigo-600 text-white rounded">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Price Modal */}
      {priceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-bold mb-4">Edit Selling Price</h3>
            <div className="mb-4">
              <label>New Price ($)</label>
              <input type="number" step="0.01" value={newPrice} onChange={e => setNewPrice(e.target.value)} className="w-full border rounded p-2" />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setPriceModal(null)} className="px-4 py-2 border rounded">Cancel</button>
              <button onClick={() => updateSellingPrice(priceModal)} className="px-4 py-2 bg-indigo-600 text-white rounded">Update</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockList;
