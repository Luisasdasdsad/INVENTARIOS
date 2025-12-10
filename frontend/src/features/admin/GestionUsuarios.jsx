import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const GestionUsuarios = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user: currentUser } = useAuth(); // Obtener el usuario actual para no modificar su propio rol

  const ROLES = ['superadmin', 'admin', 'jefe_inventario', 'tecnico', 'trabajador'];

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await api.get('/usuarios');
        setUsers(response.data);
        setError(null);
      } catch (err) {
        setError('Error al cargar los usuarios. Asegúrate de tener permisos de Superadmin.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const response = await api.put(`/usuarios/${userId}/rol`, { rol: newRole });
      
      // Actualizar el estado local para reflejar el cambio inmediatamente
      setUsers(users.map(u => (u._id === userId ? response.data : u)));
      
    } catch (err) {
      console.error('Error al actualizar el rol:', err);
      // Opcional: mostrar un mensaje de error al usuario
      alert(err.response?.data?.msg || 'No se pudo actualizar el rol.');
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Cargando usuarios...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500 bg-red-100 rounded-md">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Gestión de Usuarios</h1>
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rol
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{user.nombre}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {currentUser?._id === user._id ? (
                    <span className="font-semibold">{user.rol}</span>
                  ) : (
                    <select
                      value={user.rol}
                      onChange={(e) => handleRoleChange(user._id, e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      {ROLES.map(rol => (
                        <option key={rol} value={rol}>
                          {rol}
                        </option>
                      ))}
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GestionUsuarios;
