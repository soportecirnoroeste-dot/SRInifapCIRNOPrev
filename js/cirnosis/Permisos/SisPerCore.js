// ==========================================
// MÓDULO DE PERMISOS - SISPER CORE
// ==========================================

function renderizarListadoPermisosSis() {
    const elementosPagina = document.querySelectorAll('div, section');
    elementosPagina.forEach(el => {
        if (el.innerText && el.innerText.includes("MENÚ DEL DEPARTAMENTO") && el.id !== 'contenido-submodulo-dinamico') {
            el.style.display = 'none';
        }
    });

    let contenedorDinamico = document.getElementById('contenido-submodulo-dinamico');

    if (!contenedorDinamico) {
        const areaTrabajo = document.getElementById('app-container') || document.querySelector('main') || document.body;
        if (areaTrabajo) {
            contenedorDinamico = document.createElement('div');
            contenedorDinamico.id = 'contenido-submodulo-dinamico';
            areaTrabajo.appendChild(contenedorDinamico);
        }
    }

    if (contenedorDinamico) {
        contenedorDinamico.style.display = 'block';
        contenedorDinamico.className = "w-full space-y-6 bg-white p-6 md:p-8 rounded-2xl soft-shadow border border-[#249444]/10 mb-8 animate-fade-in";
        contenedorDinamico.innerHTML = `
            <div class="flex items-center gap-3 pb-4 border-b border-stone-100">
                <div class="p-2.5 bg-[#f0fdf4] border border-[#c6f6d5] text-[#059669] rounded-xl flex items-center justify-center">
                    <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='lucide lucide-user-round-key'><path d='M19 11v6'/><path d='M19 13h2'/><path d='M2 21a8 8 0 0 1 12.868-6.349'/><circle cx='10' cy='8' r='5'/><circle cx='19' cy='19' r='2'/></svg>
                </div>
                <div>
                    <h3 class="font-black text-stone-800 text-lg uppercase tracking-wide">Permisos</h3>
                </div>
            </div>

            <div id="contenedor-gestion-permisos" class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-stone-50 p-4 rounded-xl border border-stone-200">
                <div>
                    <h4 class="font-bold text-stone-800 text-sm">Gestión de Permisos por Colaborador</h4>
                </div>
                <div class="flex gap-2">
                    <button type="button" onclick="actualizarDatosPermisosSis()" class="px-4 py-2 bg-stone-200 text-stone-700 rounded-xl text-xs font-bold hover:bg-stone-300 transition flex items-center gap-2 cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
                        Actualizar Datos
                    </button>
                </div>
            </div>

            <div id="contenedor-listado-permisos" class="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
                <div class="p-4 border-b border-stone-100 flex flex-wrap justify-between items-center gap-4 bg-white">
                    <div class="font-bold text-xs text-stone-700 uppercase tracking-wider">Listado General de Empleados</div>
                    
                    <div class="relative">
                        <span class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-stone-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                        </span>
                        <input type="text" id="input-buscar-permisos" oninput="filtrarTarjetasPermisosSis()" placeholder="Buscar por nombre, puesto, centro..." 
                            class="w-64 sm:w-72 pl-9 pr-4 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#249444] text-stone-700 transition-all shadow-xs uppercase">
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
                            <tbody id="grid-permisos-empleados" class="divide-y divide-stone-100">
                                <tr><td colspan="6" class="p-6 text-center text-stone-400 italic">Sincronizando datos...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        cargarDatosPermisosConCatalogos();
    }
}

async function cargarDatosPermisosConCatalogos() {
    const tbody = document.getElementById('grid-permisos-empleados');

    try {
        if (!window._catPuestos || window._catPuestos.length === 0 || !window._catDepartamentos || window._catDepartamentos.length === 0) {
            const dataSys = await FetchAPI('obtenerDatosSistema', {});
            window._catDepartamentos = dataSys.departamentos || dataSys.deptos || [];
            window._catPuestos = dataSys.puestos || dataSys.catPuestos || [];
        }

        let data = window._empleadosCache || [];
        if (!data || data.length === 0) {
            data = await FetchAPI('obtenerPersonal');
            window._empleadosCache = data || [];
        }

        window.listaEmpleadosPermisosCache = window._empleadosCache;
        renderizarTarjetasPermisosSis(window.listaEmpleadosPermisosCache);

    } catch (err) {
        console.error("❌ Error en carga:", err);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-red-500">Error al conectar con Sheets: ${err.message || 'Error de red'}</td></tr>`;
        }
    }
}

