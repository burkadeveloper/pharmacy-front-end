import React from "react";
import QrReader from "react-qr-reader";

const QrScanner = ({ onScan, onClose }) => {
  const handleScan = (data) => {
    if (data) {
      onScan(data);
      onClose();
    }
  };
  const handleError = (err) => {
    console.error(err);
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 w-96">
        <QrReader
          delay={300}
          onError={handleError}
          onScan={handleScan}
          style={{ width: "100%" }}
        />
        <button
          onClick={onClose}
          className="mt-4 w-full bg-red-600 text-white py-2 rounded"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default QrScanner;
