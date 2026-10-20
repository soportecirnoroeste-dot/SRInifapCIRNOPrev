// ==========================================
// MÓDULO DE PERMISOS - SISPER FORM (VISTAS)
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
                <div><h3 class="font-black text-stone-800 text-lg uppercase tracking-wide">Permisos</h3></div>
            </div>

            <div id="contenedor-gestion-permisos" class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-stone-50 p-4 rounded-xl border border-stone-200">
                <div><h4 class="font-bold text-stone-800 text-sm">Gestión de Permisos</h4></div>
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
                        <table class="w-full border-collapse text-xs min-w-[1000px] table-fixed">
                            <thead class="bg-stone-100 font-bold text-stone-700 sticky top-0 z-10 border-b border-stone-200">
                                <tr>
                                    <th class="p-3 w-[18%] text-left border-b border-stone-200">REGIÓN</th>
                                    <th class="p-3 w-[25%] text-left border-b border-stone-200">CENTRO</th>
                                    <th class="p-3 w-[10%] text-center border-b border-stone-200">NO. EMP</th>
                                    <th class="p-3 w-[20%] text-left border-b border-stone-200">NOMBRE</th>
                                    <th class="p-3 w-[15%] text-left border-b border-stone-200">PUESTO</th>
                                    <th class="p-3 w-[12%] text-left border-b border-stone-200">DEPARTAMENTO</th>
                                </tr>
                            </thead>
                            <tbody id="tabla-personal-body" class="divide-y divide-stone-100">
                                <tr><td colspan="6" class="p-6 text-center text-stone-400 italic">SINCRONIZANDO DATOS...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        cargarDatosPermisosConCatalogos();
    }
}

