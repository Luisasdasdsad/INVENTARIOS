import Compra from "../models/compra.model.js";
import Notificacion from "../models/notificacion.model.js";
import Usuario from '../models/usuario.model.js';
import { enviarCorreo } from '../config/mailer.js';

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

        // RESPONDER INMEDIATAMENTE AL FRONTEND (Para evitar que se congele la pantalla)
        res.status(201).json(compraPoblada);

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
            // BUSCAR POR ROL: Busca al primer usuario de administración, jefe de inventario o admin
            const cotizador = await Usuario.findOne({ rol: { $in: ['administracion', 'jefe_inventario', 'admin'] } }).select('email nombre');
            const linkSistema = process.env.FRONTEND_URL || 'https://inventarios-aip4.vercel.app';
            if (cotizador && cotizador.email) {
                await enviarCorreo({
                    from: process.env.EMAIL_USER,
                    to: cotizador.email,
                    subject: `Nuevo Requerimiento de Compra #${codigo}`,
                    html: `
                        <h1>Nuevo Requerimiento de Compra</h1>
                        <p>Hola ${cotizador.nombre},</p>
                        <p>Se ha registrado un nuevo requerimiento de compra con el código <strong>#${codigo}</strong> y está pendiente de cotización.</p>
                        <p><strong>Solicitante:</strong> ${req.user.nombre}</p>
                        <p><strong>Asunto:</strong> ${data.asunto || 'Sin asunto'}</p>
                        <p>Por favor, ingresa al sistema para revisarlo.</p>
                        <p><a href="${linkSistema}">Ingresar al Sistema</a></p>
                    `
                });
            }
        } catch (emailError) {
            console.error("Error al enviar correo de notificación al cotizador:", emailError);
        }

    } catch (error) {
        // Si ya respondimos, solo logueamos el error
        if (!res.headersSent) res.status(500).json({ msg: "Error al crear requerimiento", error: error.message });
        else console.error("Error posterior a la respuesta:", error);
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
        .populate('solicitante', 'nombre email') // Necesitamos el email del solicitante
        .populate('proveedor', 'nombre')
        .populate('cotizacion', 'numeroCotizacion descripcionServicio');

        // RESPONDER INMEDIATAMENTE
        res.json(compra);

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

        // 📧 CORREO: Notificar al Aprobador y al Solicitante
        try {
            const linkSistema = process.env.FRONTEND_URL || 'https://inventarios-aip4.vercel.app';
            // BUSCAR POR ROL: Busca al Gerente (Admin o Superadmin) para aprobar
            const aprobador = await Usuario.findOne({ rol: { $in: ['admin', 'superadmin'] } }).select('email nombre');
            
            // 1. Correo al Aprobador (Para que entre a aprobar)
            if (aprobador && aprobador.email) {
                await enviarCorreo({
                    from: process.env.EMAIL_USER,
                    to: aprobador.email,
                    subject: `Cotización Lista para Aprobación - Compra #${compra.codigo}`,
                    html: `
                        <h1>Cotización Lista para Aprobación</h1>
                        <p>Hola ${aprobador.nombre},</p>
                        <p>La cotización para el requerimiento <strong>#${compra.codigo}</strong> ha sido registrada y espera tu evaluación.</p>
                        <p><strong>Solicitante:</strong> ${compra.solicitante?.nombre || 'Usuario'}</p>
                        <p><strong>Monto Total Estimado:</strong> S/ ${montoTotalEstimado.toFixed(2)}</p>
                        <p>Para aprobar o rechazar, por favor <a href="${linkSistema}">ingresa al sistema</a>.</p>
                    `
                });
            }

            // 2. Correo al Solicitante (Informativo: "Ya cotizaron tu pedido")
            if (compra.solicitante && compra.solicitante.email) {
                await enviarCorreo({
                    from: process.env.EMAIL_USER,
                    to: compra.solicitante.email,
                    subject: `Tu Requerimiento #${compra.codigo} ha sido Cotizado`,
                    html: `
                        <h1>Requerimiento Cotizado</h1>
                        <p>Hola ${compra.solicitante.nombre},</p>
                        <p>Tu requerimiento <strong>#${compra.codigo}</strong> ya tiene una cotización registrada por un monto estimado de <strong>S/ ${montoTotalEstimado.toFixed(2)}</strong>.</p>
                        <p>Actualmente se encuentra <strong>pendiente de aprobación</strong> por la gerencia.</p>
                        <p>Puedes ver el avance en el sistema: <a href="${linkSistema}">Ingresar</a></p>
                    `
                });
            }
        } catch (emailError) {
            console.error("Error al enviar correos de cotización:", emailError);
        }

    }catch (error) {
        if (!res.headersSent) res.status(500).json({ msg: "Error al registrar cotización", error: error.message });
        else console.error("Error posterior a la respuesta:", error);
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
        .populate('solicitante', 'nombre email')
        .populate('cotizador', 'nombre email')
        .populate('proveedor', 'nombre')
        .populate('cotizacion', 'numeroCotizacion descripcionServicio');

        // RESPONDER INMEDIATAMENTE
        res.json(compra);

        try {
            // CORRECCIÓN: Extraer IDs correctamente (solicitante es un objeto poblado, cotizador es un ID)
            const solicitanteId = compra.solicitante ? (compra.solicitante._id || compra.solicitante) : null;
            const cotizadorId = compra.cotizador ? (compra.cotizador._id || compra.cotizador) : null;
            
            const destinatarios = [solicitanteId, cotizadorId].filter(id => id);
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

        // 📧 CORREO: Notificar al Solicitante y al Cotizador
        try {
            console.log(`[EvaluarCompra] Iniciando notificación por correo. Decisión: ${decision}`);
            const decisionTexto = decision === 'aprobado' ? 'APROBADO' : 'RECHAZADO';
            const destinatariosEmail = [];
            const linkSistema = process.env.FRONTEND_URL || 'https://inventarios-aip4.vercel.app';

            if (compra.solicitante && compra.solicitante.email) {
                destinatariosEmail.push({ email: compra.solicitante.email, nombre: compra.solicitante.nombre });
            } else {
                console.warn("[EvaluarCompra] Solicitante no tiene email o no se cargó:", compra.solicitante);
            }
            if (compra.cotizador && compra.cotizador.email) {
                // Evitar duplicados
                if (!destinatariosEmail.some(d => d.email === compra.cotizador.email)) {
                    destinatariosEmail.push({ email: compra.cotizador.email, nombre: compra.cotizador.nombre });
                }
            }

            console.log(`[EvaluarCompra] Destinatarios encontrados: ${destinatariosEmail.length}`, destinatariosEmail);

            for (const dest of destinatariosEmail) {
                console.log(`[EvaluarCompra] Enviando correo a: ${dest.email}`);
                await enviarCorreo({
                    from: process.env.EMAIL_USER,
                    to: dest.email,
                    subject: `Requerimiento de Compra #${compra.codigo} ha sido ${decisionTexto}`,
                    html: `
                        <h1>Actualización de Requerimiento</h1>
                        <p>Hola ${dest.nombre},</p>
                        <p>El requerimiento de compra <strong>#${compra.codigo}</strong> ha sido <strong>${decisionTexto}</strong>.</p>
                        ${decision === 'rechazado' ? `<p><strong>Motivo:</strong> ${comentarios}</p>` : ''}
                        <p>Puedes ver los detalles en el sistema: <a href="${linkSistema}">Ingresar</a></p>
                    `
                });
                console.log(`[EvaluarCompra] Correo enviado a ${dest.email}`);
            }
        } catch (emailError) {
            console.error("Error al enviar correos de notificación:", emailError);
        }

    } catch (error) {
        if (!res.headersSent) res.status(500).json({ msg: "Error al evaluar compra", error: error.message });
        else console.error("Error posterior a la respuesta:", error);
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
                    usuario: compra.solicitante._id || compra.solicitante, // CORRECCIÓN: Usar solo el ID
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