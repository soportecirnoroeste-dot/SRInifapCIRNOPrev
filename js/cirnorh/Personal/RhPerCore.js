// js/cirnorh/RhPersonal.js

// Variables globales de caché y mapas
window._catRegsCache = null;
window._catCentrosCache = null;
window._catSitiosCache = null;
window._empleadosCache = [];
window._mapRegsCache = null;
window._mapCentrosCache = null;
window._mapPuestosCache = null;
window._mapDeptosCache = null;

function matchClave(a, b) {
    const strA = String(a || '').trim();
    const strB = String(b || '').trim();
    if (strA === strB) return true;
    if (!isNaN(strA) && !isNaN(strB) && strA !== '' && strB !== '') {
        return Number(strA) === Number(strB);
    }
    return false;
}

function extraerClave(val) {
    if (!val) return '';
    const str = String(val).trim();
    if (str.includes(' - ')) return str.split(' - ')[0].trim();
    return str;
}

function obtenerUsuarioSesion() {
    const posibleSesionGlobal = window.usuarioLogueado || window.usuarioActivo || window.sesion || window.currentUser || window.user;
    if (posibleSesionGlobal && typeof posibleSesionGlobal === 'object') {
        const numE = posibleSesionGlobal.SRIPerNumE || posibleSesionGlobal.numEmp || posibleSesionGlobal.usuario || posibleSesionGlobal.id || '';
        const regId = posibleSesionGlobal.SRIRegId || posibleSesionGlobal.regId || posibleSesionGlobal.reg || '';
        const cenId = posibleSesionGlobal.SRICenId || posibleSesionGlobal.cenId || posibleSesionGlobal.centro || '';

        if (numE || regId || cenId) {
            return { SRIPerNumE: numE, SRIRegId: regId, SRICenId: cenId, ...posibleSesionGlobal };
        }
    }

    try {
        const keysPossibles = ['usuario', 'usuarioLogueado', 'usuarioActivo', 'user', 'sesion', 'datosUsuario', 'currentUser'];
        for (let key of keysPossibles) {
            const dataStr = localStorage.getItem(key);
            if (dataStr) {
                let parsed;
                try { parsed = JSON.parse(dataStr); } catch (e) { parsed = dataStr; }

                if (parsed && typeof parsed === 'object') {
                    const numE = parsed.SRIPerNumE || parsed.numEmp || parsed.usuario || parsed.id || '';
                    const regId = parsed.SRIRegId || parsed.regId || parsed.reg || '';
                    const cenId = parsed.SRICenId || parsed.cenId || parsed.centro || '';

                    if (numE || regId || cenId) {
                        window.usuarioLogueado = parsed;
                        return { SRIPerNumE: numE, SRIRegId: regId, SRICenId: cenId, ...parsed };
                    }
                }
            }
        }
    } catch (e) { }

    return {
        SRIPerNumE: window.SRIPerNumE || '',
        SRIRegId: window.SRIRegId || '',
        SRICenId: window.SRICenId || ''
    };
}

