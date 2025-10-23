import { useState, useEffect } from "react";
import api from "../../services/api";
import ClienteForm from "./ClienteForm";
import Modal from "../../components/Modal/Modal";
import { FaEdit, FaTrash, FaPlus, FaSearch } from "react-icons/fa";

const ClienteList = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [clienteEdit, setClienteEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/clientes");
      setClientes(res.data);
    } catch (err) {
      setError("Error al cargar clientes");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredClientes = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.nombreComercial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cliente.tipoDoc === "RUC" ? cliente.ruc : cliente.numero)?.includes(searchTerm)
  );

  const handleClienteCreado = (nuevoCliente) => {
    if (clienteEdit) {
      setClientes(clientes.map(c => c._id === nuevoCliente._id ? nuevoCliente : c));
    } else {
      setClientes([...clientes, nuevoCliente]);
    }
    setShowForm(false);
    setClienteEdit(null);
  };

  const handleEdit = (cliente) => {
    setClienteEdit(cliente);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este cliente?")) {
      try {
        await api.delete(`/clientes/${id}`);
        setClientes(clientes.filter(c => c._id !== id));
      } catch (err) {
        console.error("Error al eliminar cliente:", err);
      }
    }
  };

  if (loading) return <div className="text-center p-4 md:p-8 text-gray-600">Cargando clientes...</div>;
  if (error) return <div className="text-center p-4 md:p-8 text-red-500 bg-red-50 rounded-md m-2 md:m-4">Error: {error}</div>;

  return (
    <div className="p-2 md:p-4 lg:p-6 max-w-7xl w-full mx-auto">
      {/* Header Mejorado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-800 whitespace-nowrap">Clientes</h2>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Buscar por nombre o documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-sm md:text-base"
              />
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-md hover:bg-blue-700 transition-colors min-h-[44px] w-full sm:w-auto text-xs md:text-sm"
        >
          <FaPlus size={14} /> Nuevo Cliente
        </button>
      </div>

      {filteredClientes.length === 0 ? (
        <div className="text-center py-8 md:py-12 text-gray-600 text-sm md:text-base">
          {searchTerm ? 'No hay clientes que coincidan con la búsqueda.' : 'No hay clientes registrados.'}
        </div>
      ) : (
        <div className="space-y-3 md:space-y-4">
          {/* Mobile: Cards Mejoradas */}
          <div className="md:hidden space-y-3">
            {filteredClientes.map((cliente) => (
              <div key={cliente._id} className="bg-white p-3 rounded-lg shadow-sm border divide-y divide-gray-200">
                <div className="space-y-2 mb-3">
                  <h3 className="text-base font-semibold text-gray-900">{cliente.nombre}</h3>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p><span className="font-medium">Tipo Doc:</span> {cliente.tipoDoc}</p>
                    <p><span className="font-medium">Documento:</span> {cliente.tipoDoc === "RUC" ? cliente.ruc : cliente.numero}</p>
                    <p><span className="font-medium">Nombre Comercial:</span> {cliente.nombreComercial || '-'}</p>
                    <p><span className="font-medium">Teléfono:</span> {cliente.telefono || '-'}</p>
                    <p><span className="font-medium">Email:</span> {cliente.email || '-'}</p>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-2 pt-3">
                  <button
                    onClick={() => handleEdit(cliente)}
                    className="flex-1 flex items-center justify-center gap-1 bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 text-xs min-h-[40px]"
                  >
                    <FaEdit size={12} /> Editar
                  </button>
                  <button
                    onClick={() => handleDelete(cliente._id)}
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo Doc</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documento</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre Comercial</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredClientes.map((cliente) => (
                    <tr key={cliente._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{cliente.tipoDoc}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-900">
                        {cliente.tipoDoc === "RUC" ? cliente.ruc : cliente.numero}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{cliente.nombre}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{cliente.nombreComercial || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{cliente.telefono || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{cliente.email || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEdit(cliente)}
                          className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1 text-xs"
                        >
                          <FaEdit size={10} /> Editar
                        </button>
                        <button
                          onClick={() => handleDelete(cliente._id)}
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
      {showForm && (
        <Modal onClose={() => { setShowForm(false); setClienteEdit(null); }}>
          <div className="max-h-[90vh] overflow-y-auto p-4 md:p-0">
            <ClienteForm
              onClienteCreado={handleClienteCreado}
              onClose={() => { setShowForm(false); setClienteEdit(null); }}
              clienteEdit={clienteEdit}
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ClienteList;
