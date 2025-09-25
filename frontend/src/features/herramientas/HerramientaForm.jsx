import { useState, useEffect } from 'react';
import api from '../../services/api.js'; // Asegúrate de que la ruta sea correcta

export default function HerramientaForm({ herramienta, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    cantidad: '',
    unidad: 'unidad',
    estado: 'disponible',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (herramienta) {
      setFormData({
        nombre: herramienta.nombre,
        codigo: herramienta.codigo,
        cantidad: herramienta.cantidad,
        unidad: herramienta.unidad,
        estado: herramienta.estado,
      });
    } else {
      setFormData({
        nombre: '',
        codigo: '',
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
    setError(null);
    try {
      if (herramienta) {
        await api.put(`/herramientas/${herramienta._id}`, formData);
        alert('Herramienta actualizada con éxito.');
      } else {
        await api.post('/herramientas', formData);
        alert('Herramienta creada con éxito.');
      }
      onSuccess(); // Llama a la función de éxito para recargar la lista
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar la herramienta');
      console.error('Error al guardar herramienta:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">
        {herramienta ? 'Editar Herramienta' : 'Crear Nueva Herramienta'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre</label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <div>
          <label htmlFor="codigo" className="block text-sm font-medium text-gray-700">Código</label>
          <input
            type="text"
            id="codigo"
            name="codigo"
            value={formData.codigo}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <div>
          <label htmlFor="cantidad" className="block text-sm font-medium text-gray-700">Cantidad</label>
          <input
            type="number"
            id="cantidad"
            name="cantidad"
            value={formData.cantidad}
            onChange={handleChange}
            required
            min="0"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <div>
          <label htmlFor="unidad" className="block text-sm font-medium text-gray-700">Unidad</label>
          <input
            type="text"
            id="unidad"
            name="unidad"
            value={formData.unidad}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <div>
          <label htmlFor="estado" className="block text-sm font-medium text-gray-700">Estado</label>
          <select
            id="estado"
            name="estado"
            value={formData.estado}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          >
            <option value="disponible">Disponible</option>
            <option value="prestado">Prestado</option>
          </select>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? 'Guardando...' : (herramienta ? 'Actualizar' : 'Crear')}
          </button>
        </div>
      </form>
    </div>
  );
}