function cargarPersonalRh(cargarLista = true) {
    if (typeof renderizarVistaModuloRh === 'function') {
        renderizarVistaModuloRh('Personal', "Personal");
    }

    const contenedorDinamico = document.getElementById('contenido-submodulo-dinamico');
    if (!contenedorDinamico) return;

    contenedorDinamico.className = "w-full space-y-6";

    contenedorDinamico.innerHTML = `
        <div id="contenedor-gestion-personal" class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-stone-50 p-4 rounded-xl border border-stone-200">
            <div>
                <h4 class="font-bold text-stone-800 text-sm">Gestión de Personal</h4>
            </div>
            <div class="flex gap-2">
                <button onclick="mostrarFormularioNuevoPersonal()" class="px-4 py-2 bg-[#249444] text-white rounded-xl text-xs font-bold hover:bg-[#1e7a37] transition flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                    Nuevo Registro
                </button>
                <button onclick="cargarDatosGenerales(true)" class="px-4 py-2 bg-stone-200 text-stone-700 rounded-xl text-xs font-bold hover:bg-stone-300 transition flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
                    Actualizar Datos
                </button>
            </div>
        </div>

        <div id="contenedor-formulario-personal" class="hidden bg-white p-6 rounded-xl border border-stone-200 shadow-sm animate-fade-in">
            <h5 id="titulo-formulario" class="font-bold text-stone-800 text-sm mb-4 pb-2 border-b border-stone-100 flex items-center gap-2">
                Capturar Nuevo Empleado
            </h5>
            <form id="form-nuevo-personal" onsubmit="guardarOActualizarPersonal(event)" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div>
                    <label class="block font-bold text-stone-700 mb-1">Región:</label>
                    <select name="SRIRegId" id="select-SRIRegId" onchange="filtrarCentrosPorRegion()" required class="w-full p-2.5 border border-stone-300 rounded-lg bg-white focus:outline-none focus:border-[#249444]">
                        <option value="" disabled selected>Seleccione una región...</option>
                    </select>
                </div>
                <div>
                    <label class="block font-bold text-stone-700 mb-1">Centro:</label>
                    <select name="SRICenId" id="select-SRICenId" onchange="filtrarSitiosPorCentro(this.value)" required class="w-full p-2.5 border border-stone-300 rounded-lg bg-white focus:outline-none focus:border-[#249444]">
                        <option value="" disabled selected>Seleccione un centro...</option>
                    </select>
                </div>
                <div>
                    <label class="block font-bold text-stone-700 mb-1">Sitio:</label>
                    <select name="SRISitId" id="select-SRISitId" required class="w-full p-2.5 border border-stone-300 rounded-lg bg-white focus:outline-none focus:border-[#249444]">
                        <option value="" disabled selected>Seleccione un sitio...</option>
                    </select>
                </div>
                
                <div><label class="block font-bold text-stone-700 mb-1">Núm. Empleado:</label><input type="text" name="SRIPerNumE" id="input-SRIPerNumE" required class="w-full p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:border-[#249444]"></div>
                <div><label class="block font-bold text-stone-700 mb-1">Nombre Completo:</label><input type="text" name="SRIPerNomE" required class="w-full p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:border-[#249444]"></div>
                
                <div><label class="block font-bold text-stone-700 mb-1">Extensión:</label><input type="text" name="SRIPerNExt" class="w-full p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:border-[#249444]"></div>
                <div><label class="block font-bold text-stone-700 mb-1">Núm. Personal / Celular:</label><input type="text" name="SRIPerNCel" class="w-full p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:border-[#249444]"></div>
                <div><label class="block font-bold text-stone-700 mb-1">Escolaridad:</label><input type="text" name="SRIPerEsco" class="w-full p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:border-[#249444]"></div>
                <div><label class="block font-bold text-stone-700 mb-1">Dirección:</label><input type="text" name="SRIPerDir" class="w-full p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:border-[#249444]"></div>
                <div><label class="block font-bold text-stone-700 mb-1">C.P.:</label><input type="text" name="SRIPerCP" class="w-full p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:border-[#249444]"></div>
                <div><label class="block font-bold text-stone-700 mb-1">Email:</label><input type="email" name="SRIPerEml" class="w-full p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:border-[#249444]"></div>
                <div><label class="block font-bold text-stone-700 mb-1">RFC:</label><input type="text" name="SRIPerRFC" required class="w-full p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:border-[#249444]"></div>
                
                <div>
                    <label class="block font-bold text-stone-700 mb-1">Puesto:</label>
                    <select name="SRIPtoId" id="select-SRIPtoId" required class="w-full p-2.5 border border-stone-300 rounded-lg bg-white focus:outline-none focus:border-[#249444]">
                        <option value="" disabled selected>Seleccione un puesto...</option>
                    </select>
                </div>
                <div>
                    <label class="block font-bold text-stone-700 mb-1">Departamento:</label>
                    <select name="SRIModNomC" id="select-SRIModNomC" required class="w-full p-2.5 border border-stone-300 rounded-lg bg-white focus:outline-none focus:border-[#249444]">
                        <option value="" disabled selected>Seleccione un departamento...</option>
                    </select>
                </div>

                <div><label class="block font-bold text-stone-700 mb-1">Ciudad:</label><input type="text" name="SRIPerCd" class="w-full p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:border-[#249444]"></div>
                <div><label class="block font-bold text-stone-700 mb-1">Estado:</label><input type="text" name="SRIPerEdo" class="w-full p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:border-[#249444]"></div>
                
                <div class="sm:col-span-2 md:col-span-3 flex items-end gap-2 pt-2">
                    <button type="submit" class="py-2.5 px-6 bg-[#249444] text-white font-bold rounded-lg hover:bg-[#047857] transition flex items-center justify-center gap-1.5">
                        Guardar
                    </button>
                    <button type="button" onclick="cancelarEdicionPersonal()" class="px-4 py-2.5 bg-stone-100 text-stone-600 font-bold rounded-lg hover:bg-stone-200 transition">Cancelar</button>
                </div>
            </form>
        </div>

        <div id="contenedor-listado-personal" class="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
            <div class="p-4 border-b border-stone-100 flex flex-wrap justify-between items-center gap-4 bg-white">
                <div class="font-bold text-xs text-stone-700 uppercase tracking-wider">Listado General de Empleados</div>
                
                <div class="relative">
                    <span class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-stone-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                    </span>
                    <input type="text" id="buscador-personal-input" oninput="filtrarTablaPersonal(this.value)" placeholder="Buscar por nombre, puesto, centro..." 
                        class="w-64 sm:w-72 pl-9 pr-4 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#249444] text-stone-700 transition-all shadow-xs">
                </div>
            </div>
            
            <div class="rounded-xl bg-white">
                <div class="max-h-[500px] overflow-y-auto overflow-x-auto custom-scrollbar">
                    <table class="w-full text-left border-collapse text-xs min-w-[950px]">
                        <thead class="bg-stone-100 font-bold text-stone-700 sticky top-0 z-10 border-b border-stone-200">
                            <tr>
                                <th class="p-3 border-b border-stone-200">REGIÓN</th>
                                <th class="p-3 border-b border-stone-200">CENTRO</th>
                                <th class="p-3 border-b border-stone-200">NO. EMP</th>
                                <th class="p-3 border-b border-stone-200">NOMBRE</th>
                                <th class="p-3 border-b border-stone-200">PUESTO</th>
                                <th class="p-3 border-b border-stone-200">DEPARTAMENTO</th>
                            </tr>
                        </thead>
                        <tbody id="tabla-personal-body" class="divide-y divide-stone-100">
                            <tr><td colspan="6" class="p-6 text-center text-stone-400 italic">Cargando registros...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    if (cargarLista) {
        cargarDatosGenerales(false);
    }
}

// 🟢 ORDEN CORREGIDO: Catálogos primero, luego personal
async function cargarDatosGenerales(forzarRecarga = false) {
    if (forzarRecarga) {
        window._catRegsCache = null;
        window._catCentrosCache = null;
        window._catSitiosCache = null;
        window._mapRegsCache = null;
        window._mapCentrosCache = null;
        window._mapPuestosCache = null;
        window._mapDeptosCache = null;
        window._catPuestos = null;
        window._catDepartamentos = null;
        window._empleadosCache = [];
    }

    const tbody = document.getElementById('tabla-personal-body');
    if (tbody && window._empleadosCache.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-stone-400 italic">Sincronizando catálogos y datos...</td></tr>`;
    }

    await cargarCatalogosSheets(forzarRecarga);
    await cargarDatosPersonalSheets(forzarRecarga);
}

