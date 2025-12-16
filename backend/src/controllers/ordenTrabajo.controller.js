import OrdenTrabajo from "../models/ordenTrabajo.model.js";
import Producto from "../models/producto.model.js";
import Cotizacion from "../models/cotización.model.js";
import Notificacion from "../models/notificacion.model.js"; // Importar modelo

export const crearOrdenTrabajo = async (req, res) => {
    try {
        const { numeroOT, cliente, productos, tecnicoAsignado, cotizacion, descripcionServicio, tareas, herramientas, fechaInicio, fechaFin, ubicacion, observaciones, instruccionesTecnico } = req.body;

        // Helper: parse YYYY-MM-DD (from <input type="date">) into a local Date to avoid timezone shifts
        const parseDateLocal = (d) => {
            if (!d) return undefined;
            if (d instanceof Date) return d;
            // Expecting 'YYYY-MM-DD'
            const parts = (d + '').split('-');
            if (parts.length !== 3) return new Date(d);
            const y = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            return new Date(y, m, day);
        };

        console.log('crearOrdenTrabajo payload:', { numeroOT, cliente, productos, tecnicoAsignado, cotizacion });

        // Generar número OT si no se proporcionó
        let numero = numeroOT;
        if (!numero) {
            // Intentar obtener el máximo numérico a partir del campo numeroOT,
            // manejando formatos como 'OT-001' y '001'. Si la conversión falla,
            // hacer un fallback en JS para extraer dígitos.
            try {
                const maxOT = await OrdenTrabajo.aggregate([
                    { $project: { nroNum: { $replaceAll: { input: "$numeroOT", find: "OT-", replacement: "" } } } },
                    { $group: { _id: null, maxNum: { $max: { $toInt: "$nroNum" } } } }
                ]);
                const nextOT = maxOT.length > 0 && maxOT[0].maxNum ? maxOT[0].maxNum + 1 : 1;
                numero = nextOT.toString().padStart(4, '0');
            } catch (aggErr) {
                console.warn('Aggregation to compute next OT failed, falling back to JS parse:', aggErr.message);
                const docs = await OrdenTrabajo.find({}, 'numeroOT').lean();
                let maxNum = 0;
                for (const d of docs) {
                    if (!d.numeroOT) continue;
                    const m = (d.numeroOT + '').match(/(\d+)/);
                    if (m) {
                        const n = parseInt(m[0], 10);
                        if (n > maxNum) maxNum = n;
                    }
                }
                const nextOT = maxNum + 1;
                numero = nextOT.toString().padStart(4, '0');
            }
        }

        // --- VALIDACIÓN CORRECTA Y ÚNICA ---
        // 1. Validar que el cliente es siempre obligatorio.
        if (!cliente) {
            return res.status(400).json({ message: "Datos incompletos: se requiere un cliente." });
        }

        // 2. Validar que la orden tenga al menos un contenido (descripción, productos o herramientas).
        const tieneProductos = productos && productos.length > 0;
        const tieneHerramientas = herramientas && herramientas.length > 0;
        const tieneDescripcion = descripcionServicio && descripcionServicio.trim() !== '';

        if (!tieneProductos && !tieneHerramientas && !tieneDescripcion) {
            return res.status(400).json({ message: "La orden de trabajo debe tener al menos una descripción, un producto o una herramienta." });
        }

        for (let item of productos) {
            if (!item || !item.producto) {
                return res.status(400).json({ message: 'Producto inválido en la lista' });
            }
            const prod = await Producto.findById(item.producto);
            if (!prod) return res.status(404).json({ message: `Producto no encontrado: ${item.producto}` });

            if (prod.stock < item.cantidad) {
                return res.status(400).json({
                    message: `Stock insuficiente para ${prod.nombre}`
                });
            }
        }

        const nuevaOT = new OrdenTrabajo ({
            numeroOT: numero,
            cliente,
            productos,
            tecnicoAsignado,
            cotizacion,
            descripcionServicio,
            tareas,
            herramientas,
            ubicacion, // Añadir aquí
            observaciones,
            instruccionesTecnico,
            fechaAsignacion: tecnicoAsignado ? new Date() : undefined,
            fechaInicio: parseDateLocal(fechaInicio),
            fechaFin: parseDateLocal(fechaFin)
        });

        try {
            await nuevaOT.save();

            // --- NOTIFICACIÓN ---
            if (tecnicoAsignado) {
                await Notificacion.create({
                    usuario: tecnicoAsignado,
                    tipo: 'asignacion_ot',
                    mensaje: `Se te ha asignado la Orden de Trabajo N° ${numero}`,
                    referenciaId: nuevaOT._id,
                    referenciaModelo: 'OrdenTrabajo'
                });
            }

            res.status(201).json({ message: "Orden de trabajo creada", data: nuevaOT });
        } catch (saveError) {
            console.error('Error saving nuevaOT:', saveError);
            if (saveError.code === 11000) {
                return res.status(400).json({ message: 'Número de OT duplicado' });
            }
            return res.status(500).json({ message: 'Error guardando la orden de trabajo', error: saveError.message });
        }
    } catch (error) {
        console.error('crearOrdenTrabajo error:', error);
        res.status(500).json({ message: "Error", error: error.message });
    }
};

