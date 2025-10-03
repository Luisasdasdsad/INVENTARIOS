import { useEffect, useState } from "react";
import api from "../../services/api.js";
import Modal from "../../components/Modal/Modal";
import HerramientaForm from "./HerramientaForm";
import BarcodeDisplay from "../../components/BarcodeDisplay/BarcodeDisplay";
import { FaEdit, FaTrash, FaBarcode, FaPlus, FaEye } from "react-icons/fa"; // Íconos para mejor UX (opcional)

export default function HerramientasList() {
  const [herramientas, setHerramientas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingHerramienta, setEditingHerramienta] = useState(null); // Para editar
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [selectedHerramienta, setSelectedHerramienta] = useState(null);
  const [generatingBarcode, setGeneratingBarcode] = useState(false);

  const fetchHerramientas = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/herramientas");
      setHerramientas(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Error al cargar herramientas");
      console.error("Error al cargar herramientas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHerramientas();
  }, []);

  const handleAddHerramienta = () => {
    setEditingHerramienta(null); // Asegurarse de que no estamos editando
    setShowModal(true);
  };

  const handleEditHerramienta = (herramienta) => {
    setEditingHerramienta(herramienta);
    setShowModal(true);
  };

  const handleDeleteHerramienta = async (id) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar esta herramienta?")) {
      return;
    }
    try {
      await api.delete(`/herramientas/${id}`);
      setHerramientas(herramientas.filter((h) => h._id !== id));
      alert("Herramienta eliminada con éxito.");
    } catch (err) {
      setError(err.response?.data?.message || "Error al eliminar herramienta");
      console.error("Error al eliminar herramienta:", err);
    }
  };

  const handleFormSubmit = () => {
    fetchHerramientas(); // Recargar la lista después de guardar
    setShowModal(false);
  };

  const handleGenerateBarcode = async (herramienta) => {
    setGeneratingBarcode(true);
    try {
      const res = await api.post(`/barcode/generar/${herramienta._id}`);
      alert('Código de barras generado exitosamente');
      fetchHerramientas(); // Recargar para mostrar el nuevo código
    } catch (err) {
      setError(err.response?.data?.error || 'Error al generar código de barras');
      console.error('Error al generar código de barras:', err);
    } finally {
      setGeneratingBarcode(false);
    }
  };

  const handleShowBarcode = (herramienta) => {
    setSelectedHerramienta(herramienta);
    setShowBarcodeModal(true);
  };

  const handleGenerateMassiveBarcodes = async () => {
    if (!window.confirm('¿Generar códigos de barras para todas las herramientas que no tienen?')) {
      return;
    }
    
    setGeneratingBarcode(true);
    try {
      const res = await api.post('/barcode/generar-masivo');
      alert(`Códigos de barras generados para ${res.data.herramientas.length} herramientas`);
      fetchHerramientas();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al generar códigos masivos');
      console.error('Error al generar códigos masivos:', err);
    } finally {
      setGeneratingBarcode(false);
    }
  };

  if (loading) return <div className="text-center p-8 md:p-12 text-gray-600">Cargando herramientas...</div>;
  if (error) return <div className="text-center p-8 md:p-12 text-red-500 bg-red-50 rounded-md m-4">Error: {error}</div>;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto"> {/* Padding responsive y centrado */}
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800">Inventario</h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={handleGenerateMassiveBarcodes}
            disabled={generatingBarcode}
            className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 min-h-[44px] w-full sm:w-auto text-sm"
          >
            {generatingBarcode ? 'Generando...' : <><FaBarcode size={16} /> Generar Códigos Masivo</>}
          </button>
          <button
            onClick={handleAddHerramienta}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 transition-colors min-h-[44px] w-full sm:w-auto text-sm"
          >
            <FaPlus size={16} /> Agregar Herramienta
          </button>
        </div>
      </div>

      {herramientas.length === 0 ? (
        <div className="text-center py-12 text-gray-600">No hay herramientas registradas.</div>
      ) : (
        <div className="space-y-4"> {/* Espaciado para cards */}
          {/* Mobile: Cards verticales */}
          <div className="md:hidden space-y-4">
            {herramientas.map((h) => (
              <div key={h._id} className="bg-white p-4 rounded-lg shadow-md border divide-y divide-gray-200">
                {/* Info principal */}
                <div className="space-y-2 mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{h.nombre}</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><span className="font-medium">Marca:</span> {h.marca || '-'}</p>
                    <p><span className="font-medium">Modelo:</span> {h.modelo || '-'}</p>
                    <p><span className="font-medium">Serie:</span> {h.serie || '-'}</p>
                    <p><span className="font-medium">Cantidad:</span> {h.cantidad} {h.unidad}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      h.estado === 'disponible' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {h.estado}
                    </span>
                  </div>
                </div>

                {/* Código de barras */}
                <div className="py-3">
                  {h.barcode ? (
                    <div className="flex items-center justify-between">
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded font-mono flex-1 truncate">
                        {h.barcode.substring(0, 15)}...
                      </span>
                      <button
                        onClick={() => handleShowBarcode(h)}
                        className="ml-2 text-blue-600 hover:text-blue-900 text-sm flex items-center gap-1"
                      >
                        <FaEye size={14} /> Ver
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleGenerateBarcode(h)}
                      disabled={generatingBarcode}
                      className="w-full text-green-600 hover:text-green-900 text-sm disabled:opacity-50 flex items-center justify-center gap-1 py-2"
                    >
                      <FaBarcode size={14} /> {generatingBarcode ? 'Generando...' : 'Generar Código'}
                    </button>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex gap-2 pt-3">
                  <button
                    onClick={() => handleEditHerramienta(h)}
                    className="flex-1 flex items-center justify-center gap-1 bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 text-sm min-h-[44px]"
                  >
                    <FaEdit size={14} /> Editar
                  </button>
                  <button
                    onClick={() => handleDeleteHerramienta(h._id)}
                    className="flex-1 flex items-center justify-center gap-1 bg-red-600 text-white py-2 rounded-md hover:bg-red-700 text-sm min-h-[44px]"
                  >
                    <FaTrash size={14} /> Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Tabla original */}
          <div className="hidden md:block">
            <div className="overflow-x-auto bg-white shadow-md rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marca</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modelo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serie</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unidad</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código de Barras</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {herramientas.map((h) => (
                    <tr key={h._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{h.nombre}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{h.marca || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{h.modelo || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{h.serie || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{h.cantidad}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{h.unidad}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          h.estado === 'disponible' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {h.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {h.barcode ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded font-mono truncate max-w-xs">
                              {h.barcode.substring(0, 15)}...
                            </span>
                            <button
                              onClick={() => handleShowBarcode(h)}
                              className="text-blue-600 hover:text-blue-900 text-xs flex items-center gap-1"
                            >
                              <FaEye size={12} /> Ver
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleGenerateBarcode(h)}
                            disabled={generatingBarcode}
                            className="text-green-600 hover:text-green-900 text-xs disabled:opacity-50 flex items-center gap-1"
                          >
                            <FaBarcode size={12} /> {generatingBarcode ? 'Generando...' : 'Generar'}
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEditHerramienta(h)}
                          className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1"
                        >
                          <FaEdit size={12} /> Editar
                        </button>
                        <button
                          onClick={() => handleDeleteHerramienta(h._id)}
                          className="text-red-600 hover:text-red-900 flex items-center gap-1"
                        >
                          <FaTrash size={12} /> Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Form */}
      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <div className="max-h-[90vh] overflow-y-auto p-4 md:p-0"> {/* Responsive height */}
            <HerramientaForm
              herramienta={editingHerramienta}
              onSuccess={handleFormSubmit}
              onCancel={() => setShowModal(false)}
            />
          </div>
        </Modal>
      )}

      {/* Modal para Barcode */}
      {showBarcodeModal && selectedHerramienta && (
        <Modal onClose={() => setShowBarcodeModal(false)}>
          <div className="p-4 md:p-6 max-h-[90vh] overflow-y-auto"> {/* Responsive height */}
            <h3 className="text-lg md:text-xl font-bold mb-4 text-gray-800">
              Código de Barras - {selectedHerramienta.nombre}
            </h3>
            <div className="text-center space-y-4">
              <BarcodeDisplay 
                value={selectedHerramienta.barcode} 
                className="mx-auto max-w-full" // Asegura que quepa en mobile
              />
              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>Herramienta:</strong> {selectedHerramienta.nombre}</p>
                <p><strong>Código:</strong> {selectedHerramienta.codigo}</p>
                <p><strong>Código de Barras:</strong> {selectedHerramienta.barcode}</p>
              </div>
              <button
                onClick={() => setShowBarcodeModal(false)}
                className="bg-gray-500 text-white px-6 py-3 rounded-md hover:bg-gray-600 min-h-[44px] w-full md:w-auto"
              >
                Cerrar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}