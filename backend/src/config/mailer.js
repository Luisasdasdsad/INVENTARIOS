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
            host: "smtp.gmail.com", // Host explícito para mayor estabilidad en Render
            port: 587,              // Usar 587 (TLS) es más estable para evitar Timeouts
            secure: false,          // false es obligatorio para el puerto 587 (usa STARTTLS)
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: `"Sistema de TEAM GAS" <${process.env.EMAIL_USER}>`,
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