import { useState } from 'react';
import OrdenTrabajoFromCotizacion from './OrdenTrabajoFromCotizacion';
import CrearOrdenTrabajoManual from './CrearOrdenTrabajoManual';

export default function CrearOrdenTrabajo() {
  const [mode, setMode] = useState('start');

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="card">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Crear Orden de Trabajo</h2>
          {mode !== 'start' && (
            <button onClick={() => setMode('start')} className="text-sm text-gray-600 hover:underline">← Volver</button>
          )}
        </div>

        {mode === 'start' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="border rounded-lg p-6 shadow-sm hover:shadow-md transition cursor-pointer" onClick={() => setMode('fromCotizacion')}>
              <h3 className="text-lg font-semibold">Crear desde Cotización</h3>
              <p className="text-sm text-gray-600 mt-2">Selecciona una cotización aprobada y genera la orden de trabajo con los productos y la descripción del servicio.</p>
                <div className="mt-4">
                <button className="btn-accent">Comenzar</button>
              </div>
            </div>

            <div className="border rounded-lg p-6 shadow-sm hover:shadow-md transition cursor-pointer" onClick={() => setMode('manual')}>
              <h3 className="text-lg font-semibold">Crear manualmente</h3>
              <p className="text-sm text-gray-600 mt-2">Crea una orden de trabajo desde cero, elige cliente, productos, herramientas y asigna un técnico.</p>
              <div className="mt-4">
                <button className="btn-primary">Comenzar</button>
              </div>
            </div>
          </div>
        )}

        {mode === 'fromCotizacion' && (
          <div className="mt-6">
            <OrdenTrabajoFromCotizacion />
          </div>
        )}

        {mode === 'manual' && (
          <div className="mt-6">
            <CrearOrdenTrabajoManual />
          </div>
        )}
      </div>
    </div>
  );
}
