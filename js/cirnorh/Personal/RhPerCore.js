// js/cirnorh/RhPersonal.js

// Variables globales de caché
window._catRegsCache = window._catRegsCache || null;
window._catCentrosCache = window._catCentrosCache || null;
window._catSitiosCache = window._catSitiosCache || null;
window._empleadosCache = window._empleadosCache || [];
window._mapRegsCache = window._mapRegsCache || null;
window._mapCentrosCache = window._mapCentrosCache || null;
window._mapPuestosCache = window._mapPuestosCache || null;
window._mapDeptosCache = window._mapDeptosCache || null;

function obtenerUsuarioSesion() {
    const posibleSesionGlobal = window.usuarioLogueado || window.usuarioActivo || window.sesion || window.currentUser || window.user;
    if (posibleSesionGlobal && typeof posibleSesionGlobal === 'object') {
        const numE = posibleSesionGlobal.SRIPerNumE || posibleSesionGlobal.numEmp || posibleSesionGlobal.usuario || posibleSesionGlobal.id || '';
        const regId = posibleSesionGlobal.SRIRegId || posibleSesionGlobal.regId || posibleSesionGlobal.reg || '';
        const cenId = posibleSesionGlobal.SRICenId || posibleSesionGlobal.cenId || posibleSesionGlobal.centro || '';

        if (numE || regId || cenId) {
            return {
                SRIPerNumE: numE,
                SRIRegId: regId,
                SRICenId: cenId,
                ...posibleSesionGlobal
            };
        }
    }

    try {
        const keysPossibles = ['usuario', 'usuarioLogueado', 'usuarioActivo', 'user', 'sesion', 'datosUsuario', 'currentUser'];
        for (let key of keysPossibles) {
            const dataStr = localStorage.getItem(key);
            if (dataStr) {
                let parsed;
                try {
                    parsed = JSON.parse(dataStr);
                } catch (errParse) {
                    parsed = dataStr;
                }

                if (parsed && typeof parsed === 'object') {
                    const numE = parsed.SRIPerNumE || parsed.numEmp || parsed.usuario || parsed.id || '';
                    const regId = parsed.SRIRegId || parsed.regId || parsed.reg || '';
                    const cenId = parsed.SRICenId || parsed.cenId || parsed.centro || '';

                    if (numE || regId || cenId) {
                        window.usuarioLogueado = parsed;
                        return {
                            SRIPerNumE: numE,
                            SRIRegId: regId,
                            SRICenId: cenId,
                            ...parsed
                        };
                    }
                } else if (typeof parsed === 'string' && parsed.trim() !== '') {
                    return {
                        SRIPerNumE: parsed,
                        SRIRegId: window.SRIRegId || '',
                        SRICenId: window.SRICenId || ''
                    };
                }
            }
        }
    } catch (e) { }

    return {
        SRIPerNumE: window.SRIPerNumE || window.numEmpUsuario || window.usuario || window.userEmp || '',
        SRIRegId: window.SRIRegId || window.regIdUsuario || window.regId || '',
        SRICenId: window.SRICenId || window.cenIdUsuario || window.cenId || ''
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
                                <th class="p-3 border-b border-stone-200">REG</th>
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
        tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-stone-400 italic">Sincronizando datos...</td></tr>`;
    }

    await cargarDatosPersonalSheets(forzarRecarga);
    await cargarCatalogosSheets(forzarRecarga);
}

function cancelarEdicionPersonal() {
    ocultarFormularioPersonal();
}

function ocultarFormularioPersonal() {
    const formContainer = document.getElementById('contenedor-formulario-personal');
    const gestionContainer = document.getElementById('contenedor-gestion-personal');
    const listadoContainer = document.getElementById('contenedor-listado-personal');

    if (formContainer) formContainer.classList.add('hidden');
    if (gestionContainer) gestionContainer.classList.remove('hidden');
    if (listadoContainer) listadoContainer.classList.remove('hidden');

    if (window._empleadosCache && window._empleadosCache.length > 0) {
        aplicarFiltroYRenderizar(window._empleadosCache);
    }
}

async function cargarCatalogosSheets(forzar = false) {
    if (forzar || !window._catRegs || window._catRegs.length === 0 || !window._catPuestos || window._catPuestos.length === 0) {
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
            console.error("Error al cargar catálogos desde servidor...", e);
        }
    }

    // 🛡️ Fallback de seguridad: si el servidor no devolvió puestos/deptos, los extraemos de los empleados cargados
    if ((!window._catPuestos || window._catPuestos.length === 0) && window._empleadosCache && window._empleadosCache.length > 0) {
        const puestosMap = new Map();
        window._empleadosCache.forEach(e => {
            if (e.SRIPtoId) puestosMap.set(String(e.SRIPtoId).trim(), String(e.SRIPtoId).trim());
        });
        window._catPuestos = Array.from(puestosMap.keys()).map(id => ({ SRIPtoId: id, SRIPtoDesc: id }));
    }

    if ((!window._catDepartamentos || window._catDepartamentos.length === 0) && window._empleadosCache && window._empleadosCache.length > 0) {
        const deptosMap = new Map();
        window._empleadosCache.forEach(e => {
            if (e.SRIModNomC) deptosMap.set(String(e.SRIModNomC).trim(), String(e.SRIModNomC).trim());
        });
        window._catDepartamentos = Array.from(deptosMap.keys()).map(id => ({ SRIModNomC: id, SRIModNom: id }));
    }

    pintarSelectsCatalogos();
}

function pintarSelectsCatalogos() {
    const selPuesto = document.getElementById('select-SRIPtoId');
if (selPuesto && window._catPuestos) {
    selPuesto.innerHTML = '<option value="" disabled selected>Seleccione un puesto...</option>' +
        window._catPuestos.map(p => {
            // Incluimos 'SRIPrtoId' que es la llave real que viene del servidor
            let numPto = String(p.SRIPrtoId || p.SRIPtoId || p.SRIPuestoId || p.NumPto || p.numPto || p.clave || '').trim();

            // Evaluamos la descripción
            let nomPto = String(p.SRIPtoDesc || p.SRIPuestoDesc || p.NomPto || p.nomPto || p.nombre || '').trim();

            // Si la descripción es idéntica al código o viene vacía, la limpiamos
            if (!nomPto || nomPto === numPto) {
                nomPto = '';
            }

            let textoMostrado = nomPto ? `${numPto} - ${nomPto}` : numPto;

            console.log(numPto + ' - ' + nomPto);

            return `<option value="${numPto}">${textoMostrado}</option>`;
        }).join('');
}

    const selDepto = document.getElementById('select-SRIModNomC');
    if (selDepto && window._catDepartamentos) {
        selDepto.innerHTML = '<option value="" disabled selected>Seleccione un departamento...</option>' +
            window._catDepartamentos.map(d => {
                const nomCor = String(d.SRIModNomC || d.SRIDepId || d.nomCorDep || d.NomCorDep || d.claveDep || d.id || '').trim();
                let nomDep = String(d.SRIModNom || d.nomDep || d.nombre || '').trim();

                if ((!nomDep || nomDep === nomCor) && window._mapDeptosCache && window._mapDeptosCache[nomCor]) {
                    nomDep = window._mapDeptosCache[nomCor];
                }

                return `<option value="${nomCor}">${nomCor}${nomDep && nomDep !== nomCor ? ' - ' + nomDep : ''}</option>`;
            }).join('');
    }

    const selRegiones = document.getElementById('select-SRIRegId');
    if (selRegiones && window._catRegs && selRegiones.options.length <= 1) {
        selRegiones.innerHTML = '<option value="" disabled selected>Seleccione una región...</option>' +
            window._catRegs.map(r => {
                const claveReg = String(r.SRIRegId || r.claveReg || '').trim();
                const nomReg = String(r.SRIRegNom || r.NomCorto || r.regional || '').trim();

                return `<option value="${claveReg}">${claveReg} - ${nomReg}</option>`;
            }).join('');
    }

    const selCentro = document.getElementById('select-SRICenId');
    if (selCentro && selCentro.value && typeof filtrarSitiosPorCentro === 'function') {
        filtrarSitiosPorCentro(selCentro.value);
    }
}

function matchClave(a, b) {
    const strA = String(a || '').trim();
    const strB = String(b || '').trim();
    if (strA === strB) return true;
    if (!isNaN(strA) && !isNaN(strB) && strA !== '' && strB !== '') {
        return Number(strA) === Number(strB);
    }
    return false;
}

