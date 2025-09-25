import React from 'react';
import ReactDOM from 'react-dom';

export default function Modal({ children, onClose }) {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) {
    // Opcional: evitar crash si no existe el div
    console.error('No se encontró el elemento #modal-root en el DOM');
    return null;
  }
  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl"
          aria-label="Cerrar modal"
        >
          &times;
        </button>
        {children}
      </div>
    </div>,
    modalRoot
  );
}
