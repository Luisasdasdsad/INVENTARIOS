import React from 'react';
import { FaTrash, FaExclamationTriangle } from 'react-icons/fa';

const ModalConfirmacion = ({ show, onClose, onConfirm, title, message, confirmText = "Sí, eliminar", cancelText = "Cancelar", isDestructive = true }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-opacity animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100 border border-gray-100">
        <div className="p-6 text-center">
          <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${isDestructive ? 'bg-red-100' : 'bg-yellow-100'}`}>
            {isDestructive ? (
              <FaTrash className="h-5 w-5 text-red-600" />
            ) : (
              <FaExclamationTriangle className="h-5 w-5 text-yellow-600" />
            )}
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-500 mb-6">
            {message}
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-md transition-colors ${isDestructive ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirmacion;