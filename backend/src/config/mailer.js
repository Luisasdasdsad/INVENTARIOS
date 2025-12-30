import nodemailer from 'nodemailer';
import { config } from  'dotenv';

config();

export const enviarCorreo = async ({ to, subject, html }) => {
    try {
        // --- PARCHE DE CORRECCIÓN ---
        // Si el sistema intenta enviar al correo antiguo, lo redirigimos forzosamente al gerente actual.
        let destinatario = to;
        if (typeof destinatario === 'string' && destinatario.includes('alexandergg@teamgas.com')) {
            console.log("⚠️ Corrigiendo destinatario: alexandergg@teamgas.com -> gerencia@teamgas.pe");
            destinatario = destinatario.replace('alexandergg@teamgas.com', 'gerencia@teamgas.pe');
        }

        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com", // Volvemos a Gmail
            port: 465,              // Puerto Seguro SSL (Mejor que 587 para Render)
            secure: true,           // Requerido para puerto 465
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            family: 4 // IMPORTANTE: Fuerza IPv4 para evitar timeouts en Render
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