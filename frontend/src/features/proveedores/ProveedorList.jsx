import { useState, useEffect } from "react";
import api from "../../services/api";
import { FaSearch, FaPlus, FaEdit, FaTrash, FaWhatsapp, FaFileExcel } from "react-icons/fa";
import Modal from "../../components/Modal/Modal";
import ProveedorForm from "./ProveedorForm";
import * as XLSX from 'xlsx'; // 1. Importar la librería para Excel
import { toast } from 'react-hot-toast';

// --- Componente Principal de la Lista de Proveedores ---
const ProveedorList = () => {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState(null);

  const fetchProveedores = async () => {
    try {
      setLoading(true);
      const res = await api.get("/proveedores"); // Llama a la ruta del backend
      setProveedores(res.data);
    } catch (err) {
      setError("Error al cargar los proveedores.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProveedores();
  }, []);

  const handleEdit = (proveedor) => {
    setEditingProveedor(proveedor);
    setShowForm(true);
  };
  
  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProveedor(null);
  };

  const handleSaveProveedor = async (proveedorData) => {
    // --- INICIO DE LA CORRECCIÓN ---
    // Creamos una copia "limpia" de los datos para evitar enviar campos extra (_id, createdAt, etc.)
    const dataToSend = {
      nombre: proveedorData.nombre,
      categoria: proveedorData.categoria,
      // Si los campos opcionales están vacíos, los enviamos como null
      ruc: proveedorData.ruc || null,
      direccion: proveedorData.direccion || null,
      telefono: proveedorData.telefono || null,
      email: proveedorData.email || null,
      descripcion: proveedorData.descripcion || null,
    };
    try {
      if (editingProveedor) {
        await api.put(`/proveedores/${editingProveedor._id}`, dataToSend);
        toast.success("Proveedor actualizado con éxito");
      } else {
        await api.post("/proveedores", dataToSend);
        toast.success("Proveedor creado con éxito");
      }
      fetchProveedores(); // Recargar la lista
      handleCloseForm();
    } catch (error) {
      console.error("Error al guardar el proveedor:", error);
      toast.error(`No se pudo guardar el proveedor: ${error.response?.data?.msg || error.message}`);
    }
    // --- FIN DE LA CORRECCIÓN ---
  };

  const handleDeleteProveedor = async (proveedorId) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este proveedor?")) {
      try {
        await api.delete(`/proveedores/${proveedorId}`);
        toast.success("Proveedor eliminado con éxito");
        fetchProveedores(); // Recargar la lista
      } catch (error) {
        console.error("Error al eliminar el proveedor:", error);
        toast.error("No se pudo eliminar el proveedor.");
      }
    }
  };

  const filteredProveedores = proveedores.filter((p) =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.ruc?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 2. Función para manejar la exportación a Excel
  const handleExportExcel = () => {
    // Formatear los datos para que coincidan con las columnas deseadas
    const dataToExport = filteredProveedores.map(proveedor => ({
      'Nombre o Razón Social': proveedor.nombre,
      'RUC': proveedor.ruc || '-',
      'Categoría': proveedor.categoria,
      'Dirección': proveedor.direccion || '-',
      // Unir el array de teléfonos en una sola celda, separados por coma
      'Teléfonos': Array.isArray(proveedor.telefono) ? proveedor.telefono.join(', ') : '-',
      'Email': proveedor.email || '-',
      'Descripción': proveedor.descripcion || '-'
    }));

    // Crear una hoja de cálculo a partir de los datos JSON
    const ws = XLSX.utils.json_to_sheet(dataToExport);

    // Crear un nuevo libro de trabajo
    const wb = XLSX.utils.book_new();

    // Añadir la hoja de cálculo al libro de trabajo
    XLSX.utils.book_append_sheet(wb, ws, "Proveedores");

    // Descargar el archivo Excel
    XLSX.writeFile(wb, "Lista_Proveedores.xlsx");
  };

  if (loading) return <div className="text-center p-6">Cargando proveedores...</div>;
  if (error) return <div className="text-center p-6 bg-red-100 text-red-700">{error}</div>;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {showForm && (
        <Modal
          title={editingProveedor ? "Editar Proveedor" : "Nuevo Proveedor"}
          onClose={handleCloseForm}
        >
          <ProveedorForm
            onSave={handleSaveProveedor}
            proveedor={editingProveedor}
            onClose={handleCloseForm}
          />
        </Modal>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-secondary-800">Proveedores</h2>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0 w-full sm:w-64 md:w-72">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o RUC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-3 py-2 border rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>
          {/* 3. Botón para exportar */}
          <button onClick={handleExportExcel} className="flex-1 sm:flex-none justify-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm font-semibold min-h-[40px]">
            <FaFileExcel /> Exportar
          </button>
          <button onClick={() => { setEditingProveedor(null); setShowForm(true); }} className="flex-1 sm:flex-none justify-center bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2 text-sm font-semibold min-h-[40px]">
            <FaPlus /> Nuevo
          </button>
        </div>
      </div>

      {/* Vista Móvil: Tarjetas */}
      <div className="md:hidden space-y-4">
        {filteredProveedores.length > 0 ? (
          filteredProveedores.map((proveedor) => (
            <div key={proveedor._id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-base font-bold text-gray-900">{proveedor.nombre}</h3>
                <span className="px-2 py-1 text-xs font-semibold bg-teal-100 text-teal-800 rounded-full">{proveedor.categoria}</span>
              </div>
              
              <div className="text-sm text-gray-600 space-y-1">
                {proveedor.ruc && <p><span className="font-semibold">RUC:</span> {proveedor.ruc}</p>}
                {proveedor.direccion && <p><span className="font-semibold">Dirección:</span> {proveedor.direccion}</p>}
                {proveedor.email && <p><span className="font-semibold">Email:</span> {proveedor.email}</p>}
                {proveedor.descripcion && <p className="text-xs italic mt-1 bg-gray-50 p-2 rounded">{proveedor.descripcion}</p>}
                
                {/* Teléfonos */}
                {Array.isArray(proveedor.telefono) && proveedor.telefono.length > 0 && (
                   <div className="flex flex-wrap gap-2 mt-2">
                     {proveedor.telefono.map((tel, index) => (
                       <a key={index} href={`https://wa.me/${tel.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-medium border border-green-100">
                         <FaWhatsapp /> {tel}
                       </a>
                     ))}
                   </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 mt-2 border-t border-gray-100">
                <button onClick={() => handleEdit(proveedor)} className="flex-1 flex items-center justify-center gap-1 bg-blue-50 text-blue-600 py-2 rounded-md hover:bg-blue-100 text-sm font-medium">
                  <FaEdit /> Editar
                </button>
                <button onClick={() => handleDeleteProveedor(proveedor._id)} className="flex-1 flex items-center justify-center gap-1 bg-red-50 text-red-600 py-2 rounded-md hover:bg-red-100 text-sm font-medium">
                  <FaTrash /> Eliminar
                </button>
              </div>
            </div>
          ))
        ) : (
           <div className="text-center py-12 text-secondary-600 bg-gray-50 rounded-lg border border-dashed">No se encontraron proveedores.</div>
        )}
      </div>

      {/* Vista Escritorio: Tabla */}
      <div className="hidden md:block overflow-x-auto bg-white shadow-soft rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-secondary-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Nombre</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Descripción</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Categoría</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Dirección</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Teléfono</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProveedores.length > 0 ? (
              filteredProveedores.map((proveedor) => (
                <tr key={proveedor._id} className="hover:bg-blue-50">
                  <td className="px-4 py-3 text-sm font-medium text-secondary-900">{proveedor.nombre}</td>
                  <td className="px-4 py-3 text-sm text-secondary-600 max-w-xs whitespace-normal" title={proveedor.descripcion}>{proveedor.descripcion || '-'}</td>
                  <td className="px-4 py-3 text-sm"><span className="px-2 py-1 text-xs font-semibold bg-teal-100 text-teal-800 rounded-full">{proveedor.categoria}</span></td>
                  <td className="px-4 py-3 text-sm">{proveedor.direccion || '-'}</td>
                  <td className="px-4 py-3 text-sm">
                    {Array.isArray(proveedor.telefono) && proveedor.telefono.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {proveedor.telefono.map((tel, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <span>{tel}</span>
                            <a href={`https://wa.me/${tel.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:text-green-700" title={`Enviar WhatsApp a ${tel}`}>
                              <FaWhatsapp />
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm flex items-center justify-center gap-4">
                    <button onClick={() => handleEdit(proveedor)} className="text-blue-600 hover:text-blue-800" title="Editar"><FaEdit /></button>
                    <button onClick={() => handleDeleteProveedor(proveedor._id)} className="text-red-600 hover:text-red-800" title="Eliminar"><FaTrash /></button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="text-center py-12 text-secondary-600">No se encontraron proveedores.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProveedorList;