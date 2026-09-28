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
                labelUser.textContent = localStorage.getItem('session_userName') || 'Usuario';
            }

            if (!paginaActual.includes('login.html')) {
                sessionStorage.setItem('ultima_ruta_completa', rutaCompletaActual);

                if (paginaActual.includes('index.html') || paginaActual.endsWith('/')) {
                    SistemaGlobal.init();
                } else {
                    const rutaGuardada = sessionStorage.getItem('ultima_ruta_completa');
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
                console.error("Error al leer la caché, procediendo a red...", e);
            }
        }

        if (!datosReales) {
            try {
                if (typeof google !== 'undefined' && google.script && google.script.run) {
                    datosReales = await new Promise((resolve, reject) => {
                        google.script.run
                            .withSuccessHandler(res => resolve(res))
                            .withFailureHandler(err => reject(err))
                            .obtenerDatosSistema();
                    });
                } else {
                    const URL_DIRECTA = "https://script.google.com/macros/s/AKfycbzDs5fvFxykQniWFZnbUqpbuDAmrIDhMHlVwU4r5B3iPLxBp4FDG7uKrtDBDQEXxEX8fQ/exec?action=obtenerDatosSistema";
                    const res = await fetch(URL_DIRECTA);
                    datosReales = await res.json();
                }
                this.guardarEnCache(datosReales);
            } catch (err) {
                console.error("Error al obtener datos del sistema:", err);
                ocultarCarga();
                return;
            }
        }

        // Consultamos los permisos específicos del empleado logueado
        const noEmp = String(localStorage.getItem('session_noEmp') || localStorage.getItem('usuario_sesion') || '').trim();
        let permisosUsuario = {};

        if (noEmp && typeof FetchAPI === 'function') {
            try {
                permisosUsuario = await FetchAPI('obtenerPermisosColaborador', { numEmp: noEmp }) || {};
            } catch (e) {
                console.warn("No se pudieron cargar los permisos del empleado:", e);
            }
        }
        window.userPermisosCache = permisosUsuario;
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
        this.datos = datosReales;
        window.allSubModulosData = datosReales.submodulos || [];

        const todosLosDepartamentos = datosReales.departamentos || [];
        const todasLasRegionales = datosReales.regionales || [];
        let todosLosCampos = datosReales.campos || [];

        // 🚀 Detección infalible de Administrador General (Nivel 4 o Empleado 4398)
        const noEmp = String(localStorage.getItem('session_noEmp') || localStorage.getItem('usuario_sesion') || '').trim();
        const permisosUsuario = window.userPermisosCache || {};
        let esAdminGeneral = (noEmp === "4398"); // Comodín directo para administrador principal

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

        if (!esAdminGeneral) {
            esAdminGeneral = buscarNivelCuatro(permisosUsuario);
        }
        console.log("👑 ¿Es Administrador General?:", esAdminGeneral);

        const areaUsuario = String(localStorage.getItem('session_area') || '').trim().toUpperCase();
        let claveRegUsuario = "";

        const regionalEncontrada = todasLasRegionales.find(r =>
            String(r.claveReg).trim().toUpperCase() === areaUsuario ||
            String(r.nomCorto).trim().toUpperCase() === areaUsuario
        );

        if (regionalEncontrada) {
            claveRegUsuario = String(regionalEncontrada.claveReg).trim();
        } else {
            const depUsuario = todosLosDepartamentos.find(dep =>
                String(dep.nomCorDep).trim().toUpperCase() === areaUsuario ||
                String(dep.claveCentro).trim().toUpperCase() === areaUsuario
            );

            if (depUsuario) {
                claveRegUsuario = String(depUsuario.claveReg).trim();
            } else {
                claveRegUsuario = todasLasRegionales.length > 0 ? String(todasLasRegionales[0].claveReg).trim() : "";
            }
        }

        this.renderizarRegional(claveRegUsuario, todasLasRegionales);

        const departamentosDeLaRegional = todosLosDepartamentos.filter(dep => String(dep.claveReg).trim() === claveRegUsuario);

        if (todosLosCampos.length === 0 && departamentosDeLaRegional.length > 0) {
            const centrosUnicos = [...new Set(departamentosDeLaRegional.map(d => d.claveCentro))];
            todosLosCampos = centrosUnicos.map(c => ({
                claveReg: claveRegUsuario,
                claveCentro: c,
                centro: `Centro ${c}`
            }));
            this.datos.campos = todosLosCampos;
        }

        this.renderizarFiltroCampos(todosLosCampos, claveRegUsuario);

        // 🚀 GESTIÓN DE EDITABILIDAD DEL COMBO DE CAMPOS (Forzar desbloqueo si es admin)
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

        const camposDeLaRegional = todosLosCampos.filter(c => String(c.claveReg).trim() === claveRegUsuario);
        const depDelUsuarioLogueado = departamentosDeLaRegional.find(dep =>
            String(dep.nomCorDep).trim().toUpperCase() === areaUsuario ||
            String(dep.claveCentro).trim().toUpperCase() === areaUsuario
        );

        let claveCentroInicial = "";
        if (depDelUsuarioLogueado) {
            claveCentroInicial = String(depDelUsuarioLogueado.claveCentro).trim();
        } else if (camposDeLaRegional.length > 0) {
            claveCentroInicial = String(camposDeLaRegional[0].claveCentro).trim();
        }

        if (claveCentroInicial) {
            localStorage.setItem('centro_activo_actual', claveCentroInicial);
        }

        if (selectFiltro && claveCentroInicial) {
            selectFiltro.value = claveCentroInicial;
        }

        if (claveCentroInicial) {
            const filtradosIniciales = departamentosDeLaRegional.filter(dep => String(dep.claveCentro).trim() === claveCentroInicial);
            this.pintarTarjetasDepartamentos(filtradosIniciales);
        } else {
            this.pintarTarjetasDepartamentos(departamentosDeLaRegional);
        }
    },

    renderizarRegional(claveReg, regionales) {
        const infoRegional = regionales.find(r => String(r.claveReg).trim() === claveReg);
        const nombreRegionalOficial = infoRegional ? infoRegional.regional : "REGIONAL NO ENCONTRADA EN SHEETS";

        const labelRegional = document.getElementById('user-regional-display');
        if (labelRegional) {
            labelRegional.textContent = `${claveReg} - ${nombreRegionalOficial}`;
        }
    },

    renderizarFiltroCampos(campos, claveReg) {
        const camposDeLaRegional = campos.filter(c => String(c.claveReg).trim() === claveReg);
        const selectFiltro = document.getElementById('filtro-campos-regional');

        if (selectFiltro) {
            selectFiltro.innerHTML = '<option value="">Seleccionar campo</option>';
            camposDeLaRegional.forEach(campo => {
                const textoOpcion = `${campo.claveCentro} - ${campo.centro}`;
                selectFiltro.innerHTML += `<option value="${campo.claveCentro}">${textoOpcion}</option>`;
            });
        }
    },

    pintarTarjetasDepartamentos(listaDepartamentos) {
        const contenedorMenu = document.getElementById('menu-dinamico-departamentos');
        if (!contenedorMenu) return;

        const noEmp = String(localStorage.getItem('session_noEmp') || localStorage.getItem('usuario_sesion') || '').trim();
        const permisosUsuario = window.userPermisosCache || {};

        let esAdminGeneral = (noEmp === "4398");
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

        if (!esAdminGeneral) {
            esAdminGeneral = buscarNivelCuatro(permisosUsuario);
        }

        const departamentosFiltrados = esAdminGeneral ? listaDepartamentos : listaDepartamentos.filter(dep => {
            const idDep = String(dep.claveDep || dep.ClaveDep || dep.id || '').trim();
            const nomCor = String(dep.nomCorDep || '').trim().toUpperCase();

            const deptoPermisos = permisosUsuario[idDep] || permisosUsuario[nomCor] || permisosUsuario[Number(idDep)];

            if (!deptoPermisos) return false;

            if (typeof deptoPermisos === 'object') {
                return Object.values(deptoPermisos).some(p => {
                    if (typeof p === 'number') return p > 0;
                    if (p && typeof p === 'object') {
                        const ver = Number(p.ver || p.Ver || 0);
                        const niv = Number(p.nivper || p.nivPer || p.NivPer || 0);
                        return ver > 0 || niv > 0;
                    }
                    return false;
                });
            }

            return Number(deptoPermisos) > 0;
        });

        if (departamentosFiltrados.length === 0) {
            contenedorMenu.innerHTML = '<p class="text-xs text-stone-400 col-span-full text-center py-8">No tienes módulos o submódulos con permisos de acceso asignados.</p>';
            return;
        }

        let htmlAcumulado = '';

        departamentosFiltrados.forEach((dep) => {
            const claveDep = (dep.nomCorDep || '').toUpperCase();
            let iconoSvg = '';

            switch (claveDep) {
                case 'CIRNODIR':
                    iconoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-landmark"><line x1="3" y1="21" x2="21" y2="21"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="10" y1="12" x2="14" y2="12"/><line x1="6" y1="16" x2="18" y2="16"/><path d="m3 9 9-6 9 6v3H3z"/></svg>`;
                    break;
                case 'CIRNODIRIN':
                    iconoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-book-search"><path d="M11 22H5.5a1 1 0 0 1 0-5h4.501"/><path d="m21 22-1.879-1.878"/><path d="M3 19.5v-15A2.5 2.5 0 0 1 5.5 2H18a1 1 0 0 1 1 1v8"/><circle cx="17" cy="18" r="3"/></svg>`;
                    break;
                case 'CIRNODIRAD':
                    iconoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-blocks"><path d="M10 22V7a1 1 0 0 0-1-1H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5a1 1 0 0 0-1-1H2"/><rect x="14" y="2" width="8" height="8" rx="1"/></svg>`;
                    break;
                case 'CIRNORF':
                    iconoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chart-line"><path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="m19 9-5 5-4-4-3 3"/></svg>`;
                    break;
                case 'CIRNORH':
                    iconoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-handshake"><path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/></svg>`;
                    break;
                case 'CIRNORM':
                    iconoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-hand-coins-icon lucide-hand-coins"><path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17"/><path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9"/><path d="m2 16 6 6"/><circle cx="16" cy="9" r="2.9"/><circle cx="6" cy="5" r="3"/></svg>`;
                    break;
                case 'CIRNOSIS':
                    iconoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-terminal"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="m8 16 2-2-2-2"/><path d="M12 18h4"/></svg>`;
                    break;
                case 'CIRNOOF':
                    iconoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mailbox-icon lucide-mailbox"><path d="M22 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5C2 7 4 5 6.5 5H18c2.2 0 4 1.8 4 4v8Z"/><polyline points="15,9 18,9 18,11"/><path d="M6.5 5C9 5 11 7 11 9.5V17a2 2 0 0 1-2 2"/><line x1="6" x2="7" y1="10" y2="10"/></svg>`;
                    break;
                default:
                    iconoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-network"><rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/></svg>`;
                    break;
            }

            htmlAcumulado += `
            <button onclick="seleccionarDepartamento('${dep.nomCorDep}', this)" 
                class="area-btn border-stone-200 flex flex-col items-center justify-center p-4 rounded-xl border hover:border-[#249444] hover:bg-emerald-50/50 transition-all text-center cursor-pointer group">
                <span class="uppercase text-xs font-bold text-stone-700 group-hover:text-[#249444] mb-2">${dep.nomDep}</span>
                <div class="w-10 h-10 rounded-lg bg-emerald-50 text-[#249444] flex items-center justify-center group-hover:bg-[#249444] group-hover:text-white transition-all">
                    ${iconoSvg}
                </div>
            </button>
        `;
        });

        contenedorMenu.innerHTML = htmlAcumulado;
    },

    filtrarPorCampo(claveCentroSeleccionado) {
        if (!this.datos || !this.datos.departamentos) return;

        const areaUsuario = String(localStorage.getItem('session_area') || '').trim().toUpperCase();
        const depUsuario = this.datos.departamentos.find(dep => String(dep.claveReg).trim() === areaUsuario);
        const claveRegUsuario = depUsuario ? String(depUsuario.claveReg).trim() : (this.datos.regionales[0]?.claveReg || "");

        const departamentosDeLaRegional = this.datos.departamentos.filter(dep => String(dep.claveReg).trim() === claveRegUsuario);

        if (!claveCentroSeleccionado) {
            this.pintarTarjetasDepartamentos(departamentosDeLaRegional);
        } else {
            const filtrados = departamentosDeLaRegional.filter(dep => String(dep.claveCentro).trim() === String(claveCentroSeleccionado).trim());
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
            const dep = item.ClaveDep !== undefined ? item.ClaveDep : item.claveDep;
            return String(dep).trim() === String(claveDepDepto).trim();
        });

        return submodulosFiltrados.map(sub => {
            const idSheet = String(sub.SModClave !== undefined ? sub.SModClave : sub.sModClave);
            const nombreSheet = String(sub.SModNom !== undefined ? sub.SModNom : sub.sModNom);
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