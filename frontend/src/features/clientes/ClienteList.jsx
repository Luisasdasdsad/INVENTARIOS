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
  const [searchTerm, setSearchTerm] = useState("");

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

  const filteredClientes = clientes.filter((cliente) =>
    cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.nombreComercial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cliente.tipoDoc === "RUC"
      ? cliente.ruc
      : cliente.numero
    )?.includes(searchTerm)
  );

  const handleEdit = (cliente) => {
    setClienteEdit(cliente);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este cliente?")) {
      try {
        await api.delete(`/clientes/${id}`);
        setClientes(clientes.filter((c) => c._id !== id));
      } catch (err) {
        console.error("Error al eliminar cliente:", err);
      }
    }
  };

  const handleClienteCreado = (nuevoCliente) => {
    if (clienteEdit) {
      setClientes((prev) =>
        prev.map((c) => (c._id === nuevoCliente._id ? nuevoCliente : c))
      );
    } else {
      setClientes((prev) => [...prev, nuevoCliente]);
    }
    setShowForm(false);
    setClienteEdit(null);
  };

  if (loading)
    return (
      <div className="text-center p-6 text-gray-600 animate-pulse">
        Cargando clientes...
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
          Clientes
        </h2>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, RUC o número..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 w-full text-sm md:text-base"
            />
          </div>

          <button
            onClick={() => {
              setClienteEdit(null);
              setShowForm(true);
            }}
            className="flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-black font-medium px-4 py-2 rounded-lg shadow-sm transition-colors"
          >
            <FaPlus size={14} /> Nuevo Cliente
          </button>
        </div>
      </div>

      {/* Lista */}
      {filteredClientes.length === 0 ? (
        <div className="text-center py-10 text-gray-600 text-sm md:text-base bg-gray-50 rounded-lg">
          {searchTerm
            ? "No se encontraron clientes que coincidan con la búsqueda."
            : "No hay clientes registrados aún."}
        </div>
      ) : (
        <div className="space-y-3 md:space-y-4">
          {/* Móvil - Tarjetas */}
          <div className="md:hidden space-y-3">
            {filteredClientes.map((cliente) => (
              <div
                key={cliente._id}
                className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition"
              >
                <h3 className="text-base font-bold text-gray-900 mb-2">
                  {cliente.nombre}
                </h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <span className="font-semibold">Tipo Doc:</span>{" "}
                    {cliente.tipoDoc}
                  </p>
                  <p>
                    <span className="font-semibold">Número:</span>{" "}
                    {cliente.tipoDoc === "RUC"
                      ? cliente.ruc
                      : cliente.numero}
                  </p>
                  <p>
                    <span className="font-semibold">Dirección:</span>{" "}
                    {cliente.direccion || "No especificada"}
                  </p>
                  <p>
                    <span className="font-semibold">Teléfono:</span>{" "}
                    {cliente.telefono || "No disponible"}
                  </p>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => handleEdit(cliente)}
                    className="flex-1 bg-yellow-500 text-black py-2 rounded-md hover:bg-yellow-600 text-xs font-medium"
                  >
                    <FaEdit className="inline-block mr-1" /> Editar
                  </button>
                  <button
                    onClick={() => handleDelete(cliente._id)}
                    className="flex-1 bg-red-600 text-white py-2 rounded-md hover:bg-red-700 text-xs font-medium"
                  >
                    <FaTrash className="inline-block mr-1" /> Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Escritorio - Tabla */}
          <div className="hidden md:block">
            <div className="overflow-x-auto bg-white shadow-sm rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-yellow-100 text-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Nombre</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Tipo Doc</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Número</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Dirección</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Teléfono</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredClientes.map((cliente) => (
                    <tr
                      key={cliente._id}
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {cliente.nombre}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {cliente.tipoDoc}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {cliente.tipoDoc === "RUC" ? cliente.ruc : cliente.numero}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {cliente.direccion || "No especificada"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {cliente.telefono || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm space-x-2">
                        <button
                          onClick={() => handleEdit(cliente)}
                          className="text-yellow-600 hover:text-yellow-700 font-medium text-xs"
                        >
                          <FaEdit className="inline-block mr-1" /> Editar
                        </button>
                        <button
                          onClick={() => handleDelete(cliente._id)}
                          className="text-red-600 hover:text-red-700 font-medium text-xs"
                        >
                          <FaTrash className="inline-block mr-1" /> Eliminar
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

      {showForm && (
        <Modal
          title={clienteEdit ? "Editar Cliente" : "Nuevo Cliente"}
          onClose={() => {
            setShowForm(false);
            setClienteEdit(null);
          }}
        >
          <ClienteForm
            clienteEdit={clienteEdit}
            onClienteCreado={handleClienteCreado}
            onClose={() => setShowForm(false)}
          />
        </Modal>
      )}
    </div>
  );
};

export default ClienteList;
