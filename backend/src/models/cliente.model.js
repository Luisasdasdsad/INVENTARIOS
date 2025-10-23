import mongoose from "mongoose";

const clienteSchema = new mongoose.Schema({
    tipoDoc: { type: String, required: true, enum: ["DNI", "RUC", "CE"] },
    ruc: {
        type: String,
        validate: {
            validator: function(value) {
                if (this.tipoDoc === "RUC") {
                    return /^\d{11}$/.test(value);
                }
                return true; // Si no es RUC, no validar
            },
            message: "El RUC debe tener exactamente 11 dígitos numéricos."
        }
    },
    numero: {
        type: String,
        required: function() {
            return this.tipoDoc === "DNI" || this.tipoDoc === "CE";
        },
        validate: {
            validator: function(value) {
                if (this.tipoDoc === "DNI") {
                    return /^\d{8}$/.test(value);
                } else if (this.tipoDoc === "CE") {
                    return /^\d{1,20}$/.test(value);
                }
                return true;
            },
            message: function(props) {
                if (this.tipoDoc === "DNI") {
                    return "El DNI debe tener exactamente 8 dígitos numéricos.";
                } else if (this.tipoDoc === "CE") {
                    return "El CE debe tener entre 1 y 20 dígitos numéricos.";
                }
                return "Número inválido.";
            }
        }
    },
    nombre: { type: String, required: true },
    nombreComercial: { type: String },
    pais: { type: String, default: "PERU" },
    ubigeo: { type: String },
    direccion: { type: String },
    referencia: { type: String },
    telefono: { type: String },
    email: { type: String },
    contacto: { type: String },
    nombreApellido: { type: String },
    sitioWeb: { type: String },
    observaciones: { type: String },

}, { timestamps: true });

export default mongoose.model("Cliente", clienteSchema);

