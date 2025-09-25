import { useEffect, useState } from "react";
import api from "../../services/api.js";
import Modal from "../../components/Modal/Modal";
import HerramientaForm from "./HerramientaForm";
import BarcodeDisplay from "../../components/BarcodeDisplay/BarcodeDisplay";

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

  if (loading) return <p className="text-center p-4">Cargando herramientas...</p>;
  if (error) return <p className="text-center p-4 text-red-500">Error: {error}</p>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Lista de Herramientas</h2>
        <div className="flex space-x-2">
          <button
            onClick={handleGenerateMassiveBarcodes}
            disabled={generatingBarcode}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {generatingBarcode ? 'Generando...' : '📊 Generar Códigos Masivo'}
          </button>
          <button
            onClick={handleAddHerramienta}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Agregar Herramienta
          </button>
        </div>
      </div>

      {herramientas.length === 0 ? (
        <p className="text-center text-gray-600">No hay herramientas registradas.</p>
      ) : (
        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unidad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código de Barras</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {herramientas.map((h) => (
                <tr key={h._id}>
                  <td className="px-6 py-4 whitespace-nowrap">{h.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{h.codigo}</td>
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
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                          {h.barcode.substring(0, 15)}...
                        </span>
                        <button
                          onClick={() => handleShowBarcode(h)}
                          className="text-blue-600 hover:text-blue-900 text-xs"
                        >
                          Ver
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleGenerateBarcode(h)}
                        disabled={generatingBarcode}
                        className="text-green-600 hover:text-green-900 text-xs disabled:opacity-50"
                      >
                        {generatingBarcode ? 'Generando...' : 'Generar'}
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEditHerramienta(h)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteHerramienta(h._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <HerramientaForm
            herramienta={editingHerramienta}
            onSuccess={handleFormSubmit}
            onCancel={() => setShowModal(false)}
          />
        </Modal>
      )}

      {showBarcodeModal && selectedHerramienta && (
        <Modal onClose={() => setShowBarcodeModal(false)}>
          <div className="p-6">
            <h3 className="text-lg font-bold mb-4">
              Código de Barras - {selectedHerramienta.nombre}
            </h3>
            <div className="text-center">
              <BarcodeDisplay 
                value={selectedHerramienta.barcode} 
                className="mb-4"
              />
              <div className="text-sm text-gray-600 mb-4">
                <p><strong>Herramienta:</strong> {selectedHerramienta.nombre}</p>
                <p><strong>Código:</strong> {selectedHerramienta.codigo}</p>
                <p><strong>Código de Barras:</strong> {selectedHerramienta.barcode}</p>
              </div>
              <button
                onClick={() => setShowBarcodeModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
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
