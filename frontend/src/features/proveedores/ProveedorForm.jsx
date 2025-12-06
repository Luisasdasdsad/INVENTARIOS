import { useState, useEffect } from "react";

// Lista de categorías que debe coincidir con el backend
const CATEGORIAS_PROVEEDOR = ['Ferretería', 'Textil', 'Eléctrico', 'Sanitario', 'Oficina', 'Varios'];

const ProveedorForm = ({ onSave, proveedor, onClose }) => {
  const [formData, setFormData] = useState({
    nombre: "",
    ruc: "",
    direccion: "",
    telefono: [""], // Ahora es un array de strings
    email: "",
    categoria: "Varios", // Valor por defecto
    descripcion: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (proveedor) {
      // Asegurarse de que 'telefono' sea siempre un array
      setFormData({
        ...proveedor,
        telefono: Array.isArray(proveedor.telefono) && proveedor.telefono.length > 0 ? proveedor.telefono : [""]
      });
    } else {
      setFormData({
        nombre: "",
        ruc: "",
        direccion: "",
        telefono: [""],
        email: "",
        categoria: "Varios",
        descripcion: "",
      });
    }
    setError("");
  }, [proveedor]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // --- NUEVAS FUNCIONES PARA MANEJAR MÚLTIPLES TELÉFONOS ---
  const handleTelefonoChange = (index, value) => {
    const nuevosTelefonos = [...formData.telefono];
    nuevosTelefonos[index] = value;
    setFormData(prev => ({ ...prev, telefono: nuevosTelefonos }));
  };

  const agregarTelefono = () => {
    setFormData(prev => ({
      ...prev,
      telefono: [...prev.telefono, ""]
    }));
  };

  const eliminarTelefono = (index) => {
    if (formData.telefono.length > 1) {
      const nuevosTelefonos = formData.telefono.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, telefono: nuevosTelefonos }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nombre) {
      setError("El nombre es obligatorio.");
      return;
    }
    setError("");
    // Filtrar teléfonos vacíos antes de guardar
    const dataToSend = {
      ...formData,
      telefono: formData.telefono.filter(t => t.trim() !== "")
    };
    onSave(dataToSend);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Nombre o Razón Social" className="border p-2 rounded" required />
        <input name="ruc" value={formData.ruc} onChange={handleChange} placeholder="RUC (11 dígitos)" className="border p-2 rounded" />
        <div className="md:col-span-2">
          <input name="direccion" value={formData.direccion} onChange={handleChange} placeholder="Dirección" className="border p-2 rounded w-full" />
        </div>
        {/* --- CAMPO DE TELÉFONOS DINÁMICO --- */}
        <div className="md:col-span-2 space-y-2">
          <label className="block text-sm font-medium text-gray-700">Teléfonos</label>
          {formData.telefono.map((tel, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={tel}
                onChange={(e) => handleTelefonoChange(index, e.target.value)}
                placeholder={`Teléfono ${index + 1}`}
                className="border p-2 rounded w-full"
              />
              <button type="button" onClick={() => eliminarTelefono(index)} disabled={formData.telefono.length <= 1} className="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed">Eliminar</button>
            </div>
          ))}
          <button type="button" onClick={agregarTelefono} className="text-sm text-blue-600 hover:text-blue-800 font-semibold">+ Agregar otro teléfono</button>
        </div>
        <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" className="border p-2 rounded" />
        <div className="md:col-span-2">
          <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
          <select id="categoria" name="categoria" value={formData.categoria} onChange={handleChange} className="border p-2 rounded w-full bg-white">
            {CATEGORIAS_PROVEEDOR.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <textarea name="descripcion" value={formData.descripcion || ''} onChange={handleChange} placeholder="Descripción (ej: Venta de accesorios, especialidades, etc.)" className="border p-2 rounded w-full" rows="3"></textarea>
        </div>
      </div>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      <div className="flex justify-end gap-4 mt-6">
        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancelar</button>
        <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700">Guardar</button>
      </div>
    </form>
  );
};

export default ProveedorForm;