window.filtrarCentrosPorRegion = function (centroActual = '', sitActual = '') {
    const selReg = document.getElementById('select-SRIRegId') || document.querySelector('select[name="SRIRegId"]');
    const selCentro = document.getElementById('select-SRICenId') || document.querySelector('select[name="SRICenId"]');
    const selSit = document.getElementById('select-SRISitId') || document.querySelector('select[name="SRISitId"]');

    if (!selReg || !selCentro || !selSit) return;

    const regionSeleccionada = selReg.value;

    selCentro.innerHTML = `<option value="" disabled selected>Seleccione un centro...</option>`;
    selSit.innerHTML = `<option value="" disabled selected>Seleccione un sitio...</option>`;

    const centrosArray = Array.isArray(window._catCentros) ? window._catCentros : [];
    const centrosFiltrados = regionSeleccionada ? centrosArray.filter(c => {
        const regEnFila = String(c.SRIRegId || c.ClaveReg || c.claveReg || '').trim();
        return matchClave(regEnFila, regionSeleccionada);
    }) : [];

    if (centrosFiltrados.length > 0) {
        selCentro.innerHTML += centrosFiltrados.map(c => {
            const claveC = String(c.SRICenId || c.ClaveCentro || c.claveCentro || '').trim();
            const nombreC = String(c.SRICenNom || c.Centro || c.centro || c.nombre || '').trim();
            const match = matchClave(claveC, centroActual);
            const selected = match ? 'selected' : '';
            return `<option value="${claveC}" ${selected}>${claveC} - ${nombreC}</option>`;
        }).join('');

        if (centroActual) {
            for (let option of selCentro.options) {
                if (matchClave(option.value, centroActual)) {
                    selCentro.value = option.value;
                    break;
                }
            }
        }
    }

    const centroIdAUsar = selCentro.value || centroActual;
    if (centroIdAUsar) {
        filtrarSitiosPorCentro(centroIdAUsar, sitActual);
    }
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
    const sitiosFiltrados = sitiosArray.filter(s => {
        const cAsociado = String(s.SRICenId || s.claveCentro || c.ClaveCentro || '').trim();
        return matchClave(cAsociado, centroId);
    });

    const esCero = String(sitActual).trim() === '0' || String(sitActual).trim() === 'N/A';

    let opcionesHTML = `<option value="N/A" ${esCero ? 'selected' : ''}>N/A</option>`;

    if (sitiosFiltrados.length > 0) {
        opcionesHTML += sitiosFiltrados.map(s => {
            const claveS = String(s.SRISitId || s.clave || s.ClaveSitio || s.claveSit || '').trim();
            const nombreS = String(s.SRISitNom || s.nombre || s.Sitio || s.sitio || '').trim();
            if (claveS === '0') return '';
            return `<option value="${claveS}">${claveS} - ${nombreS}</option>`;
        }).join('');
    }

    selSit.innerHTML = opcionesHTML;

    if (String(sitActual).trim() === '0' || String(sitActual).trim() === 'N/A') {
        selSit.value = "N/A";
    } else if (sitActual) {
        let encontrado = false;
        for (let opt of selSit.options) {
            if (matchClave(opt.value, sitActual)) {
                selSit.value = opt.value;
                encontrado = true;
                break;
            }
        }
        if (!encontrado) {
            selSit.value = "N/A";
        }
    } else {
        selSit.value = "N/A";
    }
}

