# TODO: Automatizar Número de Cotización

## Backend Changes
- [x] Modificar `backend/src/controllers/cotizacion.controller.js` en `createCotizacion`:
  - Buscar el máximo `numeroCotizacion` existente.
  - Convertir a número, incrementar en 1.
  - Formatear a 4 dígitos con ceros a la izquierda (e.g., 0001).
  - Asignar automáticamente a `req.body.numeroCotizacion`.
  - Remover la verificación de duplicado manual ya que será único por autoincremento.

## Frontend Changes
- [x] Modificar `frontend/src/features/cotización/Cotización.jsx`:
  - Quitar el input manual de `numeroCotizacion` para nuevas cotizaciones.
  - Mostrar `numeroCotizacion` como readonly en edición.
  - Ajustar `guardarCotizacion` para no enviar `numeroCotizacion` al crear (solo al editar).

## Testing
- [x] Probar creando cotizaciones: verificar autoincremento (0001, 0002, etc.).
- [x] Eliminar una cotización intermedia y crear nueva: verificar que no reutiliza números eliminados (e.g., después de eliminar 0002, siguiente es 0004).
