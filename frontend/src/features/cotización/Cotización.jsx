import { useState, useEffect } from "react";
import generarReporteCotizacion from "../../utils/generarReporteCotización";
import api from '../../services/api.js';

const Cotización = () => {
  const [clientes, setClientes] = useState([]);
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [cliente, setCliente] = useState({
    nombre: "",
    documento: "",
    telefono: "",
    email: "",
    direccion: "",
    empresa: "",
  });
  const [selectedClienteId, setSelectedClienteId] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [moneda, setMoneda] = useState("PEN");
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const response = await api.get('/clientes');
        setClientes(response.data);
      } catch (error) {
        console.error('Error fetching clientes:', error);
      }
    };
    const fetchProductos = async () => {
      try {
        const response = await api.get('/productos');
        setProductosDisponibles(response.data);
      } catch (error) {
        console.error('Error fetching productos:', error);
      }
    };
    fetchClientes();
    fetchProductos();
  }, []);

  const handleClienteChange = (e) => {
    const { name, value } = e.target;
    setCliente({ ...cliente, [name]: value });
  };

  const handleSelectCliente = (e) => {
    const id = e.target.value;
    setSelectedClienteId(id);
    if (id) {
      const selected = clientes.find(c => c._id === id);
      setCliente({
        nombre: selected.nombre,
        documento: selected.documento,
        telefono: selected.telefono,
        email: selected.email,
        direccion: selected.direccion,
        empresa: selected.empresa,
      });
    } else {
      setCliente({
        nombre: "",
        documento: "",
        telefono: "",
        email: "",
        direccion: "",
        empresa: "",
      });
    }
  };

  const addProducto = () => {
    setProductos([...productos, { productoId: "", descripcion: "", cantidad: 1, precioUnit: 0 }]);
  };

  const updateProducto = (index, field, value) => {
    const newProductos = [...productos];
    newProductos[index][field] = value;
    if (field === 'productoId') {
      const selectedProd = productosDisponibles.find(p => p._id === value);
      if (selectedProd) {
        newProductos[index].descripcion = selectedProd.nombre;
        newProductos[index].precioUnit = selectedProd.precioUnitario;
      }
    }
    setProductos(newProductos);
  };

  const removeProducto = (index) => {
    setProductos(productos.filter((_, i) => i !== index));
  };

  const subtotal = productos.reduce(
    (acc, p) => acc + p.cantidad * p.precioUnit,
    0
  );
  const igv = subtotal * 0.18;
  const total = subtotal + igv;

  const handleGenerar = () => {
    const numeroCotizacion = "COT-001"; // Hardcoded for now
    generarReporteCotizacion({ cliente, productos, subtotal, igv, total, fecha, moneda, numeroCotizacion });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Generar Cotización</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sección Cliente */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Cliente</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Seleccionar Cliente Existente</label>
            <select
              value={selectedClienteId}
              onChange={handleSelectCliente}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Nuevo Cliente</option>
              {clientes.map(c => (
                <option key={c._id} value={c._id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <input
              type="text"
              name="nombre"
              placeholder="Nombre"
              value={cliente.nombre}
              onChange={handleClienteChange}
              className="p-2 border border-gray-300 rounded-md"
            />
            <input
              type="text"
              name="documento"
              placeholder="Documento (RUC/DNI)"
              value={cliente.documento}
              onChange={handleClienteChange}
              className="p-2 border border-gray-300 rounded-md"
            />
            <input
              type="text"
              name="telefono"
              placeholder="Teléfono"
              value={cliente.telefono}
              onChange={handleClienteChange}
              className="p-2 border border-gray-300 rounded-md"
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={cliente.email}
              onChange={handleClienteChange}
              className="p-2 border border-gray-300 rounded-md"
            />
            <input
              type="text"
              name="direccion"
              placeholder="Dirección"
              value={cliente.direccion}
              onChange={handleClienteChange}
              className="p-2 border border-gray-300 rounded-md"
            />
            <input
              type="text"
              name="empresa"
              placeholder="Empresa"
              value={cliente.empresa}
              onChange={handleClienteChange}
              className="p-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>

        {/* Sección Configuraciones */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Configuraciones</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Fecha</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Moneda</label>
              <select
                value={moneda}
                onChange={(e) => setMoneda(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="PEN">PEN</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Sección Productos */}
      <div className="mt-6 bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Productos/Servicios</h3>
        <button
          onClick={addProducto}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 mb-4"
        >
          Agregar Producto
        </button>
        <table className="w-full table-auto border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2">Producto</th>
              <th className="border border-gray-300 p-2">Descripción</th>
              <th className="border border-gray-300 p-2">Cantidad</th>
              <th className="border border-gray-300 p-2">Precio Unit.</th>
              <th className="border border-gray-300 p-2">Total</th>
              <th className="border border-gray-300 p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p, index) => (
              <tr key={index}>
                <td className="border border-gray-300 p-2">
                  <select
                    value={p.productoId}
                    onChange={(e) => updateProducto(index, 'productoId', e.target.value)}
                    className="w-full p-1 border border-gray-300 rounded"
                  >
                    <option value="">Seleccionar</option>
                    {productosDisponibles.map(prod => (
                      <option key={prod._id} value={prod._id}>{prod.nombre}</option>
                    ))}
                  </select>
                </td>
                <td className="border border-gray-300 p-2">
                  <input
                    type="text"
                    value={p.descripcion}
                    onChange={(e) => updateProducto(index, 'descripcion', e.target.value)}
                    className="w-full p-1 border border-gray-300 rounded"
                  />
                </td>
                <td className="border border-gray-300 p-2">
                  <input
                    type="number"
                    value={p.cantidad}
                    onChange={(e) => updateProducto(index, 'cantidad', parseInt(e.target.value))}
                    className="w-full p-1 border border-gray-300 rounded"
                  />
                </td>
                <td className="border border-gray-300 p-2">
                  <input
                    type="number"
                    step="0.01"
                    value={p.precioUnit}
                    onChange={(e) => updateProducto(index, 'precioUnit', parseFloat(e.target.value))}
                    className="w-full p-1 border border-gray-300 rounded"
                  />
                </td>
                <td className="border border-gray-300 p-2">
                  {(p.cantidad * p.precioUnit).toFixed(2)}
                </td>
                <td className="border border-gray-300 p-2">
                  <button
                    onClick={() => removeProducto(index)}
                    className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 text-right">
          <p>Subtotal: {moneda} {subtotal.toFixed(2)}</p>
          <p>IGV (18%): {moneda} {igv.toFixed(2)}</p>
          <p>Total: {moneda} {total.toFixed(2)}</p>
        </div>
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={handleGenerar}
          className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
        >
          Generar PDF
        </button>
      </div>
    </div>
  );
};

export default Cotización;