async function cargarCatalogosSheets(forzar = false) {
    if (forzar || !window._catRegs || window._catRegs.length === 0) {
        try {
            const data = await callAppsScript('obtenerDatosSistema', {});
            if (data) {
                window._catRegs = data.regionales || data.regiones || [];
                window._catCentros = data.campos || data.centros || [];
                window._catSitios = data.sitios || [];
                window._catDepartamentos = data.departamentos || data.deptos || [];
                window._catPuestos = data.puestos || data.catPuestos || data.puesto || [];
            }
        } catch (e) {
            console.error("Error al cargar catálogos:", e);
        }
    }
    pintarSelectsCatalogos();
}

async function cargarDatosPersonalSheets(forzar = false) {
    const tbody = document.getElementById('tabla-personal-body');
    if (!tbody) return;

    if (!forzar && window._empleadosCache.length > 0) {
        aplicarFiltroYRenderizar(window._empleadosCache);
        return;
    }

    try {
        const usuarioActivo = obtenerUsuarioSesion();
        const params = {
            usuario: usuarioActivo.SRIPerNumE || '',
            SRIRegId: usuarioActivo.SRIRegId || '',
            SRICenId: usuarioActivo.SRICenId || ''
        };

        const data = await callAppsScript('obtenerPersonalSQL', params);
        window._empleadosCache = data || [];
        aplicarFiltroYRenderizar(window._empleadosCache);
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-red-500 italic">Error al conectar con la Base de Datos.</td></tr>`;
    }
}

