import { useState } from "react";
import api from "../../services/api";
import { FaUser, FaBuilding, FaSave, FaTimes, FaIdCard, FaMapMarkerAlt, FaInfoCircle, FaSearch } from "react-icons/fa";

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
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConsultingRUC, setIsConsultingRUC] = useState(false);

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setCliente({ ...cliente, [name]: value });
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }

    // Consulta automática de RUC cuando se completa el campo
    if (name === "ruc" && value.length === 11 && /^\d{11}$/.test(value) && cliente.tipoDoc === "RUC") {
      await consultarRUC(value);
    }
  };

  const consultarRUC = async (ruc) => {
    setIsConsultingRUC(true);
    try {
      const response = await api.get(`/clientes/consultar-ruc/${ruc}`);
      const data = response.data;

      // Actualizar campos con datos de SUNAT
      setCliente(prev => ({
        ...prev,
        nombre: data.nombre || prev.nombre,
        nombreComercial: data.nombreComercial || prev.nombreComercial,
        direccion: data.direccion || prev.direccion,
        ubigeo: data.ubigeo || prev.ubigeo,
      }));

      // Limpiar errores relacionados
      setErrors(prev => ({
        ...prev,
        ruc: "",
        nombre: "",
      }));
    } catch (error) {
      console.error("Error al consultar RUC:", error);
      if (error.response?.status === 404) {
        setErrors(prev => ({ ...prev, ruc: "RUC no encontrado o inactivo" }));
      } else if (error.response?.status === 400) {
        setErrors(prev => ({ ...prev, ruc: "RUC inválido" }));
      } else {
        setErrors(prev => ({ ...prev, ruc: "Error al consultar SUNAT" }));
      }
    } finally {
      setIsConsultingRUC(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!cliente.tipoDoc) {
      newErrors.tipoDoc = "El tipo de documento es requerido";
    }

    if (cliente.tipoDoc === "RUC" && !cliente.ruc) {
      newErrors.ruc = "El RUC es requerido";
    } else if (cliente.tipoDoc === "RUC" && !/^\d{11}$/.test(cliente.ruc)) {
      newErrors.ruc = "El RUC debe tener exactamente 11 dígitos";
    }

    if ((cliente.tipoDoc === "DNI" || cliente.tipoDoc === "CE") && !cliente.numero) {
      newErrors.numero = `El ${cliente.tipoDoc === "DNI" ? "DNI" : "número de documento"} es requerido`;
    } else if (cliente.tipoDoc === "DNI" && !/^\d{8}$/.test(cliente.numero)) {
      newErrors.numero = "El DNI debe tener exactamente 8 dígitos";
    }

    if (!cliente.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido";
    }

    if (cliente.email && !/\S+@\S+\.\S+/.test(cliente.email)) {
      newErrors.email = "El email no es válido";
    }

    if (cliente.telefono && !/^\d{9}$/.test(cliente.telefono)) {
      newErrors.telefono = "El teléfono debe tener exactamente 9 dígitos";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const res = clienteEdit
        ? await api.put(`/clientes/${cliente._id}`, cliente)
        : await api.post("/clientes", cliente);
      if (onClienteCreado) onClienteCreado(res.data);
      onClose();
    } catch (error) {
      console.error("Error al guardar cliente:", error);
      setErrors({ general: "Error al guardar el cliente. Inténtalo de nuevo." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = [
    { id: "datos", label: "Datos del Cliente", icon: FaIdCard },
    { id: "direccion", label: "Dirección", icon: FaMapMarkerAlt },
    { id: "otros", label: "Otros Datos", icon: FaInfoCircle }
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-secondary-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
              <FaUser className="text-primary-600" size={18} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-secondary-900">
                {clienteEdit ? "Editar Cliente" : "Nuevo Cliente"}
              </h2>
              <p className="text-sm text-secondary-600">
                {clienteEdit ? "Modifica los datos del cliente" : "Ingresa los datos del nuevo cliente"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100 rounded-lg transition-colors duration-200"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-secondary-200 bg-secondary-50">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors duration-200 ${
                  activeTab === tab.id
                    ? "border-b-2 border-primary-500 text-primary-700 bg-white"
                    : "text-secondary-600 hover:text-secondary-800 hover:bg-secondary-100"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {activeTab === "datos" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-secondary-700 mb-2">
                    Tipo Doc. Identidad *
                  </label>
                  <select
                    name="tipoDoc"
                    className={`input-field ${errors.tipoDoc ? 'input-field-error' : ''}`}
                    value={cliente.tipoDoc}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Seleccionar</option>
                    <option value="DNI">DNI</option>
                    <option value="RUC">RUC</option>
                    <option value="CE">CE</option>
                  </select>
                  {errors.tipoDoc && <p className="mt-1 text-sm text-accent-600">{errors.tipoDoc}</p>}
                </div>

                {cliente.tipoDoc === "RUC" && (
                  <div>
                    <label className="block text-sm font-semibold text-secondary-700 mb-2">
                      RUC *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="ruc"
                        className={`input-field ${errors.ruc ? 'input-field-error' : ''}`}
                        value={cliente.ruc}
                        onChange={handleChange}
                        maxLength="11"
                        placeholder="12345678901"
                      />
                      {isConsultingRUC && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="loading-spinner w-4 h-4"></div>
                        </div>
                      )}
                    </div>
                    {errors.ruc && <p className="mt-1 text-sm text-accent-600">{errors.ruc}</p>}
                  </div>
                )}

                {(cliente.tipoDoc === "DNI" || cliente.tipoDoc === "CE") && (
                  <div>
                    <label className="block text-sm font-semibold text-secondary-700 mb-2">
                      Número *
                    </label>
                    <input
                      type="text"
                      name="numero"
                      className={`input-field ${errors.numero ? 'input-field-error' : ''}`}
                      value={cliente.numero}
                      onChange={handleChange}
                      maxLength={cliente.tipoDoc === "DNI" ? "8" : "20"}
                      placeholder={cliente.tipoDoc === "DNI" ? "12345678" : "Número de documento"}
                    />
                    {errors.numero && <p className="mt-1 text-sm text-accent-600">{errors.numero}</p>}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-secondary-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    className={`input-field ${errors.nombre ? 'input-field-error' : ''}`}
                    value={cliente.nombre}
                    onChange={handleChange}
                    placeholder="Nombre del cliente"
                  />
                  {errors.nombre && <p className="mt-1 text-sm text-accent-600">{errors.nombre}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-secondary-700 mb-2">
                    Nombre comercial
                  </label>
                  <input
                    type="text"
                    name="nombreComercial"
                    className="input-field"
                    value={cliente.nombreComercial}
                    onChange={handleChange}
                    placeholder="Nombre comercial (opcional)"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "direccion" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-secondary-700 mb-2">
                    País
                  </label>
                  <input
                    type="text"
                    name="pais"
                    className="input-field"
                    value={cliente.pais}
                    onChange={handleChange}
                    placeholder="PERU"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-secondary-700 mb-2">
                    Ubigeo
                  </label>
                  <input
                    type="text"
                    name="ubigeo"
                    className="input-field"
                    value={cliente.ubigeo}
                    onChange={handleChange}
                    placeholder="Código ubigeo"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-secondary-700 mb-2">
                  Dirección
                </label>
                <input
                  type="text"
                  name="direccion"
                  className="input-field"
                  value={cliente.direccion}
                  onChange={handleChange}
                  placeholder="Dirección completa"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-secondary-700 mb-2">
                  Referencia
                </label>
                <input
                  type="text"
                  name="referencia"
                  className="input-field"
                  value={cliente.referencia}
                  onChange={handleChange}
                  placeholder="Referencia de ubicación"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-secondary-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    name="telefono"
                    className={`input-field ${errors.telefono ? 'input-field-error' : ''}`}
                    value={cliente.telefono}
                    onChange={handleChange}
                    maxLength="9"
                    placeholder="999999999"
                  />
                  {errors.telefono && <p className="mt-1 text-sm text-accent-600">{errors.telefono}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-secondary-700 mb-2">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    name="email"
                    className={`input-field ${errors.email ? 'input-field-error' : ''}`}
                    value={cliente.email}
                    onChange={handleChange}
                    placeholder="cliente@email.com"
                  />
                  {errors.email && <p className="mt-1 text-sm text-accent-600">{errors.email}</p>}
                </div>
              </div>
            </div>
          )}

          {activeTab === "otros" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-secondary-700 mb-2">
                    Contacto
                  </label>
                  <input
                    type="text"
                    name="contacto"
                    className="input-field"
                    value={cliente.contacto}
                    onChange={handleChange}
                    placeholder="Nombre del contacto"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-secondary-700 mb-2">
                    Nombre y Apellido
                  </label>
                  <input
                    type="text"
                    name="nombreApellido"
                    className="input-field"
                    value={cliente.nombreApellido}
                    onChange={handleChange}
                    placeholder="Nombre completo del contacto"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-secondary-700 mb-2">
                    Sitio Web
                  </label>
                  <input
                    type="text"
                    name="sitioWeb"
                    className="input-field"
                    value={cliente.sitioWeb}
                    onChange={handleChange}
                    placeholder="https://www.ejemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-secondary-700 mb-2">
                    Teléfono adicional
                  </label>
                  <input
                    type="text"
                    name="telefono"
                    className="input-field"
                    value={cliente.telefono}
                    onChange={handleChange}
                    maxLength="9"
                    placeholder="999999999"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-secondary-700 mb-2">
                  Observaciones
                </label>
                <textarea
                  name="observaciones"
                  className="input-field"
                  value={cliente.observaciones}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Observaciones adicionales..."
                />
              </div>
            </div>
          )}

          {errors.general && (
            <div className="bg-accent-50 border border-accent-200 rounded-lg p-4">
              <p className="text-accent-700 text-sm">{errors.general}</p>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-secondary-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex items-center gap-2"
              disabled={isSubmitting}
            >
              <FaTimes size={14} />
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="loading-spinner w-4 h-4"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <FaSave size={14} />
                  <span>{clienteEdit ? "Actualizar" : "Crear"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClienteForm;
