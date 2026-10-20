// ==========================================
// MÓDULO DE PERMISOS - SISPER CORE
// ==========================================

async function invocarBackendSis(action, payload = {}) {
    try {
        // Usamos la conexión global oficial establecida en api.js
        if (typeof window.callAppsScript === 'function') {
            return await window.callAppsScript(action, payload);
        }
        throw new Error("La función global callAppsScript no está disponible.");
    } catch (err) {
        console.error(`❌ Error en invocarBackendSis [${action}]:`, err);
        throw err;
    }
}

function renderizarTarjetasPermisosSis(empleados) {
    const tbody = document.getElementById('grid-permisos-empleados');
    if (!tbody) return;

    if (!empleados || empleados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-stone-400">No se encontraron colaboradores registrados.</td></tr>`;
        return;
    }

    // Inicializar mapas de caché si no existen
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
        window._catDepartamentos.forEach(d => {
            const nomCor = String(d.SRIModNomC || d.nomCorDep || '').trim();
            const nomLargo = d.SRIModNom || d.nomDep || d.nombre || '';
            if (nomCor) window._mapDeptosCache[nomCor] = nomLargo;
        });
    }
    if (!window._mapPuestosCache && window._catPuestos) {
        window._mapPuestosCache = {};
        window._catPuestos.forEach(p => {
            const k = String(p.SRIPrtoId || p.SRIPtoId || p.NumPto || p.clave || '').trim();
            const v = p.SRIPtoDesc || p.NomPto || p.nombre || '';
            if (k) window._mapPuestosCache[k] = v;
        });
    }

    let html = "";
    empleados.forEach(emp => {
        // Mapeo unificado para leer tanto de SQL como de objetos genéricos
        const cReg = String(emp.SRIRegId || emp.reg || emp.REG || '').trim();
        const cCentro = String(emp.SRICenId || emp.centro || emp.CENTRO || '').trim();
        const numEmp = String(emp.SRIEmpNum || emp.SRIPerNumE || emp.numEmp || emp.noEmp || '').trim();
        const nombre = emp.SRIEmpNom || emp.SRIPerNomE || emp.nombre || emp.NOMBRE || "SIN NOMBRE";

        const cNumPto = String(emp.SRIPtoId || emp.NumPto || emp.puesto || '').trim();
        let puestoVisual = cNumPto;
        if (cNumPto && window._mapPuestosCache?.[cNumPto]) {
            puestoVisual = window._mapPuestosCache[cNumPto];
        }

        const cDepto = String(emp.SRIModNomC || emp.NomCorDep || emp.depto || '').trim();
        let deptoVisual = cDepto;
        if (cDepto && window._mapDeptosCache?.[cDepto]) {
            deptoVisual = window._mapDeptosCache[cDepto];
        }

        const regTexto = window._mapRegsCache?.[cReg] ? `${cReg} - ${window._mapRegsCache[cReg]}` : (cReg || "100");
        const centroTexto = window._mapCentrosCache?.[cCentro] ? `${cCentro} - ${window._mapCentrosCache[cCentro]}` : (cCentro || "N/A");

        html += `
            <tr class="hover:bg-stone-50/80 transition-all border-b border-stone-100">
                <td class="p-3 font-mono text-stone-600">${regTexto}</td>
                <td class="p-3 font-mono text-stone-600">${centroTexto}</td>
                <td class="p-3 font-mono text-stone-600 text-center">${numEmp}</td>
                <td class="p-3 font-bold text-[#249444] uppercase">
                    <button type="button" onclick="abrirMatrizPermisosUsuario('${nombre.replace(/'/g, "\\\'")}', '${numEmp}')" class="hover:underline text-left cursor-pointer focus:outline-none">
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

async function cargarDatosPermisosConCatalogos() {
    const tbody = document.getElementById('grid-permisos-empleados');

    try {
        if (!window._catPuestos || window._catPuestos.length === 0 || !window._catDepartamentos || window._catDepartamentos.length === 0) {
            const dataSys = await invocarBackendSis('obtenerDatosSistema', {});
            window._catDepartamentos = dataSys?.departamentos || dataSys?.deptos || [];
            window._catPuestos = dataSys?.puestos || dataSys?.catPuestos || [];
        }

        let data = window._empleadosCache || [];
        if (!data || data.length === 0) {
            const resEmp = await invocarBackendSis('obtenerPersonal');
            data = Array.isArray(resEmp) ? resEmp : (resEmp?.empleados || resEmp?.data || []);
            window._empleadosCache = data;
        }

        window.listaEmpleadosPermisosCache = window._empleadosCache;
        renderizarTarjetasPermisosSis(window.listaEmpleadosPermisosCache);

    } catch (err) {
        console.error("❌ Error en carga:", err);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-red-500">Error al conectar con la Base de Datos / Servidor: ${err.message || 'Error de red'}</td></tr>`;
        }
    }
}