export const listarOrdenesTrabajo = async (req, res) => {
    try {
        const { tecnico, estado } = req.query;

        const filter = {};

        // role or query-based filters
        if (tecnico) filter.tecnicoAsignado = tecnico;
        if (estado) filter.estado = estado;

        // if user is 'tecnico' only show assigned orders by default (front end may use query param)
        if (req.user?.rol === 'tecnico' && !tecnico) {
            filter.tecnicoAsignado = req.user._id;
        }

        const orders = await OrdenTrabajo.find(filter)
            .populate("tecnicoAsignado", "nombre email telefono celular")
            .populate("productos.producto", "nombre modelo stock")
            .populate("cotizacion")
            .populate("cliente", "nombre tipoDoc numero ruc direccion telefono email")
            .populate("herramientas.herramienta", "nombre marca modelo");
        
        res.status(200).json(orders);    
    } catch (error) {
        res.status(500).json({message: "Error", error:error.message});
    }
};

export const obtenerOrdenTrabajo = async (req, res) => {
    try {
        const { id } = req.params;

        const ot = await OrdenTrabajo.findById(id)
            .populate("tecnicoAsignado", "nombre email telefono celular")
            .populate("productos.producto", "nombre modelo stock")
            .populate("cotizacion")
            .populate("cliente", "nombre tipoDoc numero ruc direccion telefono")
            .populate("herramientas.herramienta", "nombre marca modelo");

        if (!ot) return res.status(404).json({message:"OT no encontrada"});

        res.status(200).json(ot);
    } catch (error) {
        res.status(500).json({message: "Error", error: error.message});
    }
};

export const actualizarOrdenTrabajo = async (req, res) => {
    // Solo los admins pueden editar la orden de trabajo completa
    if (req.user?.rol !== 'admin') {
        return res.status(403).json({ message: 'Acceso denegado. Solo los administradores pueden editar órdenes de trabajo.' });
    }

    try {
        const { id } = req.params;
        const updateData = req.body;

        // Validaciones básicas
        if (!updateData.cliente) {
            return res.status(400).json({ message: "El campo cliente es obligatorio." });
        }

        const orden = await OrdenTrabajo.findById(id);

        if (!orden) {
            return res.status(404).json({ message: "Orden de trabajo no encontrada" });
        }

        // Actualizar campos
        orden.set(updateData);

        const ordenActualizada = await orden.save();

        res.status(200).json({ message: "Orden de trabajo actualizada exitosamente", data: ordenActualizada });
    } catch (error) {
        console.error('Error al actualizar la orden de trabajo:', error);
        res.status(500).json({ message: "Error al actualizar la orden de trabajo", error: error.message });
    }
};

