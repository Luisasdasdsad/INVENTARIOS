import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { ordenTrabajoService } from './ordenTrabajoService';

export default function CrearOrdenTrabajoManual() {
  const { id } = useParams(); // Hook para obtener el ID de la URL
  const navigate = useNavigate(); // Hook para navegar
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
    herramientas: []
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const [cRes, pRes, hRes, uRes] = await Promise.all([
          api.get('/clientes'),
          api.get('/productos'),
          api.get('/herramientas'),
          api.get('/usuarios')
        ]);
        setClientes(cRes.data);
        setProductosDB(pRes.data);
        setHerramientasDB(hRes.data);
        setTecnicos(uRes.data.filter(u => u.rol === 'tecnico'));

        if (isEditMode) {
          const otRes = await api.get(`/ordenes-trabajo/${id}`);
          const ot = otRes.data;
          // Formatear fechas para input type="date" (YYYY-MM-DD)
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
            productos: ot.productos.map(p => ({ producto: p.producto._id, cantidad: p.cantidad })),
            herramientas: ot.herramientas?.map(h => ({ herramienta: h.herramienta._id, cantidad: h.cantidad })) || []
          });
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
        alert("No se pudieron cargar los datos necesarios.");
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [id, isEditMode]);

  const addProducto = () => setForm(prev => ({ ...prev, productos: [...prev.productos, { producto: '', cantidad: 1 }] }));
  const removeProducto = (index) => setForm(prev => ({ ...prev, productos: prev.productos.filter((_, i) => i !== index) }));
  const addHerramienta = () => setForm(prev => ({ ...prev, herramientas: [...prev.herramientas, { herramienta: '', cantidad: 1 }] }));
  const removeHerramienta = (index) => setForm(prev => ({ ...prev, herramientas: prev.herramientas.filter((_, i) => i !== index) }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.cliente) {
      alert('Debes seleccionar un cliente');
      return;
    }

    // Validación de fechas
    if (!form.fechaInicio || !form.fechaFin) {
      alert("Debes seleccionar una fecha de inicio y una fecha de fin.");
      return;
    }

    const fechaInicio = new Date(form.fechaInicio);
    const fechaFin = new Date(form.fechaFin);

    if (fechaFin < fechaInicio) {
      alert("La fecha de fin no puede ser anterior a la fecha de inicio.");
      return;
    }

    try {
      const payload = {
        ...form,
        productos: form.productos.filter(p => p.producto && p.cantidad > 0),
        herramientas: form.herramientas.filter(h => h.herramienta && h.cantidad > 0),
      };

      if (isEditMode) {
        await api.put(`/ordenes-trabajo/${id}`, payload);
        alert('Orden de trabajo actualizada exitosamente');
      } else {
        await ordenTrabajoService.crearOrdenTrabajo(payload);
        alert('Orden de trabajo creada exitosamente');
      }
      navigate('/ordenes-trabajo'); // Redirigir a la lista
    } catch (error) {
      console.error('Error guardando la orden:', error);
      const serverMsg = error.response?.data?.message || 'Ocurrió un error.';
      alert('Error: ' + serverMsg);
    }
  };
  
  if (loading) {
    return <div className="text-center p-8">Cargando...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">{isEditMode ? 'Editar Orden de Trabajo' : 'Crear Orden de Trabajo Manual'}</h2>
      <form onSubmit={submit} className="space-y-6">
        {/* ... (el resto del formulario JSX no cambia) ... */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Cliente</label>
          <select value={form.cliente} onChange={e => setForm({ ...form, cliente: e.target.value })} required className="input-field mt-1">
            <option value="">Seleccionar cliente</option>
            {clientes.map(c => <option key={c._id} value={c._id}>{c.nombre}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Técnico asignado</label>
          <select value={form.tecnicoAsignado} onChange={e => setForm({ ...form, tecnicoAsignado: e.target.value })} className="input-field mt-1">
            <option value="">Sin asignar</option>
            {tecnicos.map(t => <option key={t._id} value={t._id}>{t.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Fecha de Inicio *</label>
          <input type="date" value={form.fechaInicio} onChange={e => setForm({ ...form, fechaInicio: e.target.value })} className="input-field mt-1" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Fecha de Fin *</label>
          <input type="date" value={form.fechaFin} onChange={e => setForm({ ...form, fechaFin: e.target.value })} className="input-field mt-1" required />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Descripción del servicio</label>
        <textarea value={form.descripcionServicio} onChange={e => setForm({ ...form, descripcionServicio: e.target.value })} className="input-field mt-1" rows={4} />
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
                <select value={p.producto} onChange={e => { const newP = [...form.productos]; newP[i].producto = e.target.value; setForm({ ...form, productos: newP }); }} className="input-field">
                  <option value="">Seleccionar producto</option>
                  {productosDB.map(prod => <option key={prod._id} value={prod._id}>{prod.nombre}</option>)}
                </select>
              </div>
              <div className="col-span-3">
                <input type="number" min="1" value={p.cantidad} onChange={e => { const newP = [...form.productos]; newP[i].cantidad = Number(e.target.value); setForm({ ...form, productos: newP }); }} className="input-field" />
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
                <select value={h.herramienta} onChange={e => { const newH = [...form.herramientas]; newH[i].herramienta = e.target.value; setForm({ ...form, herramientas: newH }); }} className="input-field">
                  <option value="">Seleccionar herramienta</option>
                  {herramientasDB.map(hd => <option key={hd._id} value={hd._id}>{hd.nombre}</option>)}
                </select>
              </div>
              <div className="col-span-3">
                <input type="number" min="1" value={h.cantidad} onChange={e => { const newH = [...form.herramientas]; newH[i].cantidad = Number(e.target.value); setForm({ ...form, herramientas: newH }); }} className="input-field" />
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
        <textarea value={form.observaciones} onChange={e => setForm({ ...form, observaciones: e.target.value })} className="input-field mt-1" rows={3} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Instrucciones para el Técnico</label>
        <textarea value={form.instruccionesTecnico} onChange={e => setForm({ ...form, instruccionesTecnico: e.target.value })} className="input-field mt-1" rows={3} />
      </div>

        <div className="flex justify-end">
          <button type="submit" className="btn-primary">{isEditMode ? 'Guardar Cambios' : 'Crear Orden de Trabajo'}</button>
        </div>
      </form>
    </div>
  );
}