function pintarSelectsCatalogos() {
    const selPuesto = document.getElementById('select-SRIPtoId');
    if (selPuesto && window._catPuestos) {
        selPuesto.innerHTML = '<option value="" disabled selected>Seleccione un puesto...</option>' +
            window._catPuestos.map(p => {
                let numPto = String(p.SRIPrtoId || p.SRIPtoId || p.SRIPuestoId || '').trim();
                let nomPto = String(p.SRIPtoDesc || p.SRIPuestoDesc || '').trim();
                if (!nomPto || nomPto === numPto) nomPto = '';
                return `<option value="${numPto}">${nomPto ? `${numPto} -${nomPto}` : numPto}</option>`;
            }).join('');
    }

    const selDepto = document.getElementById('select-SRIModNomC');
    if (selDepto && window._catDepartamentos) {
        selDepto.innerHTML = '<option value="" disabled selected>Seleccione un departamento...</option>' +
            window._catDepartamentos.map(d => {
                // Nombre Corto / Clave oficial para guardar en SQL (ej: CIRNORF, CIRNORH)
                const claveCorta = String(d.SRIModNomC || d.claveDep || d.id || '').trim();
                
                // Nombre largo para mostrar al usuario en la pantalla
                const nombreLargo = String(d.SRIModNom || d.SRIDepDesc || d.nombre || claveCorta).trim();

                // 🟢 IMPORTANTE: El value lleva la clave corta (CIRNORF), el texto visible muestra el nombre largo
                return `<option value="${claveCorta}">${nombreLargo}</option>`;
            }).join('');
    }

    const selRegiones = document.getElementById('select-SRIRegId');
    if (selRegiones && window._catRegs) {
        selRegiones.innerHTML = '<option value="" disabled selected>Seleccione una región...</option>' +
            window._catRegs.map(r => {
                const claveReg = String(r.SRIRegId || '').trim();
                const nomReg = String(r.SRIRegNom || '').trim();
                return `<option value="${claveReg}">${claveReg} - ${nomReg}</option>`;
            }).join('');
    }
}

window.filtrarCentrosPorRegion = function (centroActual = '', sitActual = '') {
    const selReg = document.getElementById('select-SRIRegId');
    const selCentro = document.getElementById('select-SRICenId');
    const selSit = document.getElementById('select-SRISitId');
    if (!selReg || !selCentro || !selSit) return;

    const regionSeleccionada = selReg.value;
    selCentro.innerHTML = `<option value="" disabled selected>Seleccione un centro...</option>`;
    selSit.innerHTML = `<option value="" disabled selected>Seleccione un sitio...</option>`;

    const centrosArray = Array.isArray(window._catCentros) ? window._catCentros : [];
    const centrosFiltrados = regionSeleccionada ? centrosArray.filter(c => matchClave(c.SRIRegId, regionSeleccionada)) : [];

    if (centrosFiltrados.length > 0) {
        selCentro.innerHTML += centrosFiltrados.map(c => {
            const claveC = String(c.SRICenId || '').trim();
            const nombreC = String(c.SRICenNom || '').trim();
            return `<option value="${claveC}" ${matchClave(claveC, centroActual) ? 'selected' : ''}>${claveC} - ${nombreC}</option>`;
        }).join('');
    }
    if (centroActual) selCentro.value = centroActual;
    if (selCentro.value) filtrarSitiosPorCentro(selCentro.value, sitActual);
};

