// ==========================================
// MÓDULO DE PERMISOS - SISPER CORE
// ==========================================

async function invocarBackendSis(action, payload = {}) {
    try {
        if (typeof window.callAppsScript === 'function') {
            return await window.callAppsScript(action, payload);
        }
        throw new Error("La función global callAppsScript no está disponible.");
    } catch (err) {
        console.error(`❌ Error en invocarBackendSis [${action}]:`, err);
        throw err;
    }
}

// Variable de control para evitar llamadas simultáneas duplicadas
let _cargandoPermisosEnCurso = false;

async function cargarDatosPermisosConCatalogos() {
    if (_cargandoPermisosEnCurso) {
        return;
    }

    _cargandoPermisosEnCurso = true;
    const tbody = document.getElementById('tabla-personal-body');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-stone-500 italic">Procesando ${window._empleadosCache?.length || '151'} registros de personal...</td></tr>`;
    }

    try {
        // 1. Cargar catálogos generales del sistema usando los nombres exactos del backend
        if (!window._catPuestos || window._catPuestos.length === 0 || !window._catDepartamentos || window._catDepartamentos.length === 0) {
            const dataSys = await invocarBackendSis('obtenerDatosSistema', {});
            window._catDepartamentos = dataSys?.departamentos || dataSys?.deptos || [];
            window._catPuestos = dataSys?.puestos || dataSys?.catPuestos || [];
            // 🟢 Usando las propiedades reales que expone tu Script.txt: 'regionales' y 'campos'
            window._catRegs = dataSys?.regionales || dataSys?.regiones || dataSys?.regs || [];
            window._catCentros = dataSys?.campos || dataSys?.centros || dataSys?.catCentros || [];
        }

        // 2. Obtener listado de personal si no está en caché
        let data = window._empleadosCache || [];
        if (!data || data.length === 0) {
            let resEmp = null;
            try {
                resEmp = await invocarBackendSis('obtenerPersonalSQL');
            } catch (e1) {
                resEmp = await invocarBackendSis('obtenerPersonal');
            }

            data = Array.isArray(resEmp) ? resEmp : (resEmp?.empleados || resEmp?.data || resEmp?.resultado || []);
            window._empleadosCache = data;
        }

        window.listaEmpleadosPermisosCache = window._empleadosCache;

        // 3. Renderizado seguro en pantalla
        if (window.listaEmpleadosPermisosCache && window.listaEmpleadosPermisosCache.length > 0) {
            if (typeof window.renderizarTarjetasPermisosSis === 'function') {
                window.renderizarTarjetasPermisosSis(window.listaEmpleadosPermisosCache);
            } else {
                throw new Error("La función renderizarTarjetasPermisosSis no está disponible en window.");
            }
        } else {
            if (tbody) {
                tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-stone-400 italic text-xs">No se encontraron registros para mostrar.</td></tr>`;
            }
        }

    } catch (err) {
        console.error("❌ Error crítico en cargarDatosPermisosConCatalogos:", err);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-red-500 text-xs font-bold">Error al procesar los datos: ${err.message || 'Error desconocido'}</td></tr>`;
        }
    } finally {
        // Liberar el candado al terminar (éxito o error)
        _cargandoPermisosEnCurso = false;
    }
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
        const texto = `${emp.SRIRegId || ''} ${emp.SRICenId || ''} ${emp.SRIEmpNum || ''} ${emp.SRIEmpNom || ''} ${emp.SRIPtoId || ''} ${emp.SRIModNomC || ''}`.toUpperCase();
        return texto.includes(filtro);
    });

    renderizarTarjetasPermisosSis(filtrados);
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

        if (!permisosEstructura[depto]) permisosEstructura[depto] = {};
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

                if (el === 1) permisosEstructura[depto][submodulo].nivper = 3;
                else if (ed === 1) permisosEstructura[depto][submodulo].nivper = 2;
                else if (v === 1) permisosEstructura[depto][submodulo].nivper = 1;
                else permisosEstructura[depto][submodulo].nivper = 0;
            }
        });
    });

    const payload = { numEmp: noEmp, permisos: permisosEstructura };

    try {
        // 🟢 Apuntando correctamente a la función del backend unificada para el submódulo
        await invocarBackendSis('guardarMatrizSisPermisos', payload);
        alert("¡Permisos actualizados correctamente para el colaborador!");
        if (typeof cargarPermisosSis === 'function') cargarPermisosSis();
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