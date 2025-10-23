import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../../services/api";
import logo from "../../assets/LogoTG.png";
import ClienteForm from "../clientes/ClienteForm";

const Cotización = () => {
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
  const [direccionEnvio, setDireccionEnvio] = useState("");
  const [contactoCot, setContactoCot] = useState("");
  const [telefonoCot, setTelefonoCot] = useState("");
  const [infoReferencial, setInfoReferencial] = useState("");
  const [tipoCambio, setTipoCambio] = useState("");
  const [tipoCambioLoading, setTipoCambioLoading] = useState(false);
  const [observacionesCot, setObservacionesCot] = useState("");

  // 🔹 Cargar clientes, productos y tipo de cambio
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

    const fetchTipoCambio = async () => {
      setTipoCambioLoading(true);
      try {
        // Try exchangerate-api first (more reliable CORS)
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Exchange Rate API Response:', data); // Debug log
        if (data && data.rates && data.rates.PEN) {
          setTipoCambio(data.rates.PEN.toFixed(3));
        }
      } catch (error) {
        console.error("Error al obtener tipo de cambio:", error);
        // Try SUNAT API as fallback (may have CORS issues)
        try {
          const fallbackResponse = await fetch('https://api.apis.net.pe/v1/tipo-cambio-sunat');
          const fallbackData = await fallbackResponse.json();
          console.log('SUNAT API Response:', fallbackData); // Debug log
          if (fallbackData && fallbackData.compra) {
            setTipoCambio(fallbackData.compra.toString());
          }
        } catch (fallbackError) {
          console.error("Fallback API also failed:", fallbackError);
          // Set a default value if both APIs fail
          setTipoCambio("3.800");
        }
      } finally {
        setTipoCambioLoading(false);
      }
    };

    fetchClientes();
    fetchProductos();
    fetchTipoCambio();
  }, []);

  // 🔹 Manejo de productos
  const handleProductoChange = (index, campo, valor) => {
    const nuevos = [...productos];
    nuevos[index][campo] = valor;
    const vUnit = parseFloat(nuevos[index].vUnit) || 0;
    const cantidad = parseFloat(nuevos[index].cantidad) || 0;
    const total = vUnit * cantidad;
    nuevos[index].igv = total * 0.18;
    nuevos[index].pUnit = vUnit + vUnit * 0.18;
    nuevos[index].total = total + nuevos[index].igv;
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
    const igv = subtotal * 0.18;
    const total = subtotal + igv;
    return { subtotal, igv, total };
  };

  // 🔹 Generar PDF
  const generarPDF = async () => {
    const doc = new jsPDF();

    // Load logo image
    try {
      const response = await fetch(logo);
      const blob = await response.blob();
      const imageData = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
      doc.addImage(imageData, "PNG", 10, 10, 30, 20);
    } catch (error) {
      console.error("Error loading logo:", error);
      // Continue without logo
    }

    doc.setFontSize(14);
    doc.text("COTIZACIÓN", 150, 20);
    doc.setFontSize(10);
    doc.text(`Fecha: ${fecha}`, 150, 27);
    doc.text(`Moneda: ${moneda}`, 150, 32);
    if (tipoCambio) doc.text(`Tipo de Cambio: ${tipoCambio}`, 150, 37);

    const cliente = clientes.find((c) => c._id === clienteSeleccionado);
    doc.text("CLIENTE:", 10, 40);
    if (cliente) {
      doc.text(`Nombre: ${cliente.nombre}`, 30, 40);
      doc.text(`RUC: ${cliente.ruc || "-"}`, 30, 45);
      doc.text(`Dirección: ${cliente.direccion || "-"}`, 30, 50);
      doc.text(`Teléfono: ${cliente.telefono || "-"}`, 30, 55);
      doc.text(`Email: ${cliente.email || "-"}`, 30, 60);
    }

    doc.text("INFORMACIÓN DE ENVÍO:", 10, 70);
    doc.text(`Dirección de Envío: ${direccionEnvio || "-"}`, 30, 75);
    doc.text(`Contacto: ${contactoCot || "-"}`, 30, 80);
    doc.text(`Teléfono: ${telefonoCot || "-"}`, 30, 85);
    doc.text(`Información Referencial: ${infoReferencial || "-"}`, 30, 90);
    if (observacionesCot) {
      doc.text(`Observaciones: ${observacionesCot}`, 30, 95);
    }

    autoTable(doc, {
      startY: 105,
      head: [["N°", "CANT", "UND", "DESCRIPCIÓN", "V. UNIT", "IGV", "P. UNIT", "TOTAL"]],
      body: productos.map((p, i) => [
        i + 1,
        p.cantidad,
        p.unidad,
        p.descripcion,
        p.vUnit.toFixed(2),
        p.igv.toFixed(2),
        p.pUnit.toFixed(2),
        p.total.toFixed(2),
      ]),
    });

    const { subtotal, igv, total } = calcularTotales();
    doc.text(`SUBTOTAL: ${subtotal.toFixed(2)}`, 140, doc.lastAutoTable.finalY + 10);
    doc.text(`IGV (18%): ${igv.toFixed(2)}`, 140, doc.lastAutoTable.finalY + 15);
    doc.text(`TOTAL: ${total.toFixed(2)}`, 140, doc.lastAutoTable.finalY + 20);

    doc.save("Cotizacion.pdf");
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección de Envío</label>
            <input
              type="text"
              value={direccionEnvio}
              onChange={(e) => setDireccionEnvio(e.target.value)}
              className="border border-gray-300 p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contacto</label>
            <input
              type="text"
              value={contactoCot}
              onChange={(e) => setContactoCot(e.target.value)}
              className="border border-gray-300 p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input
              type="text"
              value={telefonoCot}
              onChange={(e) => setTelefonoCot(e.target.value)}
              className="border border-gray-300 p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Información Referencial</label>
            <input
              type="text"
              value={infoReferencial}
              onChange={(e) => setInfoReferencial(e.target.value)}
              className="border border-gray-300 p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
            />
          </div>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Cambio</label>
            <div className="relative">
              <input
                type="number"
                value={tipoCambio}
                onChange={(e) => setTipoCambio(e.target.value)}
                className="border border-gray-300 p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                placeholder={tipoCambioLoading ? "Cargando..." : ""}
                disabled={tipoCambioLoading}
              />
              {tipoCambioLoading && (
                <div className="absolute right-2 top-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Tipo de cambio oficial (SUNAT)</p>
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
            <textarea
              value={observacionesCot}
              onChange={(e) => setObservacionesCot(e.target.value)}
              className="border border-gray-300 p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
              rows="3"
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
                  <th className="p-2 md:p-3 border border-gray-300 text-left text-xs md:text-sm font-medium text-gray-700">Cant</th>
                  <th className="p-2 md:p-3 border border-gray-300 text-left text-xs md:text-sm font-medium text-gray-700">Und</th>
                  <th className="p-2 md:p-3 border border-gray-300 text-left text-xs md:text-sm font-medium text-gray-700">Descripción</th>
                  <th className="p-2 md:p-3 border border-gray-300 text-left text-xs md:text-sm font-medium text-gray-700">V. Unit</th>
                  <th className="p-2 md:p-3 border border-gray-300 text-left text-xs md:text-sm font-medium text-gray-700">IGV</th>
                  <th className="p-2 md:p-3 border border-gray-300 text-left text-xs md:text-sm font-medium text-gray-700">P. Unit</th>
                  <th className="p-2 md:p-3 border border-gray-300 text-left text-xs md:text-sm font-medium text-gray-700">Total</th>
                  <th className="p-2 md:p-3 border border-gray-300 text-left text-xs md:text-sm font-medium text-gray-700">Acciones</th>
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
                      <input
                        value={p.descripcion}
                        onChange={(e) => handleProductoChange(i, "descripcion", e.target.value)}
                        className="w-full border border-gray-300 p-1 md:p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <input
                        type="number"
                        value={p.vUnit}
                        onChange={(e) => handleProductoChange(i, "vUnit", e.target.value)}
                        className="w-full border border-gray-300 p-1 md:p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                      />
                    </td>
                    <td className="border border-gray-300 p-2 text-right text-sm md:text-base">{p.igv.toFixed(2)}</td>
                    <td className="border border-gray-300 p-2 text-right text-sm md:text-base">{p.pUnit.toFixed(2)}</td>
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
              const vUnit = prod.precioUnitario || 0;
              const cantidad = 1;
              const total = vUnit * cantidad;
              const igv = total * 0.18;
              const pUnit = vUnit + vUnit * 0.18;
              setProductos([
                ...productos,
                {
                  cantidad,
                  unidad: prod.unidad || "",
                  descripcion: prod.nombre || "",
                  vUnit,
                  igv,
                  pUnit,
                  total: total + igv
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
          onClick={generarPDF}
          className="bg-indigo-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-md hover:bg-indigo-700 transition-colors min-h-[44px] w-full sm:w-auto text-xs md:text-sm"
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
