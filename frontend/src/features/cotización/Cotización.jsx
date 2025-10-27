import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import api from "../../services/api";
import ClienteForm from "../clientes/ClienteForm";
import generarReporteCotizacion from "../../utils/generarReporteCotización";

const Cotización = () => {
  const location = useLocation();
  const cotizacionEdit = location.state?.cotizacion; // Para edición

  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState("");
  const [productos, setProductos] = useState([
    { cantidad: 1, unidad: "", descripcion: "", vUnit: 0, igv: 0, pUnit: 0, total: 0 },
  ]);
  const [productosDB, setProductosDB] = useState([]);
  const [moneda, setMoneda] = useState("SOLES");
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [modalCliente, setModalCliente] = useState(false);
  const [clienteEdit, setClienteEdit] = useState(null);
  const [observacionesCot, setObservacionesCot] = useState("");
  const [numeroCotizacion, setNumeroCotizacion] = useState("");
  const [descuento, setDescuento] = useState(0);
  const [isEditing, setIsEditing] = useState(false);

  // 🔹 Cargar clientes y productos, y manejar edición
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

    // Si hay una cotización para editar
    if (cotizacionEdit) {
      setIsEditing(true);
      setClienteSeleccionado(cotizacionEdit.cliente._id);
      setProductos(cotizacionEdit.productos.map(p => ({
        cantidad: p.cantidad,
        unidad: p.unidad || "",
        descripcion: p.descripcion,
        vUnit: p.vUnit || 0,
        igv: p.igv || 0,
        pUnit: p.precioUnitario,
        total: p.total,
      })));
      setMoneda(cotizacionEdit.moneda || "SOLES");
      setFecha(new Date(cotizacionEdit.fecha).toISOString().split('T')[0]);
      setObservacionesCot(cotizacionEdit.observaciones || "");
      setNumeroCotizacion(cotizacionEdit.numeroCotizacion);
      setDescuento(cotizacionEdit.descuento || 0);
    }
  }, [cotizacionEdit]);

  // 🔹 Manejo de productos
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

  // 🔹 Totales
  const calcularTotales = () => {
    let subtotal = 0;
    productos.forEach((p) => (subtotal += p.total));
    const descuentoAmount = descuento; // Ahora es un monto directo, no porcentaje
    const discountedSubtotal = subtotal - descuentoAmount;
    const igv = 0; // IGV ya está incluido en los totales de productos
    const total = discountedSubtotal; // El total es el subtotal con descuento (IGV ya incluido)
    return { subtotal, descuentoAmount, discountedSubtotal, igv, total };
  };

  // 🔹 Guardar cotización en BD
  const guardarCotizacion = async () => {
    if (!clienteSeleccionado || !numeroCotizacion) {
      alert("Selecciona un cliente y asigna un número de cotización");
      return false;
    }

    const { discountedSubtotal } = calcularTotales();
    const cotizacionData = {
      cliente: clienteSeleccionado,
      productos: productos.map(p => ({
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

  // 🔹 Generar PDF
  const generarPDF = async () => {
    // Guardar la cotización automáticamente antes de generar el PDF
    const guardadoExitoso = await guardarCotizacion();

    // Solo generar PDF si el guardado fue exitoso
    if (!guardadoExitoso) {
      return;
    }

    const cliente = clientes.find((c) => c._id === clienteSeleccionado);
    const { subtotal, descuentoAmount, discountedSubtotal, igv, total } = calcularTotales();

    await generarReporteCotizacion({
      cliente: {
        nombre: cliente?.nombre || "#N/A",
        documento: cliente?.ruc || cliente?.documento || "#N/A",
        direccion: cliente?.direccion || "#N/A",
        telefono: cliente?.telefono || "#N/A",
      },
      productos: productos.map(p => ({
        cantidad: p.cantidad,
        unidad: p.unidad,
        descripcion: p.descripcion,
        precioUnit: parseFloat(p.pUnit) || 0,
      })),
      subtotal: subtotal,
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

  const handleClienteCreado = (nuevoCliente) => {
    setClientes([...clientes, nuevoCliente]);
    setClienteSeleccionado(nuevoCliente._id);
  };

  const handleEditarCliente = () => {
    const cliente = clientes.find((c) => c._id === clienteSeleccionado);
    if (cliente) {
      setClienteEdit(cliente);
      setModalCliente(true);
    }
  };

  return (
    <div className="p-2 md:p-4 lg:p-6 max-w-7xl w-full mx-auto">
      <h1 className="text-lg md:text-xl lg:text-2xl font-bold mb-4 md:mb-6 text-gray-800">Generar Cotización</h1>

      {/* Selección de Cliente */}
      <div className="mb-4 md:mb-6 flex flex-col sm:flex-row gap-2 items-start sm:items-center">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <select
            className="border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64 text-sm md:text-base"
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
          <button
            onClick={() => {
              setClienteEdit(null);
              setModalCliente(true);
            }}
            className="bg-blue-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-md hover:bg-blue-700 transition-colors min-h-[44px] w-full sm:w-auto text-xs md:text-sm"
          >
            + Nuevo Cliente
          </button>
          {clienteSeleccionado && (
            <button
              onClick={handleEditarCliente}
              className="bg-yellow-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-md hover:bg-yellow-700 transition-colors min-h-[44px] w-full sm:w-auto text-xs md:text-sm"
            >
              Editar Cliente
            </button>
          )}
        </div>
      </div>

      {/* Información de Cotización */}
      <div className="mb-4 md:mb-6 bg-white p-4 md:p-6 rounded-lg shadow-sm border">
        <h2 className="text-base md:text-lg font-semibold mb-4 text-gray-800">Información de Cotización</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Emisión</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="border border-gray-300 p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
            <select
              value={moneda}
              onChange={(e) => setMoneda(e.target.value)}
              className="border border-gray-300 p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
            >
              <option value="SOLES">SOLES</option>
              <option value="DOLARES">DOLARES</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Número de Cotización</label>
            <input
              type="text"
              value={numeroCotizacion}
              onChange={(e) => setNumeroCotizacion(e.target.value)}
              placeholder="001"
              className="border border-gray-300 p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descuento (monto)</label>
            <input
              type="number"
              min="0"
              value={descuento}
              onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)}
              className="border border-gray-300 p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
            />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
            <textarea
              value={observacionesCot}
              onChange={(e) => setObservacionesCot(e.target.value)}
              className="border border-gray-300 p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
              rows="8"
            />
          </div>
        </div>
      </div>

      {/* Productos */}
      <div className="mb-4 md:mb-6 bg-white rounded-lg shadow-sm border overflow-x-auto">
        <h2 className="text-base md:text-lg font-semibold p-4 md:p-6 pb-0 text-gray-800">Productos</h2>
        <div className="p-4 md:p-6 pt-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 md:p-3 border border-gray-300 text-left text-xs md:text-sm font-medium text-gray-700 w-20">Cant</th>
                  <th className="p-2 md:p-3 border border-gray-300 text-left text-xs md:text-sm font-medium text-gray-700 w-24">Und</th>
                  <th className="p-2 md:p-3 border border-gray-300 text-left text-xs md:text-sm font-medium text-gray-700">Descripción</th>
                  <th className="p-2 md:p-3 border border-gray-300 text-left text-xs md:text-sm font-medium text-gray-700 w-20">P. Unit</th>
                  <th className="p-2 md:p-3 border border-gray-300 text-left text-xs md:text-sm font-medium text-gray-700 w-16">IGV</th>
                  <th className="p-2 md:p-3 border border-gray-300 text-left text-xs md:text-sm font-medium text-gray-700 w-20">V. Unit</th>
                  <th className="p-2 md:p-3 border border-gray-300 text-left text-xs md:text-sm font-medium text-gray-700 w-20">Total</th>
                  <th className="p-2 md:p-3 border border-gray-300 text-left text-xs md:text-sm font-medium text-gray-700 w-24">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((p, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-2">
                      <input
                        type="number"
                        min="1"
                        value={p.cantidad}
                        onChange={(e) => handleProductoChange(i, "cantidad", e.target.value)}
                        className="w-full border border-gray-300 p-1 md:p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <input
                        value={p.unidad}
                        onChange={(e) => handleProductoChange(i, "unidad", e.target.value)}
                        className="w-full border border-gray-300 p-1 md:p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <textarea
                        value={p.descripcion}
                        onChange={(e) => handleProductoChange(i, "descripcion", e.target.value)}
                        className="w-full border border-gray-300 p-1 md:p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base resize-none"
                        rows="5"
                        placeholder="Descripción del producto"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <input
                        type="number"
                        min="0"
                        value={p.pUnit}
                        onChange={(e) => handleProductoChange(i, "pUnit", e.target.value)}
                        className="w-full border border-gray-300 p-1 md:p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                      />
                    </td>
                    <td className="border border-gray-300 p-2 text-right text-sm md:text-base">{p.igv.toFixed(2)}</td>
                    <td className="border border-gray-300 p-2 text-right text-sm md:text-base">{p.vUnit.toFixed(2)}</td>
                    <td className="border border-gray-300 p-2 text-right text-sm md:text-base">{p.total.toFixed(2)}</td>
                    <td className="border border-gray-300 p-2">
                      <button
                        onClick={() => eliminarProducto(i)}
                        className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 text-xs"
                        disabled={productos.length === 1}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4 md:mb-6">
        <select
          className="border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto text-sm md:text-base"
          onChange={(e) => {
            const prod = productosDB.find(p => p._id === e.target.value);
            if (prod) {
              const pUnit = prod.precioUnitario || 0;
              const cantidad = 1;
              const igv = pUnit * 0.18;
              const vUnit = pUnit - igv;
              const total = pUnit * cantidad;
              setProductos([
                ...productos,
                {
                  cantidad,
                  unidad: prod.unidad || "",
                  descripcion: prod.nombre || "",
                  vUnit,
                  igv,
                  pUnit,
                  total
                },
              ]);
            }
            e.target.value = "";
          }}
        >
          <option value="">Seleccionar Producto de BD</option>
          {productosDB.map((p) => (
            <option key={p._id} value={p._id}>
              {p.nombre} - S/ {p.precioUnitario}
            </option>
          ))}
        </select>
        <button
          onClick={agregarProducto}
          className="bg-green-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-md hover:bg-green-700 transition-colors min-h-[44px] w-full sm:w-auto text-xs md:text-sm"
        >
          + Producto Manual
        </button>
        <button
          onClick={guardarCotizacion}
          disabled={!clienteSeleccionado}
          className={`px-3 py-2 md:px-4 md:py-2 rounded-md transition-colors min-h-[44px] w-full sm:w-auto text-xs md:text-sm ${
            clienteSeleccionado
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-gray-400 text-gray-700 cursor-not-allowed"
          }`}
        >
          {isEditing ? "Actualizar Cotización" : "Guardar Cotización"}
        </button>
        <button
          onClick={generarPDF}
          disabled={!clienteSeleccionado || !numeroCotizacion || productos.length === 0}
          className={`px-3 py-2 md:px-4 md:py-2 rounded-md transition-colors min-h-[44px] w-full sm:w-auto text-xs md:text-sm ${
            clienteSeleccionado && numeroCotizacion && productos.length > 0
              ? "bg-indigo-600 text-white hover:bg-indigo-700"
              : "bg-gray-400 text-gray-700 cursor-not-allowed"
          }`}
        >
          Generar PDF
        </button>
      </div>

      {/* Modal Cliente */}
      {modalCliente && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
