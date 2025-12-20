import { useState, useEffect } from "react";
import api from "../../services/api";
import Modal from "../../components/Modal/Modal";
import { FaPlus, FaCheck, FaTimes, FaFileInvoiceDollar, FaSearch, FaShoppingCart, FaEye, FaUpload, FaImage, FaTrash, FaEdit } from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";

export default function ComprasList() {
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCompra, setSelectedCompra] = useState(null);
  const [modalStep, setModalStep] = useState('crear'); // crear, cotizar, aprobar, facturar
  const { user } = useAuth();

  // Form States
  const [items, setItems] = useState([{ nombre: '', descripcion: '', cantidad: 1, unidad: 'und', foto: '', precioUnitario: 0 }]);
  const [formData, setFormData] = useState({ titulo: '', prioridad: 'media', proveedorNombre: '', numeroFactura: '', montoFinal: '' });
  const [file, setFile] = useState(null);

  useEffect(() => {
    fetchCompras();
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

  // --- HANDLERS ---
  const handleOpenCrear = () => {
    setSelectedCompra(null);
    setModalStep('crear');
    setItems([{ nombre: '', descripcion: '', cantidad: 1, unidad: 'und', foto: '', precioUnitario: 0 }]);
    setFormData({ titulo: '', prioridad: 'media' });
    setShowModal(true);
  };

  const handleOpenAction = (compra, step) => {
    setSelectedCompra(compra);
    setModalStep(step);
    setItems(compra.items.map(i => ({ ...i, nombre: i.nombre || '', unidad: i.unidad || 'und', foto: i.foto || '', precioUnitario: i.precioUnitario || 0 })));
    setFormData({ 
      titulo: compra.titulo, 
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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      // Renombramos el archivo con prefijo 'compra' para activar la lógica del backend
      const ext = file.name.split('.').pop();
      formData.append('foto', file, `compra-doc-${Date.now()}.${ext}`);
      try {
        const res = await api.post('/fotos', formData);
        return res.data.foto;
      } catch (error) {
        console.error("Error upload:", error);
        alert("Error subiendo archivo. Asegúrate de que sea una imagen válida (JPG, PNG).");
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
        if (!items || items.length === 0) {
          return alert("Debes agregar al menos un ítem al requerimiento.");
        }
        const itemsInvalidos = items.some(i => !i.nombre.trim() || i.cantidad <= 0);
        if (itemsInvalidos) {
          return alert("Todos los items deben tener un nombre y una cantidad mayor a 0.");
        }
        await api.post('/compras/requerimiento', { ...formData, items });
      } else if (modalStep === 'cotizar') {
        await api.put(`/compras/${selectedCompra._id}/cotizar`, { 
          items, 
          proveedorNombre: formData.proveedorNombre
        });
      } else if (modalStep === 'editar') {
        // --- VALIDACIONES EDICIÓN ---
        if (!items || items.length === 0) return alert("Debes tener al menos un ítem.");
        await api.put(`/compras/${selectedCompra._id}`, { ...formData, items });
      }
      setShowModal(false);
      fetchCompras();
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
      fetchCompras();
      alert("Requerimiento eliminado");
    } catch (error) {
      console.error(error);
      alert("Error al eliminar");
    }
  };

  const handleAprobar = async (decision) => {
    if(!window.confirm(`¿Seguro que deseas ${decision} esta compra?`)) return;
    try {
      await api.put(`/compras/${selectedCompra._id}/evaluar`, { decision, comentarios: 'Evaluado por gerencia' });
      setShowModal(false);
      fetchCompras();
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
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FaShoppingCart /> Gestión de Compras
        </h2>
        <button onClick={handleOpenCrear} className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-700">
          <FaPlus /> Nuevo Requerimiento
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Solicitante</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {compras.map((compra) => (
              <tr key={compra._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{compra.codigo}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <div className="font-medium text-gray-900">{compra.titulo}</div>
                  <div className="text-xs">{new Date(compra.createdAt).toLocaleDateString()}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{compra.solicitante?.nombre}</td>
                <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(compra.estado)}</td>
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
              {/* Campos comunes */}
              {(modalStep === 'crear' || modalStep === 'ver' || modalStep === 'editar') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Título / Proyecto</label>
                  <input type="text" value={formData.titulo} onChange={e => setFormData({...formData, titulo: e.target.value})} 
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required disabled={modalStep !== 'crear' && modalStep !== 'editar'} />
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
                    
                    <div className="flex flex-wrap gap-4 items-end">
                      {/* Columna 2: Unidad */}
                      <div className="w-24">
                        <label className="text-xs font-bold text-gray-700">Unidad</label>
                        <input type="text" value={item.unidad} onChange={e => handleItemChange(idx, 'unidad', e.target.value)} 
                          className="w-full border rounded p-2 text-sm mt-1" placeholder="und" disabled={modalStep !== 'crear' && modalStep !== 'editar'} />
                      </div>

                      {/* Columna 3: Cantidad */}
                      <div className="w-20">
                        <label className="text-xs font-bold text-gray-700">Cant.</label>
                        <input type="number" value={item.cantidad} onChange={e => handleItemChange(idx, 'cantidad', e.target.value)} 
                          className="w-full border rounded p-2 text-sm mt-1" disabled={modalStep !== 'crear' && modalStep !== 'editar'} />
                      </div>

                      {/* Foto Opcional */}
                      <div className="flex items-end gap-2">
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
                        <div className="w-24">
                          <label className="text-xs font-bold text-gray-700">P. Unit.</label>
                          <input type="number" step="0.01" value={item.precioUnitario} onChange={e => handleItemChange(idx, 'precioUnitario', e.target.value)} 
                            className="w-full border rounded p-2 text-sm mt-1" disabled={modalStep !== 'cotizar'} />
                        </div>
                      )}

                      {/* Total por Ítem (Nuevo) */}
                      {modalStep !== 'crear' && (
                        <div className="w-24">
                          <label className="text-xs font-bold text-gray-700">Total</label>
                          <div className="w-full border rounded p-2 text-sm mt-1 bg-gray-100 text-right font-medium text-gray-700">
                            {((item.cantidad || 0) * (item.precioUnitario || 0)).toFixed(2)}
                          </div>
                        </div>
                      )}

                      {(modalStep === 'crear' || modalStep === 'editar') && (
                        <button type="button" onClick={() => removeItem(idx)} className="text-red-500 p-2 hover:bg-red-50 rounded mb-1 ml-auto"><FaTrash /></button>
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

              {/* Botones de Acción */}
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded text-gray-600">Cerrar</button>
                
                {modalStep === 'crear' && <button type="submit" className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700">Crear Requerimiento</button>}
                {modalStep === 'editar' && <button type="submit" className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700">Guardar Cambios</button>}
                {modalStep === 'cotizar' && <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Guardar Cotización</button>}
                
                {modalStep === 'aprobar' && (
                  <>
                    <button type="button" onClick={() => handleAprobar('rechazado')} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Rechazar</button>
                    <button type="button" onClick={() => handleAprobar('aprobado')} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Aprobar</button>
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
