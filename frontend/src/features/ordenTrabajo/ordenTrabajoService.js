import api from "../../services/api";

export const ordenTrabajoService = {
  // Obtener todas las órdenes de trabajo
  getOrdenesTrabajo: async () => {
    const response = await api.get("/ordenes-trabajo");
    return response.data;
  },

  // Obtener órdenes filtradas por técnico
  getOrdenesByTecnico: async (tecnicoId) => {
    const response = await api.get(`/ordenes-trabajo?tecnico=${tecnicoId}`);
    return response.data;
  },

  // Obtener órdenes filtradas por estado
  getOrdenesByEstado: async (estado) => {
    const response = await api.get(`/ordenes-trabajo?estado=${estado}`);
    return response.data;
  },

  // Obtener una orden de trabajo por ID
  getOrdenTrabajo: async (id) => {
    const response = await api.get(`/ordenes-trabajo/${id}`);
    return response.data;
  },

  // Crear orden de trabajo manual
  crearOrdenTrabajo: async (data) => {
    const response = await api.post("/ordenes-trabajo", data);
    return response.data;
  },

  // Crear orden de trabajo desde cotización
  crearDesdeCotizacion: async (cotizacionId, tecnicoId, observaciones, fechaInicio, fechaFin, instruccionesTecnico, descripcionServicio, ubicacion, listaProductos, listaHerramientas) => {
    const response = await api.post("/ordenes-trabajo/desde-cotizacion", {
      cotizacionId,
      tecnicoId,
      observaciones,
      fechaInicio,
      fechaFin,
      instruccionesTecnico,
      descripcionServicio,
      ubicacion,
      productos: listaProductos,
      herramientas: listaHerramientas
    });
    return response.data;
  },

  // Actualizar estado de orden de trabajo
  actualizarEstado: async (id, estado) => {
    const response = await api.patch(`/ordenes-trabajo/${id}/estado`, { estado });
    return response.data;
  },

  // Asignar técnico a orden de trabajo
  asignarTecnico: async (id, tecnicoId) => {
    const response = await api.patch(`/ordenes-trabajo/${id}/tecnico`, { tecnicoId });
    return response.data;
  }
};
