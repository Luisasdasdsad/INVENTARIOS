import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import api from "../../services/api";
import ClienteForm from "../clientes/ClienteForm";
import generarReporteCotizacion from "../../utils/generarReporteCotización";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";

const Cotización = () => {
  const location = useLocation();
  const cotizacionEdit = location.state?.cotizacion;

  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState("");
  const [productos, setProductos] = useState([
    { cantidad: 1, unidad: "", descripcion: "", vUnit: 0, igv: 0, pUnit: 0, total: 0 },
  ]);
  const [productosDB, setProductosDB] = useState([]);
  const [moneda, setMoneda] = useState("SOLES");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [modalCliente, setModalCliente] = useState(false);
  const [clienteEdit, setClienteEdit] = useState(null);
  const [observacionesCot, setObservacionesCot] = useState("");
  const [numeroCotizacion, setNumeroCotizacion] = useState("");
  const [descuento, setDescuento] = useState(0);
  const [isEditing, setIsEditing] = useState(false);

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

    fetchClientes();
    fetchProductos();

    if (cotizacionEdit) {
      setIsEditing(true);
      setClienteSeleccionado(cotizacionEdit.cliente._id);
      setProductos(
        cotizacionEdit.productos.map((p) => ({
          cantidad: p.cantidad,
          unidad: p.unidad || "",
          descripcion: p.descripcion,
          vUnit: p.vUnit || 0,
          igv: p.igv || 0,
          pUnit: p.precioUnitario,
          total: p.total,
        }))
      );
      setMoneda(cotizacionEdit.moneda || "SOLES");
      setFecha(new Date(cotizacionEdit.fecha).toISOString().split("T")[0]);
      setObservacionesCot(cotizacionEdit.observaciones || "");
      setNumeroCotizacion(cotizacionEdit.numeroCotizacion);
      setDescuento(cotizacionEdit.descuento || 0);
    }
  }, [cotizacionEdit]);

  // === Manejo de productos ===
  const handleProductoChange = (index, campo, valor) => {
    const nuevos = [...productos];
    nuevos[index][campo] = valor;
    const pUnit = parseFloat(nuevos[index].pUnit) || 0;
    const cantidad = parseFloat(nuevos[index].cantidad) || 0;
    nuevos[index].igv = pUnit * 0.18;
    nuevos[index].vUnit = pUnit - nuevos[index].igv;
    nuevos[index].total = pUnit * cantidad;
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

  // === Totales ===
  const calcularTotales = () => {
    let subtotal = productos.reduce((acc, p) => acc + p.total, 0);
    const descuentoAmount = descuento;
    const discountedSubtotal = subtotal - descuentoAmount;
    const igv = 0;
    const total = discountedSubtotal;
    return { subtotal, descuentoAmount, discountedSubtotal, igv, total };
  };

  // === Guardar cotización ===
  const guardarCotizacion = async () => {
    if (!clienteSeleccionado || !numeroCotizacion) {
      alert("Selecciona un cliente y asigna un número de cotización");
      return false;
    }

    const { discountedSubtotal } = calcularTotales();
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
      })),
      fecha,
      totalGeneral: discountedSubtotal,
      descuento,
      moneda,
      observaciones: observacionesCot,
      numeroCotizacion,
    };

    try {
      if (isEditing && cotizacionEdit) {
        await api.put(`/cotizaciones/${cotizacionEdit._id}`, cotizacionData);
        alert("Cotización actualizada exitosamente");
      } else {
        await api.post("/cotizaciones", cotizacionData);
        alert("Cotización guardada exitosamente");
      }
      return true;
    } catch (error) {
      console.error("Error al guardar cotización:", error);
      if (error.response?.status === 400 && error.response?.data?.msg?.includes("duplicate key")) {
        alert("El número de cotización ya existe. Por favor, usa un número único.");
      } else {
        alert("Error al guardar la cotización: " + (error.response?.data?.msg || error.message));
      }
      return false;
    }
  };

  // === Generar PDF ===
  const generarPDF = async () => {
    const guardadoExitoso = await guardarCotizacion();
    if (!guardadoExitoso) return;

    const cliente = clientes.find((c) => c._id === clienteSeleccionado);
    const { subtotal, descuentoAmount, discountedSubtotal, igv } = calcularTotales();

    await generarReporteCotizacion({
      cliente: {
        nombre: cliente?.nombre || "#N/A",
        documento: cliente?.ruc || cliente?.documento || "#N/A",
        direccion: cliente?.direccion || "#N/A",
        telefono: cliente?.telefono || "#N/A",
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
      total: discountedSubtotal,
      fecha,
      moneda,
      numeroCotizacion: numeroCotizacion || "001",
      condicionPago: "CONTADO",
      validez: "15 días",
      observaciones: observacionesCot,
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
  };

  const handleEditarCliente = () => {
    const cliente = clientes.find((c) => c._id === clienteSeleccionado);
    if (cliente) {
      setClienteEdit(cliente);
      setModalCliente(true);
    }
  };

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
          <select
            className="border border-gray-300 p-2 rounded-md flex-1 focus:ring-2 focus:ring-blue-500"
            value={clienteSeleccionado}
            onChange={(e) => setClienteSeleccionado(e.target.value)}
          >
            <option value="">Seleccionar Cliente</option>
            {clientes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.nombre}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setClienteEdit(null);
                setModalCliente(true);
              }}
              className="flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-black font-medium px-4 py-2 rounded-lg shadow-sm transition-colors text-sm"
            >
              <FaPlus size={14} /> Nuevo
            </button>
            {clienteSeleccionado && (
              <button
                onClick={handleEditarCliente}
                className="flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-black font-medium px-4 py-2 rounded-lg shadow-sm transition-colors text-sm"
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          <div>
            <label className="text-sm text-gray-600">N° Cotización</label>
            <input
              type="text"
              value={numeroCotizacion}
              onChange={(e) => setNumeroCotizacion(e.target.value)}
              placeholder="Ej. 001"
              className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Moneda</label>
            <select
              value={moneda}
              onChange={(e) => setMoneda(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="SOLES">SOLES</option>
              <option value="DOLARES">DÓLARES</option>
            </select>
          </div>
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
        </div>

        <div className="mt-4">
          <label className="text-sm text-gray-600">Observaciones</label>
          <textarea
            rows="4"
            value={observacionesCot}
            onChange={(e) => setObservacionesCot(e.target.value)}
            placeholder="Ingrese observaciones adicionales si es necesario"
            className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500"
          />
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
      </section>

      {/* --- Acciones --- */}
      <div className="flex flex-wrap gap-3 justify-end">
        <select
          className="border p-2 rounded-md focus:ring-2 focus:ring-blue-500"
          onChange={(e) => {
            const prod = productosDB.find((p) => p._id === e.target.value);
            if (prod) {
              const pUnit = prod.precioUnitario || 0;
              const cantidad = 1;
              const igv = pUnit * 0.18;
              const vUnit = pUnit - igv;
              const total = pUnit * cantidad;
              setProductos([
                ...productos,
                { cantidad, unidad: prod.unidad || "", descripcion: prod.nombre || "", vUnit, igv, pUnit, total },
              ]);
            }
            e.target.value = "";
          }}
        >
          <option value="">Seleccionar Producto</option>
          {productosDB.map((p) => (
            <option key={p._id} value={p._id}>
              {p.nombre} - S/ {p.precioUnitario}
            </option>
          ))}
        </select>

        <button
          onClick={agregarProducto}
          className="flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-black font-medium px-4 py-2 rounded-lg shadow-sm transition-colors text-sm"
        >
          <FaPlus size={14} /> Producto Manual
        </button>

        <button
          onClick={guardarCotizacion}
          disabled={!clienteSeleccionado}
          className={`px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors ${
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
          className={`px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors ${
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
