// js/cirnorh/asistencia/RhAsisCasc.js
document.addEventListener("DOMContentLoaded", function () {
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

        // Si viene con formato de fecha ISO o de SQL/Excel con 'T'
        if (strVal.includes('T')) {
            const fechaObj = new Date(strVal);
            if (!isNaN(fechaObj.getTime())) {
                // 🟢 IMPORTANTE: Usar getUTC... para evitar que la zona horaria local altere la hora
                const horas = String(fechaObj.getUTCHours()).padStart(2, '0');
                const minutos = String(fechaObj.getUTCMinutes()).padStart(2, '0');

                if (esRegistroCompleto) {
                    const segundos = String(fechaObj.getUTCSeconds()).padStart(2, '0');
                    return `${horas}:${minutos}:${segundos}`;
                }
                return `${horas}:${minutos}`;
            }
        }

        // Si ya viene como cadena de texto tipo "08:00:00" o "08:00", la cortamos limpio
        if (strVal.match(/^\d{1,2}:\d{2}(:\d{2})?$/)) {
            const partes = strVal.split(':');
            const h = partes[0].padStart(2, '0');
            const m = partes[1].padStart(2, '0');
            if (esRegistroCompleto && partes[2]) {
                const s = partes[2].padStart(2, '0');
                return `${h}:${m}:${s}`;
            }
            return `${h}:${m}`;
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
            console.error("❌ [DINÁMICO] Error al consultar permisos en:", e);
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

                    const idCentro = campo.CenId || '';
                    const nombre = campo.CenNom || '';
                    option.textContent = `${idCentro} - ${nombre}`;

                    selectElement.appendChild(option);
                });

                // 🟢 Se elimina la autoselección para obligar a elegir siempre de forma manual
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

        // 🟢 2. Definir HTML condicional para el filtro de Centro (Visible exclusivamente para permiso 4 o superior/específico)
        const filtroCentroHtml = (permisoUsuario === 4) ? `
            <div class="flex flex-col gap-1">
                <label for="filtroCentroBio" class="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Centro</label>
                <input type="text" id="filtroCentroBio" oninput="RhAsisCasc.aplicarFiltrosCombinados()" placeholder="Centro..."
                    class="w-32 px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs uppercase outline-none focus:ring-2 focus:ring-[#249444] transition-all shadow-xs text-stone-700">
            </div>
        ` : '';

        // 3. Selector dinámico de centros superior
        const selectorCentroHtml = `
            <div class="flex flex-col gap-1">
                <label for="selectCentroCargaAdmin" class="text-[10px] font-bold ${esAdminGlobal ? 'text-[#249444]' : 'text-stone-500'} uppercase tracking-wider">
                    Selecciona centro para cargar datos
                </label>
                <select id="selectCentroCargaAdmin" ${!esAdminGlobal ? 'disabled' : ''} class="px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs uppercase outline-none focus:ring-2 focus:ring-[#249444] text-stone-700 shadow-xs cursor-pointer h-[34px]">
                    <option value="">SELECCIONE UN CENTRO DE TRABAJO...</option>
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

                            <!-- 🟢 4. BARRA DE FILTROS REORDENADA (Centro colocado al final) -->
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
                                    <label for="filtroNumEmpBio" class="text-[10px] font-bold text-stone-500 uppercase tracking-wider">N° Empleado</label>
                                    <input type="text" id="filtroNumEmpBio" oninput="RhAsisCasc.aplicarFiltrosCombinados()" placeholder="Núm..."
                                        class="w-32 px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs uppercase outline-none focus:ring-2 focus:ring-[#249444] transition-all shadow-xs text-stone-700">
                                </div>

                                ${filtroCentroHtml}
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

            // 🟢 VALIDACIÓN DE CENTRO: Comprobar que el nombre del centro coincida con la columna B del Excel
            const selectCentro = document.getElementById('selectCentroCargaAdmin');
            if (selectCentro && selectCentro.selectedIndex >= 0) {
                const textoSeleccionado = selectCentro.options[selectCentro.selectedIndex].text.toLowerCase();

                // Extraer el nombre limpio (quitando el ID numérico si tiene formato "ID - Nombre")
                let nombreCentroLimpio = "";
                if (textoSeleccionado.includes("-")) {
                    nombreCentroLimpio = textoSeleccionado.split("-")[1].trim();
                } else {
                    nombreCentroLimpio = textoSeleccionado.trim();
                }

                if (nombreCentroLimpio && !nombreCentroLimpio.includes("seleccione")) {
                    let coincideCentro = false;
                    for (let i = 0; i < filasValidas.length; i++) {
                        // Columna B corresponde al índice 1 de la fila
                        const valorColB = String(filasValidas[i][1] || "").toLowerCase().trim();
                        if (valorColB && (valorColB.includes(nombreCentroLimpio) || nombreCentroLimpio.includes(valorColB))) {
                            coincideCentro = true;
                            break; // Con que un registro coincida, la validación es exitosa
                        }
                    }

                    if (!coincideCentro) {
                        alert(`❌ Error de validación: El archivo que intentas subir no corresponde al centro seleccionado ("${selectCentro.options[selectCentro.selectedIndex].text}"). Verifica el centro de trabajo.`);
                        return;
                    }
                }
            }
            // 🟢 FIN DE LA VALIDACIÓN DE CENTRO

            let fechaNormalizada = RhAsisCasc.normalizarFechaFiltro(rawFechaDetectada || new Date().toISOString());

            // 🟢 1. Extraer los datos exactos del PRIMER registro válido del archivo para la validación
            let primerFilaValida = filasValidas[0];
            let primerNumEmp = String(primerFilaValida[0] || primerFilaValida[1] || "0").trim();

            // Buscamos la fecha en la columna correspondiente del primer registro (índice 8) o el detectado global
            let rawFechaPrimerRegistro = primerFilaValida[8] || rawFechaDetectada;
            let fechaPrimerRegistroNorm = RhAsisCasc.normalizarFechaFiltro(rawFechaPrimerRegistro);
            let claveCentroSeleccionado = RhAsisCasc.obtenerClaveCentroActual();

            if (apiCall) {
                // 🟢 2. Validar duplicidad en SQL Server usando el primer registro
                const verificacion = await apiCall("verificarFechaBiometrico", {
                    numEmp: primerNumEmp,
                    fecha: fechaPrimerRegistroNorm
                });

                const yaExiste = verificacion && (verificacion.existe === true || verificacion.existe === "true");

                if (yaExiste) {
                    alert(`🛑 Los datos para este periodo ya fueron cargados anteriormente.`);
                    return;
                } else {
                    if (textCarga) textCarga.innerText = "Guardando...";

                    const rowsParaSql = filasValidas.map(row => {
                        const empIdNum = parseInt(String(row[0] || row[1] || "0").trim(), 10);

                        // Función interna para limpiar formatos de fecha y hora inválidos para SQL
                        function limpiarFechaSql(val) {
                            if (!val) return null;
                            let s = String(val).trim();
                            // Si contiene una fecha ISO o timestamp, extraemos solo la parte YYYY-MM-DD
                            if (s.includes('T')) s = s.split('T')[0];
                            // Validación básica de formato fecha YYYY-MM-DD o similar
                            if (s.length >= 8 && (s.includes('-') || s.includes('/'))) {
                                return s;
                            }
                            return null; // Si no es fecha válida, mandamos null para evitar error en SQL
                        }

                        function limpiarHoraSql(val) {
                            if (!val) return null;
                            let s = String(val).trim();
                            // Si el Excel trae un formato de fecha tipo fecha-hora para la hora
                            if (s.includes('T') || s.includes('1899-12-30')) {
                                const d = new Date(s);
                                if (!isNaN(d.getTime())) {
                                    // 🟢 Uso de getUTC... para evitar desfasamientos de zona horaria local
                                    const h = String(d.getUTCHours()).padStart(2, '0');
                                    const m = String(d.getUTCMinutes()).padStart(2, '0');
                                    const sec = String(d.getUTCSeconds()).padStart(2, '0');
                                    return `${h}:${m}:${sec}`;
                                }
                            }
                            // Si ya viene como texto HH:MM o HH:MM:SS
                            if (s.match(/^\d{1,2}:\d{2}(:\d{2})?$/)) {
                                return s.length === 5 ? s + ":00" : s;
                            }
                            return s ? s : null;
                        }

                        return [
                            claveCentroSeleccionado,
                            empIdNum,
                            limpiarHoraSql(row[4]),     // Hra. Entrada
                            limpiarHoraSql(row[5]),     // Hra. Salida
                            limpiarHoraSql(row[6]),     // Hra. Registro
                            row[7] || "",               // Registro (ENTRADA/SALIDA)
                            limpiarFechaSql(row[8]),    // Fecha Reg.
                            row[9] || "",               // Día Reg.
                            row[10] || "",              // Retardo Men.
                            row[11] || "",              // Retardo Med.
                            row[12] || "",              // Retardo May.
                            row[13] || ""               // Falta
                        ];
                    });

                    const resultado = await apiCall("guardarBiometrico", {
                        filas: rowsParaSql
                    });

                    if (resultado && resultado.success) {
                        alert(`✅ ¡Se guardaron ${rowsParaSql.length} registros exitosamente para el centro ${claveCentroSeleccionado}!`);
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

            // Llamamos a la función en Apps Script
            const res = await apiCall("obtenerTodosLosRegistrosPlano", {});
            let listaRegistros = [];

            if (res) {
                // Si la respuesta viene directamente como un arreglo
                if (Array.isArray(res)) {
                    listaRegistros = res;
                }
                // Si viene envuelta en un objeto con propiedad data o registros (éste es tu caso)
                else if (res.data && Array.isArray(res.data)) {
                    listaRegistros = res.data;
                } else if (res.registros && Array.isArray(res.registros)) {
                    listaRegistros = res.registros;
                }
                // Por si viene anidada como res.resultado o similar
                else if (res.resultado && Array.isArray(res.resultado)) {
                    listaRegistros = res.resultado;
                }
            }

            // Asignamos a las variables globales del grid y filtros
            RhAsisCasc.registrosBiometrico = listaRegistros;
            window.registrosFiltradosActuales = listaRegistros;

            // Renderizamos inmediatamente el grid en pantalla
            if (typeof RhAsisCasc.renderGrid === 'function') {
                RhAsisCasc.renderGrid(listaRegistros);
            }

            // Actualizamos el contador visual
            const contadorEl = document.getElementById('contadorRegistrosBio');
            if (contadorEl) {
                contadorEl.innerText = listaRegistros.length;
            }

        } catch (e) {
            console.error("❌ Error en cargarDatosDesdeSheets:", e);
            RhAsisCasc.registrosBiometrico = [];
            if (typeof RhAsisCasc.renderGrid === 'function') {
                RhAsisCasc.renderGrid([]);
            }
        }
    },

    renderGrid: function (listaRegistros) {
        const gridContent = document.getElementById('gridContentBio');
        const exportBtn = document.getElementById('exportBtn');
        const contador = document.getElementById('contadorRegistrosBio');

        if (!gridContent) return;
        const headers = RhAsisCasc.rawHeaderGlobal;

        // 🟢 Asegurarnos de que listaRegistros sea siempre un arreglo válido
        let registrosValidos = [];
        if (Array.isArray(listaRegistros)) {
            registrosValidos = listaRegistros;
        } else if (listaRegistros && typeof listaRegistros === 'object') {
            registrosValidos = listaRegistros.data || listaRegistros.registros || Object.values(listaRegistros);
        }

        if (!registrosValidos || registrosValidos.length === 0) {
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

        if (contador) contador.innerText = `${registrosValidos.length}`;

        gridContent.innerHTML = `
            <table class="w-full text-[11px] text-left border-collapse min-w-[950px]">
                <thead class="bg-stone-100 font-bold text-stone-700 sticky top-0 z-10 border-b border-stone-200">
                    <tr>${headers.map(h => `<th class="p-3 border-b border-stone-200 text-center whitespace-nowrap">${h}</th>`).join('')}</tr>
                </thead>
                <tbody class="divide-y divide-stone-100">
                    ${registrosValidos.map(r => {
            // Extraemos las primeras 12 columnas de manera segura
            let celdas = [];
            if (Array.isArray(r)) {
                celdas = r.slice(0, 12);
            } else if (r && typeof r === 'object') {
                celdas = [
                    r.Centro || r[0] || "",
                    r.NumEmp || r[1] || "",
                    r.SRICtrlAHrE || r[2] || "",
                    r.SRICtrlAHrS || r[3] || "",
                    r.SRICtrlAHrRg || r[4] || "",
                    r.SRICtrlAReg || r[5] || "",
                    r.SRICtrlAFeRg || r[6] || "",
                    r.SRICtrlADia || r[7] || "",
                    r.SRICtrlAMen || r[8] || "",
                    r.SRICtrlAMed || r[9] || "",
                    r.SRICtrlAMay || r[10] || "",
                    r.SRICtrlAFalta || r[11] || ""
                ];
            }

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
            const centro = String(row[0] || "").toLowerCase(); // ID del Centro
            const numEmp = String(row[1] || "").toLowerCase(); // Núm. Empleado
            const fechaRegRaw = String(row[6] || "").trim();    // Fecha Reg.
            const fechaRegNorm = RhAsisCasc.normalizarFechaFiltro(fechaRegRaw);

            if (centroFiltro && !centro.includes(centroFiltro)) return false;
            if (numEmpFiltro && !numEmp.includes(numEmpFiltro)) return false;
            if (fechaDesde && fechaRegNorm < fechaDesde) return false;
            if (fechaHasta && fechaRegNorm > fechaHasta) return false;

            return true;
        });

        window.registrosFiltradosActuales = filtrados;
        RhAsisCasc.renderGrid(filtrados);
    },

    obtenerRegistrosFiltradosActuales: function () {
        return window.registrosFiltradosActuales || RhAsisCasc.registrosBiometrico;
    },

    exportarExcelCasc: async function () {
        const exportBtn = document.getElementById('exportBtn');
        const exportText = document.getElementById('exportText');

        try {
            if (exportBtn) {
                exportBtn.disabled = true;
                exportBtn.classList.add('bg-stone-400', 'cursor-wait', 'opacity-80');
                exportBtn.classList.remove('bg-[#249444]', 'hover:bg-[#1e7a37]', 'cursor-pointer');
            }
            if (exportText) {
                exportText.innerText = "Generando archivo...";
            }

            const registrosAExportar = window.registrosFiltradosActuales || (typeof RhAsisCasc.obtenerRegistrosFiltradosActuales === 'function' ? RhAsisCasc.obtenerRegistrosFiltradosActuales() : RhAsisCasc.registrosBiometrico);
            const numEmpFiltro = document.getElementById('filtroNumEmpBio')?.value.trim() || "";
            const centroActual = RhAsisCasc.obtenerClaveCentroActual ? RhAsisCasc.obtenerClaveCentroActual() : "General";

            if (!registrosAExportar || registrosAExportar.length === 0) {
                alert("⚠️ No hay información disponible en el grid para exportar.");
                return;
            }

            if (typeof ExcelJS === 'undefined') {
                alert("❌ Error: La librería ExcelJS no está cargada en el HTML.");
                return;
            }

            let imageBuffer = null;
            try {
                const response = await fetch('Logo.png');
                if (response.ok) {
                    imageBuffer = await response.arrayBuffer();
                }
            } catch (err) { }

            const mapearRegistros = (lista) => {
                return lista.map(r => {
                    const celdas = Array.isArray(r) ? [...r] : RhAsisCasc.rawHeaderGlobal.map(h => r[h] || "");
                    return celdas.map((c, index) => {
                        let val = c;
                        if (index === 2 || index === 3) {
                            val = RhAsisCasc.extraerHoraLegible ? RhAsisCasc.extraerHoraLegible(val, false) : val;
                        } else if (index === 4) {
                            val = RhAsisCasc.extraerHoraLegible ? RhAsisCasc.extraerHoraLegible(val, true) : val;
                        } else if (val instanceof Date) {
                            val = val.toLocaleDateString();
                        } else if (typeof val === 'string' && val.includes('T') && val.length > 18 && !val.includes('1899-12-30')) {
                            const d = new Date(val);
                            if (!isNaN(d)) val = d.toLocaleDateString();
                        }
                        return val !== null && val !== undefined ? val : "";
                    });
                });
            };

            let gruposAProcesar = {};
            if (!numEmpFiltro) {
                registrosAExportar.forEach(row => {
                    const empId = String(row[1] || "S_N").trim();
                    if (!gruposAProcesar[empId]) gruposAProcesar[empId] = [];
                    gruposAProcesar[empId].push(row);
                });
            } else {
                gruposAProcesar[`Emp_${numEmpFiltro}`] = registrosAExportar;
            }

            const chavesGrupos = Object.keys(gruposAProcesar);
            if (chavesGrupos.length === 0) {
                alert("No hay registros para exportar con los filtros actuales.");
                return;
            }

            const wb = new ExcelJS.Workbook();
            const fondoHoja = "FFFFFF";

            for (const key of chavesGrupos) {
                const filasGrupo = gruposAProcesar[key];
                const rowsMapeadas = mapearRegistros(filasGrupo);
                let etiquetaEmp = numEmpFiltro ? numEmpFiltro : key.replace(/^Emp_/, '');

                // 🟢 LECTURA DIRECTA DESDE LA BASE DE DATOS (Posición 12 de la fila)
                let nombreEmpleadoEncontrado = "";
                if (filasGrupo && filasGrupo.length > 0) {
                    const primeraFila = filasGrupo[0];
                    if (Array.isArray(primeraFila) && primeraFila[12]) {
                        nombreEmpleadoEncontrado = String(primeraFila[12]).trim();
                    } else if (typeof primeraFila === 'object' && primeraFila.NomEmp) {
                        nombreEmpleadoEncontrado = String(primeraFila.NomEmp).trim();
                    }
                }

                const textoIncidencias = nombreEmpleadoEncontrado
                    ? `INCIDENCIAS DEL EMPLEADO: ${etiquetaEmp} - ${nombreEmpleadoEncontrado.toUpperCase()}`
                    : `INCIDENCIAS DEL EMPLEADO: ${etiquetaEmp}`;

                const nombrePestana = `${etiquetaEmp}`.replace(/[*?/\\[]]/g, '').substring(0, 31);

                const ws = wb.addWorksheet(nombrePestana);
                ws.views = [{ showGridLines: false }];

                if (imageBuffer) {
                    const imageId = wb.addImage({
                        buffer: imageBuffer,
                        extension: 'png',
                    });

                    ws.addImage(imageId, {
                        tl: { col: 0, row: 0 },
                        br: { col: 2, row: 4 }
                    });
                }

                ws.mergeCells('C1:J1');
                ws.getCell('C1').value = "INSTITUTO NACIONAL DE INVESTIGACIONES FORESTALES AGRÍCOLAS Y PECUARIAS";
                ws.getCell('C1').font = { name: 'Arial', sz: 9, bold: true, color: { argb: '000000' } };
                ws.getCell('C1').alignment = { vertical: 'middle', horizontal: 'center' };

                ws.mergeCells('C2:J2');
                ws.getCell('C2').value = "COORDINACIÓN DE ADMINISTRACIÓN Y SISTEMAS";
                ws.getCell('C2').font = { name: 'Arial', sz: 8.5, bold: true, color: { argb: '000000' } };
                ws.getCell('C2').alignment = { vertical: 'middle', horizontal: 'center' };

                ws.mergeCells('C3:J3');
                ws.getCell('C3').value = "DIRECCIÓN DE DESARROLLO HUMANO Y PROFESIONALIZACIÓN";
                ws.getCell('C3').font = { name: 'Arial', sz: 8.5, bold: true, color: { argb: '000000' } };
                ws.getCell('C3').alignment = { vertical: 'middle', horizontal: 'center' };

                ws.mergeCells('C4:J4');
                ws.getCell('C4').value = textoIncidencias;
                ws.getCell('C4').font = { name: 'Arial', sz: 8.5, bold: true, color: { argb: '000000' } };
                ws.getCell('C4').alignment = { vertical: 'middle', horizontal: 'center' };

                ws.mergeCells('C5:J5');
                ws.getCell('C5').value = "Reporte: RH_CONTROL_ASISTENCIA_CASC";
                ws.getCell('C5').font = { name: 'Arial', sz: 8.5, bold: true, color: { argb: '000000' } };
                ws.getCell('C5').alignment = { vertical: 'middle', horizontal: 'center' };

                const headerRowIndex = 7;
                ws.getRow(headerRowIndex).values = RhAsisCasc.rawHeaderGlobal;

                ws.getRow(headerRowIndex).eachCell((cell) => {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D9D9D9' } };
                    cell.font = { name: 'Arial', sz: 9, bold: true, color: { argb: '000000' } };
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                    cell.border = { top: { style: 'thin', color: { argb: 'B0B0B0' } }, bottom: { style: 'thin', color: { argb: 'B0B0B0' } }, left: { style: 'thin', color: { argb: 'B0B0B0' } }, right: { style: 'thin', color: { argb: 'B0B0B0' } } };
                });

                rowsMapeadas.forEach((dRow, idx) => {
                    const rowIndex = headerRowIndex + 1 + idx;
                    const row = ws.getRow(rowIndex);
                    row.values = dRow.slice(0, 12);

                    let bgColor = fondoHoja;
                    let fontColor = "000000";
                    let isBold = false;

                    if (dRow[11]) {
                        bgColor = "FF0000"; fontColor = "FFFFFF"; isBold = true;
                    } else if (dRow[10]) {
                        bgColor = "E46C0A"; fontColor = "FFFFFF"; isBold = true;
                    } else if (dRow[9]) {
                        bgColor = "FFC000"; isBold = true;
                    } else if (dRow[8]) {
                        bgColor = "FFFF00"; isBold = true;
                    }

                    row.eachCell((cell) => {
                        cell.font = { name: 'Arial', sz: 9, bold: isBold, color: { argb: fontColor } };
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
                        cell.alignment = { vertical: 'middle', horizontal: 'center' };
                        cell.border = { top: { style: 'thin', color: { argb: 'E0E0E0' } }, bottom: { style: 'thin', color: { argb: 'E0E0E0' } }, left: { style: 'thin', color: { argb: 'E0E0E0' } }, right: { style: 'thin', color: { argb: 'E0E0E0' } } };
                    });
                });

                ws.columns.forEach((column, colIndex) => {
                    if (colIndex === 0 || colIndex === 1) { column.width = 16; return; }
                    let maxLength = 10;
                    column.eachCell({ includeEmpty: false }, (cell, rowNum) => {
                        if (rowNum >= 7) {
                            const columnLength = cell.value ? String(cell.value).length : 10;
                            if (columnLength > maxLength) maxLength = columnLength;
                        }
                    });
                    column.width = maxLength + 3;
                });
            }

            const buffer = await wb.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);

            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `RepBiometrico_${centroActual}_${numEmpFiltro ? `${numEmpFiltro}` : "General"}.xlsx`;

            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);

            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert("Ocurrió un error al compilar el archivo .xlsx: " + err.message);
        } finally {
            if (exportBtn) {
                exportBtn.disabled = false;
                exportBtn.classList.remove('bg-stone-400', 'cursor-wait', 'opacity-80');
                exportBtn.classList.add('bg-[#249444]', 'hover:bg-[#1e7a37]', 'cursor-pointer');
            }
            if (exportText) {
                exportText.innerText = "Exportar Información";
            }
        }
    },
};