async function seleccionarEmpleadoParaEditar(numEmpParam) {
    if (!window._empleadosCache || window._empleadosCache.length === 0) {
        try {
            const usuarioActivo = obtenerUsuarioSesion();
            const params = {
                usuario: usuarioActivo.SRIPerNumE || usuarioActivo.numEmp || usuarioActivo.usuario || '',
                SRIRegId: usuarioActivo.SRIRegId || usuarioActivo.regId || '',
                SRICenId: usuarioActivo.SRICenId || usuarioActivo.cenId || ''
            };

            const data = await callAppsScript('obtenerPersonalSQL', params);
            window._empleadosCache = data || [];
        } catch (error) {
            console.error("❌ Error al recuperar empleados:", error);
        }
    }

    const busqueda = String(numEmpParam || '').trim();
    let emp = window._empleadosCache.find(e => String(e.SRIPerNumE || '').trim() === busqueda);

    if (!emp) {
        alert("No se pudieron cargar los datos del empleado.");
        return;
    }

    // Asegurarnos de tener catálogos y respaldos listos antes de pintar el formulario
    await cargarCatalogosSheets(false);

    const form = document.getElementById('form-nuevo-personal');
    const formContainer = document.getElementById('contenedor-formulario-personal');
    const gestionContainer = document.getElementById('contenedor-gestion-personal');
    const listadoContainer = document.getElementById('contenedor-listado-personal');
    const titulo = document.getElementById('titulo-formulario');
    const inputNumEmp = document.getElementById('input-SRIPerNumE');

    if (formContainer && form) {
        const regVal = String(emp.SRIRegId || '').trim();
        const centroVal = String(emp.SRICenId || '').trim();
        let rawSit = String(emp.SRISitId || '').trim();
        const sitVal = (!rawSit || rawSit === '0' || rawSit.toUpperCase() === 'N/A') ? 'N/A' : rawSit;

        const selReg = document.getElementById('select-SRIRegId');
        if (selReg) selReg.value = regVal;

        if (typeof filtrarCentrosPorRegion === 'function') {
            filtrarCentrosPorRegion(centroVal, sitVal);
        }

        form.elements['SRIPerNumE'].value = String(emp.SRIPerNumE || '').trim();
        if (inputNumEmp) inputNumEmp.setAttribute('readonly', true);

        form.elements['SRIPerNomE'].value = String(emp.SRIPerNomE || '').trim();
        form.elements['SRIPerNExt'].value = String(emp.SRIPerNExt || '').trim();
        form.elements['SRIPerNCel'].value = String(emp.SRIPerNCel || '').trim();
        form.elements['SRIPerEsco'].value = String(emp.SRIPerEsco || '').trim();
        form.elements['SRIPerDir'].value = String(emp.SRIPerDir || '').trim();
        form.elements['SRIPerCP'].value = String(emp.SRIPerCP || '').trim();
        form.elements['SRIPerEml'].value = String(emp.SRIPerEml || '').trim();
        form.elements['SRIPerRFC'].value = String(emp.SRIPerRFC || '').trim();
        form.elements['SRIPerCd'].value = String(emp.SRIPerCd || '').trim();
        form.elements['SRIPerEdo'].value = String(emp.SRIPerEdo || '').trim();

        // Asignación síncrona/asíncrona segura de Puesto y Departamento
        const ptoVal = String(emp.SRIPtoId || '').trim();
        const depVal = String(emp.SRIModNomC || '').trim();

        const selPto = document.getElementById('select-SRIPtoId');
        const selDep = document.getElementById('select-SRIModNomC');

        if (selPto) {
            if (ptoVal && ![...selPto.options].some(o => o.value === ptoVal)) {
                selPto.innerHTML += `<option value="${ptoVal}">${ptoVal}</option>`;
            }
            selPto.value = ptoVal;
        }

        if (selDep) {
            if (depVal && ![...selDep.options].some(o => o.value === depVal)) {
                selDep.innerHTML += `<option value="${depVal}">${depVal}</option>`;
            }
            selDep.value = depVal;
        }

        if (titulo) {
            titulo.innerHTML = `Editando empleado: <span class="text-[#249444]">${String(emp.SRIPerNomE || '')}</span> (No. Empleado: ${String(emp.SRIPerNumE || '')})`;
        }

        formContainer.classList.remove('hidden');
        if (gestionContainer) gestionContainer.classList.add('hidden');
        if (listadoContainer) listadoContainer.classList.add('hidden');
    }
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
            usuario: usuarioActivo.SRIPerNumE || usuarioActivo.numEmp || usuarioActivo.usuario || '',
            SRIRegId: usuarioActivo.SRIRegId || usuarioActivo.regId || '',
            SRICenId: usuarioActivo.SRICenId || usuarioActivo.cenId || ''
        };

        const data = await callAppsScript('obtenerPersonalSQL', params);
        window._empleadosCache = data || [];
        aplicarFiltroYRenderizar(window._empleadosCache);
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-red-500 italic">Error al conectar con la Base de Datos.</td></tr>`;
    }
}

function aplicarFiltroYRenderizar(empleados) {
    const usuarioActivo = obtenerUsuarioSesion();
    const centroUsuario = String(usuarioActivo.SRICenId || usuarioActivo.cenId || '').trim();
    let empleadosFiltrados = empleados;

    if (centroUsuario && centroUsuario !== '0' && centroUsuario !== 'undefined' && centroUsuario !== '') {
        empleadosFiltrados = empleados.filter(emp => {
            const centroEmp = String(emp.SRICenId || '').trim();
            return centroEmp.includes(centroUsuario);
        });
    }

    renderizarTablaPersonal(empleadosFiltrados);
}

function filtrarTablaPersonal(textoBusqueda) {
    const query = textoBusqueda.toLowerCase().trim();

    const usuarioActivo = obtenerUsuarioSesion();
    const centroUsuario = String(usuarioActivo.SRICenId || usuarioActivo.cenId || '').trim();
    let baseEmpleados = window._empleadosCache;

    if (centroUsuario && centroUsuario !== '0' && centroUsuario !== 'undefined') {
        baseEmpleados = window._empleadosCache.filter(emp => String(emp.SRICenId || '').trim().includes(centroUsuario));
    }

    if (!query) {
        renderizarTablaPersonal(baseEmpleados);
        return;
    }

    const empleadosFiltrados = baseEmpleados.filter(row => {
        const reg = String(row.SRIRegId || "").toLowerCase();
        const centro = String(row.SRICenId || "").toLowerCase();
        const numEmp = String(row.SRIPerNumE || "").toLowerCase();
        const nombre = String(row.SRIPerNomE || "").toLowerCase();
        const puesto = String(row.SRIPtoId || "").toLowerCase();
        const depto = String(row.SRIModNomC || "").toLowerCase();

        return reg.includes(query) ||
            centro.includes(query) ||
            numEmp.includes(query) ||
            nombre.includes(query) ||
            puesto.includes(query) ||
            depto.includes(query);
    });

    renderizarTablaPersonal(empleadosFiltrados);
}

