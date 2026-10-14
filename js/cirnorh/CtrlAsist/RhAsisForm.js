// js/cirnorh/asistencia/RhAsisForm.js

window.RhAsisForm = {
    groupedData: {},
    rawHeader: [],

    manejarCargaArchivo: function(input) {
        return new Promise((resolve, reject) => {
            const file = input.files[0];
            if (!file) {
                reject("No se seleccionó ningún archivo.");
                return;
            }

            const reader = new FileReader();
            reader.onload = (evt) => {
                try {
                    const data = new Uint8Array(evt.target.result);
                    const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                    const sheet = workbook.Sheets[workbook.SheetNames[0]];
                    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
                    
                    RhAsisForm.processData(rows);
                    resolve(true);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = (error) => reject(error);
            reader.readAsArrayBuffer(file);
        });
    },

    processData: function(rows) {
        RhAsisForm.groupedData = {};
        let headerIndex = -1;

        // 1. Buscamos de forma flexible la fila de encabezados o la primera fila de datos reales
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;

            const rowStr = row.join(" ").toLowerCase();
            // Identificamos por palabras clave del reporte biométrico o si encontramos celdas numéricas en las primeras columnas
            if (rowStr.includes('centro') || rowStr.includes('num') || rowStr.includes('entrada') || rowStr.includes('salida')) {
                headerIndex = i;
                RhAsisForm.rawHeader = row;
                break;
            }
        }

        // Si no se detectó por texto, buscamos la primera fila que contenga un número de empleado válido
        if (headerIndex === -1) {
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                if (row && (row[0] !== "" || row[1] !== "")) {
                    const valCheck = row[0] !== "" ? row[0] : row[1];
                    if (!isNaN(valCheck) && String(valCheck).trim() !== "") {
                        headerIndex = i - 1;
                        break;
                    }
                }
            }
        }

        // Si aún no se localiza, asignamos la cabecera estándar por defecto del sistema
        if (headerIndex === -1 || headerIndex >= rows.length) {
            headerIndex = 6; // Valor estándar para reportes con 6 líneas institucionales arriba
            RhAsisForm.rawHeader = [
                "Centro", "Núm. Emp", "Hra.Entrada", "Hra. Salida",
                "Hra.Registro", "Registro", "Fecha Reg.", "Día Reg.",
                "Retardo Men.", "Retardo Med.", "Retardo May.", "Falta"
            ];
        } else if (!RhAsisForm.rawHeader || RhAsisForm.rawHeader.length === 0) {
            RhAsisForm.rawHeader = rows[headerIndex] || [
                "Centro", "Núm. Emp", "Hra.Entrada", "Hra. Salida",
                "Hra.Registro", "Registro", "Fecha Reg.", "Día Reg.",
                "Retardo Men.", "Retardo Med.", "Retardo May.", "Falta"
            ];
        }

        // 2. Procesar las filas de datos a partir del índice detectado
        let countValidos = 0;
        for (let i = headerIndex + 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;

            let empId = String(row[0] || row[1] || "").trim();
            if (!empId || empId === "undefined" || empId.toLowerCase().includes('total') || empId.toLowerCase().includes('suma')) continue;

            if (!RhAsisForm.groupedData[empId]) {
                RhAsisForm.groupedData[empId] = { 
                    nombre: String(row[2] || "Empleado").trim(), 
                    rows: [] 
                };
            }

            // Aseguramos que la fila tenga celdas suficientes (mínimo 12 para la tabla SQL SRICtrlAsi)
            while (row.length < 12) {
                row.push("");
            }

            RhAsisForm.groupedData[empId].rows.push(row);
            countValidos++;
        }

        console.log(`📊 Datos procesados correctamente: ${countValidos} registros válidos para ${Object.keys(RhAsisForm.groupedData).length} empleados.`);
    },

    guardarDatosProcesados: function() {
        if (Object.keys(RhAsisForm.groupedData).length === 0) {
            alert("No hay datos cargados para guardar.");
            return;
        }

        try {
            localStorage.setItem('cirnorh_asistencia_biometrico', JSON.stringify(RhAsisForm.groupedData));
            alert("✅ ¡Datos del biométrico guardados y sincronizados correctamente!");
        } catch (e) {
            console.error(e);
            alert("Error al guardar localmente los datos.");
        }
    },

    generateWorkbook: function() {
        const wb = XLSX.utils.book_new();
        const fondoHoja = "E9F5E9";
        const MaxFila = 200;
        const MaxCol = 26;

        Object.keys(RhAsisForm.groupedData).forEach(id => {
            const emp = RhAsisForm.groupedData[id];
            const wsData = [
                ["inifap", "", "INSTITUTO NACIONAL DE INVESTIGACIONES FORESTALES AGRÍCOLAS Y PECUARIAS"],
                ["Instituto Nacional de Investigaciones", "", "COORDINACIÓN DE ADMINISTRACIÓN Y SISTEMAS"],
                ["Forestales, Agrícolas y Pecuarias", "", "DIRECCIÓN DE DESARROLLO HUMANO Y PROFESIONALIZACIÓN"],
                ["", "", "INCIDENCIAS GENERADAS DE ACUERDO AL REGISTRO ELECTRÓNICO V2"],
                ["", "", "Reporte: RH_CONTROL_ASISTENCIA_V2"],
                [],
                RhAsisForm.rawHeader,
                ...emp.rows
            ];
            const ws = XLSX.utils.aoa_to_sheet(wsData);
            ws['!ref'] = `A1:${XLSX.utils.encode_col(MaxCol - 1)}${MaxFila}`;
            ws['!view'] = { showGridLines: false };

            const tableRows = wsData.slice(6);
            const colWidths = RhAsisForm.rawHeader.map((_, colIndex) => {
                if (colIndex === 0) return { wch: 15 };
                let maxWidth = 10;
                tableRows.forEach(row => {
                    const cellValue = row[colIndex];
                    const text = cellValue ? String(cellValue) : "";
                    const currentWidth = cellValue instanceof Date ? 12 : text.length + 2;
                    if (currentWidth > maxWidth) maxWidth = currentWidth;
                });
                return { wch: maxWidth };
            });
            ws['!cols'] = colWidths;

            for (let r = 0; r < MaxFila; r++) {
                for (let c = 0; c < MaxCol; c++) {
                    const cellRef = XLSX.utils.encode_cell({ r: r, c: c });
                    if (!ws[cellRef]) ws[cellRef] = { v: "" };
                    let style = { fill: { type: 'pattern', pattern: 'solid', fgColor: { rgb: fondoHoja } }, font: { sz: 9, name: "Arial" }, alignment: { vertical: "center", horizontal: "center" } };
                    if (r === 0 && c === 0) { style.font = { bold: true, sz: 24, color: { rgb: "249444" }, name: "Arial Black" }; style.alignment.horizontal = "left"; }
                    if (r >= 1 && r <= 2 && c >= 0 && c <= 1) { style.font = { sz: 8, color: { rgb: "1A1A1B" }, bold: true }; style.alignment.horizontal = "left"; style.alignment.wrapText = true; }
                    if (r === 6 && c < RhAsisForm.rawHeader.length) { style.fill = { type: 'pattern', pattern: 'solid', fgColor: { rgb: "D9D9D9" } }; style.font.bold = true; style.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }; }
                    if (r >= 7) {
                        const dRow = emp.rows[r - 7];
                        if (dRow && c < RhAsisForm.rawHeader.length) {
                            let bgColor = fondoHoja; let fontColor = "000000";
                            if (dRow[13]) { bgColor = "FF0000"; fontColor = "FFFFFF"; } else if (dRow[12]) { bgColor = "E46C0A"; fontColor = "FFFFFF"; } else if (dRow[11]) { bgColor = "FFC000"; } else if (dRow[10]) { bgColor = "FFFF00"; }
                            style.fill = { type: 'pattern', pattern: 'solid', fgColor: { rgb: bgColor } }; style.font.color = { rgb: fontColor }; style.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
                        }
                    }
                    ws[cellRef].s = style;
                }
            }
            XLSX.utils.book_append_sheet(wb, ws, id.substring(0, 31));
        });
        return wb;
    },

    exportarExcel: function() {
        const wb = RhAsisForm.generateWorkbook();
        XLSX.writeFile(wb, `Reporte_Biometrico_INIFAP.xlsx`);
    },

    mostrarModalJustificante: function() {
        alert("Formulario para cargar justificantes médicos.");
    }
};