export const asignarTecnico = async (req, res) => {
    try {
        const { id } = req.params;
        const { tecnicoId } = req.body;

        const ot = await OrdenTrabajo.findById(id);
        if (!ot) return res.status(404).json({ message: 'Orden no encontrada' });

        ot.tecnicoAsignado = tecnicoId;
        ot.fechaAsignacion = new Date();
        await ot.save();

        // --- NOTIFICACIÓN ---
        if (tecnicoId) {
            await Notificacion.create({
                usuario: tecnicoId,
                tipo: 'asignacion_ot',
                mensaje: `Se te ha asignado la Orden de Trabajo N° ${ot.numeroOT}`,
                referenciaId: ot._id,
                referenciaModelo: 'OrdenTrabajo'
            });
        }

        res.status(200).json({ message: 'Técnico asignado', data: ot });
    } catch (error) {
        console.error('Error asignarTecnico:', error);
        res.status(500).json({ message: 'Error al asignar técnico', error: error.message });
    }
};

export const cambiarEstadoOT = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body || {};

        if (!estado) {
            return res.status(400).json({ message: "Estado requerido en el body" });
        }

        const ot = await OrdenTrabajo.findById(id);

        if (!ot) return res.status(404).json({message:"OT no encontrada"});

        ot.estado = estado;

        if (estado == "completado") {
            ot.fechaFin = new Date();

            for (let item of ot.productos) {
                await Producto.findByIdAndUpdate(item.producto, {
                    $inc: { stock: -item.cantidad }
                });
            }
        }

        await ot.save();

        res.status(200).json({message: "Estado actualizado", data: ot});
    } catch (error) {
        res.status(500).json({message: "Error", error: error.message});
    }
};

