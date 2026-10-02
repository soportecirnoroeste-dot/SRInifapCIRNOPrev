// ==========================================
// CONTROL DE SPINNER / OVERLAY DE CARGA
// ==========================================
function mostrarCarga() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.style.display = 'flex';
}

function ocultarCarga() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.style.display = 'none';
}

// ==========================================
// 0. FUNCIÓN AUXILIAR DE MAYÚSCULAS
// ==========================================
function convertirObjetoAMayusculas(datos) {
    let datosMayus = {};
    for (let key in datos) {
        if (typeof datos[key] === 'string' && key !== 'pass' && key !== 'email') {
            datosMayus[key] = datos[key].toUpperCase();
        } else {
            datosMayus[key] = datos[key];
        }
    }
    return datosMayus;
}

// ==========================================
// 1. CONTROLADOR CON DEPURACIÓN EN CONSOLA
// ==========================================
const AuthGuard = {
    verificarAcceso: () => {
        const usuarioSesion = localStorage.getItem('usuario_sesion');
        const paginaActual = window.location.pathname;
        const queryActual = window.location.search;
        const rutaCompletaActual = paginaActual + queryActual;

        if (!usuarioSesion && !paginaActual.includes('login.html')) {
            console.warn("Redirigiendo a login: No hay sesión activa.");
            window.location.href = 'login.html';
        } else if (usuarioSesion && paginaActual.includes('login.html')) {
            console.warn("Redirigiendo a index: Ya hay sesión activa.");
            window.location.href = 'index.html';
        } else {
            document.body.classList.add('auth-checked');

            const labelUser = document.getElementById('user-display-name');
            if (labelUser) {
                let nombreReal = 'Usuario';
                try {
                    const usuarioActivoObj = JSON.parse(localStorage.getItem('usuarioActivo') || '{}');
                    nombreReal = localStorage.getItem('session_userName') ||
                        usuarioActivoObj.userName ||
                        usuarioActivoObj.nombre ||
                        usuarioActivoObj.usuario ||
                        localStorage.getItem('nombre_usuario') ||
                        localStorage.getItem('usuario_sesion') ||
                        'Usuario';
                } catch (e) {
                    nombreReal = localStorage.getItem('session_userName') || localStorage.getItem('usuario_sesion') || 'Usuario';
                }
                labelUser.textContent = nombreReal;
            }

            if (!paginaActual.includes('login.html')) {
                sessionStorage.setItem('ultima_ruta_completa', rutaCompletaActual);

                if (paginaActual.includes('index.html') || paginaActual.endsWith('/')) {
                    SistemaGlobal.init();
                }
            }
        }
    }
};