function filtrarSitiosPorCentro(claveCentro = '', sitActual = '') {
    const selSit = document.getElementById('select-SRISitId');
    if (!selSit) return;

    selSit.innerHTML = `<option value="" disabled selected>Seleccione un sitio...</option>`;
    const centroId = String(claveCentro || document.getElementById('select-SRICenId')?.value || '').trim();

    if (!centroId) {
        selSit.innerHTML = `<option value="N/A">N/A - No aplica</option>`;
        return;
    }

    const sitiosArray = Array.isArray(window._catSitios) ? window._catSitios : [];
    const sitiosFiltrados = sitiosArray.filter(s => matchClave(s.SRICenId, centroId));

    let opcionesHTML = `<option value="N/A">N/A</option>`;
    if (sitiosFiltrados.length > 0) {
        opcionesHTML += sitiosFiltrados.map(s => {
            const claveS = String(s.SRISitId || '').trim();
            const nombreS = String(s.SRISitNom || '').trim();
            if (claveS === '0') return '';
            return `<option value="${claveS}">${claveS} - ${nombreS}</option>`;
        }).join('');
    }
    selSit.innerHTML = opcionesHTML;
    selSit.value = sitActual && sitActual !== '0' ? sitActual : "N/A";
}

function aplicarFiltroYRenderizar(empleados) {
    const usuarioActivo = obtenerUsuarioSesion();
    const centroUsuario = String(usuarioActivo.SRICenId || '').trim();
    let empleadosFiltrados = empleados;

    // 🟢 Si el arreglo contiene múltiples centros (ej. 102, 106, 108), 
    // significa que el usuario es Administrador global y NO debemos aplicar el filtro local por centro.
    const centrosUnicos = [...new Set(empleados.map(e => String(e.SRICenId || '').trim()))];
    const esAdminGlobal = centrosUnicos.length > 1;

    if (!esAdminGlobal && centroUsuario && centroUsuario !== '0' && centroUsuario !== '') {
        empleadosFiltrados = empleados.filter(emp => String(emp.SRICenId || '').trim().includes(centroUsuario));
    }

    renderizarTablaPersonal(empleadosFiltrados);
}

function filtrarTablaPersonal(textoBusqueda) {
    const query = textoBusqueda.toLowerCase().trim();
    const usuarioActivo = obtenerUsuarioSesion();
    const centroUsuario = String(usuarioActivo.SRICenId || '').trim();
    let baseEmpleados = window._empleadosCache;

    const centrosUnicos = [...new Set(baseEmpleados.map(e => String(e.SRICenId || '').trim()))];
    const esAdminGlobal = centrosUnicos.length > 1;

    if (!esAdminGlobal && centroUsuario && centroUsuario !== '0') {
        baseEmpleados = baseEmpleados.filter(emp => String(emp.SRICenId || '').trim().includes(centroUsuario));
    }

    if (!query) {
        renderizarTablaPersonal(baseEmpleados);
        return;
    }

    const filtrados = baseEmpleados.filter(row => {
        return Object.values(row).some(val => String(val || '').toLowerCase().includes(query));
    });
    renderizarTablaPersonal(filtrados);
}

