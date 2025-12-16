import Compra from "../models/compra.model.js";
import Notificacion from "../models/notificacion.model.js";
import Usuario from '../models/usuario.model.js';

const generarCodigo = async () => {
    const last = await Compra.findOne().sort({ createdAt: -1 });
    if(!last || !last.codigo) return "REQ-0001";
    const num = parseInt(last.codigo.split('-')[1]) + 1;
    return `REQ-${num.toString().padStart(4, '0')}`;
};

export const crearRequerimiento = async (req, res) => {
    try {
        const { items } = req.body;

        // --- VALIDACIONES DE ENTRADA ---
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ msg: "El requerimiento debe tener al menos un ítem." });
        }
        if (items.some(i => !i.nombre || i.cantidad <= 0)) {
            return res.status(400).json({ msg: "Todos los items deben tener nombre y cantidad mayor a 0." });
        }

        const codigo = await generarCodigo();
        const nuevaCompra = new Compra({
            ...req.body,
            codigo,
            solicitante: req.user.id,
            estado: 'pendiente'
        });
        await nuevaCompra.save();

        // 🔔 NOTIFICACIÓN: Avisar a Administración y Logística que hay un nuevo requerimiento
        try {
            const encargados = await Usuario.find({ rol: { $in: ['jefe_inventario', 'administracion', 'admin', 'superadmin'] } });
            const notificaciones = encargados.map(u => ({
                usuario: u._id,
                tipo: 'compra',
                mensaje: `Nuevo Requerimiento ${codigo} pendiente de cotización.`,
                referenciaId: nuevaCompra._id,
                referenciaModelo: 'Compra'
            }));
            if (notificaciones.length > 0) await Notificacion.insertMany(notificaciones);
        } catch (err) { console.error("Error notificando:", err); }

        res.status(201).json(nuevaCompra);
    } catch (error) {
        res.status(500).json({ msg: "Error al crear requerimiento", error: error.message });
    }
};

export const getCompras = async (req, res) => {
    try {
        const compras = await Compra.find()
            .populate('solicitante', 'nombre')
            .populate('proveedor', 'nombre')
            .sort({ createdAt: -1 });
        res.json(compras);
    } catch (error) {
        res.status(500).json({ msg: "Error al listar compras", error: error.message });
    }
};

export const registrarCotizacion = async (req, res) => {
    try {
        // --- Control de Acceso por Rol ---
        // Solo 'administracion', 'jefe_inventario', 'admin' o 'superadmin' pueden cotizar.
        const allowedRoles = ['administracion', 'jefe_inventario', 'admin', 'superadmin'];
        if (!allowedRoles.includes(req.user.rol)) {
            return res.status(403).json({ msg: 'No tienes permiso para registrar cotizaciones.' });
        }

        const { id } = req.params;
        const { items, proveedor, proveedorNombre, sustentoCotizacionUrl } = req.body;

        const montoTotalEstimado = items.reduce((acc, item) => acc + (item.cantidad * (item.precioUnitario || 0)), 0);

        const compra = await Compra.findByIdAndUpdate(id, {
            items,
            proveedor,
            proveedorNombre,
            sustentoCotizacionUrl,
            montoTotalEstimado,
            cotizador: req.user.id,
            estado: 'cotizado'
        }, { new: true });

        // 🔔 NOTIFICACIÓN: Avisar a Gerencia (Jefe Manuel/Admin) para aprobar
        try {
            const aprobadores = await Usuario.find({ rol: { $in: ['admin', 'superadmin'] } });
            const notificaciones = aprobadores.map(u => ({
                usuario: u._id,
                tipo: 'compra',
                mensaje: `Requerimiento ${compra.codigo} cotizado. Requiere aprobación.`,
                referenciaId: compra._id,
                referenciaModelo: 'Compra'
            }));
            if (notificaciones.length > 0) await Notificacion.insertMany(notificaciones);
        } catch (err) { console.error("Error notificando:", err); }

        res.json(compra);
    }catch (error) {
        res.status(500).json({ msg: "Error al registrar cotización", error: error.message });
    }
};

