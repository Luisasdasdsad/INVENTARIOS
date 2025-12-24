import Compra from "../models/compra.model.js";
import Notificacion from "../models/notificacion.model.js";
import Usuario from '../models/usuario.model.js';
import { enviarCorreo } from '../config/mailer.js';

// IDs específicos para el flujo de compras
const ID_COTIZADOR = '69128ebaed6ab6a97487f143';
const ID_APROBADOR = '690b83dfb5649a16ce4ee9cf';

const generarCodigo = async () => {
    const last = await Compra.findOne().sort({ createdAt: -1 });
    if(!last || !last.codigo) return "REQ-0001";
    const num = parseInt(last.codigo.split('-')[1]) + 1;
    return `REQ-${num.toString().padStart(4, '0')}`;
};

export const crearRequerimiento = async (req, res) => {
    try {
        const { items, archivoSolicitudUrl } = req.body;

        // --- VALIDACIONES DE ENTRADA ---
        const hasItems = items && Array.isArray(items) && items.length > 0;
        const hasFile = !!archivoSolicitudUrl;

        if (!hasItems && !hasFile) {
            return res.status(400).json({ msg: "El requerimiento debe tener al menos un ítem o un archivo adjunto." });
        }
        if (hasItems && items.some(i => !i.nombre || i.cantidad <= 0)) {
            return res.status(400).json({ msg: "Todos los items deben tener nombre y cantidad mayor a 0." });
        }

        const codigo = await generarCodigo();

        // Sanitizar body: eliminar cotizacion si es string vacío para evitar CastError de Mongoose
        const data = { ...req.body };
        if (!data.cotizacion) delete data.cotizacion;

        const nuevaCompra = new Compra({
            ...data,
            codigo,
            solicitante: req.user.id,
            estado: 'pendiente'
        });
        await nuevaCompra.save();

        // Poblar datos para devolver al frontend inmediatamente
        const compraPoblada = await Compra.findById(nuevaCompra._id)
            .populate('solicitante', 'nombre')
            .populate('proveedor', 'nombre')
            .populate('cotizacion', 'numeroCotizacion descripcionServicio');

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

        // 📧 CORREO: Notificar al Cotizador específico
        try {
            const cotizador = await Usuario.findById(ID_COTIZADOR).select('email nombre');
            if (cotizador && cotizador.email) {
                await enviarCorreo({
                    to: cotizador.email,
                    subject: `Nuevo Requerimiento de Compra #${codigo}`,
                    html: `
                        <h1>Nuevo Requerimiento de Compra</h1>
                        <p>Hola ${cotizador.nombre},</p>
                        <p>Se ha registrado un nuevo requerimiento de compra con el código <strong>#${codigo}</strong> y está pendiente de cotización.</p>
                        <p><strong>Solicitante:</strong> ${req.user.nombre}</p>
                        <p><strong>Asunto:</strong> ${data.asunto || 'Sin asunto'}</p>
                        <p>Por favor, ingresa al sistema para revisarlo.</p>
                    `
                });
            }
        } catch (emailError) {
            console.error("Error al enviar correo de notificación al cotizador:", emailError);
        }

        res.status(201).json(compraPoblada);
    } catch (error) {
        res.status(500).json({ msg: "Error al crear requerimiento", error: error.message });
    }
};

export const getCompras = async (req, res) => {
    try {
        const compras = await Compra.find()
            .populate('solicitante', 'nombre')
            .populate('proveedor', 'nombre')
            .populate('cotizacion', 'numeroCotizacion descripcionServicio') // Poblar la cotización
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
        }, { new: true })
        .populate('solicitante', 'nombre')
        .populate('proveedor', 'nombre')
        .populate('cotizacion', 'numeroCotizacion descripcionServicio');

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

        // 📧 CORREO: Notificar al Aprobador específico
        try {
            const aprobador = await Usuario.findById(ID_APROBADOR).select('email nombre');
            if (aprobador && aprobador.email) {
                const linkSistema = process.env.FRONTEND_URL || 'http://localhost:5173';
                await enviarCorreo({
                    to: aprobador.email,
                    subject: `Cotización Lista para Aprobación - Compra #${compra.codigo}`,
                    html: `
                        <h1>Cotización Lista para Aprobación</h1>
                        <p>Hola ${aprobador.nombre},</p>
                        <p>La cotización para el requerimiento <strong>#${compra.codigo}</strong> ha sido registrada y espera tu evaluación.</p>
                        <p><strong>Solicitante:</strong> ${compra.solicitante?.nombre || 'Usuario'}</p>
                        <p><strong>Monto Total Estimado:</strong> S/ ${montoTotalEstimado.toFixed(2)}</p>
                        <p>Para aprobar o rechazar, por favor <a href="${linkSistema}/compras">ingresa al sistema</a>.</p>
                    `
                });
            }
        } catch (emailError) {
            console.error("Error al enviar correo de notificación al aprobador:", emailError);
        }

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
            comentarios: comentarios
        }, { new: true })
        .populate('solicitante', 'nombre')
        .populate('proveedor', 'nombre')
        .populate('cotizacion', 'numeroCotizacion descripcionServicio');

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

        // 📧 CORREO: Notificar al Solicitante original
        try {
            if (compra.solicitante && compra.solicitante.email) {
                const decisionTexto = decision === 'aprobado' ? 'APROBADO' : 'RECHAZADO';
                await enviarCorreo({
                    to: compra.solicitante.email,
                    subject: `Tu Requerimiento de Compra #${compra.codigo} ha sido ${decisionTexto}`,
                    html: `
                        <h1>Actualización de tu Requerimiento</h1>
                        <p>Hola ${compra.solicitante.nombre},</p>
                        <p>Tu requerimiento de compra <strong>#${compra.codigo}</strong> ha sido <strong>${decisionTexto}</strong>.</p>
                        ${decision === 'rechazado' ? `<p><strong>Motivo:</strong> ${comentarios}</p>` : ''}
                        <p>Puedes ver los detalles en el sistema.</p>
                    `
                });
            }
        } catch (emailError) {
            console.error("Error al enviar correo de notificación al solicitante:", emailError);
        }

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
        }, { new: true })
        .populate('solicitante', 'nombre')
        .populate('proveedor', 'nombre')
        .populate('cotizacion', 'numeroCotizacion descripcionServicio');

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
        const { items, nombreObra, asunto, prioridad } = req.body;

        const compra = await Compra.findById(id);
        if (!compra) return res.status(404).json({ msg: "Requerimiento no encontrado" });

        if (compra.estado !== 'pendiente') {
            return res.status(400).json({ msg: "Solo se pueden editar requerimientos que estén pendientes." });
        }

        // Validaciones de items
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ msg: "El requerimiento debe tener al menos un ítem." });
        }

        const compraActualizada = await Compra.findByIdAndUpdate(id, { items, nombreObra, asunto, prioridad }, { new: true })
            .populate('solicitante', 'nombre')
            .populate('proveedor', 'nombre')
            .populate('cotizacion', 'numeroCotizacion descripcionServicio');
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