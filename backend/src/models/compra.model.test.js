import mongoose from 'mongoose';
import Compra from './compra.model.js';

describe('Compra Model Unit Tests', () => {
    
    it('should create a valid Compra instance with correct defaults', () => {
        const validData = {
            titulo: 'Compra de Equipos de Cómputo',
            solicitante: new mongoose.Types.ObjectId(),
            items: [
                {
                    nombre: 'Laptop Dell',
                    descripcion: 'Latitude 5420',
                    cantidad: 3,
                    precioUnitario: 3500,
                    total: 10500
                }
            ],
            prioridad: 'alta'
        };

        const compra = new Compra(validData);
        const err = compra.validateSync();

        expect(err).toBeUndefined();
        expect(compra.titulo).toBe(validData.titulo);
        expect(compra.estado).toBe('pendiente'); // Default value
        expect(compra.items[0].unidad).toBe('und'); // Default value inside items
        expect(compra.fechaSolicitud).toBeDefined();
    });

    it('should fail validation when required fields are missing', () => {
        const compra = new Compra({}); // Empty object
        const err = compra.validateSync();

        expect(err.errors.titulo).toBeDefined();
        expect(err.errors.solicitante).toBeDefined();
    });

    it('should fail validation when nested item required fields are missing', () => {
        const compra = new Compra({
            titulo: 'Compra con items incompletos',
            solicitante: new mongoose.Types.ObjectId(),
            items: [
                {
                    // Missing nombre, descripcion, cantidad
                    unidad: 'caja'
                }
            ]
        });
        const err = compra.validateSync();

        expect(err.errors['items.0.nombre']).toBeDefined();
        expect(err.errors['items.0.descripcion']).toBeDefined();
        expect(err.errors['items.0.cantidad']).toBeDefined();
    });

    it('should fail validation for invalid enum values', () => {
        const compra = new Compra({
            titulo: 'Compra Enum Invalido',
            solicitante: new mongoose.Types.ObjectId(),
            estado: 'EN_PROCESO', // Invalid: should be lowercase or specific value
            prioridad: 'URGENTE' // Invalid: should be baja, media, alta
        });
        const err = compra.validateSync();

        expect(err.errors.estado).toBeDefined();
        expect(err.errors.prioridad).toBeDefined();
    });

    it('should accept valid enum values', () => {
        const compra = new Compra({
            titulo: 'Compra Enum Valido',
            solicitante: new mongoose.Types.ObjectId(),
            estado: 'aprobado',
            prioridad: 'baja'
        });
        const err = compra.validateSync();
        expect(err).toBeUndefined();
    });
});