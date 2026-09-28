// js/cirnorh/RhPersonal.js

// Variables globales de caché (protegidas para máxima velocidad)
window._catRegsCache = window._catRegsCache || null;
window._catCentrosCache = window._catCentrosCache || null;
window._catSitiosCache = window._catSitiosCache || null;
window._empleadosCache = window._empleadosCache || [];
window._mapRegsCache = window._mapRegsCache || null;
window._mapCentrosCache = window._mapCentrosCache || null;
window._mapPuestosCache = window._mapPuestosCache || null; // 👈 Agregado
window._mapDeptosCache = window._mapDeptosCache || null;   // 👈 Agregado

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
                    <label class="block font-bold text-stone-700 mb-1">Clave Reg:</label>
                    <select name="claveReg" id="select-claveReg" onchange="filtrarCentrosPorRegion()" required class="w-full p-2.5 border border-stone-300 rounded-lg bg-white focus:outline-none focus:border-[#249444]">
                        <option value="" disabled selected>Seleccione una región...</option>
                    </select>
                </div>
                <div>
                    <label class="block font-bold text-stone-700 mb-1">Clave Centro:</label>
                    <select name="claveCentro" id="select-claveCentro" onchange="filtrarSitiosPorCentro(this.value)" required class="w-full p-2.5 border border-stone-300 rounded-lg bg-white focus:outline-none focus:border-[#249444]">
                        <option value="" disabled selected>Seleccione un centro...</option>
                    </select>
                </div>
                <div>
                    <label class="block font-bold text-stone-700 mb-1">Clave Sitio:</label>
                    <select name="claveSit" id="select-claveSit" required class="w-full p-2.5 border border-stone-300 rounded-lg bg-white focus:outline-none focus:border-[#249444]">
                        <option value="" disabled selected>Seleccione un sitio...</option>
                    </select>
                </div>
                
                <div><label class="block font-bold text-stone-700 mb-1">Núm. Empleado:</label><input type="text" name="numEmp" id="input-numEmp" required class="w-full p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:border-[#249444]"></div>
                <div><label class="block font-bold text-stone-700 mb-1">Nombre Completo:</label><input type="text" name="nombre" required class="w-full p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:border-[#249444]"></div>
                
                <div><label class="block font-bold text-stone-700 mb-1">Extensión:</label><input type="text" name="ext" class="w-full p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:border-[#249444]"></div>
                <div><label class="block font-bold text-stone-700 mb-1">Núm. Personal:</label><input type="text" name="numPers" class="w-full p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:border-[#249444]"></div>
                <div><label class="block font-bold text-stone-700 mb-1">Escolaridad:</label><input type="text" name="escolaridad" class="w-full p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:border-[#249444]"></div>
                <div><label class="block font-bold text-stone-700 mb-1">Dirección:</label><input type="text" name="direccion" class="w-full p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:border-[#249444]"></div>
                <div><label class="block font-bold text-stone-700 mb-1">C.P.:</label><input type="text" name="cp" class="w-full p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:border-[#249444]"></div>
                <div><label class="block font-bold text-stone-700 mb-1">Email:</label><input type="email" name="email" class="w-full p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:border-[#249444]"></div>
                <div><label class="block font-bold text-stone-700 mb-1">RFC:</label><input type="text" name="rfc" required class="w-full p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:border-[#249444]"></div>
                
                <div>
                    <label class="block font-bold text-stone-700 mb-1">Puesto:</label>
                    <select name="NumPto" id="select-NumPto" required class="w-full p-2.5 border border-stone-300 rounded-lg bg-white focus:outline-none focus:border-[#249444]">
                        <option value="" disabled selected>Seleccione un puesto...</option>
                    </select>
                </div>
                <div>
                    <label class="block font-bold text-stone-700 mb-1">Departamento:</label>
                    <select name="NomCorDep" id="select-NomCorDep" required class="w-full p-2.5 border border-stone-300 rounded-lg bg-white focus:outline-none focus:border-[#249444]">
                        <option value="" disabled selected>Seleccione un departamento...</option>
                    </select>
                </div>

                <div><label class="block font-bold text-stone-700 mb-1">Ciudad:</label><input type="text" name="ciudad" class="w-full p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:border-[#249444]"></div>
                <div><label class="block font-bold text-stone-700 mb-1">Estado:</label><input type="text" name="estado" class="w-full p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:border-[#249444]"></div>
                
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
        window._mapPuestosCache = null; // <-- Limpiamos caché de puestos también
        window._empleadosCache = [];
    }

    const tbody = document.getElementById('tabla-personal-body');
    if (tbody && window._empleadosCache.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-stone-400 italic">Sincronizando datos...</td></tr>`;
    }

    // 1. CARGAMOS PRIMERO LOS CATÁLOGOS (Puestos, Departamentos, etc.)
    await cargarCatalogosSheets(forzarRecarga);

    // 2. DESPUÉS CARGAMOS EL PERSONAL Y RENDERIZAMOS CON LOS NOMBRES YA LISTOS
    await cargarDatosPersonalSheets(forzarRecarga);
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
        renderizarTablaPersonal(window._empleadosCache);
    }
}