function renderizarTablaPersonal(registros) {
    const tbody = document.getElementById('tabla-personal-body');
    if (!tbody) return;

    if (!registros || !registros.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-stone-400 italic">No hay registros.</td></tr>`;
        return;
    }

    // Inicializar mapas de caché rápida si no existen
    if (!window._mapRegsCache && window._catRegs) {
        window._mapRegsCache = {};
        window._catRegs.forEach(r => { window._mapRegsCache[String(r.SRIRegId).trim()] = r.SRIRegNom || ''; });
    }
    if (!window._mapCentrosCache && window._catCentros) {
        window._mapCentrosCache = {};
        window._catCentros.forEach(c => { window._mapCentrosCache[String(c.SRICenId).trim()] = c.SRICenNom || ''; });
    }
    if (!window._mapDeptosCache && window._catDepartamentos) {
        window._mapDeptosCache = {};
        window._catDepartamentos.forEach(d => { window._mapDeptosCache[String(d.SRIModNomC).trim()] = d.SRIModNom || ''; });
    }
    if (!window._mapPuestosCache && window._catPuestos) {
        window._mapPuestosCache = {};
        window._catPuestos.forEach(p => {
            const k = String(p.SRIPrtoId || p.SRIPtoId || p.SRIPuestoId || p.clave || '').trim();
            const v = String(p.SRIPtoDesc || p.SRIPuestoDesc || p.NomPto || p.nombre || p.descripcion || '').trim();
            if (k) window._mapPuestosCache[k] = v;
        });
    }

    tbody.innerHTML = registros.map(row => {
        const cReg = String(row.SRIRegId || '').trim();
        const cCentro = String(row.SRICenId || '').trim();
        const cNumPto = String(row.SRIPtoId || '').trim();
        const cDepto = String(row.SRIModNomC || '').trim();

        const reg = window._mapRegsCache?.[cReg] ? `${cReg} - ${window._mapRegsCache[cReg]}` : cReg;
        const centro = window._mapCentrosCache?.[cCentro] ? `${cCentro} - ${window._mapCentrosCache[cCentro]}` : cCentro;

        const descPuesto = window._mapPuestosCache?.[cNumPto];
        const puesto = (descPuesto && descPuesto !== '' && descPuesto !== 'undefined') ? descPuesto : cNumPto;

        const depto = window._mapDeptosCache?.[cDepto] || cDepto;
        const noEmp = String(row.SRIPerNumE || '').trim();
        const nombre = row.SRIPerNomE || '';
        const valNa = (v) => (!v || v === '0' || String(v).trim() === '') ? 'N/A' : v;

        return `
            <tr class="border-b border-stone-100 hover:bg-stone-50 transition">
                <td class="p-3 font-mono text-stone-600 truncate max-w-0" title="${valNa(reg)}">${valNa(reg)}</td>
                <td class="p-3 font-mono text-stone-600 truncate max-w-0" title="${valNa(centro)}">${valNa(centro)}</td>
                <td class="p-3 font-mono text-stone-600 text-center">${valNa(noEmp)}</td>
                <td class="p-3 truncate max-w-0">
                    <button type="button" onclick="seleccionarEmpleadoParaEditar('${noEmp}')" class="font-semibold text-[#249444] hover:underline text-left truncate w-full" title="${valNa(nombre)}">
                        ${valNa(nombre)}
                    </button>
                </td>
                <td class="p-3 text-stone-600 truncate max-w-0" title="${valNa(puesto)}">${valNa(puesto)}</td>
                <td class="p-3 text-stone-600 truncate max-w-0" title="${valNa(depto)}">${valNa(depto)}</td>
            </tr>
        `;
    }).join('');
}

function cancelarEdicionPersonal() {
    const formContainer = document.getElementById('contenedor-formulario-personal');
    const gestionContainer = document.getElementById('contenedor-gestion-personal');
    const listadoContainer = document.getElementById('contenedor-listado-personal');

    if (formContainer) formContainer.classList.add('hidden');
    if (gestionContainer) gestionContainer.classList.remove('hidden');
    if (listadoContainer) listadoContainer.classList.remove('hidden');

    if (window._empleadosCache?.length > 0) aplicarFiltroYRenderizar(window._empleadosCache);
}