import nodemailer from 'nodemailer';
import { config } from  'dotenv';

config();

export const enviarCorreo = async ({ to, subject, html }) => {
    // Si no estamos en producción, solo simulamos el envío en consola.
    if (process.env.NODE_ENV !== 'production') {
        console.log("----------------------------------------------------");
        console.log(`📧 [SIMULACIÓN DE CORREO EN MODO DESARROLLO]`);
        console.log(`PARA: ${to}`);
        console.log(`ASUNTO: ${subject}`);
        console.log("----------------------------------------------------");
        return { messageId: `simulated_${Date.now()}` };
    }

    try {
        // VALIDACIÓN PREVIA: Verificar que las credenciales existen en el entorno
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error("❌ ERROR CRÍTICO: Variables de entorno EMAIL_USER o EMAIL_PASS no definidas.");
            return null;
        }

        // --- PARCHE DE CORRECCIÓN ---
        // Si el sistema intenta enviar al correo antiguo, lo redirigimos forzosamente al gerente actual.
        let destinatario = to;
        if (typeof destinatario === 'string' && destinatario.includes('alexandergg@teamgas.com')) {
            console.log("⚠️ Corrigiendo destinatario: alexandergg@teamgas.com -> gerencia@teamgas.pe");
            destinatario = destinatario.replace('alexandergg@teamgas.com', 'gerencia@teamgas.pe');
        }

        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,              // NOTA CRÍTICA: Render (Free Tier) bloquea salida a puertos 25, 465 y 587.
                                    // Para producción en Render Free, se requiere usar una API (como Resend/SendGrid) vía HTTPS (443).
            secure: false,          // CAMBIO: false es obligatorio para el puerto 587
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            tls: { rejectUnauthorized: false }, // Ayuda a evitar errores de certificados
            family: 4 // IMPORTANTE: Mantenemos IPv4 forzado
        });

        let remitente = process.env.EMAIL_USER;

        console.log(`📧 Intento de envío: DE [${remitente}] PARA [${destinatario}]`);

        const mailOptions = {
            from: `"Sistema de TEAM GAS" <${remitente}>`,
            to: destinatario, // Usamos la variable corregida
            subject,
            html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Correo enviado: %s", info.messageId);
        return info;
    } catch (error) {
        console.error("Error enviando correo:", error);
        return null;
    }
};