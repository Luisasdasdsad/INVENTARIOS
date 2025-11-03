import { useEffect, useState } from "react";
import api from "../../services/api.js";
import Modal from "../../components/Modal/Modal";
import HerramientaForm from "./HerramientaForm";
import BarcodeDisplay from "../../components/BarcodeDisplay/BarcodeDisplay";
import QRDisplay from "../../components/BarcodeDisplay/QRDisplay.jsx";
import { FaEdit, FaTrash, FaBarcode, FaQrcode, FaPlus, FaEye, FaFilePdf } from "react-icons/fa";
import { generarReporteInventario } from "../../utils/generarReporteInventario.js";

export default function HerramientasList() {
  const [herramientas, setHerramientas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingHerramienta, setEditingHerramienta] = useState(null);
  const [showCodesModal, setShowCodesModal] = useState(false);
  const [selectedHerramienta, setSelectedHerramienta] = useState(null);
  const [generatingBarcode, setGeneratingBarcode] = useState(false);
  const [generatingQR, setGeneratingQR] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');

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

  const filteredHerramientas = herramientas.filter(h =>
    h.nombre.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (tipoFilter === '' || h.tipo === tipoFilter)
  );

  const handleAddHerramienta = () => {
    setEditingHerramienta(null);
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
    fetchHerramientas();
    setShowModal(false);
  };

  const handleGenerateBarcode = async (herramienta) => {
    setGeneratingBarcode(true);
    try {
      const res = await api.post(`/barcode/generar/${herramienta._id}`);
      alert('Código de barras generado exitosamente');
      fetchHerramientas();
      if (selectedHerramienta?._id === herramienta._id) {
        setSelectedHerramienta(res.data.herramienta);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al generar código de barras');
      console.error('Error al generar código de barras:', err);
    } finally {
      setGeneratingBarcode(false);
    }
  };

  const handleGenerateQR = async (herramienta) => {
    setGeneratingQR(true);
    try {
      const res = await api.post(`/barcode/generar-qr/${herramienta._id}`);
      alert(`Código QR generado exitosamente: ${res.data.qrCode}`);
      fetchHerramientas();
      if (selectedHerramienta?._id === herramienta._id) {
        setSelectedHerramienta(res.data.herramienta);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al generar código QR');
      console.error('Error al generar código QR:', err);
    } finally {
      setGeneratingQR(false);
    }
  };

  const handleShowCodes = (herramienta) => {
    setSelectedHerramienta(herramienta);
    setShowCodesModal(true);
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

  const handleGenerateMassiveQRs = async () => {
    if (!window.confirm('¿Generar códigos QR para todas las herramientas que no tienen?')) {
      return;
    }
    setGeneratingQR(true);
    try {
      const res = await api.post('/barcode/generar-qr-masivo');
      alert(`Códigos QR generados para ${res.data.herramientas.length} herramientas`);
      fetchHerramientas();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al generar QR masivos');
      console.error('Error al generar QR masivos:', err);
    } finally {
      setGeneratingQR(false);
    }
  };

  if (loading) return <div className="text-center p-4 md:p-8 text-gray-600">Cargando herramientas...</div>;
  if (error) return <div className="text-center p-4 md:p-8 text-red-500 bg-red-50 rounded-md m-2 md:m-4">Error: {error}</div>;

  return (
    <div className="p-2 md:p-4 lg:p-6 max-w-7xl w-full mx-auto">
      {/* Header Mejorado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-800 whitespace-nowrap">Inventario</h2>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-48 text-sm md:text-base"
            />
            <select
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-48 text-sm md:text-base"
            >
              <option value="">Todos los tipos</option>
              <option value="herramientas">Herramientas</option>
              <option value="útiles de escritorio">Útiles de escritorio</option>
              <option value="equipos de computo">Equipos de computo</option>
              <option value="muebles">Muebles</option>
              <option value="útiles de aseo">Útiles de aseo</option>
              <option value="materiales">Materiales</option>
              <option value="equipos de protección personal (EPPS)">Equipos de protección personal (EPPS)</option>
            </select>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={() => generarReporteInventario(filteredHerramientas)}
            className="flex items-center justify-center gap-2 bg-red-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-md hover:bg-red-700 transition-colors min-h-[44px] w-full sm:w-auto text-xs md:text-sm"
          >
            <FaFilePdf size={14} /> Generar Reporte
          </button>
          <button
            onClick={handleGenerateMassiveBarcodes}
            disabled={generatingBarcode}
            className="flex items-center justify-center gap-2 bg-green-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 min-h-[44px] w-full sm:w-auto text-xs md:text-sm"
          >
            {generatingBarcode ? 'Generando...' : <><FaBarcode size={14} /> Barcodes Masivo</>}
          </button>
          <button
            onClick={handleGenerateMassiveQRs}
            disabled={generatingQR}
            className="flex items-center justify-center gap-2 bg-purple-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 min-h-[44px] w-full sm:w-auto text-xs md:text-sm"
          >
            {generatingQR ? 'Generando...' : <><FaQrcode size={14} /> QRs Masivo</>}
          </button>
          <button
            onClick={handleAddHerramienta}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-md hover:bg-blue-700 transition-colors min-h-[44px] w-full sm:w-auto text-xs md:text-sm"
          >
            <FaPlus size={14} /> Agregar
          </button>
        </div>
      </div>

      {filteredHerramientas.length === 0 ? (
        <div className="text-center py-8 md:py-12 text-gray-600 text-sm md:text-base">
          {searchTerm ? 'No hay herramientas que coincidan con la búsqueda.' : 'No hay herramientas registradas.'}
        </div>
      ) : (
        <div className="space-y-3 md:space-y-4">
          {/* Mobile: Cards Mejoradas */}
          <div className="md:hidden space-y-3">
            {filteredHerramientas.map((h) => (
              <div key={h._id} className="bg-white p-3 rounded-lg shadow-sm border divide-y divide-gray-200">
                <div className="space-y-2 mb-3">
                  <h3 className="text-base font-semibold text-gray-900">{h.nombre}</h3>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p><span className="font-medium">Marca:</span> {h.marca || '-'}</p>
                    <p><span className="font-medium">Modelo:</span> {h.modelo || '-'}</p>
                    <p><span className="font-medium">Tipo:</span> {h.tipo || '-'}</p>
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

                {/* Códigos en Mobile */}
                <div className="py-3">
                  <h4 className="text-xs font-medium text-gray-700 mb-2">Códigos</h4>
                  <div className="space-y-2">
                    {h.barcode ? (
                      <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-xs font-mono flex-1 truncate">
                          <FaBarcode size={10} className="mr-1 inline" /> {h.barcode}
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleGenerateBarcode(h)}
                        disabled={generatingBarcode}
                        className="w-full text-green-600 hover:text-green-900 text-xs disabled:opacity-50 flex items-center justify-center gap-1 py-2 bg-gray-100 rounded"
                      >
                        <FaBarcode size={12} /> {generatingBarcode ? 'Generando...' : 'Barcode'}
                      </button>
                    )}
                    {h.qrCode ? (
                      <div className="flex items-center justify-between bg-blue-50 p-2 rounded">
                        <span className="text-xs font-mono flex-1 truncate">
                          <FaQrcode size={10} className="mr-1 inline" /> {h.qrCode}
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleGenerateQR(h)}
                        disabled={generatingQR}
                        className="w-full text-purple-600 hover:text-purple-900 text-xs disabled:opacity-50 flex items-center justify-center gap-1 py-2 bg-gray-100 rounded"
                      >
                        <FaQrcode size={12} /> {generatingQR ? 'Generando...' : 'QR'}
                      </button>
                    )}
                    {(h.barcode || h.qrCode) && (
                      <button
                        onClick={() => handleShowCodes(h)}
                        className="w-full bg-indigo-600 text-white text-xs py-2 rounded hover:bg-indigo-700 flex items-center justify-center gap-1"
                      >
                        <FaEye size={12} /> Ver Códigos
                      </button>
                    )}
                    {!h.barcode && !h.qrCode && (
                      <span className="text-gray-500 text-xs italic block text-center">Sin códigos</span>
                    )}
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-2 pt-3">
                  <button
                    onClick={() => handleEditHerramienta(h)}
                    className="flex-1 flex items-center justify-center gap-1 bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 text-xs min-h-[40px]"
                  >
                    <FaEdit size={12} /> Editar
                  </button>
                  <button
                    onClick={() => handleDeleteHerramienta(h._id)}
                    className="flex-1 flex items-center justify-center gap-1 bg-red-600 text-white py-2 rounded-md hover:bg-red-700 text-xs min-h-[40px]"
                  >
                    <FaTrash size={12} /> Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Tabla */}
          <div className="hidden md:block">
            <div className="overflow-x-auto bg-white shadow-sm rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marca</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modelo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[180px]">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[300px]">Descripción</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unidad</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Códigos</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredHerramientas.map((h) => (
                    <tr key={h._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900 text-sm">{h.nombre}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">{h.marca || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">{h.modelo || '-'}</td>
                      <td className="px-4 py-3 text-sm max-w-[180px]">
                        <div className="whitespace-pre-line line-clamp-2 hover:line-clamp-none">
                          {h.tipo || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">{h.moneda === 'USD' ? '$' : 'S/'} {h.precio?.toFixed(2) || '0.00'}</td>
                      <td className="px-4 py-3 text-sm max-w-[300px]">
                        <div className="whitespace-pre-line line-clamp-3 hover:line-clamp-none">
                          {h.descripcion || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">{h.cantidad}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">{h.unidad}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          h.estado === 'disponible' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {h.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="space-y-1">
                          {h.barcode ? (
                            <div className="flex items-center justify-between text-xs bg-gray-50 p-1 rounded">
                              <span className="font-mono truncate flex-1">
                                <FaBarcode size={10} className="mr-1 inline" /> {h.barcode.substring(0, 12)}...
                              </span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleGenerateBarcode(h)}
                              disabled={generatingBarcode}
                              className="text-green-600 hover:text-green-900 text-xs disabled:opacity-50 flex items-center gap-1 w-full justify-center"
                            >
                              <FaBarcode size={10} /> Gen Barcode
                            </button>
                          )}
                          {h.qrCode ? (
                            <div className="flex items-center justify-between text-xs bg-blue-50 p-1 rounded">
                              <span className="font-mono truncate flex-1">
                                <FaQrcode size={10} className="mr-1 inline" /> {h.qrCode.substring(0, 12)}...
                              </span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleGenerateQR(h)}
                              disabled={generatingQR}
                              className="text-purple-600 hover:text-purple-900 text-xs disabled:opacity-50 flex items-center gap-1 w-full justify-center"
                            >
                              <FaQrcode size={10} /> Gen QR
                            </button>
                          )}
                          {(h.barcode || h.qrCode) && (
                            <button
                              onClick={() => handleShowCodes(h)}
                              className="text-indigo-600 hover:text-indigo-900 text-xs flex items-center gap-1 w-full justify-center mt-1"
                            >
                              <FaEye size={10} /> Ver
                            </button>
                          )}
                          {!h.barcode && !h.qrCode && (
                            <span className="text-gray-500 text-xs italic block text-center">Sin códigos</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEditHerramienta(h)}
                          className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1 text-xs"
                        >
                          <FaEdit size={10} /> Editar
                        </button>
                        <button
                          onClick={() => handleDeleteHerramienta(h._id)}
                          className="text-red-600 hover:text-red-900 flex items-center gap-1 text-xs"
                        >
                          <FaTrash size={10} /> Eliminar
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
          <div className="max-h-[90vh] overflow-y-auto p-4 md:p-0">
            <HerramientaForm
              herramienta={editingHerramienta}
              onSuccess={handleFormSubmit}
              onCancel={() => setShowModal(false)}
            />
          </div>
        </Modal>
      )}

      {/* Modal para Ver Códigos - Mejorado para móvil */}
      {showCodesModal && selectedHerramienta && (
        <Modal onClose={() => setShowCodesModal(false)}>
          <div className="p-4 md:p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg md:text-xl font-bold mb-4 text-gray-800">
              Códigos - {selectedHerramienta.nombre}
            </h3>
            <div className="space-y-6">
              {/* Info Herramienta */}
              <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                <h4 className="font-semibold mb-2 text-gray-700 text-sm md:text-base">Detalles</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs md:text-sm text-gray-600">
                  <p><strong>Marca:</strong> {selectedHerramienta.marca || '-'}</p>
                  <p><strong>Modelo:</strong> {selectedHerramienta.modelo || '-'}</p>
                  <p><strong>Tipo:</strong> {selectedHerramienta.tipo || '-'}</p>
                  <p><strong>Cantidad:</strong> {selectedHerramienta.cantidad} {selectedHerramienta.unidad}</p>
                  <p><strong>Estado:</strong> 
                    <span className={`ml-1 px-2 py-1 text-xs rounded-full ${
                      selectedHerramienta.estado === 'disponible' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedHerramienta.estado}
                    </span>
                  </p>
                </div>
              </div>

              {/* Códigos - Responsive */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4">
                {/* Barcode */}
                <div className="text-center border-b md:border-b-0 md:border-r border-gray-200 pb-4 md:pb-0 md:pr-6">
                  <h4 className="font-semibold mb-3 text-gray-700 flex items-center justify-center gap-2 text-sm md:text-base">
                    <FaBarcode size={14} /> Código de Barras
                  </h4>
                  {selectedHerramienta.barcode ? (
                    <>
                      <div className="mb-2">
                        <BarcodeDisplay 
                          value={selectedHerramienta.barcode}
                          height={60}
                          showActions={false}
                          className="mx-auto max-w-full"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-gray-500 italic text-sm">No hay código de barras generado.</p>
                      <button
                        onClick={() => handleGenerateBarcode(selectedHerramienta)}
                        disabled={generatingBarcode}
                        className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 mx-auto text-sm"
                      >
                        <FaBarcode size={12} /> Generar Barcode
                      </button>
                    </div>
                  )}
                </div>

                {/* QR */}
                <div className="text-center pt-4 md:pt-0 md:pl-6">
                  <h4 className="font-semibold mb-3 text-gray-700 flex items-center justify-center gap-2 text-sm md:text-base">
                    <FaQrcode size={14} /> Código QR
                  </h4>
                  {selectedHerramienta.qrCode ? (
                    <QRDisplay 
                      qrCode={selectedHerramienta.qrCode}
                      showActions={false}
                      className="mx-auto" 
                    />
                  ) : (
                    <div className="space-y-2">
                      <p className="text-gray-500 italic text-sm">No hay código QR.</p>
                      <button
                        onClick={() => handleGenerateQR(selectedHerramienta)}
                        className="bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-700 flex items-center gap-2 mx-auto text-sm"
                      >
                        <FaQrcode size={12} /> Generar
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Botón Cerrar */}
              <button
                onClick={() => setShowCodesModal(false)}
                className="w-full bg-gray-500 text-white px-4 py-3 rounded-md hover:bg-gray-600 min-h-[44px] text-sm md:text-base"
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
