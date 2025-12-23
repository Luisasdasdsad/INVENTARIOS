import { useState, useEffect } from "react";
import api from "../../services/api";
import Modal from "../../components/Modal/Modal";
import { FaPlus, FaCheck, FaTimes, FaFileInvoiceDollar, FaSearch, FaShoppingCart, FaEye, FaUpload, FaImage, FaTrash, FaEdit, FaPaperclip } from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";

export default function ComprasList() {
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCompra, setSelectedCompra] = useState(null);
  const [modalStep, setModalStep] = useState('crear'); // crear, cotizar, aprobar, facturar
  const { user } = useAuth();

  // Nuevos estados para la funcionalidad de cotización
  const [cotizacionesAprobadas, setCotizacionesAprobadas] = useState([]);
  const [cotizacionId, setCotizacionId] = useState('');

  // Form States
  const [items, setItems] = useState([{ nombre: '', descripcion: '', cantidad: 1, unidad: 'und', foto: '', precioUnitario: 0 }]);
  const [formData, setFormData] = useState({ nombreObra: '', asunto: '', prioridad: 'media', proveedorNombre: '', numeroFactura: '', montoFinal: '' });
  const [evaluacionComentario, setEvaluacionComentario] = useState('');
  const [archivoSolicitud, setArchivoSolicitud] = useState(null); // Estado para el archivo de requerimiento

  useEffect(() => {
    fetchCompras();
    fetchCotizacionesAprobadas();
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
      setCotizacionesAprobadas(cotizacionesData.filter(c => c.estado === 'Aceptada'));
    } catch (error) {
      console.error("Error cargando compras", error);
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS ---
  const handleOpenCrear = () => {
    setSelectedCompra(null);
    setModalStep('crear');
    setItems([{ nombre: '', descripcion: '', cantidad: 1, unidad: 'und', foto: '', precioUnitario: 0 }]);
    setFormData({ nombreObra: '', asunto: '', prioridad: 'media' });
    setCotizacionId('');
    setArchivoSolicitud(null);
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
        nombreObra: cotizacion.descripcionServicio || `Proyecto de Cot. #${cotizacion.numeroCotizacion}`,
        asunto: ''
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
      alert("Error subiendo foto del item. Asegúrate de que sea una imagen válida.");
    }
  };

  const addItem = () => setItems([...items, { nombre: '', descripcion: '', cantidad: 1, unidad: 'und', foto: '', precioUnitario: 0 }]);
  const removeItem = (index) => setItems(items.filter((_, i) => i !== index));

  const handleFileUpload = async (fileToUpload) => {
    const file = fileToUpload;
    if (file) {
      const formData = new FormData();
      // Renombramos el archivo con prefijo 'compra' para activar la lógica del backend
      const ext = file.name.split('.').pop();
      formData.append('archivo', file, `req-doc-${Date.now()}.${ext}`);
      try {
        const res = await api.post('/upload/drive', formData);
        return res.data.url;
      } catch (error) {
        console.error("Error upload:", error);
        // Mostrar el mensaje exacto que devuelve el backend (ej: API no habilitada)
        const errorMsg = error.response?.data?.error || error.response?.data?.msg || "Error subiendo archivo a Drive.";
        alert(`Error: ${errorMsg}`);
        return null;
      }
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalStep === 'crear') {
        // --- VALIDACIONES ---
        let archivoUrl = '';
        if (archivoSolicitud) {
           archivoUrl = await handleFileUpload(archivoSolicitud);
           if (!archivoUrl) return; // Error en subida
        }

        const hasItems = items && items.length > 0 && items.some(i => i.nombre.trim());
        
        if (!hasItems && !archivoUrl) {
          return alert("Debes agregar al menos un ítem o subir un archivo con la lista.");
        }

        if (hasItems && items.some(i => i.nombre && i.cantidad <= 0)) {
           return alert("Los items deben tener cantidad mayor a 0.");
        }

        // Preparamos el payload evitando enviar campos vacíos que puedan romper el backend
        const payload = { ...formData, items: hasItems ? items : [], archivoSolicitudUrl: archivoUrl };
        if (cotizacionId) payload.cotizacion = cotizacionId;

        const res = await api.post('/compras/requerimiento', payload);
        setCompras(prev => [res.data, ...prev]); // Agregamos al inicio de la lista visualmente
      } else if (modalStep === 'cotizar') {
        const res = await api.put(`/compras/${selectedCompra._id}/cotizar`, { 
          items, 
          proveedorNombre: formData.proveedorNombre
        });
        setCompras(prev => prev.map(c => c._id === res.data._id ? res.data : c)); // Actualizamos el item en la lista
      } else if (modalStep === 'editar') {
        if (!items || items.length === 0) return alert("Debes tener al menos un ítem.");
        const res = await api.put(`/compras/${selectedCompra._id}`, { ...formData, items });
        setCompras(prev => prev.map(c => c._id === res.data._id ? res.data : c)); // Actualizamos el item en la lista
      }
      setShowModal(false);
      // fetchCompras(); // YA NO ES NECESARIO RECARGAR TODO
      alert("Proceso guardado exitosamente");
    } catch (error) {
      console.error(error);
      alert("Error al guardar");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este requerimiento? Esta acción no se puede deshacer.")) return;
    try {
      await api.delete(`/compras/${id}`);
      setCompras(prev => prev.filter(c => c._id !== id)); // Eliminamos visualmente al instante
      alert("Requerimiento eliminado");
    } catch (error) {
      console.error(error);
      alert("Error al eliminar");
    }
  };

  const handleAprobar = async (decision) => {
    if (decision === 'rechazado' && !evaluacionComentario.trim()) {
      return alert("Por favor, ingrese una justificación en los comentarios para rechazar la solicitud.");
    }

    if(!window.confirm(`¿Seguro que deseas ${decision} esta compra?`)) return;
    try {
      const res = await api.put(`/compras/${selectedCompra._id}/evaluar`, { decision, comentarios: evaluacionComentario || 'Evaluado por gerencia' });
      setCompras(prev => prev.map(c => c._id === res.data._id ? res.data : c)); // Actualizamos estado visualmente
      setShowModal(false);
    } catch (error) {
      alert("Error al evaluar");
    }
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

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FaShoppingCart /> Gestión de Compras
        </h2>
        <button onClick={handleOpenCrear} className="w-full sm:w-auto bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-orange-700">
          <FaPlus /> Nuevo Requerimiento
        </button>
      </div>

      {/* Vista Móvil: Tarjetas */}
      <div className="md:hidden space-y-4 mb-6">
        {compras.map((compra) => (
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
              {compra.archivoSolicitudUrl && (
                <a href={compra.archivoSolicitudUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100 hover:bg-blue-100">
                  <FaPaperclip /> Ver Archivo Adjunto
                </a>
              )}
              {compra.comentarios && (
                <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-100 italic">
                  <span className="font-semibold not-italic">Nota:</span> {compra.comentarios}
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
               <button onClick={() => handleOpenAction(compra, 'ver')} className={`col-span-2 flex items-center justify-center gap-2 bg-gray-50 text-gray-600 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 ${compra.estado !== 'pendiente' ? 'col-span-2' : ''}`}>
                 <FaEye /> Ver Detalles
               </button>
            </div>
          </div>
        ))}
        {compras.length === 0 && (
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
            {compras.map((compra) => (
              <tr key={compra._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{compra.codigo}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <div className="font-bold text-gray-900">{compra.nombreObra}</div>
                  <div className="text-xs text-gray-600">{compra.asunto}</div>
                  {compra.archivoSolicitudUrl && (
                    <a href={compra.archivoSolicitudUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1">
                      <FaPaperclip size={10} /> Ver Archivo
                    </a>
                  )}
                  <div className="text-xs">{new Date(compra.createdAt).toLocaleDateString()}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{compra.solicitante?.nombre}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(compra.estado)}
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
                  <button onClick={() => handleOpenAction(compra, 'ver')} className="text-gray-400 hover:text-gray-600"><FaEye /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
                        <FaPaperclip className="inline mr-1" /> Adjuntar Lista de Pedido (PDF/Excel)
                      </label>
                      <input 
                        type="file" 
                        accept=".pdf,.xlsx,.xls,.doc,.docx"
                        onChange={(e) => setArchivoSolicitud(e.target.files[0])}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
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
                  <label className="block text-sm font-medium text-gray-700">Nombre del Proveedor</label>
                  <input type="text" value={formData.proveedorNombre} onChange={e => setFormData({...formData, proveedorNombre: e.target.value})} 
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
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
                
                {modalStep === 'crear' && <button type="submit" className="w-full sm:w-auto px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700">Crear Requerimiento</button>}
                {modalStep === 'editar' && <button type="submit" className="w-full sm:w-auto px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700">Guardar Cambios</button>}
                {modalStep === 'cotizar' && <button type="submit" className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Guardar Cotización</button>}
                
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
    </div>
  );
}
