import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { FaEdit, FaTrash, FaPlus, FaSearch, FaFilePdf, FaWhatsapp, FaFileInvoice } from "react-icons/fa";
import generarReporteCotizacion from "../../utils/generarReporteCotización"; // Para cotizaciones
import { generarFactura } from "../../utils/generarFactura"; // NUEVO: Para facturas
import { toast } from 'react-hot-toast';
import ModalConfirmacion from "../../components/ModalConfirmacion";

const CotizaciónList = () => {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const [modalConfirmacion, setModalConfirmacion] = useState({
    show: false,
    title: "",
    message: "",
    confirmText: "Confirmar",
    isDestructive: true,
    action: null,
    data: null
  });

  useEffect(() => {
    fetchCotizaciones();
  }, []);

  const fetchCotizaciones = async () => {
    setLoading(true);
    setError(null);
    try {
      // 🔄 CAMBIO: Usar la ruta de MIS cotizaciones
      const res = await api.get("/cotizaciones/mis-cotizaciones");
      setCotizaciones(res.data);
    } catch (err) {
      setError("Error al cargar cotizaciones");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCotizaciones = cotizaciones.filter((cotizacion) =>
    cotizacion.numeroCotizacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cotizacion.cliente?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cotizacion.observaciones?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (cotizacion) => {
    navigate("/cotización", { state: { cotizacion } });
  };

  const handleDelete = (id) => {
    setModalConfirmacion({
      show: true,
      title: "¿Eliminar cotización?",
      message: "¿Estás seguro de que deseas eliminar esta cotización?",
      confirmText: "Sí, eliminar",
      isDestructive: true,
      action: 'eliminar',
      data: id
    });
  };

  const ejecutarEliminacion = async (id) => {
    try {
      await api.delete(`/cotizaciones/${id}`);
      setCotizaciones(prev => prev.filter((c) => c._id !== id));
      toast.success("Cotización eliminada");
    } catch (err) {
      console.error("Error al eliminar cotización:", err);
      toast.error(err.response?.data?.msg || "Error al eliminar la cotización");
    }
  };

  const handleNuevaCotizacion = () => {
    navigate("/cotización");
  };

  // NUEVA FUNCIÓN: Para cambiar el estado de una cotización
  const handleUpdateEstado = (cotizacionId, nuevoEstado) => {
    setModalConfirmacion({
      show: true,
      title: `¿Marcar como ${nuevoEstado}?`,
      message: `¿Estás seguro de que quieres marcar esta cotización como "${nuevoEstado}"?`,
      confirmText: "Sí, confirmar",
      isDestructive: nuevoEstado === 'Rechazada',
      action: 'updateEstado',
      data: { cotizacionId, nuevoEstado }
    });
  };

  const ejecutarUpdateEstado = async (cotizacionId, nuevoEstado) => {
    try {
      const res = await api.patch(`/cotizaciones/${cotizacionId}/estado`, { estado: nuevoEstado });
      // Actualizar la lista de cotizaciones en el frontend para reflejar el cambio al instante
      setCotizaciones(prev => prev.map(c => 
        c._id === cotizacionId ? res.data : c
      ));
      toast.success(`Cotización marcada como ${nuevoEstado}`);
    } catch (error) {
      console.error("Error al actualizar el estado:", error);
      toast.error(error.response?.data?.msg || "Error al cambiar el estado de la cotización");
    }
  };

  // FUNCIÓN ACTUALIZADA: Ahora crea la factura en el backend
  const handleGenerarFactura = (cotizacion) => {
    setModalConfirmacion({
      show: true,
      title: "Generar Factura",
      message: `¿Estás seguro de que quieres generar una factura para la cotización #${cotizacion.numeroCotizacion}? Esto marcará la cotización como "Facturada".`,
      confirmText: "Generar Factura",
      isDestructive: false,
      action: 'generarFactura',
      data: cotizacion
    });
  };

  const ejecutarGenerarFactura = async (cotizacion) => {
    try {
      // Llamar al nuevo endpoint del backend para crear la factura
      const res = await api.post("/facturas", { cotizacionId: cotizacion._id });
      const nuevaFactura = res.data;

      toast.success(`Factura ${nuevaFactura.numeroFactura} creada exitosamente.`);

      // El backend ya cambia el estado, solo necesitamos actualizar el frontend
      fetchCotizaciones(); // Recargamos la lista para ver el estado "Facturada"

    } catch (error) {
      console.error("Error al generar la factura:", error);
      toast.error("Error al generar la factura: " + (error.response?.data?.msg || error.message));
    }
  };

  const handleConfirmarAccion = () => {
    if (modalConfirmacion.action === 'eliminar') {
      ejecutarEliminacion(modalConfirmacion.data);
    } else if (modalConfirmacion.action === 'updateEstado') {
      ejecutarUpdateEstado(modalConfirmacion.data.cotizacionId, modalConfirmacion.data.nuevoEstado);
    } else if (modalConfirmacion.action === 'generarFactura') {
      ejecutarGenerarFactura(modalConfirmacion.data);
    }
    setModalConfirmacion(prev => ({ ...prev, show: false }));
  };

  // NUEVO: Handler para ver la factura en PDF
  const handleVerFactura = async (cotizacion) => {
    if (!cotizacion.factura) {
      toast.error("Esta cotización no tiene una factura asociada para mostrar.");
      return;
    }
  
    // Datos de la empresa (pueden venir de un contexto, config, etc.)
    const empresa = {
      nombre: "TEAM GAS S.A.C.",
      ruc: "20604956499",
      direccion: "Jr. Coronel Guerra Nro. 152 (Plaza Principal) Junín - Chupaca - Chupaca",
      telefono: "997030802",
      email: "info@teamgas.com.pe",
    };
  
    const datosParaPdf = {
      logoUrl: '/logo.png', // Logo en la carpeta public
      empresa,
      factura: {
        numero: cotizacion.factura.numeroFactura,
        fechaEmision: new Date(cotizacion.factura.fechaEmision).toLocaleDateString('es-PE', { timeZone: 'UTC' }),
        fechaVencimiento: new Date(cotizacion.factura.fechaVencimiento).toLocaleDateString('es-PE', { timeZone: 'UTC' }),
      },
      cliente: {
        nombre: cotizacion.cliente?.nombre || "",
        ruc: cotizacion.cliente?.ruc || cotizacion.cliente?.numero || "",
        direccion: cotizacion.cliente?.direccion || "N/A",
      },
      items: cotizacion.factura.items.map(item => ({
        ...item,
        unidad: item.unidad || 'UND',
      })),
      totales: {
        subtotal: cotizacion.factura.subtotal,
        descuento: cotizacion.factura.descuento || 0,
        opGravada: (cotizacion.factura.subtotal || 0) - (cotizacion.factura.descuento || 0),
        igv: cotizacion.factura.igv,
        totalPagar: cotizacion.factura.totalGeneral,
      },
    };
  
    try {
      await generarFactura(datosParaPdf);
    } catch (error) {
      console.error("Error al generar el PDF de la factura:", error);
      toast.error("No se pudo generar el PDF de la factura.");
    }
  };

  const handleImprimir = async (cotizacion) => {
    try {
      // Calcular totales basados en productos
      const subtotal = cotizacion.productos.reduce((acc, p) => {
        const precioUnit = parseFloat(p.precioUnitario) || 0;
        const cantidad = parseFloat(p.cantidad) || 0;
        const igvUnit = precioUnit * 0.18;
        const vUnit = precioUnit - igvUnit;
        return acc + (vUnit * cantidad);
      }, 0);
      const descuentoAmount = parseFloat(cotizacion.descuento) || 0;
      const igv = cotizacion.productos.reduce((acc, p) => {
        const precioUnit = parseFloat(p.precioUnitario) || 0;
        const cantidad = parseFloat(p.cantidad) || 0;
        const igvUnit = precioUnit * 0.18;
        return acc + (igvUnit * cantidad);
      }, 0);
      const total = subtotal - descuentoAmount + igv;

      // Formatear fecha
      const fechaFormateada = new Date(cotizacion.fecha).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'UTC'
      });

      await generarReporteCotizacion({
        cliente: {
          nombre: cotizacion.cliente?.nombre || "",
          documento: cotizacion.cliente?.ruc || cotizacion.cliente?.numero || "",
          direccion: cotizacion.cliente?.direccion || "",
          telefono: cotizacion.cliente?.telefono || "#",
        },
        productos: cotizacion.productos.map((p) => ({
          cantidad: p.cantidad,
          unidad: p.unidad || 'UND',
          descripcion: p.descripcion,
          precioUnit: parseFloat(p.precioUnitario) || 0,
        })),
        subtotal,
        descuento: descuentoAmount,
        igv,
        total,
        fecha: fechaFormateada,
        moneda: cotizacion.moneda,
        numeroCotizacion: cotizacion.numeroCotizacion,
        condicionPago: "CONTADO",
        validez: cotizacion.validez,
        observaciones: cotizacion.observaciones || "",
        responsable: cotizacion.usuario?.nombre || "N/A",
        tipoCambio: cotizacion.tipoCambio,
      });
    } catch (error) {
      console.error("Error al generar el reporte:", error);
    }
  };

  if (loading)
    return (
      <div className="text-center p-6 text-gray-600 animate-pulse">
        Cargando cotizaciones...
      </div>
    );
  if (error)
    return (
      <div className="text-center p-6 bg-red-100 text-red-700 rounded-md shadow-sm">
        {error}
      </div>
    );

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-secondary-800 tracking-tight">
          Mis Cotizaciones
        </h2>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64 md:w-72">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
            <input
              type="text"
              placeholder="Buscar cotización, cliente u observación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 w-full text-sm"
            />
          </div>

          <button
            onClick={handleNuevaCotizacion}
            className="flex items-center justify-center gap-2 bg-primary-400 hover:bg-primary-500 text-secondary-800 font-bold px-4 py-2 rounded-lg shadow-soft hover:shadow-medium transition-all duration-300"
          >
            <FaPlus size={14} /> Nueva Cotización
          </button>
        </div>
      </div>

      {/* Lista */}
      {filteredCotizaciones.length === 0 ? (
        <div className="text-center py-12 text-secondary-600 text-sm md:text-base bg-secondary-50 rounded-lg border border-dashed">
          {searchTerm
            ? "No se encontraron cotizaciones que coincidan con la búsqueda."
            : "No has creado cotizaciones aún."}
        </div>
      ) : (
        <div className="space-y-3 md:space-y-4">
          {/* Móvil - Tarjetas */}
          <div className="md:hidden space-y-3">
            {filteredCotizaciones.map((cotizacion) => (
              <div
                key={cotizacion._id}
                className="bg-white p-4 rounded-xl shadow-soft border border-secondary-200 hover:shadow-medium hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex justify-between items-start">
                  <h3 className="text-base font-bold text-secondary-800 mb-2">
                    Cotización #{cotizacion.numeroCotizacion}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    cotizacion.estado === 'Aceptada' ? 'bg-success-100 text-success-800' :
                    cotizacion.estado === 'Facturada' ? 'bg-blue-100 text-blue-800' :
                    cotizacion.estado === 'Rechazada' ? 'bg-danger-100 text-danger-800' :
                    'bg-secondary-100 text-secondary-800'
                  }`}>
                    {cotizacion.estado || 'Pendiente'}
                  </span>
                </div>
                {cotizacion.factura && (
                  <p className="text-sm font-semibold text-blue-600 mb-2">
                    Factura: {cotizacion.factura.numeroFactura}
                  </p>
                )}
                <div className="text-sm text-secondary-600 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Cliente:</span>
                    <span>{cotizacion.cliente?.nombre || '-'}</span>
                    {cotizacion.cliente?.telefono && (
                      <a
                        href={`https://wa.me/51${cotizacion.cliente.telefono.replace(/\s/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-success-500 hover:text-success-600"
                      ><FaWhatsapp /></a>  
                    )}
                  </div>
                  <p>
                    <span className="font-semibold">Fecha:</span>{" "}
                    {new Date(cotizacion.fecha).toLocaleDateString('es-ES', { timeZone: 'UTC' })}
                  </p>
                  <p>
                    <span className="font-semibold">Total:</span>{" "}
                    {cotizacion.moneda === "SOLES"
                      ? `S/ ${cotizacion.totalGeneral?.toFixed(2) || "0.00"}`
                      : `${Math.round(cotizacion.totalGeneral || 0)} $`}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-4">
                  {cotizacion.factura ? (
                     <button
                        onClick={() => handleVerFactura(cotizacion)}
                        className="col-span-2 flex items-center justify-center gap-1 bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 text-xs font-medium"
                      >
                        <FaFileInvoice className="inline-block mr-1" /> Ver Factura
                      </button>
                  ) : (
                    <>
                      {cotizacion.estado === 'Aceptada' && (
                        <button 
                          onClick={() => handleGenerarFactura(cotizacion)}
                          className="col-span-2 bg-success-500 text-white flex items-center justify-center gap-1 py-2 rounded-md hover:bg-success-600 text-xs font-medium"
                        >
                          Generar Factura
                        </button>
                      )}
                    </>
                  )}
                  <button
                    onClick={() => handleImprimir(cotizacion)}
                    className="flex items-center justify-center gap-1 bg-gray-500 text-white py-2 rounded-md hover:bg-gray-600 text-xs font-medium"
                  >
                    <FaFilePdf className="inline-block mr-1" /> Ver Coti
                  </button>
                  <button
                    onClick={() => handleDelete(cotizacion._id)}
                    className="flex items-center justify-center gap-1 bg-danger-500 text-white py-2 rounded-md hover:bg-danger-600 text-xs font-medium"
                  >
                    <FaTrash className="inline-block mr-1" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Escritorio - Tabla */}
          <div className="hidden md:block">
            <div className="overflow-x-auto bg-white shadow-soft rounded-lg border border-secondary-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-primary-50 text-secondary-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">N° Cotización</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Cliente</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">N° Factura</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCotizaciones.map((cotizacion) => (
                    <tr
                      key={cotizacion._id}
                      className="hover:bg-primary-50 transition-colors duration-150"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-secondary-900">
                        #{cotizacion.numeroCotizacion}
                      </td>
                      <td className="px-4 py-3 text-sm text-secondary-700">
                        <div className="flex items-center gap-2">
                          <span>{cotizacion.cliente?.nombre || '-'}</span>
                          {cotizacion.cliente?.telefono && (
                            <a
                              href={`https://wa.me/51${cotizacion.cliente.telefono.replace(/\s/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-success-500 hover:text-success-600"
                            ><FaWhatsapp /></a>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-secondary-500">
                        {new Date(cotizacion.fecha).toLocaleDateString('es-ES', { timeZone: 'UTC' })}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-secondary-900">
                        {cotizacion.moneda === "SOLES"
                          ? `S/ ${cotizacion.totalGeneral?.toFixed(2) || "0.00"}`
                          : `${Math.round(cotizacion.totalGeneral || 0)} $`}
                      </td>
                      <td className="px-4 py-3 text-sm text-secondary-500">
                        {cotizacion.factura ? (
                          <span className="font-bold text-blue-600">{cotizacion.factura.numeroFactura}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          cotizacion.estado === 'Aceptada' ? 'bg-success-100 text-success-800' :
                          cotizacion.estado === 'Facturada' ? 'bg-blue-100 text-blue-800' :
                          cotizacion.estado === 'Rechazada' ? 'bg-danger-100 text-danger-800' :
                          'bg-secondary-100 text-secondary-800'
                        }`}>
                          {cotizacion.estado || 'Pendiente'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm space-x-2 whitespace-nowrap">
                        {/* Botón para ver la factura si ya existe */}
                        {cotizacion.factura ? (
                          <button onClick={() => handleVerFactura(cotizacion)} className="text-blue-600 hover:text-blue-800 font-medium text-xs">
                             <FaFileInvoice className="inline-block mr-1" /> Ver Factura
                           </button>
                        ) : (
                          <>
                            {/* Lógica para estados sin factura */}
                            {cotizacion.estado === 'Aceptada' && (
                              <button 
                                onClick={() => handleGenerarFactura(cotizacion)}
                                className="bg-success-500 text-white px-2 py-1 rounded-md text-xs hover:bg-success-600 transition-colors"
                              >
                                Generar Factura
                              </button>
                            )}
                          </>
                        )}
                        
                        {/* Botón Editar: Disponible siempre que no esté facturada (incluye Aceptada/Rechazada) */}
                        {!cotizacion.factura && (
                          <button onClick={() => handleEdit(cotizacion)} className="text-warning-600 hover:text-warning-700 font-medium text-xs">
                            <FaEdit className="inline-block mr-1" />Editar
                          </button>
                        )}

                        {(!cotizacion.factura && cotizacion.estado === 'Pendiente') && (
                          <>
                            <button onClick={() => handleUpdateEstado(cotizacion._id, 'Aceptada')} className="text-success-600 hover:text-success-700 font-medium text-xs">Aceptar</button>
                            <button onClick={() => handleUpdateEstado(cotizacion._id, 'Rechazada')} className="text-danger-600 hover:text-danger-700 font-medium text-xs">Rechazar</button>
                          </>
                        )}

                        {/* Botón para ver la cotización siempre disponible */}
                        <button onClick={() => handleImprimir(cotizacion)} className="text-gray-600 hover:text-gray-800 font-medium text-xs">
                          <FaFilePdf className="inline-block mr-1" /> Ver Coti
                        </button>

                        {/* Eliminar si no está facturada */}
                        <button onClick={() => handleDelete(cotizacion._id)} className="text-danger-600 hover:text-danger-700 font-medium text-xs">
                          <FaTrash className="inline-block mr-1" />
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

export default CotizaciónList;