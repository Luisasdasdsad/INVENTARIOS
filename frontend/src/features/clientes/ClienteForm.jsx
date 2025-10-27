import { useState } from "react";
import api from "../../services/api";

const ClienteForm = ({ onClienteCreado, onClose, clienteEdit }) => {
  const [cliente, setCliente] = useState(clienteEdit || {
    tipoDoc: "",
    ruc: "",
    numero: "",
    nombre: "",
    nombreComercial: "",
    pais: "PERU",
    ubigeo: "",
    direccion: "",
    referencia: "",
    telefono: "",
    email: "",
    contacto: "",
    nombreApellido: "",
    sitioWeb: "",
    observaciones: "",
  });
  const [activeTab, setActiveTab] = useState("datos");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCliente({ ...cliente, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = clienteEdit
        ? await api.put(`/clientes/${cliente._id}`, cliente)
        : await api.post("/clientes", cliente);
      if (onClienteCreado) onClienteCreado(res.data);
      onClose();
    } catch (error) {
      console.error("Error al guardar cliente:", error);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow w-full max-w-2xl">
      <h2 className="text-lg font-bold mb-3">{clienteEdit ? "Editar Cliente" : "Nuevo Cliente"}</h2>

      {/* Tabs */}
      <div className="flex border-b mb-4">
        <button
          className={`px-4 py-2 ${activeTab === "datos" ? "border-b-2 border-blue-500" : ""}`}
          onClick={() => setActiveTab("datos")}
        >
          Datos del Cliente
        </button>
        <button
          className={`px-4 py-2 ${activeTab === "direccion" ? "border-b-2 border-blue-500" : ""}`}
          onClick={() => setActiveTab("direccion")}
        >
          Dirección
        </button>
        <button
          className={`px-4 py-2 ${activeTab === "otros" ? "border-b-2 border-blue-500" : ""}`}
          onClick={() => setActiveTab("otros")}
        >
          Otros Datos
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {activeTab === "datos" && (
          <div>
            <div className="mb-2">
              <label>Tipo Doc. Identidad *</label>
              <select
                name="tipoDoc"
                className="border p-2 w-full rounded"
                value={cliente.tipoDoc}
                onChange={handleChange}
                required
              >
                <option value="">Seleccionar</option>
                <option value="DNI">DNI</option>
                <option value="RUC">RUC</option>
                <option value="CE">CE</option>
              </select>
            </div>
            {cliente.tipoDoc === "RUC" && (
              <div className="mb-2">
                <label>RUC *</label>
                <input
                  type="text"
                  name="ruc"
                  className="border p-2 w-full rounded"
                  value={cliente.ruc}
                  onChange={handleChange}
                  maxLength="11"
                  pattern="^\d{11}$"
                  required
                  title="El RUC debe tener exactamente 11 dígitos numéricos."
                />
              </div>
            )}
            {(cliente.tipoDoc === "DNI" || cliente.tipoDoc === "CE") && (
              <div className="mb-2">
                <label>Número *</label>
                <input
                  type="text"
                  name="numero"
                  className="border p-2 w-full rounded"
                  value={cliente.numero}
                  onChange={handleChange}
                  maxLength={cliente.tipoDoc === "DNI" ? "8" : "20"}
                  pattern={cliente.tipoDoc === "DNI" ? "^\\d{8}$" : "^\\d{1,20}$"}
                  required
                  title={cliente.tipoDoc === "DNI" ? "El DNI debe tener exactamente 8 dígitos numéricos." : "El CE debe tener entre 1 y 20 dígitos numéricos."}
                />
              </div>
            )}
            <div className="mb-2">
              <label>Nombre *</label>
              <input
                type="text"
                name="nombre"
                className="border p-2 w-full rounded"
                value={cliente.nombre}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-2">
              <label>Nombre comercial</label>
              <input
                type="text"
                name="nombreComercial"
                className="border p-2 w-full rounded"
                value={cliente.nombreComercial}
                onChange={handleChange}
              />
            </div>
          </div>
        )}

        {activeTab === "direccion" && (
          <div>
            <div className="mb-2">
              <label>País</label>
              <input
                type="text"
                name="pais"
                className="border p-2 w-full rounded"
                value={cliente.pais}
                onChange={handleChange}
              />
            </div>
            <div className="mb-2">
              <label>Ubigeo</label>
              <input
                type="text"
                name="ubigeo"
                className="border p-2 w-full rounded"
                value={cliente.ubigeo}
                onChange={handleChange}
              />
            </div>
            <div className="mb-2">
              <label>Dirección</label>
              <input
                type="text"
                name="direccion"
                className="border p-2 w-full rounded"
                value={cliente.direccion}
                onChange={handleChange}
              />
            </div>
            <div className="mb-2">
              <label>Referencia</label>
              <input
                type="text"
                name="referencia"
                className="border p-2 w-full rounded"
                value={cliente.referencia}
                onChange={handleChange}
              />
            </div>
            <div className="mb-2">
              <label>Teléfono</label>
              <input
                type="text"
                name="telefono"
                className="border p-2 w-full rounded"
                value={cliente.telefono}
                onChange={handleChange}
                maxLength="9"
                pattern="^\d{9}$"
                title="El teléfono debe tener exactamente 9 dígitos numéricos."
              />
            </div>
            <div className="mb-2">
              <label>Correo electrónico</label>
              <input
                type="email"
                name="email"
                className="border p-2 w-full rounded"
                value={cliente.email}
                onChange={handleChange}
              />
            </div>
          </div>
        )}

        {activeTab === "otros" && (
          <div>
            <div className="mb-2">
              <label>Contacto</label>
              <input
                type="text"
                name="contacto"
                className="border p-2 w-full rounded"
                value={cliente.contacto}
                onChange={handleChange}
              />
            </div>
            <div className="mb-2">
              <label>Nombre y Apellido</label>
              <input
                type="text"
                name="nombreApellido"
                className="border p-2 w-full rounded"
                value={cliente.nombreApellido}
                onChange={handleChange}
              />
            </div>
            <div className="mb-2">
              <label>Teléfono</label>
              <input
                type="text"
                name="telefono"
                className="border p-2 w-full rounded"
                value={cliente.telefono}
                onChange={handleChange}
                maxLength="9"
                pattern="^\d{9}$"
                title="El teléfono debe tener exactamente 9 dígitos numéricos."
              />
            </div>
            <div className="mb-2">
              <label>Sitio Web</label>
              <input
                type="text"
                name="sitioWeb"
                className="border p-2 w-full rounded"
                value={cliente.sitioWeb}
                onChange={handleChange}
              />
            </div>
            <div className="mb-2">
              <label>Observaciones</label>
              <textarea
                name="observaciones"
                className="border p-2 w-full rounded"
                value={cliente.observaciones}
                onChange={handleChange}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
          >
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClienteForm;