export const evaluarCompra = async (req, res) => {
    try {
        // --- Control de Acceso por Rol ---
        // Solo 'admin' (el jefe) o 'superadmin' pueden aprobar/rechazar.
        const allowedRoles = ['admin', 'superadmin'];
        if (!allowedRoles.includes(req.user.rol)) {
            return res.status(403).json({ msg: 'No tienes permiso para aprobar o rechazar compras.' });
        }

        const { id } = req.params;
        const { decision, comentarios } = req.body;

        const compra = await Compra.findByIdAndUpdate(id, {
            estado: decision,
            aprobador: req.user.id,
            fechaAprobacion: new Date(),
            comentariosAprobacion: comentarios
        }, { new: true });

        // 🔔 NOTIFICACIÓN: Avisar al Solicitante (Pedro/Jose) y al Cotizador (Cesar) el resultado
        try {
            const destinatarios = [compra.solicitante, compra.cotizador].filter(id => id);
            // Eliminar duplicados (si el que cotizó es el mismo que solicitó)
            const uniqueDest = [...new Set(destinatarios.map(id => id.toString()))];
            
            const notificaciones = uniqueDest.map(uid => ({
                usuario: uid,
                tipo: 'compra',
                mensaje: `El requerimiento ${compra.codigo} ha sido ${decision.toUpperCase()}.`,
                referenciaId: compra._id,
                referenciaModelo: 'Compra'
            }));
            if (notificaciones.length > 0) await Notificacion.insertMany(notificaciones);
        } catch (err) { console.error("Error notificando:", err); }

        res.json(compra);
    } catch (error) {
        res.status(500).json({ msg: "Error al evaluar compra", error: error.message });
    }
};

export const registrarFacturaCompra = async (req, res) => {
    try {
        // --- Control de Acceso por Rol ---
        // Solo 'administracion', 'jefe_inventario', 'admin' o 'superadmin' pueden registrar la compra final.
        const allowedRoles = ['administracion', 'jefe_inventario', 'admin', 'superadmin'];
        if (!allowedRoles.includes(req.user.rol)) {
            return res.status(403).json({ msg: 'No tienes permiso para registrar la compra final.' });
        }

        const { id } = req.params;
        const { numeroFactura, facturaUrl, montoFinal } = req.body;

        const compra = await Compra.findByIdAndUpdate(id, {
            estado: 'comprado',
            comprador: req.user.id,
            fechaCompra: new Date(),
            numeroFactura,
            facturaUrl,
            montoFinal
        }, { new: true });

        // 🔔 NOTIFICACIÓN: Avisar al Solicitante que ya se compró
        try {
            if (compra.solicitante) {
                await Notificacion.create({
                    usuario: compra.solicitante,
                    tipo: 'compra',
                    mensaje: `Compra realizada para requerimiento ${compra.codigo}. Factura disponible.`,
                    referenciaId: compra._id,
                    referenciaModelo: 'Compra'
                });
            }
        } catch (err) { console.error("Error notificando:", err); }

        res.json(compra);
    } catch (error) {
        res.status(500).json({ msg: "Error al registrar factura", error: error.message });
    }
};

export const actualizarRequerimiento = async (req, res) => {
    try {
        const { id } = req.params;
        const { items, titulo, prioridad } = req.body;

        const compra = await Compra.findById(id);
        if (!compra) return res.status(404).json({ msg: "Requerimiento no encontrado" });

        if (compra.estado !== 'pendiente') {
            return res.status(400).json({ msg: "Solo se pueden editar requerimientos que estén pendientes." });
        }

        // Validaciones de items
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ msg: "El requerimiento debe tener al menos un ítem." });
        }

        const compraActualizada = await Compra.findByIdAndUpdate(id, { items, titulo, prioridad }, { new: true });
        res.json(compraActualizada);
    } catch (error) {
        res.status(500).json({ msg: "Error al actualizar requerimiento", error: error.message });
    }
};

export const eliminarCompra = async (req, res) => {
    try {
        const { id } = req.params;
        await Compra.findByIdAndDelete(id);
        res.json({ msg: "Requerimiento eliminado correctamente" });
    } catch (error) {
        res.status(500).json({ msg: "Error al eliminar requerimiento", error: error.message });
    }
};