// ==========================================
// 2. NÚCLEO CENTRAL DEL SISTEMA (CON CACHÉ Y FILTRO DE PERMISOS)
// ==========================================
const SistemaGlobal = {
    datos: null,

    async init() {
        mostrarCarga();

        const datosEnCache = localStorage.getItem('sistema_cache_datos');
        const tiempoCache = localStorage.getItem('sistema_cache_tiempo');
        const ahora = new Date().getTime();

        let datosReales = null;

        if (datosEnCache && tiempoCache && (ahora - tiempoCache < 30 * 60 * 1000)) {
            try {
                datosReales = JSON.parse(datosEnCache);
            } catch (e) {
                console.error("Error al leer la caché:", e);
            }
        }

        if (!datosReales) {
            try {
                datosReales = await callAppsScript("obtenerDatosSistema");
                this.guardarEnCache(datosReales);
            } catch (err) {
                console.error("Error al obtener datos del sistema:", err);
                ocultarCarga();
                return;
            }
        }

        let usuarioActivoObjTemp = {};
        try { usuarioActivoObjTemp = JSON.parse(localStorage.getItem('usuarioActivo') || '{}'); } catch(e){}

        const noEmp = String(
            localStorage.getItem('session_noEmp') || 
            usuarioActivoObjTemp.noEmpleado || 
            usuarioActivoObjTemp.SRIPerNumE || 
            usuarioActivoObjTemp.numEmp ||
            localStorage.getItem('usuario_sesion') || 
            ''
        ).trim();

        let permisosUsuario = {};
        if (noEmp) {
            try {
                permisosUsuario = await callAppsScript('obtenerPermisosColaborador', { numEmp: noEmp }) || {};
            } catch (e) {
                console.warn("No se pudieron cargar los permisos del empleado:", e);
            }
        }
        window.userPermisosCache = permisosUsuario;
        window.userNoEmpCache = noEmp; // Guardamos globalmente para evitar errores
        console.log("🔍 PERMISOS RECIBIDOS PARA NOEMP [" + noEmp + "]:", permisosUsuario);

        this.procesarRespuestaServidor(datosReales);
        ocultarCarga();
    },

    guardarEnCache(respuestaServidor) {
        const datosReales = {
            success: respuestaServidor.success !== undefined ? respuestaServidor.success : true,
            departamentos: respuestaServidor.departamentos || [],
            regionales: respuestaServidor.regionales || [],
            campos: respuestaServidor.campos || [],
            submodulos: respuestaServidor.submodulos || []
        };

        localStorage.setItem('sistema_cache_datos', JSON.stringify(datosReales));
        localStorage.setItem('sistema_cache_tiempo', new Date().getTime());
        window.allSubModulosData = datosReales.submodulos;
    },

    procesarRespuestaServidor(datosReales) {
        this.datos = datosReales || {};
        window.allSubModulosData = this.datos.submodulos || [];

        const todosLosDepartamentos = this.datos.departamentos || [];
        const todasLasRegionales = this.datos.regionales || [];
        let todosLosCampos = this.datos.campos || [];

        let usuarioActivoObj = {};
        try {
            usuarioActivoObj = JSON.parse(localStorage.getItem('usuarioActivo') || '{}');
        } catch (e) { }

        const noEmp = String(window.userNoEmpCache || usuarioActivoObj.noEmpleado || usuarioActivoObj.SRIPerNumE || '').trim();

        // Detección flexible de Regional
        let claveRegUsuario = String(
            usuarioActivoObj.SRIRegId ||
            usuarioActivoObj.claveReg ||
            usuarioActivoObj.regId ||
            localStorage.getItem('session_regId') ||
            ''
        ).trim();

        const areaUsuario = String(
            localStorage.getItem('session_area') ||
            usuarioActivoObj.area ||
            usuarioActivoObj.SRIModNomC ||
            usuarioActivoObj.modulo ||
            ''
        ).trim().toUpperCase();

        if (!claveRegUsuario && todasLasRegionales.length > 0) {
            const regionalEncontrada = todasLasRegionales.find(r => {
                const rId = String(r.SRIRegId || r.claveReg || r.regId || '').trim();
                const rNom = String(r.regional || r.nomCorto || '').trim().toUpperCase();
                return rId.toUpperCase() === areaUsuario || rNom === areaUsuario;
            });

            if (regionalEncontrada) {
                claveRegUsuario = String(regionalEncontrada.SRIRegId || regionalEncontrada.claveReg || regionalEncontrada.regId || '').trim();
            } else {
                const depEncontrado = todosLosDepartamentos.find(d => {
                    const dReg = String(d.SRIRegId || d.claveReg || '').trim();
                    const dNom = String(d.nomCorDep || d.NomCorDep || '').trim().toUpperCase();
                    return dNom === areaUsuario;
                });
                if (depEncontrado) {
                    claveRegUsuario = String(depEncontrado.SRIRegId || depEncontrado.claveReg || '').trim();
                } else {
                    claveRegUsuario = String(todasLasRegionales[0].SRIRegId || todasLasRegionales[0].claveReg || todasLasRegionales[0].regId || '').trim();
                }
            }
        }

        console.log("📍 Regional activa detectada:", claveRegUsuario);
        this.renderizarRegional(claveRegUsuario, todasLasRegionales);

        const departamentosDeLaRegional = todosLosDepartamentos.filter(dep => {
            const regDep = String(dep.SRIRegId || dep.claveReg || dep.regId || '').trim();
            return regDep.toLowerCase() === claveRegUsuario.toLowerCase();
        });

        if (todosLosCampos.length === 0 && departamentosDeLaRegional.length > 0) {
            const centrosUnicos = [...new Set(departamentosDeLaRegional.map(d => String(d.SRICenId || d.claveCentro || d.cenId || '')))];
            todosLosCampos = centrosUnicos.map(c => ({
                SRIRegId: claveRegUsuario,
                SRICenId: c,
                centro: `Centro ${c}`
            }));
            this.datos.campos = todosLosCampos;
        }

        this.renderizarFiltroCampos(todosLosCampos, claveRegUsuario);

        let permisosUsuario = window.userPermisosCache || {};
        let esAdminGeneral = false;
        const buscarNivelCuatro = (obj) => {
            if (!obj) return false;
            if (typeof obj === 'number' || typeof obj === 'string') {
                return Number(obj) === 4;
            }
            if (typeof obj === 'object') {
                for (let k in obj) {
                    if (k.toLowerCase().includes('niv') && Number(obj[k]) === 4) return true;
                    if (buscarNivelCuatro(obj[k])) return true;
                }
            }
            return false;
        };
        esAdminGeneral = buscarNivelCuatro(permisosUsuario) || buscarNivelCuatro(usuarioActivoObj) || (noEmp === "4398");
        console.log("👑 ¿Es Administrador General?:", esAdminGeneral);

        const selectFiltro = document.getElementById('filtro-campos-regional');
        if (selectFiltro) {
            if (esAdminGeneral) {
                selectFiltro.disabled = false;
                selectFiltro.removeAttribute('disabled');
                selectFiltro.classList.remove('bg-stone-100', 'cursor-not-allowed', 'opacity-80');
                selectFiltro.style.pointerEvents = 'auto';
                selectFiltro.style.backgroundColor = '#ffffff';
            } else {
                selectFiltro.disabled = true;
                selectFiltro.classList.add('bg-stone-100', 'cursor-not-allowed', 'opacity-80');
            }
        }

        const camposDeLaRegional = todosLosCampos.filter(c => {
            const regCampo = String(c.SRIRegId || c.claveReg || '').trim();
            return regCampo.toLowerCase() === claveRegUsuario.toLowerCase();
        });

        let claveCentroInicial = String(
            usuarioActivoObj.SRICenId ||
            usuarioActivoObj.centro ||
            usuarioActivoObj.cenId ||
            localStorage.getItem('centro_activo_actual') ||
            ''
        ).trim();

        const existeCentro = camposDeLaRegional.some(c => String(c.SRICenId || c.claveCentro || '').trim() === claveCentroInicial);
        if (!existeCentro && camposDeLaRegional.length > 0) {
            claveCentroInicial = String(camposDeLaRegional[0].SRICenId || camposDeLaRegional[0].claveCentro || '').trim();
        }

        if (claveCentroInicial) {
            localStorage.setItem('centro_activo_actual', claveCentroInicial);
            if (selectFiltro) selectFiltro.value = claveCentroInicial;
        }

        const departamentosFinales = claveCentroInicial 
            ? departamentosDeLaRegional.filter(dep => String(dep.SRICenId || dep.claveCentro || '').trim() === claveCentroInicial)
            : departamentosDeLaRegional;

        this.pintarTarjetasDepartamentos(departamentosFinales);
    },

    renderizarRegional(claveReg, regionales) {
        const infoRegional = regionales.find(r => {
            const rId = String(r.SRIRegId || r.claveReg || r.regId || '').trim();
            return rId.toLowerCase() === String(claveReg).toLowerCase();
        });
        
        // Apuntamos directamente a SRIRegNom y sus variantes de respaldo
        const nombreRegionalOficial = infoRegional ? 
            (infoRegional.SRIRegNom || infoRegional.regional || infoRegional.nombre || infoRegional.NomReg || "REGIONAL") : 
            (claveReg || "REGIONAL NO ENCONTRADA");

        const labelRegional = document.getElementById('user-regional-display');
        if (labelRegional) {
            labelRegional.textContent = `${claveReg} - ${nombreRegionalOficial}`;
        }
    },

    renderizarFiltroCampos(campos, claveReg) {
        const camposDeLaRegional = campos.filter(c => {
            const regC = String(c.SRIRegId || c.claveReg || '').trim();
            return regC.toLowerCase() === String(claveReg).toLowerCase();
        });
        const selectFiltro = document.getElementById('filtro-campos-regional');

        if (selectFiltro) {
            selectFiltro.innerHTML = '<option value="">Seleccionar campo</option>';
            camposDeLaRegional.forEach(campo => {
                const cId = String(campo.SRICenId || campo.claveCentro || campo.cenId || '').trim();
                
                // Apuntamos directamente a SRICenNom y sus variantes de respaldo
                const cNom = String(
                    campo.SRICenNom || 
                    campo.centro || 
                    campo.nombreCentro || 
                    campo.NomCentro || 
                    ''
                ).trim();

                selectFiltro.innerHTML += `<option value="${cId}">${cId}${cNom ? ' - ' + cNom : ''}</option>`;
            });
        }
    },

    pintarTarjetasDepartamentos(listaDepartamentos) {
        console.log("🔍 [DEBUG] 1. listaDepartamentos pasada por parámetro:", listaDepartamentos);
        console.log("🔍 [DEBUG] 2. window.allModulosData:", window.allModulosData);
        console.log("🔍 [DEBUG] 3. window.allSubModulosData:", window.allSubModulosData);

        const contenedorMenu = document.getElementById('menu-dinamico-departamentos');
        if (!contenedorMenu) {
            console.error("❌ [DEBUG] Error: No se encontró el elemento con id 'menu-dinamico-departamentos' en el DOM.");
            return;
        }

        let usuarioActivoObjTemp = {};
        try { 
            usuarioActivoObjTemp = JSON.parse(localStorage.getItem('usuarioActivo') || '{}'); 
        } catch(e) {}

        const noEmp = String(window.userNoEmpCache || usuarioActivoObjTemp.noEmpleado || usuarioActivoObjTemp.SRIPerNumE || '').trim();
        const permisosUsuario = window.userPermisosCache || {};
        let esAdminGeneral = (noEmp === "4398");

        const submodulosCrudos = window.allSubModulosData || (this.datos && this.datos.submodulos) || [];
        const submodulosTotales = submodulosCrudos.map(sub => ({
            SRIModId: String(sub.SRIModId || sub.srimodid || '').trim(),
            SRISubMId: String(sub.SRISubMId || sub.srisubmid || '').trim(),
            SRISubMDes: String(sub.SRISubMDes || sub.srisubmdes || 'Submódulo').trim(),
            SRISubMIco: sub.SRISubMIco || sub.srisubmico || ''
        }));

        // Si no viene lista de departamentos, la intentamos sacar de los submódulos o de la caché global
        let modulosFuente = listaDepartamentos;
        if (!modulosFuente || modulosFuente.length === 0) {
            modulosFuente = window.allModulosData || (this.datos && this.datos.modulos) || [];
        }

        // Respaldo total de emergencia si la fuente sigue vacía para que no se quede en blanco
        if (!modulosFuente || modulosFuente.length === 0) {
            console.warn("⚠️ [DEBUG] No hay módulos en fuentes externas. Reconstruyendo módulos base del 1 al 9...");
            modulosFuente = [
                { SRIModId: 1, SRIModNom: "Dirección Regional", SRIModNomC: "CIRNODIR" },
                { SRIModId: 2, SRIModNom: "Dirección de Investigación", SRIModNomC: "CIRNODIRIN" },
                { SRIModId: 3, SRIModNom: "Dirección de Administración", SRIModNomC: "CIRNODIRAD" },
                { SRIModId: 4, SRIModNom: "Recursos Financieros", SRIModNomC: "CIRNORF" },
                { SRIModId: 5, SRIModNom: "Recursos Humanos", SRIModNomC: "CIRNORH" },
                { SRIModId: 6, SRIModNom: "Recursos Materiales", SRIModNomC: "CIRNORM" },
                { SRIModId: 7, SRIModNom: "Sistemas", SRIModNomC: "CIRNOSIS" },
                { SRIModId: 8, SRIModNom: "Oficialia", SRIModNomC: "CIRNOOF" },
                { SRIModId: 9, SRIModNom: "Investigación", SRIModNomC: "CIRNOINV" }
            ];
        }

        let htmlAcumulado = '';

        modulosFuente.forEach((dep) => {
            const modId = String(dep.SRIModId || dep.srimodid || dep.id || '').trim();
            const claveDep = String(dep.SRIModNomC || dep.srimodnomc || dep.nomCorDep || '').toUpperCase();
            const nombreDepReal = String(dep.SRIModNom || dep.srimodnom || dep.nombre || 'Módulo');
            
            let iconoSvg = dep.SRIModIcon || dep.srimodicon || dep.icono || `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-folder"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>`;

            const submodulosDelModulo = submodulosTotales.filter(sub => {
                return sub.SRIModId === modId || (claveDep && sub.SRIModId.toUpperCase() === claveDep);
            });

            // Como eres la usuaria Admin 4398, forzamos la visualización si hay submódulos para no bloquearte
            let tieneAccesoModulo = esAdminGeneral || (submodulosDelModulo.length > 0);

            if (tieneAccesoModulo) {
                htmlAcumulado += `
                <button onclick="seleccionarModulo('${claveDep || modId}', '${modId}', this)" 
                    class="area-btn border-stone-200 flex flex-col items-center justify-center p-6 rounded-xl border hover:border-[#249444] hover:bg-emerald-50/50 transition-all text-center cursor-pointer group shadow-sm bg-white">
                    <div class="w-12 h-12 rounded-xl bg-emerald-50 text-[#249444] flex items-center justify-center group-hover:bg-[#249444] group-hover:text-white transition-all mb-3 shadow-inner">
                        ${iconoSvg}
                    </div>
                    <span class="uppercase text-xs font-bold text-stone-700 group-hover:text-[#249444] tracking-wide">${nombreDepReal}</span>
                    <span class="text-[10px] text-stone-400 mt-1">${submodulosDelModulo.length} submódulos disponibles</span>
                </button>`;
            }
        });

        if (!htmlAcumulado) {
            contenedorMenu.innerHTML = '<p class="text-xs text-stone-400 col-span-full text-center py-8">No hay módulos disponibles para mostrar.</p>';
            return;
        }

        contenedorMenu.innerHTML = htmlAcumulado;
    },

    filtrarPorCampo(claveCentroSeleccionado) {
        if (!this.datos || !this.datos.departamentos) return;

        let usuarioActivoObj = {};
        try { usuarioActivoObj = JSON.parse(localStorage.getItem('usuarioActivo') || '{}'); } catch(e){}

        let claveRegUsuario = String(
            usuarioActivoObj.SRIRegId ||
            usuarioActivoObj.claveReg ||
            ''
        ).trim();

        const departamentosDeLaRegional = this.datos.departamentos.filter(dep => {
            const regDep = String(dep.SRIRegId || dep.claveReg || '').trim();
            return regDep.toLowerCase() === claveRegUsuario.toLowerCase();
        });

        if (!claveCentroSeleccionado) {
            this.pintarTarjetasDepartamentos(departamentosDeLaRegional);
        } else {
            const filtrados = departamentosDeLaRegional.filter(dep => {
                const cenDep = String(dep.SRICenId || dep.claveCentro || '').trim();
                return cenDep === String(claveCentroSeleccionado).trim();
            });
            this.pintarTarjetasDepartamentos(filtrados);
        }
    },

    seleccionarDepartamento(NomCorDep, elementoBtn) {
        document.querySelectorAll('.area-btn').forEach(btn => {
            btn.classList.remove('border-[#249444]', 'bg-emerald-50/80', 'shadow-sm');
            btn.classList.add('border-stone-200');
            let divIcon = btn.querySelector('div');
            if (divIcon) {
                divIcon.classList.remove('bg-[#249444]', 'text-white');
                divIcon.classList.add('bg-emerald-50', 'text-[#249444]');
            }
        });

        elementoBtn.classList.remove('border-stone-200');
        elementoBtn.classList.add('border-[#249444]', 'bg-emerald-50/80', 'shadow-sm');
        let iconoDiv = elementoBtn.querySelector('div');
        if (iconoDiv) {
            iconoDiv.classList.remove('bg-emerald-50', 'text-[#249444]');
            iconoDiv.classList.add('bg-[#249444]', 'text-white');
        }

        const deptoKey = NomCorDep.toString().toLowerCase().trim().replace(/\s+/g, '');
        sessionStorage.setItem('depto_activo', deptoKey);

        setTimeout(() => {
            window.location.href = `main.html?depto=${deptoKey}`;
        }, 150);
    }
};

