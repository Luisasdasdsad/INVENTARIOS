import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaSave } from "react-icons/fa";
import api from "../../services/api";
import { ordenTrabajoService } from "./ordenTrabajoService";
import { toast } from 'react-hot-toast';

const OrdenTrabajoFromCotizacion = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [productosDB, setProductosDB] = useState([]);
  const [herramientasDB, setHerramientasDB] = useState([]);
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [herramientasSeleccionadas, setHerramientasSeleccionadas] = useState([]);
  const [selectedCotizacion, setSelectedCotizacion] = useState(null);

  const [formData, setFormData] = useState({
    tecnicoId: "",
    observaciones: "",
    instruccionesTecnico: "",
    descripcionServicio: "", // Añadimos el campo al estado del formulario
    ubicacion: "",
    fechaInicio: "",
    fechaFin: ""
  });


  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [cotizacionesRes, usuariosRes, productosRes, herramientasRes] = await Promise.all([
        api.get("/cotizaciones/historial"),
        api.get("/usuarios"),
        api.get("/productos"),
        api.get("/herramientas")
      ]);

      // Acomodar diferentes formas de respuesta del backend
      // Puede devolver un arreglo directamente o un objeto { cotizaciones, total, ... }
      console.debug("cotizacionesRes.data:", cotizacionesRes.data);
      const cotizacionesArray = Array.isArray(cotizacionesRes.data)
        ? cotizacionesRes.data
        : cotizacionesRes.data?.cotizaciones || [];

      // Filtrar solo cotizaciones Aceptadas o Facturadas para evitar error 400 en el backend
      setCotizaciones(cotizacionesArray.filter(c => ['Aceptada', 'Facturada'].includes(c.estado)));
      // Filtrar técnicos
      setTecnicos(usuariosRes.data.filter(user => ['tecnico', 'ingeniero', 'admin'].includes(user.rol)));
      setProductosDB(productosRes.data);
      setHerramientasDB(herramientasRes.data);
    } catch (error) {
      console.error("Error cargando datos:", error);
      toast.error("Error al cargar los datos necesarios");
    }
  };

  const filteredCotizaciones = cotizaciones.filter(cot =>
    cot.numeroCotizacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cot.cliente?.nombre || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectCotizacion = (cotizacion) => {
    setSelectedCotizacion(cotizacion);
    // Precargamos la descripción del servicio en el formulario
    setFormData(prev => ({
      ...prev,
      descripcionServicio: cotizacion.descripcionServicio || ""
    }));

    // Clasificar ítems de la cotización en Productos y Herramientas
    const productosPre = [];
    const herramientasPre = [];

    cotizacion.productos.forEach(p => {
      // 1. Si tiene ID explícito, usarlo (prioridad alta)
      if (p.producto) {
        const prodId = p.producto._id || p.producto;
        productosPre.push({ producto: prodId, cantidad: p.cantidad });
        return;
      } 
      
      if (p.herramienta) {
        const herrId = p.herramienta._id || p.herramienta;
        herramientasPre.push({ herramienta: herrId, cantidad: p.cantidad });
        return;
      }

      // 2. Si no tiene ID, intentar buscar por nombre en la base de datos local
      // Esto ayuda a que aparezcan visualmente items de cotizaciones antiguas
      const descripcion = (p.descripcion || "").trim().toLowerCase();
      if (!descripcion) return;

      // Buscar coincidencia en productos
      const prodMatch = productosDB.find(prod => descripcion.includes(prod.nombre.trim().toLowerCase()));
      if (prodMatch) {
        productosPre.push({ producto: prodMatch._id, cantidad: p.cantidad });
        return;
      }

      // Buscar coincidencia en herramientas
      const herrMatch = herramientasDB.find(herr => descripcion.includes(herr.nombre.trim().toLowerCase()));
      if (herrMatch) {
        herramientasPre.push({ herramienta: herrMatch._id, cantidad: p.cantidad });
      }
    });

    setProductosSeleccionados(productosPre);
    setHerramientasSeleccionadas(herramientasPre);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Funciones para Productos (Estilo Manual)
  const addProducto = () => setProductosSeleccionados([...productosSeleccionados, { producto: '', cantidad: 1 }]);
  const removeProducto = (index) => setProductosSeleccionados(productosSeleccionados.filter((_, i) => i !== index));
  const handleProductoChange = (index, field, value) => {
    const newProductos = [...productosSeleccionados];
    newProductos[index][field] = value;
    setProductosSeleccionados(newProductos);
  };

  // Funciones para Herramientas (Estilo Manual)
  const addHerramienta = () => setHerramientasSeleccionadas([...herramientasSeleccionadas, { herramienta: '', cantidad: 1 }]);
  const removeHerramienta = (index) => setHerramientasSeleccionadas(herramientasSeleccionadas.filter((_, i) => i !== index));
  const handleHerramientaChange = (index, field, value) => {
    const newHerramientas = [...herramientasSeleccionadas];
    newHerramientas[index][field] = value;
    setHerramientasSeleccionadas(newHerramientas);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCotizacion || !formData.tecnicoId) {
      toast.error("Debe seleccionar una cotización y un técnico");
      return;
    }

    // Validación de fechas
    if (!formData.fechaInicio || !formData.fechaFin) {
      toast.error("Debe seleccionar una fecha de inicio y una fecha de fin.");
      return;
    }

    const fechaInicio = new Date(formData.fechaInicio);
    const fechaFin = new Date(formData.fechaFin);

    if (fechaFin < fechaInicio) {
      toast.error("La fecha de fin no puede ser anterior a la fecha de inicio.");
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
        formData.descripcionServicio,
        formData.ubicacion,
        productosSeleccionados.filter(p => p.producto && p.cantidad > 0),
        herramientasSeleccionadas.filter(h => h.herramienta && h.cantidad > 0)
      );

      toast.success("Orden de trabajo creada exitosamente");
      navigate("/ordenes-trabajo");
    } catch (error) {
      console.error("Error creando OT:", error);
      // Mostrar información más detallada para depuración
      const serverData = error.response?.data;
      const message = serverData?.message || serverData || error.message || "Error al crear la orden de trabajo";
      toast.error(`Error: ${typeof message === 'object' ? JSON.stringify(message) : message}`);
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

              {/* Campo de descripción de servicio ahora es editable */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Descripción del Servicio</label>
                <textarea name="descripcionServicio" value={formData.descripcionServicio} onChange={handleInputChange} rows={3} className="input-field" placeholder="Detalle del servicio a realizar..." />
              </div>
            </div>

            {/* Sección Productos (Estilo Manual) */}
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold">Productos</h4>
                <button type="button" onClick={addProducto} className="btn-secondary text-sm">+ Agregar</button>
              </div>
              {productosSeleccionados.length === 0 && <div className="text-sm text-gray-500">No hay productos agregados.</div>}
              <div className="space-y-2 mt-2">
                {productosSeleccionados.map((p, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-7">
                      <select value={p.producto} onChange={e => handleProductoChange(i, 'producto', e.target.value)} className="input-field">
                        <option value="">Seleccionar producto</option>
                        {productosDB.map(prod => <option key={prod._id} value={prod._id}>{prod.nombre}</option>)}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <input type="number" min="1" value={p.cantidad} onChange={e => handleProductoChange(i, 'cantidad', Number(e.target.value))} className="input-field" />
                    </div>
                    <div className="col-span-2 text-right">
                      <button type="button" onClick={() => removeProducto(i)} className="text-sm text-red-600">Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sección Herramientas (Estilo Manual) */}
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold">Herramientas</h4>
                <button type="button" onClick={addHerramienta} className="btn-secondary text-sm">+ Agregar</button>
              </div>
              {herramientasSeleccionadas.length === 0 && <div className="text-sm text-gray-500">No hay herramientas agregadas.</div>}
              <div className="space-y-2 mt-2">
                {herramientasSeleccionadas.map((h, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-7">
                      <select value={h.herramienta} onChange={e => handleHerramientaChange(i, 'herramienta', e.target.value)} className="input-field">
                        <option value="">Seleccionar herramienta</option>
                        {herramientasDB.map(hd => <option key={hd._id} value={hd._id}>{hd.nombre}</option>)}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <input type="number" min="1" value={h.cantidad} onChange={e => handleHerramientaChange(i, 'cantidad', Number(e.target.value))} className="input-field" />
                    </div>
                    <div className="col-span-2 text-right">
                      <button type="button" onClick={() => removeHerramienta(i)} className="text-sm text-red-600">Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Técnico asignado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Responsable Asignado *</label>
              <select name="tecnicoId" value={formData.tecnicoId} onChange={handleInputChange} className="input-field" required>
                <option value="">Seleccionar responsable</option>
                {tecnicos.map(tecnico => (
                  <option key={tecnico._id} value={tecnico._id}>
                    {tecnico.nombre} - {tecnico.rol === 'admin' ? 'Administrador' : 
                                       tecnico.rol === 'ingeniero' ? 'Ingeniero' : 
                                       'Técnico'}
                  </option>
                ))}
              </select>
            </div>

            {/* Ubicación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ubicación de la Obra</label>
              <input type="text" name="ubicacion" value={formData.ubicacion} onChange={handleInputChange} className="input-field" placeholder="Ingrese la ubicación de la obra" />
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
