# TODO: Add Marca, Modelo, and Currency to Products

## Backend Changes
- [ ] Update `backend/src/models/producto.model.js` to include `marca`, `modelo`, and `moneda` fields
- [ ] Ensure backward compatibility with existing products

## Frontend Changes
- [ ] Update `frontend/src/features/productos/ProductoForm.jsx` to include marca, modelo, and currency selection
- [ ] Update `frontend/src/features/productos/ProductoList.jsx` to display new fields (marca, modelo, currency)
- [ ] Update `frontend/src/features/cotización/Cotización.jsx` to handle dollar prices with exchange rate conversion

## Testing
- [ ] Test product creation/editing with new fields
- [ ] Test quotation generation with dollar prices
- [ ] Ensure PDF generation handles currency correctly
- [ ] Verify backward compatibility with existing products
