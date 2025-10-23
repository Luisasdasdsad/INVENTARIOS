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
  const [fecha, setFecha] = useState(new Date().toLocaleDateString("es-PE"));
  const [modalCliente, setModalCliente] = useState(false);
  const [clienteEdit, setClienteEdit] = useState(null);
  const [direccionEnvio, setDireccionEnvio] = useState("");
  const [contactoCot, setContactoCot] = useState("");
  const [telefonoCot, setTelefonoCot] = useState("");
  const [infoReferencial, setInfoReferencial] = useState("");
  const [tipoCambio, setTipoCambio] = useState("");
  const [observacionesCot, setObservacionesCot] = useState("");

  // 🔹 Cargar clientes y productos
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

  // 🔹 Totales
  const calcularTotales = () => {
    let subtotal = 0;
    productos.forEach((p) => (subtotal += p.total));
    const igv = subtotal * 0.18;
    const total = subtotal + igv;
    return { subtotal, igv, total };
  };

  // 🔹 Generar PDF
  const generarPDF = () => {
    const doc = new jsPDF();
    doc.addImage(logo, "PNG", 10, 10, 30, 20);
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
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Generar Cotización</h1>

      {/* Selección de Cliente */}
      <div className="mb-4 flex gap-2 items-center">
        <select
          className="border p-2 rounded w-1/3"
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
          className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600"
        >
          + Cliente
        </button>
        {clienteSeleccionado && (
          <button
            onClick={handleEditarCliente}
            className="bg-yellow-500 text-white px-3 py-2 rounded hover:bg-yellow-600"
          >
            Editar Cliente
          </button>
        )}
      </div>

      {/* Información de Cotización */}
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Dirección de Envío</label>
          <input
            type="text"
            value={direccionEnvio}
            onChange={(e) => setDireccionEnvio(e.target.value)}
            className="border p-2 w-full rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Contacto</label>
          <input
            type="text"
            value={contactoCot}
            onChange={(e) => setContactoCot(e.target.value)}
            className="border p-2 w-full rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Teléfono</label>
          <input
            type="text"
            value={telefonoCot}
            onChange={(e) => setTelefonoCot(e.target.value)}
            className="border p-2 w-full rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Información Referencial</label>
          <input
            type="text"
            value={infoReferencial}
            onChange={(e) => setInfoReferencial(e.target.value)}
            className="border p-2 w-full rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Fecha de Emisión</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="border p-2 w-full rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Moneda</label>
          <select
            value={moneda}
            onChange={(e) => setMoneda(e.target.value)}
            className="border p-2 w-full rounded"
          >
            <option value="SOLES">SOLES</option>
            <option value="DOLARES">DOLARES</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Tipo de Cambio</label>
          <input
            type="number"
            value={tipoCambio}
            onChange={(e) => setTipoCambio(e.target.value)}
            className="border p-2 w-full rounded"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium">Observaciones</label>
          <textarea
            value={observacionesCot}
            onChange={(e) => setObservacionesCot(e.target.value)}
            className="border p-2 w-full rounded"
            rows="3"
          />
        </div>
      </div>

      {/* Productos */}
      <table className="w-full border mb-4">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Cant</th>
            <th className="p-2 border">Und</th>
            <th className="p-2 border">Descripción</th>
            <th className="p-2 border">V. Unit</th>
            <th className="p-2 border">IGV</th>
            <th className="p-2 border">P. Unit</th>
            <th className="p-2 border">Total</th>
          </tr>
        </thead>
        <tbody>
          {productos.map((p, i) => (
            <tr key={i}>
              <td className="border p-2">
                <input
                  type="number"
                  value={p.cantidad}
                  onChange={(e) => handleProductoChange(i, "cantidad", e.target.value)}
                  className="w-full border p-1 rounded"
                />
              </td>
              <td className="border p-2">
                <input
                  value={p.unidad}
                  onChange={(e) => handleProductoChange(i, "unidad", e.target.value)}
                  className="w-full border p-1 rounded"
                />
              </td>
              <td className="border p-2">
                <input
                  value={p.descripcion}
                  onChange={(e) => handleProductoChange(i, "descripcion", e.target.value)}
                  className="w-full border p-1 rounded"
                />
              </td>
              <td className="border p-2">
                <input
                  type="number"
                  value={p.vUnit}
                  onChange={(e) => handleProductoChange(i, "vUnit", e.target.value)}
                  className="w-full border p-1 rounded"
                />
              </td>
              <td className="border p-2 text-right">{p.igv.toFixed(2)}</td>
              <td className="border p-2 text-right">{p.pUnit.toFixed(2)}</td>
              <td className="border p-2 text-right">{p.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex gap-2 mb-4">
        <select
          className="border p-2 rounded"
          onChange={(e) => {
            const prod = productosDB.find(p => p._id === e.target.value);
            if (prod) {
              setProductos([
                ...productos,
                {
                  cantidad: 1,
                  unidad: prod.unidad || "",
                  descripcion: prod.nombre || "",
                  vUnit: prod.precioUnitario || 0,
                  igv: 0,
                  pUnit: 0,
                  total: 0
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
          className="bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600"
        >
          + Producto Manual
        </button>
        <button
          onClick={generarPDF}
          className="bg-indigo-500 text-white px-3 py-2 rounded hover:bg-indigo-600"
        >
          Generar PDF
        </button>
      </div>

      {/* Modal Cliente */}
      {modalCliente && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
          <ClienteForm
            clienteEdit={clienteEdit}
            onClienteCreado={handleClienteCreado}
            onClose={() => {
              setModalCliente(false);
              setClienteEdit(null);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Cotización;
