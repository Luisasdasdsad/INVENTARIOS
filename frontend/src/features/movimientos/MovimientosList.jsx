import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api.js';

export default function MovimientosList() {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMovimientos = async () => {
      try {
        const res = await api.get('/movimientos');
        setMovimientos(res.data);
      } catch (err) {
        setError('Error al cargar movimientos');
      } finally {
        setLoading(false);
      }
    };

    fetchMovimientos();
  }, []);

  if (loading) return <p>Cargando movimientos...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="p-6 bg-white rounded shadow max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Lista de Movimientos</h2>
        <div className="space-x-2">
          <button
            onClick={() => navigate('/movimientos/registrar?tipo=entrada')}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Registrar Entrada
          </button>
          <button
            onClick={() => navigate('/movimientos/registrar?tipo=salida')}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Registrar Salida
          </button>
        </div>
      </div>

      {movimientos.length === 0 ? (
        <p>No hay movimientos registrados.</p>
      ) : (
        <table className="min-w-full border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-4 py-2 text-left">Tipo</th>
              <th className="border px-4 py-2 text-left">Herramienta</th>
              <th className="border px-4 py-2 text-right">Cantidad</th>
              <th className="border px-4 py-2 text-left">Unidad</th>
              <th className="border px-4 py-2 text-left">Usuario</th>
              <th className="border px-4 py-2 text-left">Fecha</th>
              <th className="border px-4 py-2 text-left">Nota</th>
            </tr>
          </thead>
          <tbody>
            {movimientos.map((mov) => (
              <tr key={mov._id} className="hover:bg-gray-50">
                <td className="border px-4 py-2">
                  <span
                    className={`px-2 py-1 rounded text-white text-sm ${
                      mov.tipo === 'entrada' ? 'bg-green-600' : 'bg-red-600'
                    }`}
                  >
                    {mov.tipo.charAt(0).toUpperCase() + mov.tipo.slice(1)}
                  </span>
                </td>
                <td className="border px-4 py-2">
                  {mov.herramienta ? (
                    <>
                      <strong>{mov.herramienta.nombre}</strong> ({mov.herramienta.codigo})
                    </>
                  ) : (
                    'Herramienta eliminada'
                  )}
                </td>
                <td className="border px-4 py-2 text-right">{mov.cantidad}</td>
                <td className="border px-4 py-2">{mov.herramienta?.unidad || '-'}</td>
                <td className="border px-4 py-2">{mov.usuario?.nombre || 'Desconocido'}</td>
                <td className="border px-4 py-2">
                  {new Date(mov.createdAt).toLocaleString()}
                </td>
                <td className="border px-4 py-2">{mov.nota || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}