// Crear OT a partir de una cotización
export const crearDesdeCotizacion = async (req, res) => {
    try {
        const { cotizacionId, tecnicoId, observaciones, fechaInicio, fechaFin, instruccionesTecnico, descripcionServicio, ubicacion, productos, herramientas } = req.body;

        console.log('crearDesdeCotizacion payload:', { cotizacionId, tecnicoId, observaciones, instruccionesTecnico, descripcionServicio });

        // Buscar cotización
        const cotizacion = await Cotizacion.findById(cotizacionId).populate('cliente');
        if (!cotizacion) return res.status(404).json({ message: 'Cotización no encontrada' });

        // Asegurar que esté aprobada o facturada
        if (cotizacion.estado && !['Aceptada', 'Facturada'].includes(cotizacion.estado)) {
            return res.status(400).json({ message: 'La cotización debe estar aprobada o facturada para crear una orden de trabajo' });
        }

        // Asegurar que `cotizacion.productos` es un arreglo
        const cotProdArray = Array.isArray(cotizacion.productos) ? cotizacion.productos : [];

        // Mapear productos y servicios de la cotización a la estructura requerida por OrdenTrabajo
        // Si el ítem tiene referencia a producto, se añade a productosOT.
        // Si no se encuentra coincidencia en inventario, se añade como tarea/servicio en la OT.
        const productosOT = [];
        const herramientasOT = []; // Nuevo: para soportar herramientas
        const tareasFromCot = [];

        // 1. Si el frontend envía productos (editados), usarlos. Si no, calcular desde cotización.
        if (productos && Array.isArray(productos) && productos.length > 0) {
            productosOT.push(...productos);
        } else {
            // Lógica original de fallback
            for (const item of cotProdArray) {
                if (item.producto) {
                    productosOT.push({ producto: item.producto, cantidad: item.cantidad });
                    continue;
                }
                // Buscar por nombre si no tiene ID
                const nombre = (item.descripcion || '').trim();
                let prodMatch = null;
                if (nombre) {
                    prodMatch = await Producto.findOne({ nombre: new RegExp('^' + nombre + '$', 'i') });
                    if (!prodMatch) prodMatch = await Producto.findOne({ nombre: new RegExp(nombre, 'i') });
                }
                if (!prodMatch) {
                    tareasFromCot.push({ descripcion: nombre || 'Servicio sin descripción', cantidad: item.cantidad || 1 });
                } else {
                    productosOT.push({ producto: prodMatch._id, cantidad: item.cantidad });
                }
            }
        }

        // 2. Si el frontend envía herramientas, usarlas.
        if (herramientas && Array.isArray(herramientas)) {
            herramientasOT.push(...herramientas);
        }

        // Nota: Si se usaron productos del frontend, 'tareasFromCot' estará vacío. 
        // Si deseas conservar tareas de la cotización original incluso editando productos, se requeriría lógica adicional.

        // Generar número de OT (manejar formatos como 'OT-001')
        let numeroOT;
        try {
            const maxOT = await OrdenTrabajo.aggregate([
                { $project: { nroNum: { $replaceAll: { input: "$numeroOT", find: "OT-", replacement: "" } } } },
                { $group: { _id: null, maxNum: { $max: { $toInt: "$nroNum" } } } }
            ]);
            const nextOT = maxOT.length > 0 && maxOT[0].maxNum ? maxOT[0].maxNum + 1 : 1;
            numeroOT = nextOT.toString().padStart(4, '0');
        } catch (errAgg) {
            console.warn('Aggregation to compute next OT failed (crearDesdeCotizacion), falling back to JS parse:', errAgg.message);
            const docs = await OrdenTrabajo.find({}, 'numeroOT').lean();
            let maxNum = 0;
            for (const d of docs) {
                if (!d.numeroOT) continue;
                const m = (d.numeroOT + '').match(/(\d+)/);
                if (m) {
                    const n = parseInt(m[0], 10);
                    if (n > maxNum) maxNum = n;
                }
            }
            const nextOT = maxNum + 1;
            numeroOT = nextOT.toString().padStart(4, '0');
        }

        const nuevaOT = new OrdenTrabajo({
            numeroOT,
            cliente: cotizacion.cliente._id,
            productos: productosOT,
            tecnicoAsignado: tecnicoId,
            cotizacion: cotizacion._id,
            observaciones: observaciones || '',
            instruccionesTecnico: instruccionesTecnico || '',
            // 💡 Usar la descripción del request, o la de la cotización como fallback.
            descripcionServicio: descripcionServicio || cotizacion.descripcionServicio || '',
            tareas: tareasFromCot,
            herramientas: herramientasOT, // Guardar herramientas
            fechaInicio: fechaInicio ? new Date(fechaInicio) : undefined,
            fechaFin: fechaFin ? new Date(fechaFin) : undefined,
            ubicacion
        });

        try {
            console.log('Guardando nueva OT desde cotización:', nuevaOT);
            await nuevaOT.save();

            // --- NOTIFICACIÓN ---
            if (tecnicoId) {
                await Notificacion.create({
                    usuario: tecnicoId,
                    tipo: 'asignacion_ot',
                    mensaje: `Se te ha asignado la Orden de Trabajo N° ${numeroOT} (vía Cotización)`,
                    referenciaId: nuevaOT._id,
                    referenciaModelo: 'OrdenTrabajo'
                });
            }

            res.status(201).json({ message: 'Orden de trabajo creada desde cotización', data: nuevaOT });
        } catch (saveErr) {
            console.error('Error guardando nuevaOT desde cotización:', saveErr);
            if (saveErr.code === 11000) {
                return res.status(400).json({ message: 'Número de OT duplicado' });
            }
            return res.status(500).json({ message: 'Error guardando la orden de trabajo', error: saveErr.message });
        }
    } catch (error) {
        console.error('Error crearDesdeCotizacion:', error);
        res.status(500).json({ message: 'Error creando OT desde cotización', error: error.message });
    }
};

export const eliminarOrdenTrabajo = async (req, res) => {
    try {
        const { id } = req.params;

        // Buscar y eliminar la orden de trabajo
        const ordenEliminada = await OrdenTrabajo.findByIdAndDelete(id);

        if (!ordenEliminada) {
            return res.status(404).json({ message: "Orden de trabajo no encontrada" });
        }

        res.status(200).json({ message: "Orden de trabajo eliminada exitosamente" });
    } catch (error) {
        console.error('Error al eliminar la orden de trabajo:', error);
        res.status(500).json({ message: "Error al eliminar la orden de trabajo", error: error.message });
    }
};
