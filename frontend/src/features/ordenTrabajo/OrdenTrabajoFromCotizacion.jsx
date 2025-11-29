import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaSave } from "react-icons/fa";
import api from "../../services/api";
import { ordenTrabajoService } from "./ordenTrabajoService";

const OrdenTrabajoFromCotizacion = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCotizacion, setSelectedCotizacion] = useState(null);

  const [formData, setFormData] = useState({
    tecnicoId: "",
    observaciones: "",
    instruccionesTecnico: "",
    descripcionServicio: "" // 💡 Añadimos el campo al estado del formulario
  });

  // Añadir fechas al formulario
  useEffect(() => {
    setFormData(prev => ({ ...prev, fechaInicio: '', fechaFin: '' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [cotizacionesRes, usuariosRes] = await Promise.all([
        api.get("/cotizaciones/historial"),
        api.get("/usuarios")
      ]);

      // Acomodar diferentes formas de respuesta del backend
      // Puede devolver un arreglo directamente o un objeto { cotizaciones, total, ... }
      console.debug("cotizacionesRes.data:", cotizacionesRes.data);
      const cotizacionesArray = Array.isArray(cotizacionesRes.data)
        ? cotizacionesRes.data
        : cotizacionesRes.data?.cotizaciones || [];

      // Mostrar todas las cotizaciones por defecto (no filtrar por estado)
      setCotizaciones(cotizacionesArray);
      // Filtrar técnicos
      setTecnicos(usuariosRes.data.filter(user => user.rol === "tecnico"));
    } catch (error) {
      console.error("Error cargando datos:", error);
      alert("Error al cargar los datos necesarios");
    }
  };

  const filteredCotizaciones = cotizaciones.filter(cot =>
    cot.numeroCotizacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cot.cliente?.nombre || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectCotizacion = (cotizacion) => {
    setSelectedCotizacion(cotizacion);
    // 💡 Precargamos la descripción del servicio en el formulario
    setFormData(prev => ({
      ...prev,
      descripcionServicio: cotizacion.descripcionServicio || ""
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCotizacion || !formData.tecnicoId) {
      alert("Debe seleccionar una cotización y un técnico");
      return;
    }

    // Validación de fechas
    if (!formData.fechaInicio || !formData.fechaFin) {
      alert("Debe seleccionar una fecha de inicio y una fecha de fin.");
      return;
    }

    const fechaInicio = new Date(formData.fechaInicio);
    const fechaFin = new Date(formData.fechaFin);

    if (fechaFin < fechaInicio) {
      alert("La fecha de fin no puede ser anterior a la fecha de inicio.");
      return;
    }

    setLoading(true);
    try {
      await ordenTrabajoService.crearDesdeCotizacion(
        selectedCotizacion._id,
        formData.tecnicoId,
        formData.observaciones,
        formData.fechaInicio,
        formData.fechaFin,
        formData.instruccionesTecnico,
        formData.descripcionServicio // 💡 Enviamos la descripción actualizada
      );

      alert("Orden de trabajo creada exitosamente desde la cotización");
      navigate("/ordenes-trabajo");
    } catch (error) {
      console.error("Error creando OT:", error);
      // Mostrar información más detallada para depuración
      const serverData = error.response?.data;
      const message = serverData?.message || serverData || error.message || "Error al crear la orden de trabajo";
      alert(`Error al crear la orden de trabajo: ${typeof message === 'object' ? JSON.stringify(message) : message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Crear Orden de Trabajo desde Cotización</h2>

        {!selectedCotizacion ? (
          // Paso 1: Seleccionar cotización
          <div>
            <div className="mb-6">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar cotización por número o cliente..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="input-field pl-10"
                    />
                  </div>
                </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCotizaciones.length === 0 ? (
                <div className="col-span-1 md:col-span-2 text-center py-8 text-gray-500">
                  {searchTerm ? "No se encontraron cotizaciones" : "No hay cotizaciones aprobadas disponibles"}
                </div>
              ) : (
                filteredCotizaciones.map(cot => (
                  <div key={cot._id} className="card cursor-pointer" onClick={() => handleSelectCotizacion(cot)}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-800">Cotización #{cot.numeroCotizacion}</h3>
                        <p className="text-sm text-gray-600 mt-1">{cot.cliente?.nombre || 'Cliente no disponible'}</p>
                        {/* --- INICIO DE LA MEJORA --- */}
                        <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                          {cot.descripcionServicio || 'Sin descripción de servicio.'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Aprobada</span>
                        <p className="text-xs text-gray-500 mt-1">{new Date(cot.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          // Paso 2: Configurar OT
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Resumen de la cotización */}
            <div className="card">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-800">Cotización #{selectedCotizacion.numeroCotizacion}</h3>
                  <p className="text-sm text-gray-600">Cliente: {selectedCotizacion.cliente?.nombre || 'N/D'}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Fecha:</strong> {new Date(selectedCotizacion.createdAt).toLocaleDateString()}</p>
                  <p><strong>Estado:</strong> Aprobada</p>
                </div>
                <div>
                </div>
              </div>

              {/* 💡 Campo de descripción de servicio ahora es editable */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Descripción del Servicio</label>
                <textarea name="descripcionServicio" value={formData.descripcionServicio} onChange={handleInputChange} rows={3} className="input-field" placeholder="Detalle del servicio a realizar..." />
              </div>

              <div className="mt-4">
                <p className="font-semibold">Productos incluidos</p>
                <div className="mt-2 grid grid-cols-1 gap-2 text-sm">
                  {selectedCotizacion.productos.map((prod, index) => (
                    <div key={index} className="flex justify-between">
                      <div>• {prod.producto?.nombre || prod.descripcion}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Técnico asignado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Técnico Asignado *</label>
              <select name="tecnicoId" value={formData.tecnicoId} onChange={handleInputChange} className="input-field" required>
                <option value="">Seleccionar técnico</option>
                {tecnicos.map(tecnico => (<option key={tecnico._id} value={tecnico._id}>{tecnico.nombre}</option>))}
              </select>
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Inicio *</label>
                <input type="date" name="fechaInicio" value={formData.fechaInicio || ''} onChange={handleInputChange} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Fin *</label>
                <input type="date" name="fechaFin" value={formData.fechaFin || ''} onChange={handleInputChange} className="input-field" required />
              </div>
            </div>

            {/* Observaciones */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones</label>
              <textarea name="observaciones" value={formData.observaciones} onChange={handleInputChange} rows={3} className="input-field" placeholder="Observaciones adicionales para la orden de trabajo..." />
            </div>

            {/* Instrucciones para el técnico */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Instrucciones para el Técnico</label>
              <textarea name="instruccionesTecnico" value={formData.instruccionesTecnico} onChange={handleInputChange} rows={3} className="input-field" placeholder="Instrucciones específicas para el técnico que realizará el trabajo..." />
            </div>

            {/* Botones */}
            <div className="flex justify-between items-center">
              <button type="button" onClick={() => setSelectedCotizacion(null)} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">← Volver a seleccionar</button>

              <div className="flex space-x-3">
                <button type="button" onClick={() => navigate('/ordenes-trabajo')} className="btn-secondary">Cancelar</button>
                <button type="submit" disabled={loading} className="btn-primary"><FaSave className="mr-2" />{loading ? 'Creando...' : 'Crear Orden de Trabajo'}</button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default OrdenTrabajoFromCotizacion;