// ==========================================
// MÓDULO DE PERMISOS - SISPER FORM (VISTAS)
// ==========================================
function renderizarTarjetasPermisosSis(empleados) {
    const tbody = document.getElementById('tabla-personal-body');
    if (!tbody) return;

    if (!empleados || empleados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-stone-400">No se encontraron colaboradores registrados.</td></tr>`;
        return;
    }

    // 🟢 1. Construcción de mapas de catálogo (admite cualquier nombre de propiedad)
    if ((!window._mapRegsCache || Object.keys(window._mapRegsCache).length === 0) && window._catRegs) {
        window._mapRegsCache = {};
        window._catRegs.forEach(r => {
            const k = String(r.SRIRegId || r.regId || r.RegId || r.id || '').trim();
            const v = r.SRIRegNom || r.SRIRegDesc || r.regNom || r.regDesc || r.NomReg || r.nombre || '';
            if (k) window._mapRegsCache[k] = v;
        });
    }

    if ((!window._mapCentrosCache || Object.keys(window._mapCentrosCache).length === 0) && window._catCentros) {
        window._mapCentrosCache = {};
        window._catCentros.forEach(c => {
            const k = String(c.SRICenId || c.cenId || c.CenId || c.id || '').trim();
            const v = c.SRICenNom || c.SRICenDesc || c.cenNom || c.cenDesc || c.NomCen || c.nombre || '';
            if (k) window._mapCentrosCache[k] = v;
        });
    }

    if ((!window._mapDeptosCache || Object.keys(window._mapDeptosCache).length === 0) && window._catDepartamentos) {
        window._mapDeptosCache = {};
        window._catDepartamentos.forEach(d => {
            const nomCor = String(d.SRIModNomC || d.claveDep || '').trim();
            const nomLargo = d.SRIModNom || d.SRIModNomL || d.nomDep || d.nombre || '';
            if (nomCor) window._mapDeptosCache[nomCor] = nomLargo;
        });
    }

    if ((!window._mapPuestosCache || Object.keys(window._mapPuestosCache).length === 0) && window._catPuestos) {
        window._mapPuestosCache = {};
        window._catPuestos.forEach(p => {
            const k = String(p.SRIPrtoId || p.SRIPtoId || p.NumPto || p.clave || '').trim();
            const v = p.SRIPrtoDesc || p.SRIPtoDesc || p.NomPto || p.nombre || '';
            if (k) window._mapPuestosCache[k] = v;
        });
    }

    let html = "";
    empleados.forEach(emp => {
        const cReg = String(emp.SRIRegId || emp.regId || '').trim();
        const cCentro = String(emp.SRICenId || emp.cenId || '').trim();
        const numEmp = String(emp.SRIEmpNum || emp.SRIPerNumE || '').trim();
        const nombre = emp.SRIEmpNom || emp.SRIPerNomE || "SIN NOMBRE";

        // 🟢 Resolver Nombre de Región (Prioridad: Mapa -> Objeto Empleado -> Solo Código)
        const nomReg = window._mapRegsCache?.[cReg] || emp.SRIRegNom || emp.SRIRegDesc || emp.regNom || '';
        const regTexto = nomReg ? `${cReg} - ${nomReg}` : cReg;

        // 🟢 Resolver Nombre de Centro (Prioridad: Mapa -> Objeto Empleado -> Solo Código)
        const nomCentro = window._mapCentrosCache?.[cCentro] || emp.SRICenNom || emp.SRICenDesc || emp.cenNom || '';
        const centroTexto = nomCentro ? `${cCentro} - ${nomCentro}` : cCentro;

        // 🟢 Resolver Puesto
        const cNumPto = String(emp.SRIPtoId || emp.SRIPrtoId || '').trim();
        let puestoVisual = window._mapPuestosCache?.[cNumPto] || emp.SRIPtoDesc || emp.SRIPrtoDesc || cNumPto;

        // 🟢 Resolver Departamento
        const cDepto = String(emp.SRIModNomC || '').trim();
        let deptoVisual = window._mapDeptosCache?.[cDepto] || emp.SRIModNom || cDepto || 'N/A';

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
                <td class="p-3 text-stone-600 uppercase">${deptoVisual}</td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// 🟢 EXPORTACIONES OBLIGATORIAS AL FINAL DE SisPerForm.js
window.renderizarListadoPermisosSis = renderizarListadoPermisosSis;
window.renderizarTarjetasPermisosSis = renderizarTarjetasPermisosSis;
window.abrirMatrizPermisosUsuario = abrirMatrizPermisosUsuario;

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
        if (!window.datosSistema || !window.datosSistema.departamentos || !window.datosSistema.submodulos) {
            const dataSys = await invocarBackendSis('obtenerDatosSistema', {});
            window._catDepartamentos = dataSys?.departamentos || dataSys?.deptos || [];
            window.allSubModulosData = dataSys?.submodulos || dataSys?.subModulos || [];
            window.datosSistema = dataSys;
        }

        // 🟢 1. Extraer adecuadamente el mapa de permisos desde la propiedad .permisos
        const resPermisos = await invocarBackendSis('obtenerMatrizSisPermisos', { numEmp: String(noEmp).trim() });
        const permisosMap = resPermisos?.permisos || resPermisos || {};

        const deptos = window._catDepartamentos || [];
        const submodulos = window.allSubModulosData || [];
        let filasHTML = "";

        if (deptos.length > 0) {
            deptos.forEach(dep => {
                const idMod = String(dep.SRIModId || dep.claveDep || '').trim();
                const nombreDep = dep.SRIModNom || dep.nomDep || dep.nombre || `Departamento ${idMod}`;
                
                // Filtrar submódulos comparando numéricamente / en texto limpio
                const subsDelDepto = submodulos.filter(sub => String(sub.SRIModId || sub.ClaveDep || '').trim() === idMod);

                filasHTML += `
                    <tr class="bg-stone-50 font-bold text-stone-800 border-t border-stone-200">
                        <td class="p-3 pl-4 uppercase tracking-wider" colspan="5">📁 Departamento: ${nombreDep}</td>
                    </tr>
                `;

                if (subsDelDepto.length > 0) {
                    subsDelDepto.forEach(sub => {
                        const nombreSub = sub.SRISubMDes || sub.SModNom || sub.sModNom || sub.nombre || 'Submódulo';
                        const idSub = String(sub.SRISubMId || sub.SModClave || '').trim();

                        // 🟢 2. Buscar en permisosMap[idMod][idSub]
                        const pData = permisosMap?.[idMod]?.[idSub] || permisosMap?.[idSub] || 0;
                        
                        let nivPer = 0;
                        if (typeof pData === 'object' && pData !== null) {
                            nivPer = Number(pData.nivper || pData.nivPer || pData.ver || 0);
                        } else {
                            nivPer = Number(pData) || 0;
                        }

                        // 🟢 3. Activar casillas según los niveles (1=Ver, 2=Agregar, 3=Editar, 4=Eliminar)
                        const chkVer = nivPer >= 1 ? 'checked' : '';
                        const chkAgregar = nivPer >= 2 ? 'checked' : '';
                        const chkEditar = nivPer >= 3 ? 'checked' : '';
                        const chkEliminar = nivPer >= 4 ? 'checked' : '';

                        filasHTML += `
                            <tr class="hover:bg-stone-50 transition-all border-b border-stone-100">
                                <td class="p-3 pl-8 font-medium text-stone-600"><span>↳ ${nombreSub}</span></td>
                                <td class="p-3 text-center"><input type="checkbox" data-depto="${idMod}" data-submodulo="${idSub}" data-tipo="ver" ${chkVer} class="accent-[#249444] w-4 h-4 cursor-pointer chk-permiso"></td>
                                <td class="p-3 text-center"><input type="checkbox" data-depto="${idMod}" data-submodulo="${idSub}" data-tipo="agregar" ${chkAgregar} class="accent-[#249444] w-4 h-4 cursor-pointer chk-permiso"></td>
                                <td class="p-3 text-center"><input type="checkbox" data-depto="${idMod}" data-submodulo="${idSub}" data-tipo="editar" ${chkEditar} class="accent-[#249444] w-4 h-4 cursor-pointer chk-permiso"></td>
                                <td class="p-3 text-center pr-4"><input type="checkbox" data-depto="${idMod}" data-submodulo="${idSub}" data-tipo="eliminar" ${chkEliminar} class="accent-[#249444] w-4 h-4 cursor-pointer chk-permiso"></td>
                            </tr>
                        `;
                    });
                } else {
                    filasHTML += `
                        <tr class="border-b border-stone-100 bg-stone-50/40">
                            <td class="p-3 pl-8 text-stone-400 italic text-xs" colspan="5">Sin submódulos registrados para este departamento.</td>
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
                        <label for="chk-admin-general" class="text-xs font-bold text-stone-700 uppercase cursor-pointer select-none">Administrador (Todos los permisos Nivel 5)</label>
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
                                    <th class="p-3 text-center">VER (N1)</th>
                                    <th class="p-3 text-center">AGREGAR (N2)</th>
                                    <th class="p-3 text-center">EDITAR (N3)</th>
                                    <th class="p-3 text-center pr-4">ELIMINAR / ADMIN MÓDULO (N4)</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-stone-100 text-stone-700">${filasHTML}</tbody>
                        </table>
                    </div>
                </div>
                <div class="flex items-center gap-3 pt-2">
                    <button onclick="guardarMatrizPermisosSis('${noEmp}')" class="bg-[#249444] hover:bg-[#1e7a37] text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer">Guardar</button>
                    <button onclick="cargarPermisosSis()" class="bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold px-6 py-2.5 rounded-xl transition-all cursor-pointer">Cancelar</button>
                </div>
            </div>
        `;

        actualizarEstadoCheckboxAdminGeneral();

    } catch (err) {
        console.error("❌ Error al abrir matriz de permisos:", err);
        contenedorDinamico.innerHTML = `<div class="p-6 text-center text-red-500 text-xs">Error al cargar los datos: ${err.message}</div>`;
    }
}

