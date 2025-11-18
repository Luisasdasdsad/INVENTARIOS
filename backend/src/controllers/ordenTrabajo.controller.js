import OrdenTrabajo from "../models/ordenTrabajo.model.js";
import Producto from "../models/producto.model.js";

export const crearOrdenTrabajo = async (req, res) => {
    try {
        const { numeroOT, cliente, productos, tecnicoAsignado, cotizacion} = req.body;

        if (!numeroOT || !cliente || !productos || !productos.length === 0) {
            return res.status(400).json({message: "Datos incompletos"});
        }

        for (let item of productos) {
            const prod = await Producto.findById(item.producto);
            if (!prod) return res.status(404).json({message: "Producto no encontrado"});

            if (prod.stock < item.cantidad) {
                return res.status(400).json({
                    message: `Stock insuficiente para ${prod.nombre}`
                });
            }
        }

        const nuevaOT = new OrdenTrabajo ({
            numeroOT,
            cliente,
            productos,
            tecnicoAsignado,
            cotizacion
        });

        await nuevaOT.save();

        res.status(201).json({
            message: "Orden de trabajo creada",
            data: nuevaOT
        });
    } catch (error) {
        res.status(500).json({message: "Error", error: error.message});
    }
};

export const listarOrdenesTrabajo = async (req, res) => {
    try {
        const orders = await OrdenTrabajo.find()
            .populate("tecnicoAsignado", "nombre email")
            .populate("productos.producto", "nombre modelo stock")
            .populate("cotizacion");
        
        res.status(200).json(orders);    
    } catch (error) {
        res.status(500).json({message: "Error", error:error.message});
    }
};

export const cambiarEstadoOT = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

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