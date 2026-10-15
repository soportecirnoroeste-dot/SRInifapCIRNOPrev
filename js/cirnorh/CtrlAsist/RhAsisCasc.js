// js/cirnorh/asistencia/RhAsisCasc.js

window.RhAsisCasc = {
    registrosBiometrico: [],
    personalGlobal: [],
    rawHeaderGlobal: [
        "Centro", "Núm. Emp", "Hra.Entrada", "Hra. Salida",
        "Hra.Registro", "Registro", "Fecha Reg.", "Día Reg.",
        "Retardo Men.", "Retardo Med.", "Retardo May.", "Falta"
    ],

    extraerHoraLegible: function (valor, esRegistroCompleto = false) {
        if (!valor) return "";
        let strVal = String(valor).trim();

        if (strVal.includes('1899-12-30T') || strVal.includes('T')) {
            const fechaObj = new Date(strVal);
            if (!isNaN(fechaObj.getTime())) {
                const horas = String(fechaObj.getHours()).padStart(2, '0');
                const minutos = String(fechaObj.getMinutes()).padStart(2, '0');

                if (esRegistroCompleto) {
                    const segundos = String(fechaObj.getSeconds()).padStart(2, '0');
                    return `${horas}:${minutos}:${segundos}`;
                }
                return `${horas}:${minutos}`;
            }
        }

        return strVal;
    },

    // 🟢 Validación de permisos: Permiso 4 otorga control total para cualquier campo
    tienePermisoGlobal: function () {
        const permisoUsuario = parseInt(localStorage.getItem('usuario_permiso_actual') || localStorage.getItem('permiso_usuario') || "0", 10);
        return permisoUsuario === 4;
    },

    obtenerClaveCentroActual: function () {
        // Si tiene permiso 4, tomamos el valor seleccionado en el combo dinámico de la interfaz
        if (RhAsisCasc.tienePermisoGlobal()) {
            const selectCentro = document.getElementById('selectCentroCargaAdmin');
            if (selectCentro && selectCentro.value) {
                return String(selectCentro.value).trim();
            }
        }
        
        // Si no tiene permiso 4, tomamos de forma fija el centro asignado al usuario logueado
        let claveCentroUsuario = localStorage.getItem('centro_activo_actual') || localStorage.getItem('usuario_centro') || "";
        return String(claveCentroUsuario).trim();
    },

    mostrarVistaBiometrico: async function () {
        const contenedor = document.getElementById('app-container') || document.querySelector('main') || document.body;

        if (!contenedor) {
            console.error("❌ ERROR: No se encontró ningún contenedor para pintar la vista.");
            return;
        }

        const nombreCortoActual = localStorage.getItem('depto_activo_actual') || 'cirnorh';
        if (typeof window.actualizarBotonRegresar === 'function') {
            window.actualizarBotonRegresar('vista-interna', nombreCortoActual, () => {
                if (typeof cargarAsistenciaRh === 'function') {
                    cargarAsistenciaRh();
                } else {
                    window.location.href = `main.html?depto=${nombreCortoActual}&seccion=asistencia`;
                }
            });
        }

        // 🟢 Generamos dinámicamente el selector de campos si el usuario tiene permiso 4
        let selectorCentroHtml = '';
        const esAdminGlobal = RhAsisCasc.tienePermisoGlobal();

        if (esAdminGlobal) {
            selectorCentroHtml = `
                <div class="flex flex-col gap-1">
                    <label for="selectCentroCargaAdmin" class="text-[10px] font-bold text-[#249444] uppercase tracking-wider">Campo / Centro de Trabajo (Admin)</label>
                    <select id="selectCentroCargaAdmin" class="px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs uppercase outline-none focus:ring-2 focus:ring-[#249444] text-stone-700 shadow-xs cursor-pointer h-[34px]">
                        <option value="CIQ">CIQ - Campo Experimental Norman E. Borlaug</option>
                        <option value="CIB">CIB - Centro de Investigación Regional Noroeste</option>
                        <option value="CIG">CIG - Campo Experimental Valle del Yaqui</option>
                    </select>
                </div>
            `;
        }

        contenedor.innerHTML = `
            <div class="space-y-6 animate-fade-in pb-10">
                <div class="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 space-y-6">
                    <div class="flex items-center gap-3 mb-6 pb-4 border-b border-stone-100">
                        <div class="p-2.5 bg-[#f0fdf4] border border-[#c6f6d5] text-[#059669] rounded-xl flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 21a8 8 0 0 1 13.292-6"/><circle cx="10" cy="8" r="5"/><path d="m16 19 2 2 4-4"/></svg>
                        </div>
                        <div>
                            <h3 class="font-black text-stone-800 text-lg uppercase tracking-wide">CONTROL DE ASISTENCIA</h3>
                            <p class="text-xs text-stone-500">Gestión y carga masiva de biométricos</p>
                        </div>
                    </div>

                    <div class="bg-stone-50/60 rounded-2xl border border-stone-200 p-5 space-y-4">
                        <div class="flex flex-col gap-4">
                            <input type="file" id="uploadBiometrico" class="hidden" accept=".xlsx, .xlsm, .csv" onchange="RhAsisCasc.manejarCargaYGuardadoAutomatico(this)">

                            <div class="flex flex-wrap items-center justify-between gap-3 w-full">
                                <div class="flex items-center gap-4">
                                    <h4 class="font-bold text-stone-800 text-sm">Gestión de Asistencias</h4>
                                    ${selectorCentroHtml}
                                </div>

                                <div class="flex flex-wrap items-end gap-2">
                                    <div class="flex flex-col gap-1">
                                        <span class="text-[10px] font-bold text-[#249444] uppercase tracking-wider">Paso 1</span>
                                        <a href="http://biometrico.inifap.gob.mx/LoginBio.aspx?ReturnUrl=%2f" target="_blank" rel="noopener noreferrer" class="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer h-[34px] no-underline">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                                            <span>Conexión Biometricos</span>
                                        </a>
                                    </div>

                                    <div class="flex flex-col gap-1">
                                        <span class="text-[10px] font-bold text-[#249444] uppercase tracking-wider">Paso 2</span>
                                        <a href="https://sigi.inifap.gob.mx/Login.aspx?ReturnUrl=%2flogueo.aspx" target="_blank" rel="noopener noreferrer" class="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer h-[34px] no-underline">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                                            <span>Login SIGI</span>
                                        </a>
                                    </div>

                                    <div class="flex flex-col gap-1">
                                        <span class="text-[10px] font-bold text-[#249444] uppercase tracking-wider">Paso 3</span>
                                        <button id="labelCargaDatos" class="px-4 py-2 bg-[#249444] text-white rounded-xl text-xs font-bold hover:bg-[#1e7a37] transition flex items-center gap-2 cursor-pointer shadow-xs h-[34px]" onclick="document.getElementById('uploadBiometrico').click();">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-up"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M12 12v6"/><path d="m15 15-3-3-3 3"/></svg>
                                            <span id="textoCargaBtn">Carga de Datos</span>
                                        </button>
                                    </div>

                                    <button id="exportBtn" disabled onclick="if(window.RhAsisCasc && typeof RhAsisCasc.exportarExcelCasc === 'function') RhAsisCasc.exportarExcelCasc()" class="px-4 py-2 bg-[#249444] text-white rounded-xl text-xs font-bold hover:bg-[#1e7a37] transition flex items-center gap-2 shadow-xs opacity-60 cursor-not-allowed h-[34px]">
                                        <svg id="exportIcon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-down"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/></svg>
                                        <span id="exportText">Exportar Información</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
                        <div class="px-6 py-4 border-b border-stone-100 flex justify-between items-center bg-white">
                            <h4 class="font-bold text-stone-800 text-xs uppercase tracking-wider">
                                LISTADO DE <span id="contadorRegistrosBio">0</span> REGISTROS DE BIOMÉTRICO
                            </h4>

                            <div class="flex flex-wrap items-end gap-3">
                                <div class="flex flex-col gap-1">
                                    <label for="filtroFechaDesde" class="text-[10px] font-bold text-stone-500 uppercase tracking-wider">De</label>
                                    <input type="date" id="filtroFechaDesde" onchange="RhAsisCasc.aplicarFiltrosCombinados()"
                                        class="px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs uppercase outline-none focus:ring-2 focus:ring-[#249444] text-stone-700 shadow-xs cursor-pointer">
                                </div>

                                <div class="flex flex-col gap-1">
                                    <label for="filtroFechaHasta" class="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Hasta</label>
                                    <input type="date" id="filtroFechaHasta" onchange="RhAsisCasc.aplicarFiltrosCombinados()"
                                        class="px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs uppercase outline-none focus:ring-2 focus:ring-[#249444] text-stone-700 shadow-xs cursor-pointer">
                                </div>

                                <div class="flex flex-col gap-1">
                                    <label for="filtroCentroBio" class="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Centro</label>
                                    <input type="text" id="filtroCentroBio" oninput="RhAsisCasc.aplicarFiltrosCombinados()" placeholder="Centro..."
                                        class="w-32 px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs uppercase outline-none focus:ring-2 focus:ring-[#249444] transition-all shadow-xs text-stone-700">
                                </div>

                                <div class="flex flex-col gap-1">
                                    <label for="filtroNumEmpBio" class="text-[10px] font-bold text-stone-500 uppercase tracking-wider">N° Empleado</label>
                                    <input type="text" id="filtroNumEmpBio" oninput="RhAsisCasc.aplicarFiltrosCombinados()" placeholder="Núm..."
                                        class="w-32 px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs uppercase outline-none focus:ring-2 focus:ring-[#249444] transition-all shadow-xs text-stone-700">
                                </div>
                            </div>
                        </div>

                        <div id="gridContentBio" class="max-h-[500px] overflow-y-auto overflow-x-auto custom-scrollbar">
                            <table class="w-full text-[11px] text-left border-collapse min-w-[950px]">
                                <thead class="bg-stone-50 font-bold text-stone-700 sticky top-0 z-10 border-b border-stone-200">
                                    <tr>${RhAsisCasc.rawHeaderGlobal.map(h => `<th class="p-3 border-b border-stone-200 text-center whitespace-nowrap">${h}</th>`).join('')}</tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td colspan="${RhAsisCasc.rawHeaderGlobal.length}" class="py-12 text-center text-stone-400 italic font-medium">
                                            SINCRONIZANDO DATOS...
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;

        RhAsisCasc.registrosBiometrico = [];
        await RhAsisCasc.cargarDatosDesdeSheets();
    },

    manejarCargaYGuardadoAutomatico: async function (input) {
        const file = input.files[0];
        if (!file) return;

        const labelCarga = document.getElementById('labelCargaDatos');
        const textCarga = document.getElementById('textoCargaBtn');
        const apiCall = window.callAppsScript || window.FetchAPI;

        try {
            if (labelCarga) {
                labelCarga.classList.remove('cursor-pointer', 'bg-[#249444]', 'hover:bg-[#1e7a37]');
                labelCarga.classList.add('bg-stone-400', 'cursor-wait');
            }
            if (textCarga) textCarga.innerText = "Leyendo archivo...";

            const rows = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    try {
                        const data = new Uint8Array(evt.target.result);
                        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                        const sheet = workbook.Sheets[workbook.SheetNames[0]];
                        const parsedRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
                        resolve(parsedRows);
                    } catch (err) {
                        reject(err);
                    }
                };
                reader.onerror = (error) => reject(error);
                reader.readAsArrayBuffer(file);
            });

            if (!rows || rows.length === 0) {
                alert("El archivo Excel está vacío.");
                return;
            }

            const filasValidas = [];
            let rawFechaDetectada = "";

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                if (!row || row.length === 0 || row.every(c => c === "")) continue;

                const col0 = String(row[0] || "").trim();
                const col1 = String(row[1] || "").trim();
                const rowText = row.join(" ").toLowerCase();

                if (rowText.includes('instituto') || rowText.includes('coordinación') || rowText.includes('dirección') || rowText.includes('reporte') || rowText.includes('núm. emp')) {
                    continue;
                }

                if (col0 !== "" || col1 !== "") {
                    while (row.length < 12) {
                        row.push("");
                    }
                    filasValidas.push(row);

                    if (!rawFechaDetectada) {
                        for (let c = 0; c < row.length; c++) {
                            const val = String(row[c] || "");
                            if (val.includes('-') || val.includes('/') || val.length >= 8) {
                                rawFechaDetectada = val;
                                break;
                            }
                        }
                    }
                }
            }

            if (filasValidas.length === 0) {
                alert("El archivo se leyó pero no se encontraron datos válidos.");
                return;
            }

            if (!rawFechaDetectada) {
                rawFechaDetectada = new Date().toISOString().split('T')[0];
            }

            let fechaNormalizada = RhAsisCasc.normalizarFechaFiltro(rawFechaDetectada);
            let primerNumEmp = String(filasValidas[0][0] || filasValidas[0][1] || "0").trim();

            if (textCarga) textCarga.innerText = "Verificando...";

            // 🟢 Obtenemos la clave de centro validando si es admin global (permiso 4) o centro asignado
            let claveCentroSeleccionado = RhAsisCasc.obtenerClaveCentroActual();

            if (!claveCentroSeleccionado) {
                alert("⚠️ Por favor selecciona o configura un Centro de Trabajo válido antes de continuar.");
                return;
            }

            if (apiCall) {
                const verificacion = await apiCall("verificarFechaBiometrico", {
                    numEmp: primerNumEmp,
                    fecha: fechaNormalizada
                });
                const yaExiste = verificacion && (verificacion.existe === true || verificacion.existe === "true");

                if (yaExiste) {
                    alert(`🛑 Los datos para este periodo ya fueron cargados anteriormente.`);
                    return;
                } else {
                    if (textCarga) textCarga.innerText = "Guardando...";

                    const rowsParaSql = filasValidas.map(row => [
                        claveCentroSeleccionado,
                        row[0] || "",
                        row[4] || "",
                        row[5] || "",
                        row[6] || "",
                        row[7] || "",
                        row[8] || "",
                        row[9] || "",
                        row[10] || "",
                        row[11] || "",
                        row[12] || "",
                        row[13] || ""
                    ]);

                    const resultado = await apiCall("guardarBiometrico", {
                        filas: rowsParaSql
                    });

                    if (resultado && resultado.success) {
                        sessionStorage.removeItem(`biometrico_registros_${claveCentroSeleccionado}`);
                        sessionStorage.removeItem(`biometrico_registros_general`);

                        alert(`✅ ¡Datos cargados y guardados exitosamente en SQL Server (${rowsParaSql.length} registros para el centro ${claveCentroSeleccionado})!`);
                        await RhAsisCasc.cargarDatosDesdeSheets();
                    } else {
                        alert("⚠️ Aviso al guardar: " + (resultado ? resultado.message : "Desconocido"));
                    }
                }
            }
        } catch (error) {
            console.error(error);
            alert("❌ Ocurrió un error al procesar la validación y carga del archivo.");
        } finally {
            if (labelCarga) {
                labelCarga.classList.remove('bg-stone-400', 'cursor-wait');
                labelCarga.classList.add('bg-[#249444]', 'hover:bg-[#1e7a37]', 'cursor-pointer');
            }
            if (textCarga) textCarga.innerText = "Carga de Datos";
            input.value = "";
        }
    },

    cargarDatosDesdeSheets: async function () {
        try {
            const apiCall = window.callAppsScript || window.FetchAPI;
            if (!apiCall) return;

            const claveCentroActivo = RhAsisCasc.obtenerClaveCentroActual ? String(RhAsisCasc.obtenerClaveCentroActual()).trim() : "";
            const cacheKey = `biometrico_registros_${claveCentroActivo || 'general'}`;

            const datosEnCache = sessionStorage.getItem(cacheKey);
            if (datosEnCache) {
                RhAsisCasc.registrosBiometrico = JSON.parse(datosEnCache);
                RhAsisCasc.renderGrid(RhAsisCasc.registrosBiometrico);
                return;
            }

            const res = await apiCall("obtenerTodosLosRegistrosPlano", {
                claveCentro: claveCentroActivo,
                centro: claveCentroActivo
            });

            if (res && (res.success || Array.isArray(res))) {
                const registrosData = Array.isArray(res) ? res : (res.registros || res.data || []);
                RhAsisCasc.registrosBiometrico = registrosData;
                sessionStorage.setItem(cacheKey, JSON.stringify(registrosData));
                RhAsisCasc.renderGrid(RhAsisCasc.registrosBiometrico);
            } else {
                RhAsisCasc.registrosBiometrico = [];
                RhAsisCasc.renderGrid([]);
            }
        } catch (e) {
            console.error("Error al cargar biométrico:", e);
            RhAsisCasc.registrosBiometrico = [];
            RhAsisCasc.renderGrid([]);
        }
    },

    renderGrid: function (listaRegistros) {
        const gridContent = document.getElementById('gridContentBio');
        const exportBtn = document.getElementById('exportBtn');
        const contador = document.getElementById('contadorRegistrosBio');

        if (!gridContent) return;
        const headers = RhAsisCasc.rawHeaderGlobal;

        if (!listaRegistros || listaRegistros.length === 0) {
            if (exportBtn) {
                exportBtn.disabled = true;
                exportBtn.className = "px-4 py-2 bg-stone-100 border border-stone-200 text-stone-400 opacity-60 cursor-not-allowed rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 h-[34px]";
            }
            if (contador) contador.innerText = "0";

            gridContent.innerHTML = `
                <table class="w-full text-[11px] text-left border-collapse min-w-[950px]">
                    <thead class="bg-stone-100 font-bold text-stone-700 sticky top-0 z-10 border-b border-stone-200">
                        <tr>${headers.map(h => `<th class="p-3 border-b border-stone-200 text-center whitespace-nowrap">${h}</th>`).join('')}</tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colspan="${headers.length}" class="py-12 text-center text-stone-400 italic font-medium">
                                SIN DATOS REGISTRADOS
                            </td>
                        </tr>
                    </tbody>
                </table>
            `;
            return;
        }

        if (exportBtn) {
            exportBtn.disabled = false;
            exportBtn.className = "px-4 py-2 bg-[#249444] hover:bg-[#1e7a37] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer h-[34px]";
        }

        if (contador) contador.innerText = `${listaRegistros.length}`;

        gridContent.innerHTML = `
            <table class="w-full text-[11px] text-left border-collapse min-w-[950px]">
                <thead class="bg-stone-100 font-bold text-stone-700 sticky top-0 z-10 border-b border-stone-200">
                    <tr>${headers.map(h => `<th class="p-3 border-b border-stone-200 text-center whitespace-nowrap">${h}</th>`).join('')}</tr>
                </thead>
                <tbody class="divide-y divide-stone-100">
                    ${listaRegistros.map(r => {
                        const celdas = Array.isArray(r) ? [...r.slice(0, 12)] : headers.map(h => r[h] || "");
                        return `
                            <tr class="bg-white hover:bg-stone-50 transition text-stone-700">
                                ${celdas.map((c, index) => {
                                    let val = c;
                                    if (index === 2 || index === 3) {
                                        val = RhAsisCasc.extraerHoraLegible(val, false);
                                    } else if (index === 4) {
                                        val = RhAsisCasc.extraerHoraLegible(val, true);
                                    }
                                    return `<td class="p-2.5 border-b border-stone-100 text-center whitespace-nowrap">${val !== null && val !== undefined && String(val).trim() !== '' ? val : ''}</td>`;
                                }).join('')}
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    },

    normalizarFechaFiltro: function (fechaStr) {
        if (!fechaStr) return "";
        let str = String(fechaStr).trim();
        if (str.includes('T')) str = str.split('T')[0];
        return str;
    },

    aplicarFiltrosCombinados: function () {
        const fechaDesde = document.getElementById('filtroFechaDesde')?.value || "";
        const fechaHasta = document.getElementById('filtroFechaHasta')?.value || "";
        const numEmpFiltro = document.getElementById('filtroNumEmpBio')?.value.toLowerCase().trim() || "";
        const centroFiltro = document.getElementById('filtroCentroBio')?.value.toLowerCase().trim() || "";

        const filtrados = RhAsisCasc.registrosBiometrico.filter(row => {
            if (!Array.isArray(row)) return false;
            const centro = String(row[0] || "").toLowerCase();
            const numEmp = String(row[1] || "").toLowerCase();
            const fechaRegRaw = String(row[6] || "").trim();
            const fechaRegNorm = RhAsisCasc.normalizarFechaFiltro(fechaRegRaw);

            if (centroFiltro && !centro.includes(centroFiltro)) return false;
            if (numEmpFiltro && !numEmp.includes(numEmpFiltro)) return false;
            if (fechaDesde && fechaRegNorm < fechaDesde) return false;
            if (fechaHasta && fechaRegNorm > fechaHasta) return false;

            return true;
        });

        RhAsisCasc.renderGrid(filtrados);
    },

    exportarExcelCasc: async function () {
        if (typeof RhAsisForm !== 'undefined' && typeof RhAsisForm.exportarExcel === 'function') {
            RhAsisForm.exportarExcel();
        } else {
            alert("Módulo de exportación Excel no disponible.");
        }
    }
};