async function cargarCatalogosSheets(forzar = false) {
    if (!forzar && window._catRegs && window._catRegs.length > 0) return;

    try {
        const data = await FetchAPI('obtenerDatosSistema', {});

        window._catRegs = data.regionales || [];
        window._catCentros = data.campos || [];
        window._catSitios = data.sitios || [];
        window._catDepartamentos = data.departamentos || data.deptos || [];
        window._catPuestos = data.puestos || data.catPuestos || [];

        // Poblar select de puestos
        const selPuesto = document.getElementById('select-NumPto');
        if (selPuesto && window._catPuestos) {
            selPuesto.innerHTML = '<option value="" disabled selected>Seleccione un puesto...</option>' +
                window._catPuestos.map(p => {
                    const numPto = p.NumPto || p.numPto || p.clave || '';
                    const nomPto = p.NomPto || p.nomPto || p.nombre || '';
                    return `<option value="${numPto}">${numPto} - ${nomPto}</option>`;
                }).join('');
        }

        // Poblar select de departamentos
        const selDepto = document.getElementById('select-NomCorDep');
        if (selDepto && window._catDepartamentos) {
            selDepto.innerHTML = '<option value="" disabled selected>Seleccione un departamento...</option>' +
                window._catDepartamentos.map(d => {
                    const nomCor = d.nomCorDep || d.NomCorDep || d.claveDep || '';
                    const nomDep = d.nomDep || d.nombre || '';
                    return `<option value="${nomCor}">${nomCor} - ${nomDep}</option>`;
                }).join('');
        }

        const selCentro = document.getElementById('select-claveCentro');
        if (selCentro && selCentro.value && typeof filtrarSitiosPorCentro === 'function') {
            filtrarSitiosPorCentro(selCentro.value);
        }
    } catch (e) {
        console.error("Error al cargar catálogos desde servidor...", e);
    }
}

function poblarSelectoresCascada(regSeleccionada = '', centroSeleccionado = '', sitioSeleccionado = '') {
    const selectReg = document.getElementById('select-claveReg');
    const selectCentro = document.getElementById('select-claveCentro');
    const selectSitio = document.getElementById('select-claveSit');

    if (!selectReg || !selectCentro || !selectSitio) return;

    selectReg.innerHTML = '<option value="" disabled selected>Seleccione una región...</option>' +
        window._catRegs.map(r => `<option value="${r.claveReg}">${r.claveReg} - ${r.regional}</option>`).join('');

    if (regSeleccionada) {
        selectReg.value = regSeleccionada;
        filtrarCentrosPorRegion(centroSeleccionado, sitioSeleccionado);
    }

    selectReg.onchange = () => filtrarCentrosPorRegion();
    selectCentro.onchange = () => filtrarSitiosPorCentro();
}

