import { useState, useEffect } from 'react';
import api from '../../services/api.js';

export default function HerramientaForm({ herramienta, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    nombre: '',
    marca: '',
    modelo: '',
    serie: '',
    cantidad: '',
    unidad: 'unidad',
    estado: 'disponible',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (herramienta) {
      setFormData({
        nombre: herramienta.nombre || '',
        marca: herramienta.marca || '',
        modelo: herramienta.modelo || '',
        serie: herramienta.serie || '',
        cantidad: herramienta.cantidad || '',
        unidad: herramienta.unidad || 'unidad',
        estado: herramienta.estado || 'disponible',
      });
    } else {
      setFormData({
        nombre: '',
        marca: '',
        modelo: '',
        serie: '',
        cantidad: '',
        unidad: 'unidad',
        estado: 'disponible',
      });
    }
  }, [herramienta]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validación simple (solo lo esencial)
    if (!formData.nombre || !formData.marca || !formData.modelo) {
      setError('Nombre, marca y modelo son requeridos');
      setLoading(false);
      return;
    }
    const cantidadNum = parseInt(formData.cantidad);
    if (isNaN(cantidadNum) || cantidadNum < 1) {
      setError('Cantidad debe ser un número mayor o igual a 1');
      setLoading(false);
      return;
    }

    // Preparar datos (cantidad como número)
    const dataToSend = {
      ...formData,
      cantidad: cantidadNum,
    };

    try {
      if (herramienta) {
        await api.put(`/herramientas/${herramienta._id}`, dataToSend);
        alert('Herramienta actualizada con éxito.');
      } else {
        await api.post('/herramientas', dataToSend);
        alert('Herramienta creada con éxito.');
        // Resetear form al crear
        setFormData({
          nombre: '',
          marca: '',
          modelo: '',
          serie: '',
          cantidad: '',
          unidad: 'unidad',
          estado: 'disponible',
        });
      }
      onSuccess();
    } catch (err) {
      // Manejo simple de errores
      let errorMessage = 'Error al guardar la herramienta';
      if (err.response?.data) {
        const data = err.response.data;
        if (data.message) {
          errorMessage = data.message;
        } else if (data.errors) {
          // Resumen de errores de validación (Mongoose)
          errorMessage = Object.values(data.errors)
            .map(e => e.message)
            .join(', ');
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg max-h-[90vh] overflow-y-auto"> {/* Responsive height para modales */}
      <h2 className="text-xl md:text-2xl font-bold mb-4 text-gray-800">
        {herramienta ? 'Editar Herramienta' : 'Crear Nueva Herramienta'}
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
            className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" // Más alto en mobile
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> {/* Apila en mobile */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Marca *</label>
            <input
              type="text"
              name="marca"
              value={formData.marca}
              onChange={handleChange}
              required
              className="w-full px-3 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" // py-3 para touch
              placeholder="Ej. Stanley"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Modelo *</label>
            <input
              type="text"
              name="modelo"
              value={formData.modelo}
              onChange={handleChange}
              required
              className="w-full px-3 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej. STHT0-72413"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Serie (opcional)</label>
            <input
              type="text"
              name="serie"
              value={formData.serie}
              onChange={handleChange}
              className="w-full px-3 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej. ABC123"
            />
          </div>
        </div>
        <div>
          <label htmlFor="cantidad" className="block text-sm font-medium text-gray-700 mb-1">
            Cantidad *
          </label>
          <input
            type="number"
            id="cantidad"
            name="cantidad"
            value={formData.cantidad}
            onChange={handleChange}
            required
            min="1"
            className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="unidad" className="block text-sm font-medium text-gray-700 mb-1">
            Unidad
          </label>
          <input
            type="text"
            id="unidad"
            name="unidad"
            value={formData.unidad}
            onChange={handleChange}
            className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-1">
            Estado
          </label>
          <select
            id="estado"
            name="estado"
            value={formData.estado}
            onChange={handleChange}
            className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="disponible">Disponible</option>
            <option value="prestado">Prestado</option>
          </select>
        </div>

        {error && (
          <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md border border-red-200"> {/* Más visible en mobile */}
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 min-h-[44px]" // Full-width y alto en mobile
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 min-h-[44px]"
            disabled={loading}
          >
            {loading ? 'Guardando...' : (herramienta ? 'Actualizar' : 'Crear')}
          </button>
        </div>
      </form>
    </div>
  );
}