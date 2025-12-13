import { useState, useEffect } from 'react';
import api from '../../services/api.js';
import PhotoCapture from '../../components/PhotoCapture/PhotoCapture';

export default function ProductoForm({ producto, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    unidad: 'unidad',
    stock: '',
    precioUnitario: '',
    categoria: '',
    marca: '',
    modelo: '',
    moneda: 'SOLES',
  });

  // Estado para la URL de la foto
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (producto) {
      setFormData({
        nombre: producto.nombre || '',
        descripcion: producto.descripcion || '',
        unidad: producto.unidad || 'unidad',
        stock: producto.stock || '',
        precioUnitario: producto.precioUnitario || '',
        categoria: producto.categoria || '',
        marca: producto.marca || '',
        modelo: producto.modelo || '',
        moneda: producto.moneda || 'SOLES',
      });
      setPreview(producto.foto || '');
    } else {
      setFormData({
        nombre: '',
        descripcion: '',
        unidad: 'unidad',
        stock: '',
        precioUnitario: '',
        categoria: '',
        marca: '',
        modelo: '',
        moneda: 'SOLES',
      });
      setPreview('');
    }
  }, [producto]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => data.append(key, value));

      // Si hay una URL de foto, la enviamos como fotoUrl
      if (preview) {
        data.append("fotoUrl", preview); // El backend debe soportar recibir la URL si la imagen ya se subió
      }

      if (producto) {
        await api.put(`/productos/${producto._id}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert("Producto actualizado con éxito.");
      } else {
        await api.post("/productos", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert("Producto creado con éxito.");
      }

      onSuccess();
    } catch (err) {
      setError("Error al guardar el producto: " + (err.response?.data?.msg || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg max-h-[90vh] overflow-y-auto">
      <h2 className="text-xl md:text-2xl font-bold mb-4 text-gray-800">
        {producto ? 'Editar Producto' : 'Crear Nuevo Producto'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre *
          </label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
            className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Categoría *</label>
            <select
              name="categoria"
              value={formData.categoria}
              onChange={handleChange}
              required
              className="w-full px-3 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecciona una categoría</option>
              <option value="materiales">Materiales</option>
              <option value="herramientas">Herramientas</option>
              <option value="útiles de escritorio">Útiles de escritorio</option>
              <option value="equipos de computo">Equipos de computo</option>
              <option value="muebles">Muebles</option>
              <option value="útiles de aseo">Útiles de aseo</option>
              <option value="equipo de protección personal (EPPS)">Equipo de protección personal (EPPS)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Unidad</label>
            <input
              type="text"
              name="unidad"
              value={formData.unidad}
              onChange={handleChange}
              className="w-full px-3 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej. unidad, kg, litros"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">
              Stock *
            </label>
            <input
              type="number"
              id="stock"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              required
              min="0"
              step="any"
              inputMode="decimal"
              placeholder="Ej. 5.5"
              className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="precioUnitario" className="block text-sm font-medium text-gray-700 mb-1">
              Precio Unitario ({formData.moneda === 'DOLARES' ? '$' : 'S/.'})
            </label>
            <input
              type="number"
              id="precioUnitario"
              name="precioUnitario"
              value={formData.precioUnitario}
              onChange={handleChange}
              min="0"
              step="0.01"
              placeholder="Ej. 120.50"
              className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="marca" className="block text-sm font-medium text-gray-700 mb-1">
              Marca
            </label>
            <input
              type="text"
              id="marca"
              name="marca"
              value={formData.marca}
              onChange={handleChange}
              className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej. Samsung, HP"
            />
          </div>
          <div>
            <label htmlFor="modelo" className="block text-sm font-medium text-gray-700 mb-1">
              Modelo
            </label>
            <input
              type="text"
              id="modelo"
              name="modelo"
              value={formData.modelo}
              onChange={handleChange}
              className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej. Galaxy S21, Pavilion"
            />
          </div>
          <div>
            <label htmlFor="moneda" className="block text-sm font-medium text-gray-700 mb-1">
              Moneda
            </label>
            <select
              id="moneda"
              name="moneda"
              value={formData.moneda}
              onChange={handleChange}
              className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="SOLES">SOLES (S/.)</option>
              <option value="DOLARES">DÓLARES ($)</option>
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            id="descripcion"
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            rows="3"
            placeholder="Detalles adicionales del producto..."
            className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* SECCIÓN DE FOTO REUTILIZABLE */}
        <PhotoCapture 
          onCapture={(url) => setPreview(url)} 
          currentPhoto={preview} 
          fileNamePrefix={`producto-${formData.nombre ? formData.nombre.trim().replace(/\s+/g, '_') : 'nuevo'}`}
        />

        {error && (
          <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md border border-red-200">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 min-h-[44px]"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 min-h-[44px]"
            disabled={loading}
          >
            {loading ? 'Guardando...' : (producto ? 'Actualizar' : 'Crear')}
          </button>
        </div>
      </form>
    </div>
  );
}
