import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../services/api";
import ClienteForm from "../clientes/ClienteForm";
import generarReporteCotizacion from "../../utils/generarReporteCotización";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from 'react-hot-toast';

const Cotización = () => {
  const location = useLocation();
  const navigate = useNavigate(); // <-- Add this
  const cotizacionEdit = location.state?.cotizacion;

  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState("");
  const [productos, setProductos] = useState([
    { cantidad: 1, unidad: "", descripcion: "", vUnit: 0, igv: 0, pUnit: 0, total: 0 },
  ]);
  const [productosDB, setProductosDB] = useState([]);
  const [herramientasDB, setHerramientasDB] = useState([]);
  const [moneda, setMoneda] = useState("SOLES");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [modalCliente, setModalCliente] = useState(false);
  const [clienteEdit, setClienteEdit] = useState(null);
  const [observacionesCot, setObservacionesCot] = useState("");
  const [descripcionServicio, setDescripcionServicio] = useState("");
  const [numeroCotizacion, setNumeroCotizacion] = useState("");
  const [descuento, setDescuento] = useState(0);
  const [tipoCambio, setTipoCambio] = useState(1);
  const [tipoCambioSunat, setTipoCambioSunat] = useState(null);
  const [loadingSunat, setLoadingSunat] = useState(false);
  const [validez, setValidez] = useState(15);
  const [isEditing, setIsEditing] = useState(false);
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [mostrarResultados, setMostrarResultados] = useState(false);

  // === Cargar clientes y productos ===
  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const res = await api.get("/clientes");
        setClientes(res.data);
      } catch (error) {
        console.error("Error al obtener clientes:", error);
      }
    };

    const fetchProductos = async () => {
      try {
        const res = await api.get("/productos");
        setProductosDB(res.data);
      } catch (error) {
        console.error("Error al obtener productos:", error);
      }
    };

    const fetchHerramientas = async () => {
      try {
        const res = await api.get("/herramientas");
        setHerramientasDB(res.data);
      } catch (error) {
        console.error("Error al obtener herramientas:", error);
      }
    };

    fetchClientes();
    fetchProductos();
    fetchHerramientas();

    if (cotizacionEdit) {
      setIsEditing(true);
      setClienteSeleccionado(cotizacionEdit.cliente._id);
      setBusquedaCliente(cotizacionEdit.cliente.nombre || "");
      setProductos(
        cotizacionEdit.productos.map((p) => ({
          cantidad: p.cantidad,
          unidad: p.unidad || "",
          descripcion: p.descripcion,
          vUnit: p.vUnit || 0,
          igv: p.igv || 0,
          pUnit: p.precioUnitario,
          total: p.total,
          producto: p.producto ? (p.producto._id || p.producto) : undefined,
          herramienta: p.herramienta ? (p.herramienta._id || p.herramienta) : undefined
        }))
      );
      setMoneda(cotizacionEdit.moneda || "SOLES");
      setFecha(new Date(cotizacionEdit.fecha).toISOString().split("T")[0]);
      setObservacionesCot(cotizacionEdit.observaciones || "");
      setDescripcionServicio(cotizacionEdit.descripcionServicio || "");
      setNumeroCotizacion(cotizacionEdit.numeroCotizacion);
      setDescuento(cotizacionEdit.descuento || 0);
      setTipoCambio(cotizacionEdit.tipoCambio || 1);
      if (cotizacionEdit.moneda === 'DOLARES') {
        obtenerTipoCambioSunat(false, false); // Obtener referencia SUNAT sin sobrescribir y SIN alerta de error
      }
      // cotizacionEdit.validez may be stored as "N días" or a number; normalize to integer days
      setValidez(parseInt(cotizacionEdit.validez) || 15);
    }
  }, [cotizacionEdit]);

  // === Obtener correlativo dinámico por año (Reinicio 2026) ===
  const year = fecha.split("-")[0]; // Extraer año de la fecha seleccionada
  useEffect(() => {
    const fetchNextNumber = async () => {
      if (!cotizacionEdit) {
        try {
          // Enviamos el año al backend para que reinicie la numeración (ej: COT-2026-001)
          const res = await api.get(`/cotizaciones/next-number?year=${year}`);
          setNumeroCotizacion(res.data.numeroCotizacion);
        } catch (error) {
          console.error("Error al obtener el siguiente número de cotización:", error);
        }
      }
    };
    fetchNextNumber();
  }, [cotizacionEdit, year]); // Se ejecuta cuando cambia el año o el modo edición

  // === Manejo de productos ===
  const handleProductoChange = (index, campo, valor) => {
    const nuevos = [...productos];
    let nuevoValor = valor;
    // Sanitize pUnit: allow digits and one dot, max 2 decimals
    if (campo === "pUnit") {
      nuevoValor = String(valor).replace(/,/g, ".").replace(/[^0-9.]/g, "");
      const parts = nuevoValor.split(".");
      if (parts.length > 2) {
        nuevoValor = parts[0] + "." + parts.slice(1).join("");
      }
      if (parts[1]) {
        parts[1] = parts[1].slice(0, 2);
        nuevoValor = parts[0] + (parts[1] ? "." + parts[1] : "");
      }
    }

    nuevos[index][campo] = nuevoValor;
    const pUnit = parseFloat(nuevos[index].pUnit) || 0;
    const cantidad = parseFloat(nuevos[index].cantidad) || 0;
    nuevos[index].igv = pUnit * 0.18;
    nuevos[index].vUnit = pUnit - nuevos[index].igv;
    nuevos[index].total = pUnit * cantidad;

    // Validación de Stock (Solo advertencia)
    if (campo === 'cantidad') {
      if (nuevos[index].producto) {
        const prodDB = productosDB.find(p => p._id === nuevos[index].producto);
        if (prodDB && Number(nuevoValor) > prodDB.stock) {
          toast.error(`Stock insuficiente: Solo hay ${prodDB.stock} unidades de ${prodDB.nombre}`, { id: 'stock-warning' });
        }
      } else if (nuevos[index].herramienta) {
        const herrDB = herramientasDB.find(h => h._id === nuevos[index].herramienta);
        if (herrDB && Number(nuevoValor) > (herrDB.cantidad ?? 0)) {
          toast.error(`Stock insuficiente: Solo hay ${herrDB.cantidad ?? 0} unidades de ${herrDB.nombre}`, { id: 'stock-warning' });
        }
      }
    }
    setProductos(nuevos);
  };

  const agregarProducto = () => {
    setProductos([
      ...productos,
      { cantidad: 1, unidad: "", descripcion: "", vUnit: 0, igv: 0, pUnit: 0, total: 0 },
    ]);
  };

  const eliminarProducto = (index) => {
    if (productos.length > 1) {
      setProductos(productos.filter((_, i) => i !== index));
    }
  };

  // === Obtener Tipo de Cambio SUNAT ===
  const obtenerTipoCambioSunat = async (actualizarEditable = true, showError = true) => {
    setLoadingSunat(true);
    try {
      // Usamos nuestro propio backend como proxy para evitar CORS y problemas de red
      const res = await api.get('/tipo-cambio');
      const data = res.data;
      if (data && data.venta) {
        setTipoCambioSunat(data.venta);
        if (actualizarEditable) {
          setTipoCambio(data.venta);
        }
      }
    } catch (error) {
      console.error("Error al obtener tipo de cambio SUNAT:", error.response?.data || error);
      if (showError) {
        // Intentar mostrar el mensaje específico que devuelve el backend si existe
        const msg = error.response?.data?.msg || error.response?.data?.message || error.response?.data?.error || "No se pudo obtener el T.C. de SUNAT automáticamente.";
        toast.error(msg);
      }
    } finally {
      setLoadingSunat(false);
    }
  };

  // === Totales ===
  const calcularTotales = () => {
    // Cálculo del subtotal (suma de valores unitarios * cantidad)
    const subtotal = productos.reduce((acc, p) => acc + (p.vUnit * p.cantidad), 0);
    const descuentoAmount = descuento;
    // Cálculo del IGV total (suma de IGV * cantidad de cada producto)
    const igv = productos.reduce((acc, p) => acc + (p.igv * p.cantidad), 0);
    // El total es: subtotal - descuento + IGV
    const total = subtotal - descuentoAmount + igv;
    return { subtotal, descuentoAmount, igv, total };
  };

  // === Guardar cotización ===
  const guardarCotizacion = async () => {
    if (!clienteSeleccionado) {
      toast.error("Selecciona un cliente");
      return;
    }

    const { total } = calcularTotales();
    const cotizacionData = {
      cliente: clienteSeleccionado,
      productos: productos.map((p) => ({
        descripcion: p.descripcion,
        cantidad: p.cantidad,
        unidad: p.unidad,
        precioUnitario: parseFloat(p.pUnit) || 0,
        igv: p.igv,
        vUnit: p.vUnit,
        total: p.total,
        producto: p.producto, // Guardar ID del producto
        herramienta: p.herramienta // Guardar ID de la herramienta
      })),
      fecha,
      totalGeneral: total,
      descuento,
      moneda,
      tipoCambio: moneda === 'DOLARES' ? tipoCambio : 1,
      observaciones: observacionesCot,
      // Store as string "N días" to keep backend compatibility
      validez: `${validez} días`,
    };

    // Solo incluir numeroCotizacion en edición
    if (isEditing) {
      cotizacionData.numeroCotizacion = numeroCotizacion;
    }
    cotizacionData.descripcionServicio = descripcionServicio;

    try {
      if (isEditing && cotizacionEdit) {
        await api.put(`/cotizaciones/${cotizacionEdit._id}`, cotizacionData);
        toast.success("Cotización actualizada exitosamente");
      } else {
        const response = await api.post("/cotizaciones", cotizacionData);
        setNumeroCotizacion(response.data.numeroCotizacion); // Mantener por si acaso
        toast.success("Cotización guardada exitosamente");
      }
      // Redireccionar después de guardar
      navigate('/cotizaciones'); 
    } catch (error) {
      console.error("Error al guardar cotización:", error);
      if (error.response?.status === 400 && error.response?.data?.msg?.includes("duplicate key")) {
        toast.error("El número de cotización ya existe. Por favor, usa un número único.");
      } else {
        toast.error("Error al guardar la cotización: " + (error.response?.data?.msg || error.message));
      }
    }
  };

  // === Generar PDF ===
  const generarPDF = async () => {
    // Verificar si ya está guardada la cotización
    if (!numeroCotizacion) {
      toast.error("Debe guardar la cotización antes de generar el PDF");
      return;
    }

    const cliente = clientes.find((c) => c._id === clienteSeleccionado);
    const { subtotal, descuentoAmount, igv, total } = calcularTotales();
    const responsable = isEditing && cotizacionEdit ? cotizacionEdit.usuario.nombre : user.nombre;

    await generarReporteCotizacion({
      cliente: {
        nombre: cliente?.nombre || "",
        documento: cliente?.tipoDoc === "RUC" ? cliente?.ruc : cliente?.numero || "",
        tipoDoc: cliente?.tipoDoc || "",
        direccion: cliente?.direccion || "",
        telefono: cliente?.telefono || "",
      },
      productos: productos.map((p) => ({
        cantidad: p.cantidad,
        unidad: p.unidad,
        descripcion: p.descripcion,
        precioUnit: parseFloat(p.pUnit) || 0,
      })),
      subtotal,
      descuento: descuentoAmount,
      igv,
      total,
      fecha,
      moneda,
      tipoCambio: moneda === 'DOLARES' ? tipoCambio : null,
      numeroCotizacion: numeroCotizacion || "001",
      condicionPago: "CONTADO",
      validez: `${validez} días`,
      observaciones: observacionesCot,
      responsable,
    });
  };

  // === Cliente nuevo o editado ===
  const handleClienteCreado = (clienteActualizado) => {
    if (clienteEdit) {
      // Si estamos editando, actualizamos el cliente en la lista
      setClientes(clientes.map(c => 
        c._id === clienteActualizado._id ? clienteActualizado : c
      ));
    } else {
      // Si es nuevo, lo agregamos a la lista
      setClientes([...clientes, clienteActualizado]);
    }
    setClienteSeleccionado(clienteActualizado._id);
    setBusquedaCliente(clienteActualizado.nombre);
  };

  const handleEditarCliente = () => {
    const cliente = clientes.find((c) => c._id === clienteSeleccionado);
    if (cliente) {
      setClienteEdit(cliente);
      setModalCliente(true);
    }
  };

  // Calcular totales para mostrar en la interfaz
  const { subtotal, descuentoAmount, igv, total } = calcularTotales();

  // === Render principal ===
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 border-b pb-2 mb-6">
        Generar Cotización
      </h1>

      {/* --- Cliente --- */}
      <section className="bg-white border rounded-xl shadow-sm p-4 mb-6">
        <h2 className="font-semibold text-gray-700 mb-3 text-lg">Cliente</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Buscar por nombre o RUC/DNI..."
              value={busquedaCliente}
              onChange={(e) => {
                setBusquedaCliente(e.target.value);
                setMostrarResultados(true);
                setClienteSeleccionado(""); // Limpiar selección al escribir para obligar a seleccionar de la lista
              }}
              onFocus={() => setMostrarResultados(true)}
              onBlur={() => setTimeout(() => setMostrarResultados(false), 200)}
            />
            {mostrarResultados && (
              <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
                {clientes.filter(c => 
                  c.nombre.toLowerCase().includes(busquedaCliente.toLowerCase()) || 
                  (c.ruc && c.ruc.includes(busquedaCliente)) ||
                  (c.numero && c.numero.includes(busquedaCliente))
                ).length > 0 ? (
                  clientes.filter(c => 
                    c.nombre.toLowerCase().includes(busquedaCliente.toLowerCase()) || 
                    (c.ruc && c.ruc.includes(busquedaCliente)) ||
                    (c.numero && c.numero.includes(busquedaCliente))
                  ).map((c) => (
                    <div
                      key={c._id}
                      className="p-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-700 border-b last:border-b-0"
                      onClick={() => {
                        setClienteSeleccionado(c._id);
                        setBusquedaCliente(c.nombre);
                        setMostrarResultados(false);
                      }}
                    >
                      <div className="font-medium">{c.nombre}</div>
                      <div className="text-xs text-gray-500">
                        {c.tipoDoc === 'RUC' ? `RUC: ${c.ruc}` : `DNI: ${c.numero}`}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-2 text-sm text-gray-500">No se encontraron clientes</div>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                setClienteEdit(null);
                setModalCliente(true);
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-black font-medium px-4 py-2 rounded-lg shadow-sm transition-colors text-sm min-h-[44px]"
            >
              <FaPlus size={14} /> Nuevo
            </button>
            {clienteSeleccionado && (
              <button
                onClick={handleEditarCliente}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-black font-medium px-4 py-2 rounded-lg shadow-sm transition-colors text-sm min-h-[44px]"
              >
                <FaEdit size={14} /> Editar
              </button>
            )}
          </div>
        </div>
      </section>

      {/* --- Datos de Cotización --- */}
      <section className="bg-white border rounded-xl shadow-sm p-4 mb-6">
        <h2 className="font-semibold text-gray-700 mb-3 text-lg">Información</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm text-gray-600">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              placeholder="Seleccione una fecha"
              className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {/* 💡 Siempre mostramos el campo. Si es nuevo, muestra "Cargando..." hasta que llegue el número. */}
          {(isEditing || !cotizacionEdit) && (
            <div>
              <label className="text-sm text-gray-600">N° Cotización</label>
              <input
                type="text"
                value={numeroCotizacion || "Cargando..."}
                readOnly
                className="w-full border border-gray-300 p-2 rounded-md bg-gray-100"
              />
            </div>
          )}
          <div>
            <label className="text-sm text-gray-600">Moneda</label>
            <select
              value={moneda}
              onChange={(e) => {
                setMoneda(e.target.value);
                if (e.target.value === "DOLARES") {
                  obtenerTipoCambioSunat(true, false); // Carga automática silenciosa
                }
              }}
              className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="SOLES">SOLES</option>
              <option value="DOLARES">DÓLARES</option>
            </select>
          </div>
          {moneda === 'DOLARES' && (
            <>
              <div>
                <label className="text-sm text-gray-600 flex justify-between items-center">
                  T.C. SUNAT (Ref)
                  <button 
                    type="button" 
                    onClick={() => obtenerTipoCambioSunat(true, true)} 
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                    disabled={loadingSunat}
                  >
                    {loadingSunat ? "Cargando..." : "Actualizar"}
                  </button>
                </label>
                <input
                  type="number"
                  value={tipoCambioSunat || ''}
                  readOnly
                  className="w-full border border-gray-300 p-2 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
                  placeholder={loadingSunat ? "Cargando..." : "Sin datos"}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">T.C. a usar</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={tipoCambio}
                onChange={(e) => setTipoCambio(parseFloat(e.target.value) || 1)}
                placeholder="3.75"
                className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            </>
            )}
          <div>
            <label className="text-sm text-gray-600">Descuento (S/)</label>
            <input
              type="number"
              min="0"
              value={descuento}
              onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Validez (días)</label>
            <input
              type="number"
              min="1"
              max="365"
              step="1"
              value={validez}
              onChange={(e) => setValidez(Math.max(1, parseInt(e.target.value) || 1))}
              placeholder="15"
              className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="col-span-1 sm:col-span-2 md:col-span-4">
            <label className="text-sm text-gray-600">Descripción del Servicio</label>
            <textarea
              rows="2"
              value={descripcionServicio}
              onChange={(e) => setDescripcionServicio(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Descripción general del servicio o trabajo a realizar"
            />
          </div>
        </div>
      </section>

      {/* --- Productos --- */}
      <section className="bg-white border rounded-xl shadow-sm p-4 mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-gray-700 text-lg">Productos</h2>
        </div>

        {/* Móvil - Tarjetas */}
        <div className="md:hidden space-y-3">
          {productos.map((p, i) => (
            <div key={i} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Cant</label>
                    <input
                      type="number"
                      min="1"
                      value={p.cantidad}
                      onChange={(e) => handleProductoChange(i, "cantidad", e.target.value)}
                      className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Und</label>
                    <input
                      value={p.unidad}
                      onChange={(e) => handleProductoChange(i, "unidad", e.target.value)}
                      className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
                  <textarea
                    rows="2"
                    value={p.descripcion}
                    onChange={(e) => handleProductoChange(i, "descripcion", e.target.value)}
                    className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">P. Unit</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      pattern="\d*(\.\d{0,2})?"
                      value={p.pUnit}
                      onChange={(e) => handleProductoChange(i, "pUnit", e.target.value)}
                      className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Total</label>
                    <input
                      type="text"
                      value={p.total.toFixed(2)}
                      readOnly
                      className="w-full border border-gray-300 p-2 rounded-md bg-gray-100 text-sm"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => eliminarProducto(i)}
                    className="flex items-center justify-center gap-1 bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 text-xs font-medium"
                    disabled={productos.length === 1}
                  >
                    <FaTrash size={12} /> Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Escritorio - Tabla */}
        <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-yellow-100 text-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Cant</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Und</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Descripción</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">P. Unit</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">IGV</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">V. Unit</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Total</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Acción</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {productos.map((p, i) => (
                <tr key={i} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-sm">
                    <input
                      type="number"
                      min="1"
                      value={p.cantidad}
                      onChange={(e) => handleProductoChange(i, "cantidad", e.target.value)}
                      className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <input
                      value={p.unidad}
                      onChange={(e) => handleProductoChange(i, "unidad", e.target.value)}
                      className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm w-[40%]">
                    <textarea
                      rows="6"
                      value={p.descripcion}
                      onChange={(e) => handleProductoChange(i, "descripcion", e.target.value)}
                      className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 resize-vertical min-h-[120px]"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      pattern="\d*(\.\d{0,2})?"
                      value={p.pUnit}
                      onChange={(e) => handleProductoChange(i, "pUnit", e.target.value)}
                      className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right">{p.igv.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right">{p.vUnit.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right">{p.total.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => eliminarProducto(i)}
                      className="text-red-600 hover:text-red-700 font-medium text-xs"
                      disabled={productos.length === 1}
                    >
                      <FaTrash className="inline-block mr-1" /> Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* --- Controles para Agregar Productos (Movido aquí) --- */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Agregar Ítem</h3>
          <div className="flex flex-col md:flex-row gap-3">
            <select
              className="flex-1 w-full border p-2 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
              onChange={(e) => {
                const prod = productosDB.find((p) => p._id === e.target.value);
                if (prod) {
                  const pUnit = prod.precioUnitario || 0;
                  if (prod.stock < 1) {
                    toast.error(`Advertencia: El producto ${prod.nombre} no tiene stock disponible.`, { duration: 4000 });
                  }
                  const cantidad = 1;
                  const igv = pUnit * 0.18;
                  const vUnit = pUnit - igv;
                  const total = pUnit * cantidad;
                  setProductos([
                    ...productos,
                    { cantidad, unidad: prod.unidad || "", descripcion: prod.nombre || "", vUnit, igv, pUnit, total, producto: prod._id },
                  ]);
                }
                e.target.value = "";
              }}
            >
              <option value="">Seleccionar Producto del Inventario</option>
              {productosDB.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.nombre} - S/ {p.precioUnitario}
                </option>
              ))}
            </select>

            <select
              className="flex-1 w-full border p-2 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
              onChange={(e) => {
                const herramienta = herramientasDB.find((h) => h._id === e.target.value);
                if (herramienta) {
                  if ((herramienta.cantidad ?? 0) < 1) {
                    toast.error(`Advertencia: La herramienta ${herramienta.nombre} no tiene stock disponible.`, { duration: 4000 });
                  }
                  const pUnit = herramienta.precio || 0;
                  const cantidad = 1;
                  const igv = pUnit * 0.18;
                  const vUnit = pUnit - igv;
                  const total = pUnit * cantidad;
                  const descripcion = `${herramienta.nombre} - ${herramienta.marca} ${herramienta.modelo}`;
                  setProductos([
                    ...productos,
                    { cantidad, unidad: herramienta.unidad || "", descripcion, vUnit, igv, pUnit, total, herramienta: herramienta._id },
                  ]);
                }
                e.target.value = "";
              }}
            >
              <option value="">Seleccionar Herramienta</option>
              {herramientasDB.map((h) => (
                <option key={h._id} value={h._id}>
                  {h.nombre} - {h.marca} {h.modelo} - S/ {h.precio}
                </option>
              ))}
            </select>

            <button
              onClick={agregarProducto}
              className="flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              <FaPlus size={14} /> Manual
            </button>
          </div>
        </div>

        {/* --- Totales --- */}
        <div className="mt-6 flex justify-end border-t pt-4">
          <div className="w-full md:w-1/3 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal:</span>
              <span>{moneda === 'DOLARES' ? '$' : 'S/'} {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Descuento:</span>
              <span>- {moneda === 'DOLARES' ? '$' : 'S/'} {descuentoAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>IGV (18%):</span>
              <span>{moneda === 'DOLARES' ? '$' : 'S/'} {igv.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-800 border-t pt-2 mt-2">
              <span>Total:</span>
              <span>{moneda === 'DOLARES' ? '$' : 'S/'} {total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white border rounded-xl shadow-sm p-4 mb-6">
        <h2 className="font-semibold text-gray-700 mb-3 text-lg">Observaciones</h2>
        <textarea
          rows="4"
          value={observacionesCot}
          onChange={(e) => setObservacionesCot(e.target.value)}
          placeholder="Ingrese olvervaciones adicionales si es necesario"
          className="w-full border border-gray-300 p-2 rounded-md focus:ring-blue-500"
        />
      </section>

      {/* --- Acciones --- */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-end">
        <button
          onClick={guardarCotizacion}
          disabled={!clienteSeleccionado}
          className={`w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors min-h-[44px] ${
            clienteSeleccionado
              ? "bg-yellow-500 hover:bg-yellow-600 text-black"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {isEditing ? "Actualizar Cotización" : "Guardar Cotización"}
        </button>

        <button
          onClick={generarPDF}
          disabled={!clienteSeleccionado || !numeroCotizacion || productos.length === 0}
          className={`w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors min-h-[44px] ${
            clienteSeleccionado && numeroCotizacion && productos.length > 0
              ? "bg-yellow-500 hover:bg-yellow-600 text-black"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Generar PDF
        </button>
      </div>

      {/* --- Modal Cliente --- */}
      {modalCliente && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-6 shadow-lg w-full max-w-2xl">
            <ClienteForm
              clienteEdit={clienteEdit}
              onClienteCreado={handleClienteCreado}
              onClose={() => {
                setModalCliente(false);
                setClienteEdit(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Cotización;
