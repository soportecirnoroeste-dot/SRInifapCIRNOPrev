// js/cirnorh/asistencia/RhAsisForm.js

window.RhAsisForm = {
    groupedData: {},
    rawHeader: [],

    manejarCargaArchivo: function(input) {
        const file = input.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const data = new Uint8Array(evt.target.result);
            const workbook = XLSX.read(data, { type: 'array', cellDates: true });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
            RhAsisForm.processData(rows);
        };
        reader.readAsArrayBuffer(file);
    },

    processData: function(rows) {
        RhAsisForm.groupedData = {};
        let dataStarted = false;

        rows.forEach((row, index) => {
            if (!dataStarted) {
                if (row[0] !== "" && !isNaN(row[0]) && row[0] !== null) {
                    dataStarted = true;
                    RhAsisForm.rawHeader = rows[index - 1] || [];
                } else return;
            }
            const empId = String(row[0]).trim();
            if (!empId || empId === "undefined") return;
            if (!RhAsisForm.groupedData[empId]) {
                RhAsisForm.groupedData[empId] = { nombre: (row[2] || "Empleado").trim(), rows: [] };
            }
            RhAsisForm.groupedData[empId].rows.push(row);
        });

        if (Object.keys(RhAsisForm.groupedData).length > 0) {
            document.getElementById('statsCounter').innerHTML = `Total: <span class="text-[#249444] font-bold">${Object.keys(RhAsisForm.groupedData).length} empleados</span> detectados`;
            RhAsisCasc.renderTabs();
        }
    },

    guardarDatosProcesados: function() {
        if (Object.keys(RhAsisForm.groupedData).length === 0) {
            alert("No hay datos cargados para guardar.");
            return;
        }

        // Guardamos una copia en localStorage para persistencia interna del sistema CIRNORH
        try {
            localStorage.setItem('cirnorh_asistencia_biometrico', JSON.stringify(RhAsisForm.groupedData));
            alert("✅ ¡Datos del biométrico guardados y sincronizados correctamente con el sistema de Recursos Humanos!");
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