window.filtrarCentrosPorRegion = function (centroActual = '', sitActual = '') {
    const selReg = document.getElementById('select-claveReg') || document.querySelector('select[name="claveReg"]');
    const selCentro = document.getElementById('select-claveCentro') || document.querySelector('select[name="claveCentro"]');
    const selSit = document.getElementById('select-claveSit') || document.querySelector('select[name="claveSit"]');

    if (!selReg || !selCentro || !selSit) return;

    const regionSeleccionada = selReg.value;

    selCentro.innerHTML = `<option value="" disabled selected>Seleccione un centro...</option>`;
    selSit.innerHTML = `<option value="" disabled selected>Seleccione un sitio...</option>`;

    const centrosArray = Array.isArray(window._catCentros) ? window._catCentros : [];
    const centrosFiltrados = regionSeleccionada ? centrosArray.filter(c => {
        const regEnFila = String(c.ClaveReg || c.claveReg || c.CLAVEREG || '').trim();
        return regEnFila === String(regionSeleccionada).trim();
    }) : [];

    if (centrosFiltrados.length > 0) {
        selCentro.innerHTML += centrosFiltrados.map(c => {
            const claveC = c.ClaveCentro || c.claveCentro || c.CLAVECENTRO || c.clave || '';
            const nombreC = c.Centro || c.centro || c.nombre || '';
            const selected = (String(claveC) === String(centroActual)) ? 'selected' : '';
            return `<option value="${claveC}" ${selected}>${claveC} - ${nombreC}</option>`;
        }).join('');
    }

    if (centroActual || selCentro.value) {
        filtrarSitiosPorCentro(centroActual || selCentro.value, sitActual);
    }
};

window.filtrarSitiosPorCentro = function (claveCentro = '', sitActual = '') {
    const selSit = document.getElementById('select-claveSit');
    if (!selSit) return;

    selSit.innerHTML = `<option value="" disabled selected>Seleccione un sitio...</option>`;

    const centroId = claveCentro || document.getElementById('select-claveCentro').value;

    const sitiosArray = Array.isArray(window._catSitios) ? window._catSitios : [];
    const sitiosFiltrados = sitiosArray.filter(s => {
        const cAsociado = String(s.claveCentro || s.ClaveCentro || '').trim();
        return cAsociado === String(centroId).trim();
    });

    if (sitiosFiltrados.length > 0) {
        selSit.innerHTML += sitiosFiltrados.map(s => {
            const claveS = s.clave || s.ClaveSitio || s.claveSit || '';
            const nombreS = s.nombre || s.Sitio || s.sitio || '';
            return `<option value="${claveS}">${claveS} - ${nombreS}</option>`;
        }).join('');
    } else {
        selSit.innerHTML += `<option value="N/A" selected>N/A - No aplica</option>`;
    }

    if (sitActual) {
        selSit.value = sitActual;
    }
};

document.addEventListener("DOMContentLoaded", () => {
    const selReg = document.getElementById('select-claveReg') || document.querySelector('select[name="claveReg"]');
    if (selReg) {
        selReg.addEventListener('change', () => {
            window.filtrarCentrosPorRegion();
        });
    }

    const selCentro = document.getElementById('select-claveCentro');
    if (selCentro) {
        selCentro.addEventListener('change', function (e) {
            window.filtrarSitiosPorCentro(e.target.value);
        });
    }
});

async function cargarDatosPersonalSheets(forzar = false) {
    const tbody = document.getElementById('tabla-personal-body');
    if (!tbody) return;

    if (!forzar && window._empleadosCache.length > 0) {
        renderizarTablaPersonal(window._empleadosCache);
        return;
    }

    try {
        const data = await FetchAPI('obtenerPersonal');
        window._empleadosCache = data || [];
        renderizarTablaPersonal(window._empleadosCache);
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-red-500 italic">Error al conectar con Sheets.</td></tr>`;
    }
}

