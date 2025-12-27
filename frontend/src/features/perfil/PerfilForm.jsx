import { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { useAuth } from '../../contexts/AuthContext';
import { FaUser, FaEnvelope, FaLock, FaSave, FaEye, FaEyeSlash, FaUsers, FaEdit, FaPhone, FaMobileAlt, FaMapMarkerAlt, FaTrash, FaSearch } from 'react-icons/fa';
import Modal from '../../components/Modal/Modal';
import ModalConfirmacion from '../../components/ModalConfirmacion';

export default function PerfilForm() {
  const { user, login, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [usuarios, setUsuarios] = useState([]);
  const [selectedUsuario, setSelectedUsuario] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [modalConfirmacion, setModalConfirmacion] = useState({
    show: false,
    title: "",
    message: "",
    confirmText: "Confirmar",
    isDestructive: true,
    action: null,
    data: null
  });

  // Estado para perfil
  const [profileData, setProfileData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    celular: '',
    direccion: ''
  });

  // Estado para cambio de contraseña
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        nombre: user.nombre || '',
        email: user.email || '',
        telefono: user.telefono || '',
        celular: user.celular || '',
        direccion: user.direccion || ''
      });
    }
  }, [user]);

  // Cargar usuarios si es admin
  useEffect(() => {
    if (user?.rol === 'admin' || user?.rol === 'superadmin') {
      fetchUsuarios();
    }
  }, [user]);

  const fetchUsuarios = async () => {
    try {
      const response = await api.get('/usuarios');
      setUsuarios(response.data);
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
    }
  };

  const handleEditUsuario = (usuario) => {
    setSelectedUsuario({ ...usuario });
    setShowModal(true);
  };

  const handleUpdateUsuario = async () => {
    try {
      await api.put(`/usuarios/${selectedUsuario._id}`, {
        nombre: selectedUsuario.nombre,
        email: selectedUsuario.email,
        rol: selectedUsuario.rol,
        telefono: selectedUsuario.telefono,
        celular: selectedUsuario.celular,
        direccion: selectedUsuario.direccion
      });
      setSuccess('Usuario actualizado exitosamente');
      setShowModal(false);
      fetchUsuarios(); // Recargar lista
    } catch (err) {
      setError(err.response?.data?.msg || 'Error al actualizar usuario');
    }
  };

  const handleDeleteUsuario = (userId) => {
    setModalConfirmacion({
      show: true,
      title: "¿Eliminar usuario?",
      message: "¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.",
      confirmText: "Sí, eliminar",
      isDestructive: true,
      action: 'eliminarUsuario',
      data: userId
    });
  };

  const ejecutarEliminacionUsuario = async (userId) => {
    try {
      await api.delete(`/usuarios/${userId}`);
      setSuccess('Usuario eliminado exitosamente');
      fetchUsuarios();
    } catch (err) {
      setError(err.response?.data?.msg || 'Error al eliminar usuario');
    }
  };

  const handleConfirmarAccion = () => {
    if (modalConfirmacion.action === 'eliminarUsuario') {
      ejecutarEliminacionUsuario(modalConfirmacion.data);
    }
    setModalConfirmacion(prev => ({ ...prev, show: false }));
  };

  const getRolLabel = (rol) => {
    switch (rol) {
      case 'superadmin': return 'Super Admin';
      case 'admin': return 'Administrador'; // Rol válido
      case 'tecnico': return 'Técnico'; // Rol válido
      case 'ingeniero': return 'Ingeniero'; // Rol válido
      case 'trabajador': return 'Trabajador'; // Rol válido
      case 'jefe_inventario': return 'Jefe de Inventario'; // Rol válido
      case 'administracion': return 'Administración'; // Rol válido
      default: return rol;
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await api.put('/auth/update-profile', profileData);
      setSuccess('Perfil actualizado exitosamente');

      // Actualizar el contexto de autenticación
      // Usamos setUser si está disponible, o recargamos la página para obtener los datos frescos
      if (setUser) {
        setUser(response.data.user);
      } else {
        window.location.reload();
      }
    } catch (err) {
      setError(err.response?.data?.msg || 'Error al actualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Las contraseñas nuevas no coinciden');
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      setSuccess('Contraseña actualizada exitosamente');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      setError(err.response?.data?.msg || 'Error al cambiar contraseña');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b overflow-x-auto">
          <div className="flex min-w-max md:min-w-0">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'profile'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FaUser className="inline mr-2" />
              Perfil
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'password'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FaLock className="inline mr-2" />
              Contraseña
            </button>
            {(user?.rol === 'admin' || user?.rol === 'superadmin') && (
              <button
                onClick={() => setActiveTab('users')}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === 'users'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <FaUsers className="inline mr-2" />
                Usuarios
              </button>
            )}
          </div>
        </div>

        <div className="p-4 md:p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              {success}
            </div>
          )}

          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaUser className="inline mr-2" />
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={profileData.nombre}
                  onChange={(e) => setProfileData({...profileData, nombre: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaEnvelope className="inline mr-2" />
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaPhone className="inline mr-2" />
                    Teléfono Fijo
                  </label>
                  <input
                    type="text"
                    value={profileData.telefono}
                    onChange={(e) => setProfileData({...profileData, telefono: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaMobileAlt className="inline mr-2" />
                    Celular
                  </label>
                  <input
                    type="text"
                    value={profileData.celular}
                    onChange={(e) => setProfileData({...profileData, celular: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaMapMarkerAlt className="inline mr-2" />
                  Dirección
                </label>
                <input
                  type="text"
                  value={profileData.direccion}
                  onChange={(e) => setProfileData({...profileData, direccion: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rol
                </label>
                <input
                  type="text"
                  value={getRolLabel(user?.rol)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  readOnly
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
              >
                <FaSave size={16} />
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </form>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña actual
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar nueva contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
              >
                <FaSave size={16} />
                {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
              </button>
            </form>
          )}

          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-2">
                <h3 className="text-lg font-medium text-gray-900">Gestión de Usuarios</h3>
                <div className="relative w-full sm:w-64">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Buscar usuario..." 
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                {usuarios.filter(u => 
                  u.nombre.toLowerCase().includes(userSearch.toLowerCase()) || 
                  u.email.toLowerCase().includes(userSearch.toLowerCase())
                ).map((usuario) => (
                  <div key={usuario._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow bg-gray-50 sm:bg-white">
                    <div className="flex items-center gap-3 mb-3 sm:mb-0">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg flex-shrink-0">
                        {usuario.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{usuario.nombre}</p>
                        <p className="text-sm text-gray-600">{usuario.email}</p>
                        <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-700 mt-1 font-medium">
                          {getRolLabel(usuario.rol)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleEditUsuario(usuario)}
                        className="flex-1 sm:flex-none justify-center bg-white border border-blue-200 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-50 flex items-center gap-2 text-sm transition-colors font-medium"
                      >
                        <FaEdit size={14} />
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteUsuario(usuario._id)}
                        className="flex-1 sm:flex-none justify-center bg-white border border-red-200 text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 flex items-center gap-2 text-sm transition-colors font-medium"
                      >
                        <FaTrash size={14} />
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && selectedUsuario && (
        <Modal onClose={() => setShowModal(false)}>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Editar Usuario</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
              <input
                type="text"
                value={selectedUsuario.nombre}
                onChange={(e) => setSelectedUsuario({...selectedUsuario, nombre: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={selectedUsuario.email}
                onChange={(e) => setSelectedUsuario({...selectedUsuario, email: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                <input
                  type="text"
                  value={selectedUsuario.telefono || ''}
                  onChange={(e) => setSelectedUsuario({...selectedUsuario, telefono: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Celular</label>
                <input
                  type="text"
                  value={selectedUsuario.celular || ''}
                  onChange={(e) => setSelectedUsuario({...selectedUsuario, celular: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Dirección</label>
              <input
                type="text"
                value={selectedUsuario.direccion || ''}
                onChange={(e) => setSelectedUsuario({...selectedUsuario, direccion: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rol</label>
              <select
                value={selectedUsuario.rol}
                onChange={(e) => setSelectedUsuario({...selectedUsuario, rol: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="trabajador">Trabajador</option>
                <option value="tecnico">Técnico</option>
                <option value="ingeniero">Ingeniero</option>
                <option value="admin">Admin</option>
                <option value="jefe_inventario">Jefe de Inventario</option>
                <option value="administracion">Administración</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleUpdateUsuario}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Guardar
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      )}

      <ModalConfirmacion
        show={modalConfirmacion.show}
        onClose={() => setModalConfirmacion(prev => ({ ...prev, show: false }))}
        onConfirm={handleConfirmarAccion}
        title={modalConfirmacion.title}
        message={modalConfirmacion.message}
        confirmText={modalConfirmacion.confirmText}
        isDestructive={modalConfirmacion.isDestructive}
      />
    </div>
  );
}
