# TODO: Implementar Sistema de Roles y Permisos

## Backend Changes
- [x] Agregar campo 'rol' al modelo Usuario y corregir exportación
- [x] Actualizar middleware auth para incluir 'rol' en req.user
- [x] Modificar controlador auth: registro con rol (solo admin), incluir rol en payload
- [x] Cambiar controlador movimiento: usar req.user.id, eliminar creación de usuarios temporales

## Frontend Changes
- [x] Actualizar AuthContext para incluir 'rol' en estado de usuario
- [x] Modificar DashboardLayout para mostrar/ocultar menú Inventario según rol
- [x] Simplificar PrivateRoute (sin verificación de roles en rutas)

## Testing and Setup
- [x] Crear cuentas de prueba (admin y trabajador) - Primer admin creado sin auth
- [ ] Probar login y restricciones de acceso
- [ ] Validar asociaciones de movimientos al usuario logueado