function renderizarTarjetasPermisosSis(empleados) {
    const tbody = document.getElementById('grid-permisos-empleados');
    if (!tbody) return;

    if (!empleados || empleados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-stone-400">No se encontraron colaboradores registrados.</td></tr>`;
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
        if (cNumPto && window._mapPuestosCache?.[cNumPto]) {
            puestoVisual = window._mapPuestosCache[cNumPto];
        }

        const cNomCorDep = String(emp.NomCorDep || emp.nomCorDep || emp.depto || '').trim();
        let deptoVisual = cNomCorDep;
        if (cNomCorDep && window._mapDeptosCache?.[cNomCorDep]) {
            deptoVisual = window._mapDeptosCache[cNomCorDep];
        }

        html += `
            <tr class="hover:bg-stone-50/80 transition-all border-b border-stone-100">
                <td class="p-3 font-mono text-stone-600">${reg}</td>
                <td class="p-3 font-mono text-stone-600">${centro}</td>
                <td class="p-3 font-mono text-stone-600">${numEmp}</td>
                <td class="p-3 font-bold text-[#249444] uppercase">
                    <button type="button" onclick="abrirMatrizPermisosUsuario('${nombre.replace(/'/g, "\\\'")}', '${numEmp}')" class="hover:underline text-left cursor-pointer focus:outline-none">
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

async function abrirMatrizPermisosUsuario(nombreColaborador, noEmp) {
    const contenedorDinamico = document.getElementById('contenido-submodulo-dinamico');
    if (!contenedorDinamico) return;

    contenedorDinamico.className = "col-span-1 sm:col-span-2 md:col-span-3 space-y-6 animate-fade-in";

    contenedorDinamico.innerHTML = `
        <div class="w-full space-y-6 bg-white p-8 rounded-2xl soft-shadow border border-[#249444]/10 mb-8 text-center">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#249444] border-t-transparent"></div>
            <p class="text-xs text-stone-500 font-bold mt-2">Cargando matriz de permisos y submódulos...</p>
        </div>
    `;

    try {
        if (!window.allSubModulosData || window.allSubModulosData.length === 0) {
            const dataSys = await invocarBackendSis('obtenerDatosSistema', {});
            window._catDepartamentos = dataSys?.departamentos || dataSys?.deptos || [];
            window.allSubModulosData = dataSys?.submodulos || dataSys?.subModulos || [];
        }

        const respuestaPermisos = await invocarBackendSis('obtenerPermisosColaborador', { numEmp: String(noEmp).trim() });
        const permisosMap = respuestaPermisos?.permisos || respuestaPermisos || {};

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

                        const pDep = permisosMap?.[cDep]?.[idSub] || permisosMap?.[idSub] || { ver: 0, editar: 0, eliminar: 0 };
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

        contenedorDinamico.innerHTML = `
            <div class="w-full space-y-6 bg-white p-6 md:p-8 rounded-2xl soft-shadow border border-[#249444]/10 mb-8 animate-fade-in">
                <div class="flex items-center justify-between pb-4 border-b border-stone-100">
                    <div class="flex items-center gap-3">
                        <div class="p-2.5 bg-[#f0fdf4] border border-[#c6f6d5] text-[#059669] rounded-xl flex items-center justify-center">
                            <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M19 11v6'/><path d='M19 13h2'/><path d='M2 21a8 8 0 0 1 12.868-6.349'/><circle cx='10' cy='8' r='5'/><circle cx='19' cy='19' r='2'/></svg>
                        </div>
                        <div><h3 class="font-black text-stone-800 text-lg uppercase tracking-wide">Permisos</h3></div>
                    </div>
                    
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
                                    <th class="p-3 pl-4">DEPARTAMENTO / SUBMÓDULO</th>
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

    checkboxes.forEach(chk => {
        const depto = chk.getAttribute('data-depto');
        const submodulo = chk.getAttribute('data-submodulo');
        const tipo = chk.getAttribute('data-tipo');

        if (!permisosEstructura[depto]) {
            permisosEstructura[depto] = {};
        }
        if (!permisosEstructura[depto][submodulo]) {
            permisosEstructura[depto][submodulo] = { ver: 0, editar: 0, eliminar: 0, nivper: 1 };
        }

        permisosEstructura[depto][submodulo][tipo] = chk.checked ? 1 : 0;
    });

    Object.keys(permisosEstructura).forEach(depto => {
        Object.keys(permisosEstructura[depto]).forEach(submodulo => {
            if (esAdminActivo) {
                permisosEstructura[depto][submodulo].ver = 1;
                permisosEstructura[depto][submodulo].editar = 1;
                permisosEstructura[depto][submodulo].eliminar = 1;
                permisosEstructura[depto][submodulo].nivper = 4;
            } else {
                const v = permisosEstructura[depto][submodulo].ver;
                const ed = permisosEstructura[depto][submodulo].editar;
                const el = permisosEstructura[depto][submodulo].eliminar;

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
        console.log("💾 [SISPER] Guardando permisos hacia servidor/SQL:", payload);
        await invocarBackendSis('guardarPermisos', payload);

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
window.renderizarListadoPermisosSis = renderizarListadoPermisosSis;
window.abrirMatrizPermisosUsuario = abrirMatrizPermisosUsuario;
window.guardarMatrizPermisosSis = guardarMatrizPermisosSis;
window.togglePermisosAdministrador = togglePermisosAdministrador;