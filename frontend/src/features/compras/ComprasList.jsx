import { useState, useEffect } from "react";
import api from "../../services/api";
import Modal from "../../components/Modal/Modal";
import { FaPlus, FaCheck, FaTimes, FaFileInvoiceDollar, FaSearch, FaShoppingCart, FaEye, FaUpload, FaImage, FaTrash, FaEdit, FaPaperclip, FaFilePdf, FaChevronLeft, FaChevronRight, FaChartLine } from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from 'react-hot-toast';
import ModalConfirmacion from "../../components/ModalConfirmacion";
import { generarReporteCompras } from "../../utils/generarReporteCompras";
import { generarReporteGeneralCompras } from "../../utils/generarReporteGeneralCompras";

// PEGA AQUÍ LA URL DE TU GOOGLE APPS SCRIPT (WEB APP)
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxsopO2QCw09B2pPx4bj1UVF7Z9QMvUhEM9479vkLjVyRNvfuBkwKOsI7IAJt_uYXaRag/exec";

export default function ComprasList() {
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCompra, setSelectedCompra] = useState(null);
  const [modalStep, setModalStep] = useState('crear'); // crear, cotizar, aprobar, facturar
  const { user } = useAuth();

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Nuevos estados para la funcionalidad de cotización
  const [cotizacionesAprobadas, setCotizacionesAprobadas] = useState([]);
  const [cotizacionId, setCotizacionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // Estado para controlar el envío
  const [proveedores, setProveedores] = useState([]); // Estado para lista de proveedores

  // Form States
  const [items, setItems] = useState([{ nombre: '', descripcion: '', cantidad: 1, unidad: 'und', foto: '', precioUnitario: 0 }]);
  const [formData, setFormData] = useState({ nombreObra: '', asunto: '', prioridad: 'media', proveedorNombre: '', numeroFactura: '', montoFinal: '' });
  const [evaluacionComentario, setEvaluacionComentario] = useState('');
  const [archivosSolicitud, setArchivosSolicitud] = useState([]); // Estado para los archivos de requerimiento
  const [modalConfirmacion, setModalConfirmacion] = useState({
    show: false,
    title: "",
    message: "",
    confirmText: "Confirmar",
    isDestructive: true,
    action: null,
    data: null
  });

  // Estado para Reportes
  const [mostrarReportes, setMostrarReportes] = useState(false);
  const [filtrosReporte, setFiltrosReporte] = useState({
    inicio: new Date().toISOString().slice(0, 8) + '01', // Primer día del mes actual
    fin: new Date().toISOString().slice(0, 10) // Hoy
  });

  useEffect(() => {
    fetchCompras();
    fetchCotizacionesAprobadas();
    fetchProveedores();
  }, []);

  const fetchCompras = async () => {
    try {
      const res = await api.get("/compras"); // Asegúrate de crear esta ruta en backend
      setCompras(res.data);
    } catch (error) {
      console.error("Error cargando compras", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCotizacionesAprobadas = async () => {
    try {
      const res = await api.get("/cotizaciones/historial");
      const cotizacionesData = Array.isArray(res.data) ? res.data : res.data.cotizaciones || [];
      setCotizacionesAprobadas(cotizacionesData);
    } catch (error) {
      console.error("Error cargando compras", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProveedores = async () => {
    try {
      const res = await api.get("/proveedores");
      setProveedores(res.data);
    } catch (error) {
      console.error("Error cargando proveedores", error);
    }
  };

  // Reset page if out of bounds (e.g. after deletion)
  useEffect(() => {
    const maxPage = Math.ceil(compras.length / itemsPerPage);
    if (currentPage > maxPage && maxPage > 0) {
      setCurrentPage(maxPage);
    }
  }, [compras, currentPage]);

  // --- HANDLERS ---
  const handleOpenCrear = () => {
    setSelectedCompra(null);
    setModalStep('crear');
    setItems([{ nombre: '', descripcion: '', cantidad: 1, unidad: 'und', foto: '', precioUnitario: 0 }]);
    setFormData({ nombreObra: '', asunto: '', prioridad: 'media', proveedorNombre: '', numeroFactura: '', montoFinal: '' });
    setCotizacionId('');
    setArchivosSolicitud([]);
    setShowModal(true);
  };

  const handleOpenAction = (compra, step) => {
    setSelectedCompra(compra);
    setModalStep(step);
    setEvaluacionComentario('');
    setItems(compra.items.map(i => ({ ...i, nombre: i.nombre || '', unidad: i.unidad || 'und', foto: i.foto || '', precioUnitario: i.precioUnitario || 0 })));
    setFormData({ 
      nombreObra: compra.nombreObra,
      asunto: compra.asunto,
      prioridad: compra.prioridad,
      proveedorNombre: compra.proveedorNombre || '',
      proveedorId: compra.proveedor?._id || compra.proveedor || '',
      numeroFactura: '',
      montoFinal: compra.montoTotalEstimado || ''
    });
    setShowModal(true);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSelectCotizacion = (e) => {
    const selectedId = e.target.value;
    setCotizacionId(selectedId);

    if (!selectedId) {
      setFormData(prev => ({ ...prev, nombreObra: '', asunto: '' }));
      setItems([{ nombre: '', descripcion: '', cantidad: 1, unidad: 'und', foto: '', precioUnitario: 0 }]);
      return;
    }

    const cotizacion = cotizacionesAprobadas.find(c => c._id === selectedId);
    if (cotizacion) {
      setFormData(prev => ({
        ...prev,
        nombreObra: '', // Se deja vacío para que el usuario ingrese el nombre de la obra manualmente
        asunto: cotizacion.descripcionServicio || `Requerimiento de Cot. #${cotizacion.numeroCotizacion}`
      }));
      setItems(cotizacion.productos.map(p => ({
        nombre: p.descripcion,
        descripcion: `Item de cotización #${cotizacion.numeroCotizacion}`,
        cantidad: p.cantidad, unidad: p.unidad || 'und', foto: '', precioUnitario: p.precioUnitario || 0
      })));
    }
  };

  const handleItemPhotoUpload = async (index, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    const ext = file.name.split('.').pop();
    formData.append('foto', file, `req-item-${Date.now()}.${ext}`);

    try {
      const res = await api.post('/fotos', formData);
      const newItems = [...items];
      newItems[index].foto = res.data.foto;
      setItems(newItems);
    } catch (error) {
      console.error("Error upload:", error);
      toast.error("Error subiendo foto del item. Asegúrate de que sea una imagen válida.");
    }
  };

  const addItem = () => setItems([...items, { nombre: '', descripcion: '', cantidad: 1, unidad: 'und', foto: '', precioUnitario: 0 }]);
  const removeItem = (index) => setItems(items.filter((_, i) => i !== index));

  // Helper para convertir archivo a Base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const handleUploadFiles = async () => {
    const urls = [];
    for (const file of archivosSolicitud) {
      try {
        const base64 = await fileToBase64(file);
        const response = await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          // No enviamos headers explícitos. Al enviar un string, el navegador lo trata como text/plain automáticamente (Simple Request).
          body: JSON.stringify({ filename: file.name, mimeType: file.type, fileBase64: base64 })
        });
        const data = await response.json();
        if (data.status === 'success') urls.push(data.url);
      } catch (error) {
        console.error("Error subiendo a Drive:", error);
        toast.error(`Error al subir ${file.name}`);
      }
    }
    return urls;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // Evitar doble clic

    setIsSubmitting(true); // Activar estado de carga
    try {
      if (modalStep === 'crear') {
        // --- VALIDACIONES ---
        let archivoUrls = [];
        if (archivosSolicitud.length > 0) {
           const uploadedUrls = await handleUploadFiles();
           if (!uploadedUrls || uploadedUrls.length !== archivosSolicitud.length) {
             setIsSubmitting(false); // Desactivar carga si falla
             return; 
           }
           archivoUrls = uploadedUrls;
        }

        const hasItems = items && items.length > 0 && items.some(i => i.nombre.trim());
        
        if (!hasItems && archivoUrls.length === 0) {
          toast.error("Debes agregar al menos un ítem o subir un archivo con la lista.");
          setIsSubmitting(false);
          return;
        }

        if (hasItems && items.some(i => i.nombre && i.cantidad <= 0)) {
           toast.error("Los items deben tener cantidad mayor a 0.");
           setIsSubmitting(false);
           return;
        }

        // Preparamos el payload evitando enviar campos vacíos que puedan romper el backend
        const payload = { 
          ...formData, 
          items: hasItems ? items : [], 
          archivosSolicitudUrls: archivoUrls
        };
        if (cotizacionId) payload.cotizacion = cotizacionId;

        const res = await api.post('/compras/requerimiento', payload);
        setCompras(prev => [res.data, ...prev]); // Agregamos al inicio de la lista visualmente
        setCurrentPage(1); // Volver a la primera página para ver el nuevo item
        toast.success("Requerimiento creado. Se notificará al encargado de cotizar.");
      } else if (modalStep === 'cotizar') {
        const res = await api.put(`/compras/${selectedCompra._id}/cotizar`, { 
          items, 
          proveedorNombre: formData.proveedorNombre,
          proveedor: formData.proveedorId || null // Enviamos el ID del proveedor seleccionado
        });
        setCompras(prev => prev.map(c => c._id === res.data._id ? res.data : c)); // Actualizamos el item en la lista
        toast.success("Cotización registrada. Se notificará al aprobador.");
      } else if (modalStep === 'editar') {
        if (!items || items.length === 0) {
          toast.error("Debes tener al menos un ítem.");
          setIsSubmitting(false);
          return;
        }
        const res = await api.put(`/compras/${selectedCompra._id}`, { ...formData, items });
        setCompras(prev => prev.map(c => c._id === res.data._id ? res.data : c)); // Actualizamos el item en la lista
        toast.success("Requerimiento actualizado correctamente.");
      }
      setShowModal(false);
      // fetchCompras(); // YA NO ES NECESARIO RECARGAR TODO
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar");
    } finally {
      setIsSubmitting(false); // Desactivar carga al finalizar (éxito o error)
    }
  };

  const handleDelete = (id) => {
    setModalConfirmacion({
      show: true,
      title: "¿Eliminar requerimiento?",
      message: "¿Estás seguro de eliminar este requerimiento? Esta acción no se puede deshacer.",
      confirmText: "Sí, eliminar",
      isDestructive: true,
      action: 'eliminar',
      data: id
    });
  };

  const ejecutarEliminacion = async (id) => {
    try {
      await api.delete(`/compras/${id}`);
      setCompras(prev => prev.filter(c => c._id !== id)); // Eliminamos visualmente al instante
      toast.success("Requerimiento eliminado");
    } catch (error) {
      console.error(error);
      toast.error("Error al eliminar");
    }
  };

  const handleAprobar = (decision) => {
    if (decision === 'rechazado' && !evaluacionComentario.trim()) {
      toast.error("Por favor, ingrese una justificación en los comentarios para rechazar la solicitud.");
      return;
    }

    setModalConfirmacion({
      show: true,
      title: `¿${decision === 'aprobado' ? 'Aprobar' : 'Rechazar'} compra?`,
      message: `¿Seguro que deseas ${decision} esta compra?`,
      confirmText: decision === 'aprobado' ? "Sí, aprobar" : "Sí, rechazar",
      isDestructive: decision === 'rechazado',
      action: 'aprobar',
      data: decision
    });
  };

  const ejecutarAprobacion = async (decision) => {
    try {
      const res = await api.put(`/compras/${selectedCompra._id}/evaluar`, { decision, comentarios: evaluacionComentario || 'Evaluado por gerencia' });
      setCompras(prev => prev.map(c => c._id === res.data._id ? res.data : c)); // Actualizamos estado visualmente
      setShowModal(false);
      toast.success(`Compra ${decision === 'aprobado' ? 'aprobada' : 'rechazada'}. Se notificará al solicitante.`);
    } catch (error) {
      toast.error("Error al evaluar");
    }
  };

  const handleConfirmarAccion = () => {
    if (modalConfirmacion.action === 'eliminar') {
      ejecutarEliminacion(modalConfirmacion.data);
    } else if (modalConfirmacion.action === 'aprobar') {
      ejecutarAprobacion(modalConfirmacion.data);
    }
    setModalConfirmacion(prev => ({ ...prev, show: false }));
  };

  const handlePrint = (compra) => {
    generarReporteCompras(compra);
  };

  const handleGenerarReporteGlobal = () => {
    // Parsear fechas manualmente para respetar la zona horaria local y cubrir todo el día final
    const [anioIni, mesIni, diaIni] = filtrosReporte.inicio.split('-').map(Number);
    const inicio = new Date(anioIni, mesIni - 1, diaIni, 0, 0, 0, 0);

    const [anioFin, mesFin, diaFin] = filtrosReporte.fin.split('-').map(Number);
    const fin = new Date(anioFin, mesFin - 1, diaFin, 23, 59, 59, 999);

    const comprasFiltradas = compras.filter(c => {
      const fecha = new Date(c.createdAt);
      // Filtrar por fecha y solo compras aprobadas o compradas (gastos reales)
      return fecha >= inicio && fecha <= fin && ['aprobado', 'comprado'].includes(c.estado);
    });

    if (comprasFiltradas.length === 0) {
      toast.error("No se encontraron compras aprobadas en este rango de fechas.");
      return;
    }

    generarReporteGeneralCompras(comprasFiltradas, filtrosReporte.inicio, filtrosReporte.fin);
  };

  // --- RENDER ---
  const getStatusBadge = (estado) => {
    const styles = {
      pendiente: "bg-gray-100 text-gray-800",
      cotizado: "bg-blue-100 text-blue-800",
      aprobado: "bg-green-100 text-green-800",
      rechazado: "bg-red-100 text-red-800",
      comprado: "bg-purple-100 text-purple-800"
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${styles[estado] || styles.pendiente}`}>{estado}</span>;
  };

  // Lógica de Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = compras.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(compras.length / itemsPerPage);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FaShoppingCart /> Gestión de Compras
        </h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setMostrarReportes(!mostrarReportes)} 
            className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"
          >
            <FaChartLine /> Reportes
          </button>
          <button onClick={handleOpenCrear} className="w-full sm:w-auto bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-orange-700 transition-colors">
            <FaPlus /> Nuevo Requerimiento
          </button>
        </div>
      </div>

      {/* Panel de Reportes */}
      {mostrarReportes && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-green-200 mb-6 animate-fade-in-down">
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <FaChartLine className="text-green-600" /> Generar Reporte de Gastos (Aprobados)
          </h3>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="w-full sm:w-auto">
              <label className="block text-xs font-medium text-gray-600 mb-1">Fecha Inicio</label>
              <input type="date" value={filtrosReporte.inicio} onChange={e => setFiltrosReporte({...filtrosReporte, inicio: e.target.value})} className="border rounded p-2 text-sm w-full" />
            </div>
            <div className="w-full sm:w-auto">
              <label className="block text-xs font-medium text-gray-600 mb-1">Fecha Fin</label>
              <input type="date" value={filtrosReporte.fin} onChange={e => setFiltrosReporte({...filtrosReporte, fin: e.target.value})} className="border rounded p-2 text-sm w-full" />
            </div>
            <button onClick={handleGenerarReporteGlobal} className="bg-gray-800 text-white px-4 py-2 rounded text-sm hover:bg-gray-900 w-full sm:w-auto">
              Descargar PDF
            </button>
          </div>
        </div>
      )}

      {/* Vista Móvil: Tarjetas */}
      <div className="md:hidden space-y-4 mb-6">
        {currentItems.map((compra) => (
          <div key={compra._id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600 block w-fit mb-1">{compra.codigo}</span>
                <div className="text-xs text-gray-500">{new Date(compra.createdAt).toLocaleDateString()}</div>
              </div>
              {getStatusBadge(compra.estado)}
            </div>
            
            <div className="mb-4">
              <h3 className="font-bold text-gray-900 text-lg mb-1">{compra.nombreObra}</h3>
              <p className="text-sm text-gray-500">{compra.asunto}</p>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <span className="font-medium">Solicitante:</span> {compra.solicitante?.nombre}
              </p>
              {compra.archivosSolicitudUrls?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {compra.archivosSolicitudUrls.map((url, idx) => (
                    <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100 hover:bg-blue-100">
                      <FaPaperclip /> Archivo {idx + 1}
                    </a>
                  ))}
                </div>
              )}
              {compra.comentarios && (
                <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-100 italic">
                  <span className="font-semibold not-italic">Nota:</span> {compra.comentarios}
                </div>
              )}
              {['aprobado', 'comprado'].includes(compra.estado) && (
                <div className="mt-2 text-sm font-bold text-gray-800 bg-green-50 p-2 rounded border border-green-100">
                  Total: S/ {compra.items.reduce((acc, item) => acc + (item.cantidad * (item.precioUnitario || 0)), 0).toFixed(2)}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100">
               {compra.estado === 'pendiente' && (
                  <>
                    <button onClick={() => handleOpenAction(compra, 'cotizar')} className="col-span-2 bg-blue-50 text-blue-700 py-2 rounded-lg text-sm font-medium hover:bg-blue-100">
                      Cotizar
                    </button>
                    <button onClick={() => handleOpenAction(compra, 'editar')} className="flex items-center justify-center gap-1 bg-yellow-50 text-yellow-700 py-2 rounded-lg text-sm font-medium hover:bg-yellow-100">
                      <FaEdit /> Editar
                    </button>
                    <button onClick={() => handleDelete(compra._id)} className="flex items-center justify-center gap-1 bg-red-50 text-red-700 py-2 rounded-lg text-sm font-medium hover:bg-red-100">
                      <FaTrash /> Eliminar
                    </button>
                  </>
               )}
               {compra.estado === 'cotizado' && (
                  <button onClick={() => handleOpenAction(compra, 'aprobar')} className="col-span-2 bg-green-50 text-green-700 py-2 rounded-lg text-sm font-medium hover:bg-green-100">
                    Evaluar
                  </button>
               )}
               <button onClick={() => handlePrint(compra)} className="col-span-2 flex items-center justify-center gap-2 bg-gray-50 text-gray-600 py-2 rounded-lg text-sm font-medium hover:bg-gray-100">
                 <FaFilePdf /> Descargar PDF
               </button>
               <button onClick={() => handleOpenAction(compra, 'ver')} className={`col-span-2 flex items-center justify-center gap-2 bg-gray-50 text-gray-600 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 ${compra.estado !== 'pendiente' ? 'col-span-2' : ''}`}>
                 <FaEye /> Ver Detalles
               </button>
            </div>
          </div>
        ))}
        {currentItems.length === 0 && (
           <div className="text-center py-8 text-gray-500 bg-white rounded-lg border border-dashed">No hay compras registradas.</div>
        )}
      </div>

      {/* Vista Escritorio: Tabla */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Solicitante</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-48">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentItems.map((compra) => (
              <tr key={compra._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{compra.codigo}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <div className="font-bold text-gray-900">{compra.nombreObra}</div>
                  <div className="text-xs text-gray-600">{compra.asunto}</div>
                  {compra.archivosSolicitudUrls?.length > 0 && (
                    <div className="flex flex-col gap-1 mt-1">
                      {compra.archivosSolicitudUrls.map((url, idx) => (
                        <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                          <FaPaperclip size={10} /> Ver Archivo {idx + 1}
                        </a>
                      ))}
                    </div>
                  )}
                  <div className="text-xs">{new Date(compra.createdAt).toLocaleDateString()}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{compra.solicitante?.nombre}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(compra.estado)}
                  {['aprobado', 'comprado'].includes(compra.estado) && (
                    <div className="text-sm font-bold text-gray-700 mt-1">
                      S/ {compra.items.reduce((acc, item) => acc + (item.cantidad * (item.precioUnitario || 0)), 0).toFixed(2)}
                    </div>
                  )}
                  {compra.comentarios && (
                    <div className="text-xs text-gray-500 mt-1 max-w-[200px] truncate" title={compra.comentarios}>
                      {compra.comentarios}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {/* Lógica de Botones según Estado */}
                  {compra.estado === 'pendiente' && (
                    <button onClick={() => handleOpenAction(compra, 'cotizar')} className="text-blue-600 hover:text-blue-900 mr-3">Cotizar</button>
                  )}
                  {compra.estado === 'pendiente' && (
                    <button onClick={() => handleOpenAction(compra, 'editar')} className="text-yellow-600 hover:text-yellow-900 mr-3" title="Editar"><FaEdit /></button>
                  )}
                  {compra.estado === 'pendiente' && (
                    <button onClick={() => handleDelete(compra._id)} className="text-red-600 hover:text-red-900 mr-3" title="Eliminar"><FaTrash /></button>
                  )}
                  {compra.estado === 'cotizado' && (
                    <button onClick={() => handleOpenAction(compra, 'aprobar')} className="text-green-600 hover:text-green-900 mr-3">Evaluar</button>
                  )}
                  <button onClick={() => handlePrint(compra)} className="text-gray-500 hover:text-gray-700 mr-3" title="Descargar PDF"><FaFilePdf /></button>
                  <button onClick={() => handleOpenAction(compra, 'ver')} className="text-gray-400 hover:text-gray-600"><FaEye /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Controles de Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`p-2 rounded-md ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <FaChevronLeft />
          </button>
          
          <span className="text-sm text-gray-600">
            Página {currentPage} de {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`p-2 rounded-md ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <FaChevronRight />
          </button>
        </div>
      )}

      {/* MODAL DINÁMICO */}
      {showModal && (
        <Modal onClose={() => setShowModal(false)} className="max-w-4xl w-full">
          <div className="p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 capitalize">
              {modalStep === 'crear' ? 'Nuevo Requerimiento' : 
               modalStep === 'editar' ? 'Editar Requerimiento' :
               modalStep === 'cotizar' ? 'Registrar Cotización' : 
               modalStep === 'aprobar' ? 'Aprobar Compra' : 'Detalles de Compra'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campos para Crear y Editar */}
              {(modalStep === 'crear' || modalStep === 'editar') && (
                <div>
                  {modalStep === 'crear' && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700">Jalar datos de Cotización (Opcional)</label>
                      <select onChange={handleSelectCotizacion} value={cotizacionId} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                        <option value="">-- Ninguna --</option>
                        {cotizacionesAprobadas.map(c => (
                          <option key={c._id} value={c._id}>
                            #{c.numeroCotizacion} - {c.descripcionServicio}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Nombre de la Obra / Proyecto *</label>
                    <input type="text" value={formData.nombreObra} onChange={e => setFormData({...formData, nombreObra: e.target.value})} 
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required disabled={modalStep === 'ver'} />
                  </div>
                  <label className="block text-sm font-medium text-gray-700">Asunto de la Compra *</label>
                  <input type="text" value={formData.asunto} onChange={e => setFormData({...formData, asunto: e.target.value})} 
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required placeholder="Ej: Compra de materiales para instalación" disabled={modalStep === 'ver'} />
                  
                  {/* Input para subir archivo (PDF/Excel) */}
                  {modalStep === 'crear' && (
                    <div className="mt-4 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FaPaperclip className="inline mr-1" /> Adjuntar Archivos (PDF/Excel)
                      </label>
                      <input 
                        type="file" 
                        accept=".pdf,.xlsx,.xls,.doc,.docx"
                        multiple
                        onChange={(e) => {
                          if (e.target.files) setArchivosSolicitud(prev => [...prev, ...Array.from(e.target.files)]);
                        }}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {archivosSolicitud.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {archivosSolicitud.map((file, idx) => (
                            <li key={idx} className="text-xs text-gray-600 flex justify-between items-center bg-white p-1 rounded border">
                              <span>{file.name}</span>
                              <button type="button" onClick={() => setArchivosSolicitud(prev => prev.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700"><FaTimes /></button>
                            </li>
                          ))}
                        </ul>
                      )}
                      <p className="text-xs text-gray-500 mt-1">Si subes un archivo, no es obligatorio llenar la lista de items abajo.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Lista de Items */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Items Requeridos</h4>
                {items.map((item, idx) => (
                  <div key={idx} className="mb-4 p-4 border rounded-lg bg-white shadow-sm relative">
                    {/* Fila 1: Nombre y Descripción (Más amplio) */}
                    <div className="grid grid-cols-1 gap-4 mb-3">
                      <div>
                        <label className="text-xs font-bold text-gray-700">Nombre del Ítem</label>
                        <input type="text" value={item.nombre} onChange={e => handleItemChange(idx, 'nombre', e.target.value)} 
                          className="w-full border rounded p-2 text-sm mt-1" placeholder="Ej. Cemento Sol" disabled={modalStep !== 'crear' && modalStep !== 'editar'} />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-700">Descripción Detallada</label>
                        <textarea value={item.descripcion} onChange={e => handleItemChange(idx, 'descripcion', e.target.value)} 
                          className="w-full border rounded p-2 text-sm mt-1" placeholder="Ej. Tipo I, 42.5kg" rows={2} disabled={modalStep !== 'crear' && modalStep !== 'editar'} />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-4 items-end">
                      {/* Columna 2: Unidad */}
                      <div className="col-span-1 sm:w-24">
                        <label className="text-xs font-bold text-gray-700">Unidad</label>
                        <input type="text" value={item.unidad} onChange={e => handleItemChange(idx, 'unidad', e.target.value)} 
                          className="w-full border rounded p-2 text-sm mt-1" placeholder="und" disabled={modalStep !== 'crear' && modalStep !== 'editar'} />
                      </div>

                      {/* Columna 3: Cantidad */}
                      <div className="col-span-1 sm:w-20">
                        <label className="text-xs font-bold text-gray-700">Cant.</label>
                        <input type="number" value={item.cantidad} onChange={e => handleItemChange(idx, 'cantidad', e.target.value)} 
                          className="w-full border rounded p-2 text-sm mt-1" disabled={modalStep !== 'crear' && modalStep !== 'editar'} />
                      </div>

                      {/* Foto Opcional */}
                      <div className="col-span-2 sm:col-span-1 flex items-end gap-2">
                      {item.foto ? (
                        <div className="relative w-10 h-10 group flex-shrink-0">
                          <img src={item.foto} alt="Item" className="w-full h-full object-cover rounded border" />
                          {(modalStep === 'crear' || modalStep === 'editar') && (
                            <button type="button" onClick={() => handleItemChange(idx, 'foto', '')} 
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs shadow-sm z-10">
                              <FaTimes size={8} />
                            </button>
                          )}
                          <a href={item.foto} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all" />
                        </div>
                      ) : (
                        (modalStep === 'crear' || modalStep === 'editar') && (
                          <div className="relative flex-shrink-0">
                            <input type="file" id={`file-${idx}`} className="hidden" accept="image/*" onChange={(e) => handleItemPhotoUpload(idx, e)} />
                            <label htmlFor={`file-${idx}`} className="cursor-pointer flex items-center justify-center w-10 h-10 bg-gray-100 border border-dashed border-gray-400 rounded hover:bg-gray-200 text-gray-500" title="Subir foto">
                              <FaImage />
                            </label>
                          </div>
                        )
                      )}
                      </div>

                      {/* Precio solo visible en cotización en adelante */}
                      {modalStep !== 'crear' && (
                        <div className="col-span-1 sm:w-24">
                          <label className="text-xs font-bold text-gray-700">P. Unit.</label>
                          <input type="number" step="0.01" value={item.precioUnitario} onChange={e => handleItemChange(idx, 'precioUnitario', e.target.value)} 
                            className="w-full border rounded p-2 text-sm mt-1" disabled={modalStep !== 'cotizar'} />
                        </div>
                      )}

                      {/* Total por Ítem (Nuevo) */}
                      {modalStep !== 'crear' && (
                        <div className="col-span-1 sm:w-24">
                          <label className="text-xs font-bold text-gray-700">Total</label>
                          <div className="w-full border rounded p-2 text-sm mt-1 bg-gray-100 text-right font-medium text-gray-700">
                            {((item.cantidad || 0) * (item.precioUnitario || 0)).toFixed(2)}
                          </div>
                        </div>
                      )}

                      {(modalStep === 'crear' || modalStep === 'editar') && (
                        <button type="button" onClick={() => removeItem(idx)} className="col-span-2 sm:col-span-1 text-red-500 p-2 hover:bg-red-50 rounded mb-1 sm:ml-auto flex items-center justify-center w-full sm:w-auto"><FaTrash className="sm:hidden mr-2" /> <span className="sm:hidden">Eliminar Item</span> <FaTrash className="hidden sm:block" /></button>
                      )}
                    </div>
                  </div>
                ))}
                {(modalStep === 'crear' || modalStep === 'editar') && (
                  <button type="button" onClick={addItem} className="text-sm text-blue-600 mt-2">+ Agregar Item</button>
                )}
                {modalStep !== 'crear' && (
                  <div className="flex justify-end mt-4">
                    <div className="bg-gray-100 p-3 rounded-lg border border-gray-200">
                      <span className="text-gray-600 font-medium mr-2">
                        Total Estimado:
                      </span>
                      <span className="text-xl font-bold text-gray-800">
                        S/ {items.reduce((acc, i) => acc + (i.cantidad * (i.precioUnitario || 0)), 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Paso Cotización */}
              {modalStep === 'cotizar' && (
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Seleccionar Proveedor</label>
                  <select 
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2 mb-2"
                    value={formData.proveedorId || ''}
                    onChange={(e) => {
                      const selected = proveedores.find(p => p._id === e.target.value);
                      setFormData({ 
                        ...formData, 
                        proveedorId: e.target.value, 
                        proveedorNombre: selected ? selected.nombre : '' 
                      });
                    }}
                  >
                    <option value="">-- Seleccione o escriba abajo --</option>
                    {proveedores.map(p => <option key={p._id} value={p._id}>{p.nombre}</option>)}
                  </select>
                  <input type="text" value={formData.proveedorNombre} onChange={e => setFormData({...formData, proveedorNombre: e.target.value, proveedorId: ''})} 
                    className="block w-full border border-gray-300 rounded-md shadow-sm p-2" placeholder="Nombre del proveedor (si no está en lista)" required />
                </div>
              )}

              {/* Ver Detalles: Mostrar Comentarios si existen */}
              {modalStep === 'ver' && selectedCompra?.comentarios && (
                <div className="border-t pt-4 mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nota de Evaluación</label>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded border">{selectedCompra.comentarios}</p>
                </div>
              )}

              {/* Paso Aprobar: Comentarios */}
              {modalStep === 'aprobar' && (
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nota de Evaluación <span className="text-xs text-gray-500 font-normal">(Opcional para aprobar, obligatorio para rechazar)</span></label>
                  <textarea 
                    value={evaluacionComentario} 
                    onChange={e => setEvaluacionComentario(e.target.value)} 
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    rows={3} 
                    placeholder="Ingrese observaciones o motivos de la decisión..." />
                </div>
              )}

              {/* Botones de Acción */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="w-full sm:w-auto px-4 py-2 border rounded text-gray-600">Cerrar</button>
                
                {modalStep === 'crear' && <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed">{isSubmitting ? 'Creando...' : 'Crear Requerimiento'}</button>}
                {modalStep === 'editar' && <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed">{isSubmitting ? 'Guardando...' : 'Guardar Cambios'}</button>}
                {modalStep === 'cotizar' && <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">{isSubmitting ? 'Guardando...' : 'Guardar Cotización'}</button>}
                
                {modalStep === 'aprobar' && (
                  <>
                    <button type="button" onClick={() => handleAprobar('rechazado')} className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Rechazar</button>
                    <button type="button" onClick={() => handleAprobar('aprobado')} className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Aprobar</button>
                  </>
                )}
              </div>
            </form>
          </div>
        </Modal>
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
}
