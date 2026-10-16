// js/cirnorh/asistencia/RhAsisCasc.js
document.addEventListener("DOMContentLoaded", function() {
    if (typeof RhAsisCasc.cargarCamposPorRegional === "function") {
        RhAsisCasc.cargarCamposPorRegional();
    }
});

window.RhAsisCasc = {
    registrosBiometrico: [],
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

    obtenerNumEmpleadoLogueado: function () {
        let numEmp = localStorage.getItem('usuario_numemp') ||
            localStorage.getItem('SRIPerNumE') ||
            localStorage.getItem('num_emp') ||
            localStorage.getItem('id_empleado') || "";

        if (!numEmp) {
            const clavesJson = ['usuarioActivo', 'usuario', 'usuarioLogueado', 'sesionActiva', 'SRIEmpleado', 'datosUsuario'];
            for (let i = 0; i < clavesJson.length; i++) {
                const rawObj = localStorage.getItem(clavesJson[i]) || sessionStorage.getItem(clavesJson[i]);
                if (rawObj) {
                    try {
                        const parsed = JSON.parse(rawObj);
                        numEmp = parsed.SRIPerNumE || parsed.noEmpleado || parsed.numEmp || parsed.id || parsed.empleadoId || "";
                        if (numEmp) break;
                    } catch (e) { }
                }
            }
        }
        return String(numEmp).trim();
    },

    obtenerPermisoUsuarioDinamico: async function () {
        const numEmp = RhAsisCasc.obtenerNumEmpleadoLogueado();
        const apiCall = window.callAppsScript || window.FetchAPI;

        const configModulo = window.cirnorhConfig || {};
        const usuarioActivo = JSON.parse(localStorage.getItem('usuarioActivo') || '{}');

        const modId = configModulo.claveDep || "";
        const moduloNombreCorto = usuarioActivo.SRIModNomC || configModulo.deptoKey || "";
        const submoduloActual = localStorage.getItem('submoduloActivoId') || new URLSearchParams(window.location.search).get('seccion') || "";

        if (!apiCall || !numEmp) {
            return { permiso: 0, numEmp };
        }

        try {
            const res = await apiCall("obtenerPermisoSubmoduloSQL", {
                numEmp: numEmp,
                modId: modId,
                moduloNombre: moduloNombreCorto,
                submoduloNombre: submoduloActual
            });

            if (res && res.success && res.permiso !== undefined) {
                return { permiso: parseInt(res.permiso, 10), numEmp };
            }
        } catch (e) {
            console.error("❌ [DINÁMICO] Error al consultar permisos en SQL:", e);
        }

        return { permiso: 0, numEmp };
    },

    obtenerClaveCentroActual: function () {
        const selectCentro = document.getElementById('selectCentroCargaAdmin');
        if (selectCentro && !selectCentro.disabled && selectCentro.value) {
            return String(selectCentro.value).trim();
        }

        let claveUsuario = localStorage.getItem('centro_activo_actual') ||
            localStorage.getItem('usuario_centro') ||
            localStorage.getItem('depto_activo_actual') || "";

        return String(claveUsuario).trim();
    },

    // 🟢 CARGA DINÁMICA DE LOS CENTROS DESDE LA TABLA SQL (dbo.SRICentro) FILTRADOS POR REGIONAL
    cargarCamposPorRegional: async function () {
        const apiCall = window.callAppsScript || window.FetchAPI;
        const selectElement = document.getElementById('selectCentroCargaAdmin');

        if (!selectElement || !apiCall) return;

        const usuarioActivo = JSON.parse(localStorage.getItem('usuarioActivo') || '{}');
        const regId = usuarioActivo.SRIRegId || 100; 

        try {
            const res = await apiCall("obtenerCamposPorRegionalSQL", { regId: regId });

            if (res && res.success && Array.isArray(res.data)) {
                selectElement.innerHTML = '<option value="">SELECCIONE UN CENTRO DE TRABAJO...</option>';
                
                res.data.forEach(campo => {
                    const option = document.createElement('option');
                    option.value = campo.CenId;
                    
                    // 🟢 Formato explícito: ID - NOMBRE (ej: 108 - DIRECCIÓN CIR-NOROESTE)
                    const idCentro = campo.CenId || '';
                    const nombre = campo.CenNom || '';
                    option.textContent = `${idCentro} - ${nombre}`;
                    
                    selectElement.appendChild(option);
                });

                if (usuarioActivo.SRICenId) {
                    selectElement.value = usuarioActivo.SRICenId;
                }
            }
        } catch (e) {
            console.error("❌ Error en petición SQL de campos:", e);
        }
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

        // 1. Consultar permisos
        const datosPermiso = await RhAsisCasc.obtenerPermisoUsuarioDinamico();
        const permisoUsuario = datosPermiso.permiso;
        const esAdminGlobal = (permisoUsuario === 4 || permisoUsuario === 5);

        // 🟢 2. DECLARACIÓN DE LA VARIABLE (AQUÍ ESTABA EL ERROR)
        const indicadorDepuracionHtml = `
            <div class="px-3 py-1.5 bg-stone-100 border border-stone-200 rounded-lg text-[11px] text-stone-600 flex items-center gap-3">
                <span><b>Emp (SQL):</b> ${datosPermiso.numEmp || 'No detectado'}</span>
                <span><b>Permiso (SQL):</b> <strong class="${esAdminGlobal ? 'text-emerald-600' : 'text-stone-800'}">${permisoUsuario}</strong></span>
            </div>
        `;

        // 3. Selector dinámico de centros
        const selectorCentroHtml = `
            <div class="flex flex-col gap-1">
                <label for="selectCentroCargaAdmin" class="text-[10px] font-bold ${esAdminGlobal ? 'text-[#249444]' : 'text-stone-500'} uppercase tracking-wider">
                    Selecciona centro para cargar datos ${esAdminGlobal}
                </label>
                <select id="selectCentroCargaAdmin" ${!esAdminGlobal ? 'disabled' : ''} onchange="RhAsisCasc.cargarDatosDesdeSheets()" class="px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs uppercase outline-none focus:ring-2 focus:ring-[#249444] text-stone-700 shadow-xs cursor-pointer h-[34px]">
                    <option value="">Cargando centros...</option>
                </select>
            </div>
        `;

        contenedor.innerHTML = `
            <div class="space-y-6 animate-fade-in pb-10">
                <div class="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 space-y-6">
                    <div class="flex items-center justify-between mb-6 pb-4 border-b border-stone-100 flex-wrap gap-3">
                        <div class="flex items-center gap-3">
                            <div class="p-2.5 bg-[#f0fdf4] border border-[#c6f6d5] text-[#059669] rounded-xl flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 21a8 8 0 0 1 13.292-6"/><circle cx="10" cy="8" r="5"/><path d="m16 19 2 2 4-4"/></svg>
                            </div>
                            <div>
                                <h3 class="font-black text-stone-800 text-lg uppercase tracking-wide">CONTROL DE ASISTENCIA</h3>
                                <p class="text-xs text-stone-500">Gestión y carga masiva de biométricos</p>
                            </div>
                        </div>
                        ${indicadorDepuracionHtml}
                    </div>

                    <div class="bg-stone-50/60 rounded-2xl border border-stone-200 p-5 space-y-4">
                        <div class="flex flex-col gap-4">
                            <input type="file" id="uploadBiometrico" class="hidden" accept=".xlsx, .xlsm, .csv" onchange="RhAsisCasc.manejarCargaYGuardadoAutomatico(this)">

                            <div class="flex flex-wrap items-center justify-between gap-3 w-full">
                                <div class="flex items-center gap-4 flex-wrap">
                                    <h4 class="font-bold text-stone-800 text-sm">Gestión de Asistencias</h4>
                                    ${selectorCentroHtml}
                                </div>

                                <div class="flex flex-wrap items-end gap-2">
                                    <div class="flex flex-col gap-1">
                                        <span class="text-[10px] font-bold text-[#249444] uppercase tracking-wider">Paso 1</span>
                                        <a href="http://biometrico.inifap.gob.mx/LoginBio.aspx?ReturnUrl=%2f" target="_blank" rel="noopener noreferrer" class="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer h-[34px] no-underline">
                                            <span>Conexión Biometricos</span>
                                        </a>
                                    </div>

                                    <div class="flex flex-col gap-1">
                                        <span class="text-[10px] font-bold text-[#249444] uppercase tracking-wider">Paso 2</span>
                                        <a href="https://sigi.inifap.gob.mx/Login.aspx?ReturnUrl=%2flogueo.aspx" target="_blank" rel="noopener noreferrer" class="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer h-[34px] no-underline">
                                            <span>Login SIGI</span>
                                        </a>
                                    </div>

                                    <div class="flex flex-col gap-1">
                                        <span class="text-[10px] font-bold text-[#249444] uppercase tracking-wider">Paso 3</span>
                                        <button id="labelCargaDatos" class="px-4 py-2 bg-[#249444] text-white rounded-xl text-xs font-bold hover:bg-[#1e7a37] transition flex items-center gap-2 cursor-pointer shadow-xs h-[34px]" onclick="document.getElementById('uploadBiometrico').click();">
                                            <span id="textoCargaBtn">Carga de Datos</span>
                                        </button>
                                    </div>

                                    <button id="exportBtn" disabled onclick="if(window.RhAsisCasc && typeof RhAsisCasc.exportarExcelCasc === 'function') RhAsisCasc.exportarExcelCasc()" class="px-4 py-2 bg-[#249444] text-white rounded-xl text-xs font-bold hover:bg-[#1e7a37] transition flex items-center gap-2 shadow-xs opacity-60 cursor-not-allowed h-[34px]">
                                        <span id="exportText">Exportar Información</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
                        <div class="px-6 py-4 border-b border-stone-100 flex justify-between items-center bg-white flex-wrap gap-3">
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

        // 4. Poblar el combo dinámicamente con datos reales de SQL
        await RhAsisCasc.cargarCamposPorRegional();

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

            const filasValidas = [];
            let rawFechaDetectada = "";

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                if (!row || row.length === 0 || row.every(c => String(c).trim() === "")) continue;

                const col0 = String(row[0] || "").trim();
                const col1 = String(row[1] || "").trim();

                let numEmpCandidato = col0;
                if (isNaN(numEmpCandidato) || numEmpCandidato === "") {
                    numEmpCandidato = col1;
                }

                if (isNaN(numEmpCandidato) || numEmpCandidato === "" || parseInt(numEmpCandidato, 10) <= 0) {
                    continue;
                }

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

            if (filasValidas.length === 0) {
                alert("El archivo se leyó pero no se encontraron filas con número de empleado válido.");
                return;
            }

            let fechaNormalizada = RhAsisCasc.normalizarFechaFiltro(rawFechaDetectada || new Date().toISOString());
            let primerNumEmp = String(filasValidas[0][0] || filasValidas[0][1] || "0").trim();
            let claveCentroSeleccionado = RhAsisCasc.obtenerClaveCentroActual();

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

                    const rowsParaSql = filasValidas.map(row => {
                        const empIdNum = parseInt(String(row[0] || row[1] || "0").trim(), 10);
                        return [
                            claveCentroSeleccionado,
                            empIdNum,
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
                        ];
                    });

                    const resultado = await apiCall("guardarBiometrico", {
                        filas: rowsParaSql
                    });

                    if (resultado && resultado.success) {
                        alert(`✅ ¡Se guardaron ${rowsParaSql.length} registros exitosamente en SQL Server para el centro ${claveCentroSeleccionado}!`);
                        await RhAsisCasc.cargarDatosDesdeSheets();
                    } else {
                        alert("⚠️ Aviso al guardar: " + (resultado ? resultado.message : "Desconocido"));
                    }
                }
            }
        } catch (error) {
            console.error("❌ Error en el proceso:", error);
            alert("❌ Ocurrió un error al procesar la carga.");
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

            const claveCentroActivo = RhAsisCasc.obtenerClaveCentroActual();
            const res = await apiCall("obtenerTodosLosRegistrosPlano", {
                claveCentro: claveCentroActivo,
                centro: claveCentroActivo
            });

            if (res && (res.success || Array.isArray(res))) {
                const registrosData = Array.isArray(res) ? res : (res.registros || res.data || []);
                RhAsisCasc.registrosBiometrico = registrosData;
                RhAsisCasc.renderGrid(RhAsisCasc.registrosBiometrico);
            } else {
                RhAsisCasc.registrosBiometrico = [];
                RhAsisCasc.renderGrid([]);
            }
        } catch (e) {
            console.error("Error al cargar biométrico desde SQL:", e);
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