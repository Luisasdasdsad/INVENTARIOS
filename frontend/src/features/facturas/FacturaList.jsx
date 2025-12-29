import { useState, useEffect } from "react";
import api from "../../services/api";
import { FaFilePdf, FaSearch, FaPaperPlane, FaCheckCircle, FaTimesCircle, FaHourglassHalf } from "react-icons/fa";
import { generarFactura } from "../../utils/generarFactura";
import { toast } from 'react-hot-toast';
import ModalConfirmacion from "../../components/ModalConfirmacion";

const FacturaList = () => {
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalConfirmacion, setModalConfirmacion] = useState({
    show: false,
    title: "",
    message: "",
    confirmText: "Confirmar",
    isDestructive: true,
    action: null,
    data: null
  });

  const fetchFacturas = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/facturas");
      setFacturas(res.data);
    } catch (err) {
      setError("Error al cargar las facturas.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacturas();
  }, []); // El array vacío asegura que solo se llame una vez al montar el componente

  const handleImprimirFactura = async (facturaId) => {
    try {
      // 1. Obtener los datos completos de la factura desde el backend
      const res = await api.get(`/facturas/${facturaId}`);
      const facturaCompleta = res.data;

      // 2. Preparar datos de la empresa (esto debería venir de una config global)
      const EMPRESA_INFO = {
        nombre: "TEAM GAS S.A.C.",
        ruc: "20604956499",
        direccion: "JR. CORONEL GUERRA NRO. 152 (PLAZA PRINCIPAL) JUNIN - CHUPACA - CHUPACA",
        telefono: "997030802 - 919289085",
        email: "info@teamgas.com",
        logoUrl: "/fondocotizacion.png",
      };

      // 3. Preparar información de pago (ejemplo)
      const CUENTAS_BANCARIAS = [
        { banco: "BCP", moneda: "SOLES", cuenta: "191-XXXXXXXXX-XX-XXX", cci: "002-191-XXXXXXXXX-XX-XXX" },
        { banco: "Interbank", moneda: "DOLARES", cuenta: "003-XXXXXXXXX-XX-XXX", cci: "007-003-XXXXXXXXX-XX-XXX" },
      ];

      // 4. Ensamblar el objeto de datos para la función de generar PDF
      const datosParaFactura = {
        logoUrl: EMPRESA_INFO.logoUrl,
        empresa: EMPRESA_INFO,
        factura: {
          numero: facturaCompleta.numeroFactura,
          fechaEmision: new Date(facturaCompleta.fechaEmision).toLocaleDateString('es-ES'),
          fechaVencimiento: new Date(facturaCompleta.fechaVencimiento).toLocaleDateString('es-ES'),
        },
        cliente: {
          nombre: facturaCompleta.cliente?.nombre || "",
          ruc: facturaCompleta.cliente?.ruc || facturaCompleta.cliente?.numero || "",
          direccion: facturaCompleta.cliente?.direccion || "",
        },
        items: facturaCompleta.items.map(p => ({
          cantidad: p.cantidad,
          unidad: 'UND', // Asumimos UND, se podría guardar en el modelo si varía
          descripcion: p.descripcion,
          precioUnitario: parseFloat(p.precioUnitario) || 0,
          total: p.total,
        })),
        totales: {
          subtotal: facturaCompleta.subtotal,
          descuento: facturaCompleta.descuento,
          opGravada: facturaCompleta.subtotal - facturaCompleta.descuento,
          igv: facturaCompleta.igv,
          totalPagar: facturaCompleta.totalGeneral,
        },
        cuentas: CUENTAS_BANCARIAS,
        observaciones: "", // Las facturas usualmente no llevan las observaciones de la cotización
      };

      await generarFactura(datosParaFactura);

    } catch (error) {
      console.error("Error al imprimir la factura:", error);
      toast.error("No se pudo generar el PDF de la factura.");
    }
  };

  const handleEnviarSunat = (facturaId) => {
    setModalConfirmacion({
      show: true,
      title: "Enviar a SUNAT",
      message: "¿Estás seguro de que deseas enviar esta factura a la SUNAT? Esta acción no se puede deshacer.",
      confirmText: "Sí, enviar",
      isDestructive: false, // Usamos false para que salga azul/amarillo en vez de rojo
      action: 'enviarSunat',
      data: facturaId
    });
  };

  const ejecutarEnviarSunat = async (facturaId) => {
    try {
      // Actualiza el estado local para mostrar un feedback inmediato al usuario
      setFacturas(prev => prev.map(f => f._id === facturaId ? { ...f, estadoSunat: 'Enviando...' } : f));

      const res = await api.post(`/facturas/${facturaId}/enviar-sunat`);
      const facturaActualizada = res.data.factura;

      // Actualiza la lista de facturas con la respuesta final del backend
      setFacturas(prev => prev.map(f => f._id === facturaId ? facturaActualizada : f));

      toast.success(`Factura enviada. Estado SUNAT: ${facturaActualizada.estadoSunat}`);

    } catch (error) {
      console.error("Error al enviar a SUNAT:", error);
      toast.error(`Error: ${error.response?.data?.message || 'No se pudo enviar la factura.'}`);
      // Vuelve a cargar los datos para reflejar el estado de error guardado en el backend
      fetchFacturas(); 
    }
  };

  const handleConfirmarAccion = () => {
    if (modalConfirmacion.action === 'enviarSunat') {
      ejecutarEnviarSunat(modalConfirmacion.data);
    }
    setModalConfirmacion(prev => ({ ...prev, show: false }));
  };

  const filteredFacturas = facturas.filter((factura) =>
    factura.numeroFactura.toLowerCase().includes(searchTerm.toLowerCase()) ||
    factura.cliente?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="text-center p-6 text-gray-600 animate-pulse">Cargando facturas...</div>;
  if (error) return <div className="text-center p-6 bg-red-100 text-red-700 rounded-md shadow-sm">{error}</div>;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-secondary-800 tracking-tight">
          Historial de Facturas
        </h2>
        <div className="relative w-full sm:w-64 md:w-72">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
          <input
            type="text"
            placeholder="Buscar por N° o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 w-full text-sm"
          />
        </div>
      </div>

      {/* Lista de Facturas */}
      {filteredFacturas.length === 0 ? (
        <div className="text-center py-12 text-secondary-600 text-sm md:text-base bg-secondary-50 rounded-lg border border-dashed">
          No se han generado facturas aún.
        </div>
      ) : (
        <>
          {/* Vista Móvil: Tarjetas */}
          <div className="md:hidden space-y-4">
            {filteredFacturas.map((factura) => (
              <div key={factura._id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-sm font-bold text-gray-900 block">{factura.numeroFactura}</span>
                    <span className="text-xs text-gray-500">{new Date(factura.fechaEmision).toLocaleDateString()}</span>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    factura.estado === 'Pagada' ? 'bg-green-100 text-green-800' :
                    factura.estado === 'Anulada' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {factura.estado}
                  </span>
                </div>

                <div className="mb-4 space-y-1">
                  <p className="text-sm text-gray-700"><span className="font-semibold">Cliente:</span> {factura.cliente?.nombre || '-'}</p>
                  <p className="text-sm text-gray-700"><span className="font-semibold">Total:</span> {new Intl.NumberFormat('es-PE', { style: 'currency', currency: factura.moneda === 'SOLES' ? 'PEN' : 'USD' }).format(factura.totalGeneral)}</p>
                </div>

                <div className="border-t border-gray-100 pt-3">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs text-gray-500 font-medium">Estado SUNAT</span>
                    <span className={`flex items-center gap-1 text-xs font-bold ${
                      factura.estadoSunat === 'Aceptada' ? 'text-green-600' :
                      factura.estadoSunat === 'Rechazada' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {factura.estadoSunat === 'Aceptada' && <FaCheckCircle />}
                      {factura.estadoSunat === 'Rechazada' && <FaTimesCircle />}
                      {factura.estadoSunat === 'Pendiente de Envío' && <FaHourglassHalf />}
                      {factura.estadoSunat}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {factura.estadoSunat === 'Pendiente de Envío' && (
                      <button
                        onClick={() => handleEnviarSunat(factura._id)}
                        className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 text-xs font-medium flex items-center justify-center gap-1 min-h-[36px]"
                      >
                        <FaPaperPlane /> Enviar
                      </button>
                    )}
                    {factura.estadoSunat === 'Aceptada' ? (
                      <a href={factura.enlacePdf || '#'} target="_blank" rel="noopener noreferrer" className="flex-1 bg-white text-blue-600 border border-blue-200 py-2 rounded-md hover:bg-blue-50 text-xs font-medium flex items-center justify-center gap-1 min-h-[36px]">
                        <FaFilePdf /> Ver PDF
                      </a>
                    ) : (
                      <button
                        onClick={() => handleImprimirFactura(factura._id)}
                        className="flex-1 bg-white text-gray-700 border border-gray-300 py-2 rounded-md hover:bg-gray-50 text-xs font-medium flex items-center justify-center gap-1 min-h-[36px]"
                      >
                        <FaFilePdf /> Preliminar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Vista Escritorio: Tabla */}
          <div className="hidden md:block overflow-x-auto bg-white shadow-soft rounded-lg border border-secondary-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-secondary-100 text-secondary-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">N° Factura</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Fecha Emisión</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Total</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Estado SUNAT</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFacturas.map((factura) => (
                <tr key={factura._id} className="hover:bg-blue-50 transition-colors duration-150">
                  <td className="px-4 py-3 text-sm font-medium text-secondary-900">
                    {factura.numeroFactura}
                  </td>
                  <td className="px-4 py-3 text-sm text-secondary-700">
                    {factura.cliente?.nombre || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-secondary-500">
                    {new Date(factura.fechaEmision).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-secondary-900">
                    {new Intl.NumberFormat('es-PE', { style: 'currency', currency: factura.moneda === 'SOLES' ? 'PEN' : 'USD' }).format(factura.totalGeneral)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      factura.estado === 'Pagada' ? 'bg-success-100 text-success-800' :
                      factura.estado === 'Anulada' ? 'bg-danger-100 text-danger-800' :
                      'bg-warning-100 text-warning-800'
                    }`}>
                      {factura.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`flex items-center gap-1.5 text-xs font-semibold ${
                      factura.estadoSunat === 'Aceptada' ? 'text-success-700' :
                      factura.estadoSunat === 'Rechazada' ? 'text-danger-700' :
                      'text-secondary-600'
                    }`}>
                      {factura.estadoSunat === 'Aceptada' && <FaCheckCircle />}
                      {factura.estadoSunat === 'Rechazada' && <FaTimesCircle />}
                      {factura.estadoSunat === 'Pendiente de Envío' && <FaHourglassHalf />}
                      {factura.estadoSunat}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm flex items-center gap-3">
                    {factura.estadoSunat === 'Pendiente de Envío' && (
                      <button
                        onClick={() => handleEnviarSunat(factura._id)}
                        className="text-primary-600 hover:text-primary-800 font-medium text-xs flex items-center gap-1"
                        title="Enviar a SUNAT"
                      >
                        <FaPaperPlane /> Enviar
                      </button>
                    )}
                    {factura.estadoSunat === 'Aceptada' ? (
                       <a href={factura.enlacePdf || '#'} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-medium text-xs flex items-center gap-1">
                         <FaFilePdf /> Ver PDF
                       </a>
                    ) : (
                      <button
                        onClick={() => handleImprimirFactura(factura._id)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-xs flex items-center gap-1"
                      >
                        <FaFilePdf /> Preliminar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </>
      )}

      <ModalConfirmacion
        show={modalConfirmacion.show}
        onClose={() => setModalConfirmacion(prev => ({ ...prev, show: false }))}
        onConfirm={handleConfirmarAccion}
        title={modalConfirmacion.title}
        message={modalConfirmacion.message}
        confirmText={modalConfirmacion.confirmText}
        isDestructive={modalConfirmacion.isDestructive}
      />
    </div>
  );
};

export default FacturaList;