function renderizarTablaPersonal(registros) {
    const tbody = document.getElementById('tabla-personal-body');
    if (!tbody) return;

    if (!registros || !registros.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-stone-400 italic">No hay registros.</td></tr>`;
        return;
    }

    if (!window._mapRegsCache && window._catRegs) {
        window._mapRegsCache = {};
        window._catRegs.forEach(r => {
            const k = String(r.SRIRegId || r.claveReg || '').trim();
            if (k) window._mapRegsCache[k] = r.SRIRegNom || r.NomCorto || r.regional || '';
        });
    }

    if (!window._mapCentrosCache && window._catCentros) {
        window._mapCentrosCache = {};
        window._catCentros.forEach(c => {
            const k = String(c.SRICenId || c.ClaveCentro || '').trim();
            if (k) window._mapCentrosCache[k] = c.SRICenNom || c.Centro || '';
        });
    }

    if (!window._mapDeptosCache && window._catDepartamentos && Array.isArray(window._catDepartamentos)) {
        window._mapDeptosCache = {};
        window._catDepartamentos.forEach(d => {
            const k = String(d.SRIModNomC || d.SRIDepId || d.claveDep || d.id || d.Clave || '').trim();
            const v = d.SRIModNom || d.SRIModNomC || d.nombreDep || d.nombre || d.descripcion || d.Descripcion || '';
            if (k) window._mapDeptosCache[k] = v;
        });
    }

    if (!window._mapPuestosCache && window._catPuestos && Array.isArray(window._catPuestos)) {
        window._mapPuestosCache = {};
        window._catPuestos.forEach(p => {
            const k = String(p.SRIPtoId || '').trim();
            const v = p.SRIPtoDesc || p.NomPto || '';
            if (k) window._mapPuestosCache[k] = v;
        });
    }

    tbody.innerHTML = registros.map((row) => {
        const cReg = String(row.SRIRegId || '').trim();
        const cCentro = String(row.SRICenId || '').trim();
        const cNumPto = String(row.SRIPtoId || '').trim();
        const cNomCorDep = String(row.SRIModNomC || row.departamento || row.depto || row.SRIDepId || row.ClaveDep || '').trim();

        const nomCortoReg = (window._mapRegsCache && window._mapRegsCache[cReg]) || '';
        const reg = nomCortoReg ? `${cReg} - ${nomCortoReg}` : cReg;

        const nomCortoCentro = (window._mapCentrosCache && window._mapCentrosCache[cCentro]) || '';
        const centro = nomCortoCentro ? `${cCentro} - ${nomCortoCentro}` : cCentro;

        let puestoVisual = cNumPto;
        if (cNumPto && window._mapPuestosCache && window._mapPuestosCache[cNumPto]) {
            puestoVisual = window._mapPuestosCache[cNumPto];
        }

        let deptoVisual = cNomCorDep;
        if (cNomCorDep && window._mapDeptosCache && window._mapDeptosCache[cNomCorDep]) {
            deptoVisual = window._mapDeptosCache[cNomCorDep];
        }

        const noEmp = String(row.SRIPerNumE || '').trim();
        const nombre = row.SRIPerNomE || '';

        const valNa = (v) => (!v || v === 0 || v === '0' || String(v).trim() === '') ? 'N/A' : v;

        return `
            <tr class="border-b border-stone-100 hover:bg-stone-50 transition">
                <td class="p-3 font-mono text-stone-600">${valNa(reg)}</td>
                <td class="p-3 font-mono text-stone-600">${valNa(centro)}</td>
                <td class="p-3 font-mono text-stone-600">${valNa(noEmp)}</td>
                <td class="p-3"><button type="button" onclick="seleccionarEmpleadoParaEditar('${noEmp}')" class="font-semibold text-[#249444] hover:underline text-left">${valNa(nombre)}</button></td>
                <td class="p-3 text-stone-600">${valNa(puestoVisual)}</td>
                <td class="p-3 text-stone-600">${valNa(deptoVisual)}</td>
            </tr>
        `;
    }).join('');
}