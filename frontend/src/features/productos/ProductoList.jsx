import { useEffect, useState } from "react";
import api from "../../services/api.js";
import Modal from "../../components/Modal/Modal";
import ProductoForm from "./ProductoForm";
import BarcodeDisplay from "../../components/BarcodeDisplay/BarcodeDisplay";
import QRDisplay from "../../components/BarcodeDisplay/QRDisplay.jsx";
import { FaEdit, FaTrash, FaBarcode, FaQrcode, FaPlus, FaEye, FaFilePdf } from "react-icons/fa";
import { generarReporteProductos } from "../../utils/generarReporteProductos.js";

export default function ProductoList() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProducto, setEditingProducto] = useState(null);
  const [showCodesModal, setShowCodesModal] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState(null);
  const [generatingBarcode, setGeneratingBarcode] = useState(false);
  const [generatingQR, setGeneratingQR] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');

  const fetchProductos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/productos");
      setProductos(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Error al cargar productos");
      console.error("Error al cargar productos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  const filteredProductos = productos.filter(p =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (categoriaFilter === '' || p.categoria === categoriaFilter)
  );

  const handleAddProducto = () => {
    setEditingProducto(null);
    setShowModal(true);
  };

  const handleEditProducto = (producto) => {
    setEditingProducto(producto);
    setShowModal(true);
  };

  const handleDeleteProducto = async (id) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este producto?")) {
      return;
    }
    try {
      await api.delete(`/productos/${id}`);
      setProductos(productos.filter((p) => p._id !== id));
      alert("Producto eliminado con éxito.");
    } catch (err) {
      setError(err.response?.data?.message || "Error al eliminar producto");
      console.error("Error al eliminar producto:", err);
    }
  };

  const handleFormSubmit = () => {
    fetchProductos();
    setShowModal(false);
  };

  const handleGenerateBarcode = async (producto) => {
    setGeneratingBarcode(true);
    try {
      const res = await api.post(`/productos/generar-barcode/${producto._id}`);
      alert('Código de barras generado exitosamente');
      fetchProductos();
      if (selectedProducto?._id === producto._id) {
        setSelectedProducto(res.data.producto);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al generar código de barras');
      console.error('Error al generar código de barras:', err);
    } finally {
      setGeneratingBarcode(false);
    }
  };

  const handleGenerateQR = async (producto) => {
    setGeneratingQR(true);
    try {
      const res = await api.post(`/productos/generar-qr/${producto._id}`);
      alert(`Código QR generado exitosamente: ${res.data.qrCode}`);
      fetchProductos();
      if (selectedProducto?._id === producto._id) {
        setSelectedProducto(res.data.producto);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al generar código QR');
      console.error('Error al generar código QR:', err);
    } finally {
      setGeneratingQR(false);
    }
  };

  const handleShowCodes = (producto) => {
    setSelectedProducto(producto);
    setShowCodesModal(true);
  };

  const handleGenerateMassiveBarcodes = async () => {
    if (!window.confirm('¿Generar códigos de barras para todos los productos que no tienen?')) {
      return;
    }
    setGeneratingBarcode(true);
    try {
      const res = await api.post('/productos/generar-barcode-masivo');
      alert(`Códigos de barras generados para ${res.data.productos.length} productos`);
      fetchProductos();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al generar códigos masivos');
      console.error('Error al generar códigos masivos:', err);
    } finally {
      setGeneratingBarcode(false);
    }
  };

  const handleGenerateMassiveQRs = async () => {
    if (!window.confirm('¿Generar códigos QR para todos los productos que no tienen?')) {
      return;
    }
    setGeneratingQR(true);
    try {
      const res = await api.post('/productos/generar-qr-masivo');
      alert(`Códigos QR generados para ${res.data.productos.length} productos`);
      fetchProductos();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al generar QR masivos');
      console.error('Error al generar QR masivos:', err);
    } finally {
      setGeneratingQR(false);
    }
  };

  if (loading) return <div className="text-center p-4 md:p-8 text-gray-600">Cargando productos...</div>;
  if (error) return <div className="text-center p-4 md:p-8 text-red-500 bg-red-50 rounded-md m-2 md:m-4">Error: {error}</div>;

  return (
    <div className="p-2 md:p-4 lg:p-6 max-w-7xl w-full mx-auto">
      {/* Header Mejorado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-800 whitespace-nowrap">Productos</h2>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-48 text-sm md:text-base"
            />
            <select
              value={categoriaFilter}
              onChange={(e) => setCategoriaFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-48 text-sm md:text-base"
            >
              <option value="">Todas las categorías</option>
              <option value="materiales">Materiales</option>
              <option value="herramientas">Herramientas</option>
              <option value="útiles de escritorio">Útiles de escritorio</option>
              <option value="equipos de computo">Equipos de computo</option>
              <option value="muebles">Muebles</option>
              <option value="útiles de aseo">Útiles de aseo</option>
              <option value="equipo de protección personal (EPPS)">Equipo de protección personal (EPPS)</option>
            </select>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={() => generarReporteProductos(filteredProductos)}
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
            onClick={handleAddProducto}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-md hover:bg-blue-700 transition-colors min-h-[44px] w-full sm:w-auto text-xs md:text-sm"
          >
            <FaPlus size={14} /> Agregar
          </button>
        </div>
      </div>

      {filteredProductos.length === 0 ? (
        <div className="text-center py-8 md:py-12 text-gray-600 text-sm md:text-base">
          {searchTerm ? 'No hay productos que coincidan con la búsqueda.' : 'No hay productos registrados.'}
        </div>
      ) : (
        <div className="space-y-3 md:space-y-4">
          {/* Mobile: Cards Mejoradas */}
          <div className="md:hidden space-y-3">
            {filteredProductos.map((p) => (
              <div key={p._id} className="bg-white p-3 rounded-lg shadow-sm border divide-y divide-gray-200">
                <div className="space-y-2 mb-3">
                  <h3 className="text-base font-semibold text-gray-900">{p.nombre}</h3>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p><span className="font-medium">Categoría:</span> {p.categoria || '-'}</p>
                    <p><span className="font-medium">Stock:</span> {p.stock} {p.unidad}</p>
                    <p><span className="font-medium">Precio:</span> S/ {p.precioUnitario?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>

                {/* Códigos en Mobile */}
                <div className="py-3">
                  <h4 className="text-xs font-medium text-gray-700 mb-2">Códigos</h4>
                  <div className="space-y-2">
                    {p.barcode ? (
                      <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-xs font-mono flex-1 truncate">
                          <FaBarcode size={10} className="mr-1 inline" /> {p.barcode}
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleGenerateBarcode(p)}
                        disabled={generatingBarcode}
                        className="w-full text-green-600 hover:text-green-900 text-xs disabled:opacity-50 flex items-center justify-center gap-1 py-2 bg-gray-100 rounded"
                      >
                        <FaBarcode size={12} /> {generatingBarcode ? 'Generando...' : 'Barcode'}
                      </button>
                    )}
                    {p.qrCode ? (
                      <div className="flex items-center justify-between bg-blue-50 p-2 rounded">
                        <span className="text-xs font-mono flex-1 truncate">
                          <FaQrcode size={10} className="mr-1 inline" /> {p.qrCode}
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleGenerateQR(p)}
                        disabled={generatingQR}
                        className="w-full text-purple-600 hover:text-purple-900 text-xs disabled:opacity-50 flex items-center justify-center gap-1 py-2 bg-gray-100 rounded"
                      >
                        <FaQrcode size={12} /> {generatingQR ? 'Generando...' : 'QR'}
                      </button>
                    )}
                    {(p.barcode || p.qrCode) && (
                      <button
                        onClick={() => handleShowCodes(p)}
                        className="w-full bg-indigo-600 text-white text-xs py-2 rounded hover:bg-indigo-700 flex items-center justify-center gap-1"
                      >
                        <FaEye size={12} /> Ver Códigos
                      </button>
                    )}
                    {!p.barcode && !p.qrCode && (
                      <span className="text-gray-500 text-xs italic block text-center">Sin códigos</span>
                    )}
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-2 pt-3">
                  <button
                    onClick={() => handleEditProducto(p)}
                    className="flex-1 flex items-center justify-center gap-1 bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 text-xs min-h-[40px]"
                  >
                    <FaEdit size={12} /> Editar
                  </button>
                  <button
                    onClick={() => handleDeleteProducto(p._id)}
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unidad</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Unitario</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Códigos</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProductos.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900 text-sm">{p.nombre}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">{p.categoria || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">{p.stock}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">{p.unidad}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">S/ {p.precioUnitario?.toFixed(2) || '0.00'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">{p.descripcion || '-'}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="space-y-1">
                          {p.barcode ? (
                            <div className="flex items-center justify-between text-xs bg-gray-50 p-1 rounded">
                              <span className="font-mono truncate flex-1">
                                <FaBarcode size={10} className="mr-1 inline" /> {p.barcode.substring(0, 12)}...
                              </span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleGenerateBarcode(p)}
                              disabled={generatingBarcode}
                              className="text-green-600 hover:text-green-900 text-xs disabled:opacity-50 flex items-center gap-1 w-full justify-center"
                            >
                              <FaBarcode size={10} /> Gen Barcode
                            </button>
                          )}
                          {p.qrCode ? (
                            <div className="flex items-center justify-between text-xs bg-blue-50 p-1 rounded">
                              <span className="font-mono truncate flex-1">
                                <FaQrcode size={10} className="mr-1 inline" /> {p.qrCode.substring(0, 12)}...
                              </span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleGenerateQR(p)}
                              disabled={generatingQR}
                              className="text-purple-600 hover:text-purple-900 text-xs disabled:opacity-50 flex items-center gap-1 w-full justify-center"
                            >
                              <FaQrcode size={10} /> Gen QR
                            </button>
                          )}
                          {(p.barcode || p.qrCode) && (
                            <button
                              onClick={() => handleShowCodes(p)}
                              className="text-indigo-600 hover:text-indigo-900 text-xs flex items-center gap-1 w-full justify-center mt-1"
                            >
                              <FaEye size={10} /> Ver
                            </button>
                          )}
                          {!p.barcode && !p.qrCode && (
                            <span className="text-gray-500 text-xs italic block text-center">Sin códigos</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEditProducto(p)}
                          className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1 text-xs"
                        >
                          <FaEdit size={10} /> Editar
                        </button>
                        <button
                          onClick={() => handleDeleteProducto(p._id)}
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
            <ProductoForm
              producto={editingProducto}
              onSuccess={handleFormSubmit}
              onCancel={() => setShowModal(false)}
            />
          </div>
        </Modal>
      )}

      {/* Modal para Ver Códigos - Mejorado para móvil */}
      {showCodesModal && selectedProducto && (
        <Modal onClose={() => setShowCodesModal(false)}>
          <div className="p-4 md:p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg md:text-xl font-bold mb-4 text-gray-800">
              Códigos - {selectedProducto.nombre}
            </h3>
            <div className="space-y-6">
              {/* Info Producto */}
              <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                <h4 className="font-semibold mb-2 text-gray-700 text-sm md:text-base">Detalles</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs md:text-sm text-gray-600">
                  <p><strong>Categoría:</strong> {selectedProducto.categoria || '-'}</p>
                  <p><strong>Stock:</strong> {selectedProducto.stock} {selectedProducto.unidad}</p>
                  <p><strong>Precio Unitario:</strong> S/ {selectedProducto.precioUnitario?.toFixed(2) || '0.00'}</p>
                </div>
              </div>

              {/* Códigos - Responsive */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4">
                {/* Barcode */}
                <div className="text-center border-b md:border-b-0 md:border-r border-gray-200 pb-4 md:pb-0 md:pr-6">
                  <h4 className="font-semibold mb-3 text-gray-700 flex items-center justify-center gap-2 text-sm md:text-base">
                    <FaBarcode size={14} /> Código de Barras
                  </h4>
                  {selectedProducto.barcode ? (
                    <>
                      <div className="mb-2">
                        <BarcodeDisplay
                          value={selectedProducto.barcode}
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
                        onClick={() => handleGenerateBarcode(selectedProducto)}
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
                  {selectedProducto.qrCode ? (
                    <QRDisplay
                      qrCode={selectedProducto.qrCode}
                      showActions={false}
                      className="mx-auto"
                    />
                  ) : (
                    <div className="space-y-2">
                      <p className="text-gray-500 italic text-sm">No hay código QR.</p>
                      <button
                        onClick={() => handleGenerateQR(selectedProducto)}
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