// ==========================================
// 3. PUENTES GLOBALES PARA EL HTML
// ==========================================
function filtrarPorCampoRegional(claveCentro) {
    if (claveCentro) {
        localStorage.setItem('centro_activo_actual', String(claveCentro).trim());
    } else {
        localStorage.removeItem('centro_activo_actual');
    }
    SistemaGlobal.filtrarPorCampo(claveCentro);
}

function seleccionarDepartamento(NomCorDep, elementoBtn) {
    SistemaGlobal.seleccionarDepartamento(NomCorDep, elementoBtn);
}

// ==========================================
// 4. DISPARADOR ÚNICO DE INICIO
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    AuthGuard.verificarAcceso();

    const deptoGuardado = sessionStorage.getItem('depto_activo');
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.get('depto') && deptoGuardado && window.location.pathname.includes('main.html')) {
        window.history.replaceState({}, '', `main.html?depto=${deptoGuardado}`);
    }
});

// ==========================================
// UTILIDAD CENTRALIZADA PARA SUBMÓDULOS DINÁMICOS
// ==========================================
window.AppConfigUtils = {
    crearOpcionesDinamicas(claveDepDepto, deptoKey) {
        const fuenteDatos = window.allSubModulosData || (SistemaGlobal.datos && SistemaGlobal.datos.submodulos);

        if (!fuenteDatos || !Array.isArray(fuenteDatos)) {
            return [];
        }

        const submodulosFiltrados = fuenteDatos.filter(item => {
            const dep = item.ClaveDep !== undefined ? item.ClaveDep : (item.SRIDepId || item.sModClave || item.claveDep);
            return String(dep).trim().toUpperCase() === String(claveDepDepto).trim().toUpperCase();
        });

        return submodulosFiltrados.map(sub => {
            const idSheet = String(sub.SModClave !== undefined ? sub.SModClave : (sub.sModClave || sub.id));
            const nombreSheet = String(sub.SModNom !== undefined ? sub.SModNom : (sub.sModNom || sub.nombre));
            const iconoSheet = sub.SModIcon !== undefined ? sub.SModIcon : (sub.sModIcon || sub.icono);

            const iconoPorDefecto = "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect width='18' height='18' x='3' y='3' rx='2'/></svg>";

            return {
                id: idSheet,
                title: nombreSheet,
                icon: iconoSheet && iconoSheet.trim() !== "" ? iconoSheet : iconoPorDefecto,
                action: `manejarAccionSeccion_${deptoKey}('${idSheet}')`
            };
        });
    }
};