function renderizarTarjetasPermisosSis(empleados) {
    const tbody = document.getElementById('grid-permisos-empleados');
    if (!tbody) return;

    if (!empleados || empleados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-stone-400">No se encontraron colaboradores registrados Sheets.</td></tr>`;
        return;
    }

    if (!window._mapPuestosCache && window._catPuestos && Array.isArray(window._catPuestos)) {
        window._mapPuestosCache = {};
        window._catPuestos.forEach(p => {
            const k = String(p.NumPto || p.numPto || p.clave || '').trim();
            const v = p.NomPto || p.nomPto || p.nombre || '';
            if (k) window._mapPuestosCache[k] = v;
        });
    }

    if (!window._mapDeptosCache && window._catDepartamentos && Array.isArray(window._catDepartamentos)) {
        window._mapDeptosCache = {};
        window._catDepartamentos.forEach(d => {
            const nomCor = String(d.nomCorDep || '').trim();
            const cDep = String(d.claveDep || '').trim();
            const nomLargo = d.nomDep || d.nombre || '';
            if (nomCor) window._mapDeptosCache[nomCor] = nomLargo;
            if (cDep) window._mapDeptosCache[cDep] = nomLargo;
        });
    }

    let html = "";
    empleados.forEach(emp => {
        const reg = emp.reg || emp.REG || "100 - CIRNO";
        const centro = emp.centro || emp.CENTRO || "108 - DIRECCION";
        const numEmp = String(emp.numEmp || emp.noEmp || emp.NO_EMP || emp.NumEmp || '').trim();
        const nombre = emp.nombre || emp.NOMBRE || "SIN NOMBRE";

        const cNumPto = String(emp.NumPto || emp.numPto || emp.puesto || '').trim();
        let puestoVisual = cNumPto;
        if (cNumPto && window._mapPuestosCache && window._mapPuestosCache[cNumPto]) {
            puestoVisual = window._mapPuestosCache[cNumPto];
        }

        const cNomCorDep = String(emp.NomCorDep || emp.nomCorDep || emp.depto || '').trim();
        let deptoVisual = cNomCorDep;
        if (cNomCorDep && window._mapDeptosCache && window._mapDeptosCache[cNomCorDep]) {
            deptoVisual = window._mapDeptosCache[cNomCorDep];
        }

        html += `
            <tr class="hover:bg-stone-50/80 transition-all border-b border-stone-100">
                <td class="p-3 font-mono text-stone-600">${reg}</td>
                <td class="p-3 font-mono text-stone-600">${centro}</td>
                <td class="p-3 font-mono text-stone-600">${numEmp}</td>
                <td class="p-3 font-bold text-[#249444] uppercase">
                    <button type="button" onclick="abrirMatrizPermisosUsuario('${nombre.replace(/'/g, "\\'")}', '${numEmp}')" class="hover:underline text-left cursor-pointer focus:outline-none">
                        ${nombre}
                    </button>
                </td>
                <td class="p-3 text-stone-600 uppercase">${puestoVisual}</td>
                <td class="p-3 text-stone-600 uppercase">${deptoVisual || 'N/A'}</td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

function filtrarTarjetasPermisosSis() {
    const inputBusqueda = document.getElementById('input-buscar-permisos');
    if (!inputBusqueda) return;

    const filtro = inputBusqueda.value.toUpperCase().trim();
    const lista = window.listaEmpleadosPermisosCache || [];

    if (!filtro) {
        renderizarTarjetasPermisosSis(lista);
        return;
    }

    const filtrados = lista.filter(emp => {
        const texto = `${emp.reg || ''} ${emp.centro || ''} ${emp.numEmp || ''} ${emp.noEmp || ''} ${emp.nombre || ''} ${emp.NumPto || ''} ${emp.NomCorDep || ''}`.toUpperCase();
        return texto.includes(filtro);
    });

    renderizarTarjetasPermisosSis(filtrados);
}

function cargarPermisosSis() {
    if (typeof window.renderizarListadoPermisosSis === 'function') {
        window.renderizarListadoPermisosSis();
    }
}

function actualizarDatosPermisosSis() {
    window._empleadosCache = null;
    cargarPermisosSis();
}


// ==========================================
// MÓDULO DE PERMISOS - SISPER CORE
// ==========================================

async function abrirMatrizPermisosUsuario(nombreColaborador, noEmp) {
    const contenedorDinamico = document.getElementById('contenido-submodulo-dinamico');
    if (!contenedorDinamico) return;

    contenedorDinamico.className = "col-span-1 sm:col-span-2 md:col-span-3 space-y-6 animate-fade-in";

    // 1. Mostrar estado de carga inicial dentro del contenedor para evitar parpadeos
    contenedorDinamico.innerHTML = `
        <div class="w-full space-y-6 bg-white p-8 rounded-2xl soft-shadow border border-[#249444]/10 mb-8 text-center">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#249444] border-t-transparent"></div>
            <p class="text-xs text-stone-500 font-bold mt-2">Cargando matriz de permisos y submódulos...</p>
        </div>
    `;

    try {
        // 2. 🚀 PETICIÓN ÚNICA: Aseguramos catálogos y permisos del empleado de un solo golpe
        if (!window.allSubModulosData || window.allSubModulosData.length === 0) {
            const dataSys = await FetchAPI('obtenerDatosSistema', {});
            window._catDepartamentos = dataSys.departamentos || dataSys.deptos || [];
            window.allSubModulosData = dataSys.submodulos || dataSys.subModulos || [];
        }

        // 3. Obtenemos los permisos específicos del colaborador
        const permisosMap = await FetchAPI('obtenerPermisosColaborador', { numEmp: String(noEmp).trim() }) || {};

        const deptos = window._catDepartamentos || [];
        const submodulos = window.allSubModulosData || [];
        let filasHTML = "";

        if (deptos.length > 0) {
            deptos.forEach(dep => {
                const cDep = String(dep.claveDep || dep.ClaveDep || '').trim();
                const nombreDep = dep.nomDep || dep.nombre || dep.NomDep || `Departamento ${cDep}`;
                const subsDelDepto = submodulos.filter(sub => String(sub.ClaveDep || sub.claveDep || '').trim() === cDep);

                filasHTML += `
                    <tr class="bg-stone-50 font-bold text-stone-800 border-t border-stone-200">
                        <td class="p-3 pl-4 uppercase tracking-wider" colspan="4">📁 Departamento: ${nombreDep}</td>
                    </tr>
                `;

                if (subsDelDepto.length > 0) {
                    subsDelDepto.forEach(sub => {
                        const nombreSub = sub.SModNom || sub.sModNom || sub.nombre || 'Submódulo';
                        const idSub = sub.SModClave || sub.sModClave || sub.id || '';

                        const pDep = permisosMap[cDep] && permisosMap[cDep][idSub] ? permisosMap[cDep][idSub] : { ver: 0, editar: 0, eliminar: 0 };

                        // Si el nivel de permiso almacenado es 4, marcamos todos los checkboxes por defecto
                        const esNivel4 = Number(pDep.nivper || pDep.ver) === 4 || (Number(pDep.ver) === 1 && Number(pDep.editar) === 1 && Number(pDep.eliminar) === 1);

                        const chkVer = esNivel4 || Number(pDep.ver) === 1 ? 'checked' : '';
                        const chkEditar = esNivel4 || Number(pDep.editar) === 1 ? 'checked' : '';
                        const chkEliminar = esNivel4 || Number(pDep.eliminar) === 1 ? 'checked' : '';

                        filasHTML += `
                            <tr class="hover:bg-stone-50 transition-all border-b border-stone-100">
                                <td class="p-3 pl-8 font-medium text-stone-600"><span>↳ ${nombreSub}</span></td>
                                <td class="p-3 text-center"><input type="checkbox" data-depto="${cDep}" data-submodulo="${idSub}" data-tipo="ver" ${chkVer} class="accent-[#249444] w-4 h-4 cursor-pointer chk-permiso"></td>
                                <td class="p-3 text-center"><input type="checkbox" data-depto="${cDep}" data-submodulo="${idSub}" data-tipo="editar" ${chkEditar} class="accent-[#249444] w-4 h-4 cursor-pointer chk-permiso"></td>
                                <td class="p-3 text-center pr-4"><input type="checkbox" data-depto="${cDep}" data-submodulo="${idSub}" data-tipo="eliminar" ${chkEliminar} class="accent-[#249444] w-4 h-4 cursor-pointer chk-permiso"></td>
                            </tr>
                        `;
                    });
                } else {
                    filasHTML += `
                        <tr class="border-b border-stone-100 bg-stone-50/40">
                            <td class="p-3 pl-8 text-stone-400 italic text-xs" colspan="4">Sin submódulos registrados para este departamento.</td>
                        </tr>
                    `;
                }
            });
        }

        // 4. Renderizamos la estructura completa incluyendo el checkbox de Administrador
        contenedorDinamico.innerHTML = `
            <div class="w-full space-y-6 bg-white p-6 md:p-8 rounded-2xl soft-shadow border border-[#249444]/10 mb-8 animate-fade-in">
                <div class="flex items-center justify-between pb-4 border-b border-stone-100">
                    <div class="flex items-center gap-3">
                        <div class="p-2.5 bg-[#f0fdf4] border border-[#c6f6d5] text-[#059669] rounded-xl flex items-center justify-center">
                            <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M19 11v6'/><path d='M19 13h2'/><path d='M2 21a8 8 0 0 1 12.868-6.349'/><circle cx='10' cy='8' r='5'/><circle cx='19' cy='19' r='2'/></svg>
                        </div>
                        <div><h3 class="font-black text-stone-800 text-lg uppercase tracking-wide">Permisos</h3></div>
                    </div>
                    
                    <!-- Checkbox Administrador General -->
                    <div class="flex items-center gap-2 bg-stone-50 px-4 py-2 rounded-xl border border-stone-200">
                        <input type="checkbox" id="chk-admin-general" onchange="togglePermisosAdministrador(this)" class="accent-[#249444] w-4 h-4 cursor-pointer">
                        <label for="chk-admin-general" class="text-xs font-bold text-stone-700 uppercase cursor-pointer select-none">Administrador (Todos los permisos)</label>
                    </div>
                </div>

                <div class="rounded-xl border border-stone-200 overflow-hidden shadow-sm">
                    <div class="p-4 border-b border-stone-100 bg-white">
                        <p class="text-xs text-stone-500">Editando permisos para: <span class="font-bold text-stone-800">${nombreColaborador}</span> (No. Empleado: ${noEmp})</p>
                    </div>
                    <div class="max-h-[500px] overflow-y-auto custom-scrollbar">
                        <table class="w-full text-left border-collapse text-xs">
                            <thead class="sticky top-0 z-10 bg-stone-100">
                                <tr class="text-stone-600 font-bold border-b border-stone-200 text-[11px]">
                                    <th class="p-3 pl-4">DEPARTAMENTO / SUBMÓDULO (SHEETS)</th>
                                    <th class="p-3 text-center">VER / LEER</th>
                                    <th class="p-3 text-center">CREAR / EDITAR</th>
                                    <th class="p-3 text-center pr-4">ELIMINAR</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-stone-100 text-stone-700">${filasHTML}</tbody>
                        </table>
                    </div>
                </div>
                <div class="flex items-center gap-3 pt-2">
                    <button onclick="guardarMatrizPermisosSis('${noEmp}')" class="bg-[#249444] hover:bg-[#1e7a37] text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all shadow-sm">Guardar</button>
                    <button onclick="cargarPermisosSis()" class="bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold px-6 py-2.5 rounded-xl transition-all">Cancelar</button>
                </div>
            </div>
        `;

        actualizarEstadoCheckboxAdminGeneral();

    } catch (err) {
        console.error("❌ Error al abrir matriz de permisos:", err);
        contenedorDinamico.innerHTML = `<div class="p-6 text-center text-red-500 text-xs">Error al cargar los datos: ${err.message}</div>`;
    }
}

// ==========================================
// LÓGICA DE NEGOCIO Y MARCADO
// ==========================================

function togglePermisosAdministrador(masterCheckbox) {
    const checkboxes = document.querySelectorAll('.chk-permiso');
    checkboxes.forEach(chk => {
        chk.checked = masterCheckbox.checked;
    });
}

function actualizarEstadoCheckboxAdminGeneral() {
    const checkboxes = document.querySelectorAll('.chk-permiso');
    const chkAdmin = document.getElementById('chk-admin-general');
    if (!chkAdmin || checkboxes.length === 0) return;

    let todosMarcados = true;
    checkboxes.forEach(chk => {
        if (!chk.checked) todosMarcados = false;
    });

    chkAdmin.checked = todosMarcados;
}

// ==========================================
// GUARDAR PERMISOS - SISPER CORE (FORZANDO NIVEL 4 SI ES ADMIN)
// ==========================================

async function guardarMatrizPermisosSis(noEmp) {
    const btnGuardar = document.querySelector(`button[onclick*="guardarMatrizPermisosSis('${noEmp}')"]`);
    let contenidoOriginalBtn = "";

    if (btnGuardar) {
        contenidoOriginalBtn = btnGuardar.innerHTML;
        btnGuardar.disabled = true;
        btnGuardar.className = "bg-[#249444]/70 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-not-allowed";
        btnGuardar.innerHTML = `
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Guardando...
        `;
    }

    const chkAdminGeneral = document.getElementById('chk-admin-general');
    const esAdminActivo = chkAdminGeneral && chkAdminGeneral.checked;

    const checkboxes = document.querySelectorAll('.chk-permiso');
    const permisosEstructura = {};

    // 1. Primero construimos o mapeamos todos los submódulos limpiamente
    checkboxes.forEach(chk => {
        const depto = chk.getAttribute('data-depto');
        const submodulo = chk.getAttribute('data-submodulo');
        const tipo = chk.getAttribute('data-tipo'); // 'ver', 'editar', 'eliminar'

        if (!permisosEstructura[depto]) {
            permisosEstructura[depto] = {};
        }
        if (!permisosEstructura[depto][submodulo]) {
            permisosEstructura[depto][submodulo] = { ver: 0, editar: 0, eliminar: 0, nivper: 1 };
        }

        // Asignamos el valor del checkbox correspondiente
        permisosEstructura[depto][submodulo][tipo] = chk.checked ? 1 : 0;
    });

    // 2. Si el Administrador general está activo, barremos toda la estructura y forzamos NivPer a 4
    Object.keys(permisosEstructura).forEach(depto => {
        Object.keys(permisosEstructura[depto]).forEach(submodulo => {
            // Si es admin activo, forzamos nivper a 4, de lo contrario calculamos según los checks
            if (esAdminActivo) {
                permisosEstructura[depto][submodulo].ver = 1;
                permisosEstructura[depto][submodulo].editar = 1;
                permisosEstructura[depto][submodulo].eliminar = 1;
                permisosEstructura[depto][submodulo].nivper = 4; // <--- El Core define que es 4
            } else {
                const v = permisosEstructura[depto][submodulo].ver;
                const ed = permisosEstructura[depto][submodulo].editar;
                const el = permisosEstructura[depto][submodulo].eliminar;

                // <--- El Core define el nivel exacto (1, 2, 3 o 0)
                if (el === 1) {
                    permisosEstructura[depto][submodulo].nivper = 3;
                } else if (ed === 1) {
                    permisosEstructura[depto][submodulo].nivper = 2;
                } else if (v === 1) {
                    permisosEstructura[depto][submodulo].nivper = 1;
                } else {
                    permisosEstructura[depto][submodulo].nivper = 0;
                }
            }
        });
    });

    const payload = {
        numEmp: noEmp,
        permisos: permisosEstructura
    };

    try {
        console.log("💾 [SISPER] Guardando permisos con NivPer forzado:", payload);

        if (typeof FetchAPI === 'function') {
            await FetchAPI('guardarPermisos', payload);
        } else if (typeof google !== 'undefined' && google.script && google.script.run) {
            await new Promise((resolve, reject) => {
                google.script.run
                    .withSuccessHandler(resolve)
                    .withFailureHandler(reject)
                    .guardarPermisosEnSheet(payload);
            });
        }

        alert("¡Permisos actualizados correctamente para el colaborador!");

        if (typeof cargarPermisosSis === 'function') {
            cargarPermisosSis();
        }
    } catch (err) {
        console.error("❌ Error al guardar permisos:", err);
        alert("Error al guardar los permisos: " + (err.message || err));

        if (btnGuardar) {
            btnGuardar.disabled = false;
            btnGuardar.className = "bg-[#249444] hover:bg-[#1e7a37] text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2";
            btnGuardar.innerHTML = contenidoOriginalBtn;
        }
    }
}

window.guardarMatrizPermisosSis = guardarMatrizPermisosSis;

// Control de selección en cascada y actualización del admin general
document.addEventListener('change', function (e) {
    const chk = e.target;
    if (!chk.classList.contains('chk-permiso')) return;

    const fila = chk.closest('tr');
    if (fila) {
        const checkboxes = fila.querySelectorAll('input.chk-permiso');
        if (checkboxes.length >= 3) {
            const chkVer = checkboxes[0];
            const chkEditar = checkboxes[1];
            const chkEliminar = checkboxes[2];

            if (chk === chkEliminar && chk.checked) {
                chkEditar.checked = true;
                chkVer.checked = true;
            } else if (chk === chkEditar && chk.checked) {
                chkVer.checked = true;
            } else if (chk === chkVer && !chk.checked) {
                chkEditar.checked = false;
                chkEliminar.checked = false;
            }
        }
    }

    actualizarEstadoCheckboxAdminGeneral();
});

// Exportaciones globales
window.guardarMatrizPermisosSis = guardarMatrizPermisosSis;
window.abrirMatrizPermisosUsuario = abrirMatrizPermisosUsuario;
window.togglePermisosAdministrador = togglePermisosAdministrador;