import html2pdf from "html2pdf.js";

const generarReporteOrdenTrabajo = async (ordenTrabajo) => {
  const {
    numeroOT,
    cliente,
    productos: productosRaw,
    herramientas: herramientasRaw,
    tareas: tareasRaw,
    estado,
    tecnicoAsignado,
    fechaInicio,
    fechaFin,
    observaciones,
    instruccionesTecnico,
    descripcionServicio,
    createdAt,
    ubicacion,
  } = ordenTrabajo;

  // Asegurar que sean arrays incluso si vienen como null
  const productos = productosRaw || [];
  const herramientas = herramientasRaw || [];
  const tareas = tareasRaw || [];

  // Formatear fechas
  const formatDateUTC = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: 'UTC',
    });
  };

  const formatDateLocal = (date) => {
    if (!date) return "N/A";
    const fecha = new Date(date);
    // Restamos 5 horas (5 * 60 * 60 * 1000 ms) para ajustar manualmente a hora Perú
    const fechaPeru = new Date(fecha.getTime() - 5 * 60 * 60 * 1000);
    return fechaPeru.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: 'UTC', // Usamos UTC porque ya restamos las horas manualmente
    });
  };

  const formattedFechaInicio = formatDateUTC(fechaInicio);
  const formattedFechaFin = formatDateUTC(fechaFin);
  const formattedCreatedAt = formatDateLocal(createdAt);

  // Combinar teléfono y celular si existen
  const telefonos = [cliente?.telefono, cliente?.celular].filter(Boolean).join(" / ");
  const telefonosTecnico = [tecnicoAsignado?.telefono, tecnicoAsignado?.celular].filter(Boolean).join(" / ");

  const headerWithDetails = `
    <!-- ENCABEZADO -->
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #ffc107; padding-bottom: 10px; margin-bottom: 5px;">
      <div style="display: flex; align-items: center;">
        <img src="/logo.png" alt="Logo" style="height: 70px;">
        <div style="margin-left: 15px;">
          <h3 style="margin: 0; color: #333; font-size: 16px;">TEAMGAS</h3>
          <p style="margin: 2px 0; font-size: 12px;">Email: info@teamgas.pe</p>
          <p style="margin: 2px 0; font-size: 12px;">Web: www.teamgas.pe</p>
          <p style="margin: 2px 0; font-size: 12px;"><b>Teléfono:</b> 997030802 - 919289085</p>
          <p style="margin: 2px 0; font-size: 12px;"><b>RUC:</b> 20604956499</p>
        </div>
      </div>
      <div style="text-align: right;">
        <h2 style="margin: 0; color: #333;">ORDEN DE TRABAJO N° ${numeroOT}</h2>
        <p style="margin: 0;">Fecha de Creación: ${formattedCreatedAt}</p>
      </div>
    </div>
  `;

  const companyTitle = `
    <!-- TÍTULO DE LA EMPRESA -->
    <div style="text-align: left; margin-bottom: 10px;">
      <h2 style="margin: 0 0 2px 0; color: #333; font-size: 16px; text-transform: uppercase;">Teamgas Sociedad Anónima Cerrada</h2>
      <p style="margin: 0; color: #444; font-size: 14px;"><b>Dirección:</b> Jr. Coronel Guerra Nro. 152, Junín - Chupaca</p>
    </div>
  `;

  const infoSection = `
    <!-- INFORMACIÓN PRINCIPAL -->
    <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
      <div style="width: 48%; border: 2px solid #ffc107; border-radius: 8px; padding: 5px;">
        <h4 style="margin-top: 0; color: #444; text-align: center;"><Strong>Cliente</Strong></h4>
        <p><b>Nombre:</b> ${cliente?.nombre ?? 'N/A'}</p>
        <p><b>${cliente?.tipoDoc || 'Documento'}:</b> ${cliente?.tipoDoc === 'RUC' ? (cliente?.ruc || 'N/A') : (cliente?.numero || 'N/A')}</p>
        <p><b>Dirección:</b> ${cliente?.direccion || ''}</p>
        <p><b>Ubicación de la obra:</b> ${ubicacion || ''}</p>
        <p><b>Teléfono:</b> ${telefonos || '__________________'}</p>
      </div>

      <div style="width: 48%; border: 2px solid #ffc107; border-radius: 8px; padding: 5px;">
        <h4 style="margin-top: 0; color: #444; text-align: center;"><Strong>Técnico Asignado</Strong></h4>
        <p><b>Nombre:</b> ${tecnicoAsignado?.nombre || "N/A"}</p>
        <p><b>Email:</b> ${tecnicoAsignado?.email || "N/A"}</p>
        <p><b>Teléfono:</b> ${telefonosTecnico || '__________________'}</p>
        <p><b>Hora de Llegada:</b> __________________</p>
        <p><b>Hora de Salida:</b> __________________</p>
      </div>
    </div>

    <!-- DATOS DE LA ORDEN -->
    <div style="border: 2px solid #ffc107; border-radius: 8px; padding: 2px; margin-bottom: 5px;">
      <h4 style="margin-top: 0; margin-bottom: 10px; color: #444; text-align: center;"><Strong>Datos de la Orden de Trabajo</Strong></h4>
      <div style="display: flex; justify-content: space-between;">
        <div style="width: 48%;">
          <p style="margin: 4px 0;"><b>Estado:</b> ${estado.replace("_", " ").toUpperCase()}</p>
          <p style="margin: 4px 0;"><b>Fecha de Inicio:</b> ${formattedFechaInicio}</p>
        </div>
        <div style="width: 48%;">
          <p style="margin: 4px 0;"><b>Fecha de Fin:</b> ${formattedFechaFin}</p>
          <p style="margin: 4px 0;"><b>N° OT:</b> ${numeroOT}</p>
        </div>
      </div>
    </div>
  `;

  const descripcionSection = descripcionServicio ? `
    <!-- DESCRIPCIÓN DEL SERVICIO -->
    <div style="border: 1px solid #ffc107; padding: 5px; margin-bottom: 10px; width: 100%;">
      <p style="margin: 0; color: #444;"><b>Descripción del Servicio:</b></p>
      <p style="margin: 5px 0 0 0; color: #444; white-space: pre-wrap;">${descripcionServicio}</p>
    </div>
  ` : '';

  const tableHeader = `
    <table style="width: 100%; border-collapse: collapse; font-size: 9px; border: 1px solid #ddd;">
      <thead>
        <tr style="background: #fff3cd; color: #333;">
          <th style="border: 2px solid #ffc107; padding: 3px 2px 13px 2px; text-align: center; vertical-align: middle; font-size: 11px; font-weight: bold; width: 10%;">N°</th>
          <th style="border: 2px solid #ffc107; padding: 3px 2px 13px 2px; text-align: center; vertical-align: middle; font-size: 11px; font-weight: bold; width: 15%;">CANTIDAD</th>
          <th style="border: 2px solid #ffc107; padding: 3px 2px 13px 2px; text-align: center; vertical-align: middle; font-size: 11px; font-weight: bold; width: 75%;">PRODUCTOS/MATERIALES</th>
        </tr>
      </thead>
      <tbody>
  `;

  const generateTableRows = (prods) => {
    if (!prods || prods.length === 0) return "";
    const rows = prods.map((p, idx) => {
      const index = idx + 1;
      const nombreProducto = p.producto?.nombre || "Producto no especificado";
      return `
        <tr>
          <td style="border-right: 1px solid #ddd; padding: 2px; text-align: center; width: 10%;">${index}</td>
          <td style="border-right: 1px solid #ddd; padding: 2px; text-align: center; width: 15%;">${p.cantidad}</td>
          <td style="border-right: 1px solid #ddd; padding: 6px; text-align: left; white-space: pre-line; line-height: 1.4; width: 75%;">${nombreProducto}</td>
        </tr>`;
    });
    return rows.join("");
  };

  // Combinar productos y tareas para mostrar en la tabla de materiales/productos
  const tareasComoProductos = tareas.map(t => ({
    cantidad: t.cantidad,
    producto: { nombre: t.descripcion }
  }));

  // Combinar herramientas para incluirlas en la misma tabla
  const herramientasComoProductos = herramientas.map(h => ({
    cantidad: h.cantidad,
    producto: { 
      nombre: `${h.herramienta?.nombre || "Herramienta"}${h.herramienta?.marca ? ` (${h.herramienta.marca})` : ""}` 
    }
  }));

  const todosLosProductos = [...productos, ...tareasComoProductos, ...herramientasComoProductos];

  // Generamos el HTML de las tablas antes para evitar errores en el template string
  const productosRows = generateTableRows(todosLosProductos);

  const formatInstructions = (instructions) => {
    if (!instructions) {
      return "Ninguna";
    }
    return instructions.replace(/\n/g, '<br>');
  };

  const footerSection = `
    <div style="page-break-inside: avoid;">
      <!-- OBSERVACIONES -->
      <div style="border: 1px solid #ffc107; padding: 5px; margin-bottom: 10px; width: 100%;">
        <p style="margin: 0; color: #444;"><b>Observaciones:</b> ${observaciones || "Ninguna"}</p>
      </div>

      <!-- INSTRUCCIONES PARA EL TÉCNICO -->
      <div style="border: 1px solid #ffc107; padding: 5px; margin-bottom: 10px; width: 100%;">
        <p style="margin: 0; color: #444;"><b>Instrucciones para el Técnico:</b></p>
        <div style="margin: 5px 0; color: #444;">${formatInstructions(instruccionesTecnico)}</div>
      </div>

      <!-- PIE -->
      <div style="text-align: center; font-size: 12px; color: #666; margin-bottom: 50px;">
        <p style="margin: 0;">Gracias por su trabajo. Equipo TEAMGAS</p>
      </div>
      
      <!-- FIRMAS -->
      <div style="page-break-inside: avoid; padding-top: 20px;">
          <table style="width: 100%;">
              <tr>
                  <td style="width: 40%; text-align: center; vertical-align: top;">
                      <div style="border-bottom: 1px solid #333; height: 70px; margin: 0 auto 5px auto;"></div>
                      <div style="font-weight: bold; font-size: 11px;">${tecnicoAsignado?.nombre || '________________'}</div>
                      <div style="font-size: 10px; color: #666;">TÉCNICO RESPONSABLE</div>
                  </td>
                  <td style="width: 20%;"></td>
                  <td style="width: 40%; text-align: center; vertical-align: top;">
                      <div style="border-bottom: 1px solid #333; height: 70px; margin: 0 auto 5px auto;"></div>
                      <div style="font-weight: bold; font-size: 11px;">CONFORMIDAD CLIENTE</div>
                      <div style="font-size: 10px; color: #666;">DNI / Firma / Sello</div>
                  </td>
              </tr>
          </table>
      </div>
    </div>
  `;

  const htmlContent = `
    <div class="no-break" style="font-family: 'Arial', sans-serif; font-size: 12px; padding: 20px; border-radius: 12px; background: #fff; width: 210mm; box-sizing: border-box; page-break-inside: avoid;">
      ${headerWithDetails}
      ${companyTitle}
      ${infoSection}
      ${descripcionSection}

      <div style="margin-bottom: 20px; ${!todosLosProductos || todosLosProductos.length === 0 ? 'display: none;' : ''}">
        <h4 style="margin: 0 0 5px 0; color: #444; font-size: 12px;">Materiales / Productos / Herramientas</h4>
        ${tableHeader}
        ${productosRows}
        </tbody></table>
      </div>

      ${footerSection}
    </div>
  `;

  const element = document.createElement("div");
  element.innerHTML = htmlContent;

  // === Generar PDF ===
  const opt = {
    margin: 0,
    filename: `ORDEN_TRABAJO_${numeroOT}.pdf`,
    image: { type: "jpeg", quality: 1 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    pagebreak: { mode: 'css', before: '.pagebreak', after: '.pagebreak', avoid: '.no-break' },
  };

  html2pdf().set(opt).from(element).save();
};

export default generarReporteOrdenTrabajo;