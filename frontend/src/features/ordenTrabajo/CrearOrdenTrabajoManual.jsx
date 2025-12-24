import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

export default function CrearOrdenTrabajoManual() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [clientes, setClientes] = useState([]);
  const [productosDB, setProductosDB] = useState([]);
  const [herramientasDB, setHerramientasDB] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    cliente: '',
    descripcionServicio: '',
    tecnicoAsignado: '',
    observaciones: '',
    instruccionesTecnico: '',
    fechaInicio: '',
    fechaFin: '',
    productos: [],
    herramientas: [],
    ubicacion: ''
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // Usamos Promise.allSettled para que si falla uno (ej: permisos de usuarios/clientes), no falle todo
        const results = await Promise.allSettled([
          api.get('/clientes'),
          api.get('/productos'),
          api.get('/herramientas'),
          api.get('/usuarios')
        ]);

        const [cRes, pRes, hRes, uRes] = results;

        if (cRes.status === 'fulfilled') setClientes(cRes.value.data);
        if (pRes.status === 'fulfilled') setProductosDB(pRes.value.data);
        if (hRes.status === 'fulfilled') setHerramientasDB(hRes.value.data);
        if (uRes.status === 'fulfilled') setTecnicos(uRes.value.data.filter(u => ['tecnico', 'ingeniero', 'admin'].includes(u.rol)));

        if (isEditMode) {
          const otRes = await api.get(`/ordenes-trabajo/${id}`);
          const ot = otRes.data;

          // Si no se pudieron cargar clientes/técnicos (por permisos), agregamos los actuales para que se vean en el select
          if (cRes.status === 'rejected' && ot.cliente) setClientes([ot.cliente]);
          if (uRes.status === 'rejected' && ot.tecnicoAsignado) setTecnicos([ot.tecnicoAsignado]);

          const formatDateForInput = (date) => {
            if (!date) return '';
            return new Date(date).toISOString().split('T')[0];
          };

          setForm({
            cliente: ot.cliente._id,
            descripcionServicio: ot.descripcionServicio || '',
            tecnicoAsignado: ot.tecnicoAsignado?._id || '',
            observaciones: ot.observaciones || '',
            instruccionesTecnico: ot.instruccionesTecnico || '',
            fechaInicio: formatDateForInput(ot.fechaInicio),
            fechaFin: formatDateForInput(ot.fechaFin),
            productos: ot.productos.map(p => ({ producto: p.producto?._id || '', cantidad: p.cantidad })),
            herramientas: ot.herramientas?.map(h => ({ herramienta: h.herramienta?._id || '', cantidad: h.cantidad })) || [],
            ubicacion: ot.ubicacion || ''
          });
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
        toast.error("No se pudieron cargar los datos necesarios.");
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [id, isEditMode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const addProducto = () => setForm(prev => ({ ...prev, productos: [...prev.productos, { producto: '', cantidad: 1 }] }));
  const removeProducto = (index) => setForm(prev => ({ ...prev, productos: prev.productos.filter((_, i) => i !== index) }));
  const handleProductoChange = (index, field, value) => {
    const newProductos = [...form.productos];
    newProductos[index][field] = value;

    // Validación de stock
    if (field === 'cantidad' && newProductos[index].producto) {
      const prodDB = productosDB.find(p => p._id === newProductos[index].producto);
      if (prodDB && Number(value) > prodDB.stock) {
        toast.error(`Stock insuficiente: Solo hay ${prodDB.stock} unidades de ${prodDB.nombre}`, { id: 'stock-warning' });
      }
    }
    setForm(prev => ({ ...prev, productos: newProductos }));
  };

  const addHerramienta = () => setForm(prev => ({ ...prev, herramientas: [...prev.herramientas, { herramienta: '', cantidad: 1 }] }));
  const removeHerramienta = (index) => setForm(prev => ({ ...prev, herramientas: prev.herramientas.filter((_, i) => i !== index) }));
  const handleHerramientaChange = (index, field, value) => {
    const newHerramientas = [...form.herramientas];
    newHerramientas[index][field] = value;

    // Validación de stock para herramientas
    if (field === 'cantidad' && newHerramientas[index].herramienta) {
      const herrDB = herramientasDB.find(h => h._id === newHerramientas[index].herramienta);
      if (herrDB && Number(value) > (herrDB.cantidad ?? 0)) {
        toast.error(`Stock insuficiente: Solo hay ${herrDB.cantidad ?? 0} unidades de ${herrDB.nombre}`, { id: 'stock-warning' });
      }
    }
    setForm(prev => ({ ...prev, herramientas: newHerramientas }));
  };


  const submit = async (e) => {
    e.preventDefault();
    if (!form.cliente) {
      toast.error('Debes seleccionar un cliente');
      return;
    }

    if (!form.fechaInicio || !form.fechaFin) {
      toast.error("Debes seleccionar una fecha de inicio y una fecha de fin.");
      return;
    }

    const fechaInicio = new Date(form.fechaInicio);
    const fechaFin = new Date(form.fechaFin);

    if (fechaFin < fechaInicio) {
      toast.error("La fecha de fin no puede ser anterior a la fecha de inicio.");
      return;
    }

    try {
      const payload = {
        cliente: form.cliente,
        tecnicoAsignado: form.tecnicoAsignado,
        descripcionServicio: form.descripcionServicio,
        observaciones: form.observaciones,
        instruccionesTecnico: form.instruccionesTecnico,
        fechaInicio: form.fechaInicio,
        fechaFin: form.fechaFin,
        ubicacion: form.ubicacion,
        productos: form.productos.filter(p => p.producto && p.cantidad > 0),
        herramientas: form.herramientas.filter(h => h.herramienta && h.cantidad > 0),
      };

      console.log("Enviando payload al servidor:", payload); // Verifica aquí si los datos salen bien

      if (isEditMode) {
        await api.put(`/ordenes-trabajo/${id}`, payload);
        toast.success('Orden de trabajo actualizada. Se ha notificado los cambios.');
      } else {
        await api.post('/ordenes-trabajo', payload);
        toast.success('Orden de trabajo creada. Se ha enviado notificación al técnico asignado.');
      }
      navigate('/ordenes-trabajo');
    } catch (error) {
      console.error('Error guardando la orden:', error);
      const serverMsg = error.response?.data?.message || 'Ocurrió un error.';
      toast.error('Error: ' + serverMsg);
    }
  };
  
  if (loading) {
    return <div className="text-center p-8">Cargando...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">{isEditMode ? 'Editar Orden de Trabajo' : 'Crear Orden de Trabajo Manual'}</h2>
      <form onSubmit={submit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Cliente</label>
            <select name="cliente" value={form.cliente} onChange={handleInputChange} required className="input-field mt-1">
              <option value="">Seleccionar cliente</option>
              {clientes.map(c => <option key={c._id} value={c._id}>{c.nombre}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Responsable asignado</label>
            <select name="tecnicoAsignado" value={form.tecnicoAsignado} onChange={handleInputChange} className="input-field mt-1">
              <option value="">Sin asignar</option>
              {tecnicos.map(t => (
                <option key={t._id} value={t._id}>
                  {t.nombre} - {t.rol === 'admin' ? 'Administrador' : 
                                t.rol === 'ingeniero' ? 'Ingeniero' : 
                                'Técnico'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha de Inicio *</label>
            <input type="date" name="fechaInicio" value={form.fechaInicio} onChange={handleInputChange} className="input-field mt-1" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha de Fin *</label>
            <input type="date" name="fechaFin" value={form.fechaFin} onChange={handleInputChange} className="input-field mt-1" required />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Descripción del servicio</label>
          <textarea name="descripcionServicio" value={form.descripcionServicio} onChange={handleInputChange} className="input-field mt-1" rows={4} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Ubicación de la obra</label>
          <textarea name="ubicacion" value={form.ubicacion} onChange={handleInputChange} className="input-field mt-1" rows={2} />
        </div>

        <div className="bg-gray-50 p-4 rounded-md">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold">Productos</h4>
            <button type="button" onClick={addProducto} className="btn-secondary text-sm">+ Agregar</button>
          </div>
          {form.productos.length === 0 && <div className="text-sm text-gray-500">No hay productos agregados.</div>}
          <div className="space-y-2 mt-2">
            {form.productos.map((p, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-7">
                  <select value={p.producto} onChange={e => {
                    handleProductoChange(i, 'producto', e.target.value);
                    const prod = productosDB.find(pr => pr._id === e.target.value);
                    if (prod && prod.stock < 1) {
                      toast.error(`El producto ${prod.nombre} no tiene stock disponible.`);
                    }
                  }} className="input-field">
                    <option value="">Seleccionar producto</option>
                    {productosDB.map(prod => <option key={prod._id} value={prod._id}>{prod.nombre}</option>)}
                  </select>
                </div>
                <div className="col-span-3">
                  <input type="number" min="1" value={p.cantidad} onChange={e => handleProductoChange(i, 'cantidad', Number(e.target.value))} className="input-field" />
                </div>
                <div className="col-span-2 text-right">
                  <button type="button" onClick={() => removeProducto(i)} className="text-sm text-red-600">Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-md">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold">Herramientas</h4>
            <button type="button" onClick={addHerramienta} className="btn-secondary text-sm">+ Agregar</button>
          </div>
          {form.herramientas.length === 0 && <div className="text-sm text-gray-500">No hay herramientas agregadas.</div>}
          <div className="space-y-2 mt-2">
            {form.herramientas.map((h, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-7">
                  <select value={h.herramienta} onChange={e => {
                    handleHerramientaChange(i, 'herramienta', e.target.value);
                    const herr = herramientasDB.find(hd => hd._id === e.target.value);
                    if (herr && (herr.cantidad ?? 0) < 1) {
                      toast.error(`La herramienta ${herr.nombre} no tiene stock disponible.`);
                    }
                  }} className="input-field">
                    <option value="">Seleccionar herramienta</option>
                    {herramientasDB.map(hd => <option key={hd._id} value={hd._id}>{hd.nombre}</option>)}
                  </select>
                </div>
                <div className="col-span-3">
                  <input type="number" min="1" value={h.cantidad} onChange={e => handleHerramientaChange(i, 'cantidad', Number(e.target.value))} className="input-field" />
                </div>
                <div className="col-span-2 text-right">
                  <button type="button" onClick={() => removeHerramienta(i)} className="text-sm text-red-600">Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Observaciones</label>
          <textarea name="observaciones" value={form.observaciones} onChange={handleInputChange} className="input-field mt-1" rows={3} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Instrucciones para el Técnico</label>
          <textarea name="instruccionesTecnico" value={form.instruccionesTecnico} onChange={handleInputChange} className="input-field mt-1" rows={3} />
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn-primary">{isEditMode ? 'Guardar Cambios' : 'Crear Orden de Trabajo'}</button>
        </div>
      </form>
    </div>
  );
}