function filtrarTablaPersonal(textoBusqueda) {
    const query = textoBusqueda.toLowerCase().trim();

    if (!query) {
        renderizarTablaPersonal(window._empleadosCache);
        return;
    }

    const empleadosFiltrados = window._empleadosCache.filter(row => {
        const reg = String(row.claveReg || row.textoReg || "").toLowerCase();
        const centro = String(row.claveCentro || row.textoCentro || "").toLowerCase();
        const numEmp = String(row.numEmp || "").toLowerCase();
        const nombre = String(row.nombre || "").toLowerCase();
        const puesto = String(row.NumPto || row.puesto || "").toLowerCase();
        const depto = String(row.NomCorDep || row.departamento || "").toLowerCase();

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
            const k = String(r.claveReg || r.clave || '').trim();
            if (k) window._mapRegsCache[k] = r.NomCorto || r.nomCorto || r.regional || r.nombre || '';
        });
    }

    if (!window._mapCentrosCache && window._catCentros) {
        window._mapCentrosCache = {};
        window._catCentros.forEach(c => {
            const k = String(c.ClaveCentro || c.claveCentro || c.clave || '').trim();
            if (k) window._mapCentrosCache[k] = c.NomCorto || c.nomCorto || c.Centro || c.centro || '';
        });
    }

    if (window._catDepartamentos && Array.isArray(window._catDepartamentos) && window._catDepartamentos.length > 0) {
        window._mapDeptosCache = {};
        window._catDepartamentos.forEach(d => {
            const nomCor = String(d.nomCorDep || '').trim();
            const cDep = String(d.claveDep || '').trim();
            const nomLargo = d.nomDep || d.nombre || '';

            if (nomCor) window._mapDeptosCache[nomCor] = nomLargo;
            if (cDep) window._mapDeptosCache[cDep] = nomLargo;
        });
    }

    if (!window._mapPuestosCache && window._catPuestos && Array.isArray(window._catPuestos)) {
        window._mapPuestosCache = {};
        window._catPuestos.forEach(p => {
            const k = String(p.NumPto || p.numPto || p.clave || '').trim();
            const v = p.NomPto || p.nomPto || p.nombre || '';
            if (k) window._mapPuestosCache[k] = v;
        });
    }

    tbody.innerHTML = registros.map((row) => {
        const cReg = String(row.claveReg || '').trim();
        const cCentro = String(row.claveCentro || '').trim();
        const cNumPto = String(row.NumPto || row.numPto || row.puesto || '').trim();
        const cNomCorDep = String(row.NomCorDep || row.nomCorDep || row.departamento || '').trim();

        const nomCortoReg = (window._mapRegsCache && window._mapRegsCache[cReg]) || '';
        const reg = nomCortoReg ? `${cReg} - ${nomCortoReg}` : (row.textoReg || cReg);

        const nomCortoCentro = (window._mapCentrosCache && window._mapCentrosCache[cCentro]) || '';
        const centro = nomCortoCentro ? `${cCentro} - ${nomCortoCentro}` : (row.textoCentro || cCentro);

        let puestoVisual = cNumPto; // Por si no encuentra coincidencia, muestra el número temporalmente
        if (cNumPto) {
            // 1. Buscamos primero en el mapa optimizado de puestos
            if (window._mapPuestosCache && window._mapPuestosCache[cNumPto]) {
                puestoVisual = window._mapPuestosCache[cNumPto];
            }
            // 2. Si no está en el mapa, hacemos una búsqueda directa en el arreglo de catálogos
            else if (Array.isArray(window._catPuestos) && window._catPuestos.length > 0) {
                const encontrado = window._catPuestos.find(p =>
                    String(p.NumPto || p.numPto || '').trim() === cNumPto
                );
                if (encontrado) {
                    puestoVisual = encontrado.NomPto || encontrado.nomPto || encontrado.nombre || cNumPto;
                }
            }
        }

        let deptoVisual = cNomCorDep;
        if (cNomCorDep) {
            if (window._mapDeptosCache && window._mapDeptosCache[cNomCorDep]) {
                deptoVisual = window._mapDeptosCache[cNomCorDep];
            } else if (Array.isArray(window._catDepartamentos)) {
                const encontrado = window._catDepartamentos.find(d =>
                    String(d.nomCorDep || '').trim().toUpperCase() === cNomCorDep.toUpperCase() ||
                    String(d.claveDep || '').trim() === cNomCorDep ||
                    String(d.nomDep || '').trim().toUpperCase() === cNomCorDep.toUpperCase()
                );
                if (encontrado) {
                    deptoVisual = encontrado.nomDep || encontrado.nombre || cNomCorDep;
                }
            }
        }

        const noEmp = String(row.numEmp || row.noEmp || '').trim();
        const nombre = row.nombre;

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