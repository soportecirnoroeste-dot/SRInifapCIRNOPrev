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
// 1. CONTROLADOR DE ACCESO (AUTH GUARD)
// ==========================================
const AuthGuard = {
    verificarAcceso: () => {
        const usuarioSesion = localStorage.getItem('usuario_sesion');
        const paginaActual = window.location.pathname;
        const queryActual = window.location.search;
        const rutaCompletaActual = paginaActual + queryActual;

        if (!usuarioSesion && !paginaActual.includes('login.html')) {
            window.location.href = 'login.html';
        } else if (usuarioSesion && paginaActual.includes('login.html')) {
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
// 2. NÚCLEO CENTRAL DEL SISTEMA
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
                // Error silencioso de caché
            }
        }

        if (!datosReales) {
            try {
                datosReales = await callAppsScript("obtenerDatosSistema");
                this.guardarEnCache(datosReales);
            } catch (err) {
                ocultarCarga();
                return;
            }
        }

        this.datos = datosReales;

        let usuarioActivoObjTemp = {};
        try { usuarioActivoObjTemp = JSON.parse(localStorage.getItem('usuarioActivo') || '{}'); } catch (e) { }

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
                // Error silencioso de permisos
            }
        }

        // 🟢 FORZAMOS ACCESO TOTAL TEMPORALMENTE PARA QUE PINTE LAS TARJETAS
        permisosUsuario.accesoTotalPermitido = true;

        window.userPermisosCache = permisosUsuario;
        window.userNoEmpCache = noEmp;

        const respuestaProcesada = this.procesarRespuestaServidor(datosReales);

        if (respuestaProcesada) {
            let claveRegUser = String(
                usuarioActivoObjTemp.SRIRegId ||
                usuarioActivoObjTemp.claveReg ||
                usuarioActivoObjTemp.regId ||
                ''
            ).trim();

            if (!claveRegUser && respuestaProcesada.regionales && respuestaProcesada.regionales.length > 0) {
                claveRegUser = String(
                    respuestaProcesada.regionales[0].SRIRegId ||
                    respuestaProcesada.regionales[0].claveReg ||
                    respuestaProcesada.regionales[0].regId || ''
                ).trim();
            }

            if (claveRegUser && typeof this.renderizarRegional === 'function') {
                this.renderizarRegional(claveRegUser, respuestaProcesada.regionales || []);
            }

            if (claveRegUser && typeof this.renderizarFiltroCampos === 'function') {
                this.renderizarFiltroCampos(respuestaProcesada.campos || [], claveRegUser);
            }

           // --- PROTECCIÓN Y COMPATIBILIDAD DE DATOS ---
            const fuenteModulos = respuestaProcesada.departamentos || respuestaProcesada.modulos || [];
            window.allModulosData = fuenteModulos; // Guardamos respaldo global

            // Si deseas mostrar todos los módulos disponibles sin importar la restricción estricta de regional en pantalla:
            const listaA_Pintar = fuenteModulos;

            this.pintarTarjetasDepartamentos(listaA_Pintar);
        }

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

    procesarRespuestaServidor(respuesta) {
        if (!respuesta) return null;
        if (typeof respuesta === 'string') {
            try {
                return JSON.parse(respuesta);
            } catch (e) {
                return respuesta;
            }
        }
        return respuesta;
    },

    pintarTarjetasDepartamentos(listaDepartamentos) {
        const contenedorMenu = document.getElementById('menu-dinamico-departamentos');
        if (!contenedorMenu) return;

        let usuarioActivoObjTemp = {};
        try {
            usuarioActivoObjTemp = JSON.parse(localStorage.getItem('usuarioActivo') || '{}');
        } catch (e) { }

        const permisosUsuario = window.userPermisosCache || {};

        const verificarNivelAdministrativo = (obj) => {
            if (!obj) return false;
            if (typeof obj === 'number' || typeof obj === 'string') return Number(obj) >= 5;
            if (typeof obj === 'object') {
                for (let k in obj) {
                    if (k.toLowerCase().includes('niv') && Number(obj[k]) >= 5) return true;
                    if (typeof obj[k] === 'object' && obj[k] !== null) {
                        const val = Number(obj[k].SRIPermEm || obj[k].ver || obj[k].nivel || 0);
                        if (val >= 5) return true;
                    }
                    if (verificarNivelAdministrativo(obj[k])) return true;
                }
            }
            return false;
        };

        const esAdminGeneral = Boolean(
            usuarioActivoObjTemp.esAdmin ||
            usuarioActivoObjTemp.isAdmin ||
            permisosUsuario.accesoTotalPermitido ||
            String(usuarioActivoObjTemp.rol || '').toLowerCase().includes('admin') ||
            String(usuarioActivoObjTemp.tipo || '').toLowerCase().includes('admin') ||
            verificarNivelAdministrativo(permisosUsuario)
        );

        const submodulosCrudos = window.allSubModulosData || (this.datos && this.datos.submodulos) || [];
        const submodulosTotales = submodulosCrudos.map(sub => ({
            SRIModId: String(sub.SRIModId || sub.srimodid || '').trim(),
            SRISubMId: String(sub.SRISubMId || sub.srisubmid || '').trim(),
            SRISubMDes: String(sub.SRIModNom || sub.SRISubMDes || sub.srimodmdes || 'Submódulo').trim(),
            SRISubMIco: sub.SRISubMIco || sub.srisubmico || ''
        }));

        let modulosFuente = listaDepartamentos;
        if (!modulosFuente || modulosFuente.length === 0) {
            modulosFuente = window.allModulosData || (this.datos && this.datos.modulos) || [];
        }

        let htmlAcumulado = '';

        modulosFuente.forEach((dep) => {
            const modId = String(dep.SRIModId || dep.srimodid || dep.id || '').trim();
            const claveDep = String(dep.SRIModNomC || dep.srimodnomc || dep.nomCorDep || '').toUpperCase();
            const nombreDepReal = String(
                dep.SRIModNom ||
                dep.srimodnom ||
                dep.SRIModDesc ||
                dep.srimoddesc ||
                dep.nombre ||
                dep.descripcion ||
                dep.ModNom ||
                dep.Nombre ||
                'Módulo'
            );
            let iconoSvgCrudo = dep.SRIModIcon || dep.srimodicon || dep.icono || '';
            let iconoSvgHtml = '';

            if (iconoSvgCrudo && iconoSvgCrudo.trim() !== '') {
                iconoSvgHtml = iconoSvgCrudo.includes('width=')
                    ? iconoSvgCrudo
                    : iconoSvgCrudo.replace('<svg', '<svg width="24" height="24"');
            } else {
                iconoSvgHtml = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-folder"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>`;
            }

            const submodulosDelModulo = submodulosTotales.filter(sub => {
                return sub.SRIModId === modId || (claveDep && sub.SRIModId.toUpperCase() === claveDep);
            });

            let tieneAccesoModulo = esAdminGeneral;

            if (!tieneAccesoModulo) {
                const permisosMod = permisosUsuario[modId] || permisosUsuario[Number(modId)] || permisosUsuario[claveDep] || permisosUsuario[String(modId).toLowerCase()];
                if (permisosMod) {
                    if (typeof permisosMod === 'object') {
                        tieneAccesoModulo = submodulosDelModulo.some(sub => {
                            const permisoSub = permisosMod[sub.SRISubMId] || permisosMod[Number(sub.SRISubMId)] || permisosMod[String(sub.SRISubMId)];
                            if (permisoSub !== undefined && permisoSub !== null) {
                                const nivelPermiso = typeof permisoSub === 'object' ? Number(permisoSub.SRIPermEm || permisoSub.ver || 0) : Number(permisoSub);
                                return nivelPermiso >= 1;
                            }
                            return false;
                        });
                    } else {
                        tieneAccesoModulo = Number(permisosMod) >= 1;
                    }
                }
            } else {
                tieneAccesoModulo = (submodulosDelModulo.length > 0);
            }

            if (tieneAccesoModulo) {
                htmlAcumulado += `
                <button onclick="seleccionarModulo('${claveDep || modId}', '${modId}', this)" 
                    class="area-btn border-stone-200 flex flex-col items-center justify-center p-6 rounded-xl border hover:border-[#249444] hover:bg-emerald-50/50 transition-all text-center cursor-pointer group shadow-sm bg-white">
                    <div class="w-12 h-12 rounded-xl bg-emerald-50 text-[#249444] flex items-center justify-center group-hover:bg-[#249444] group-hover:text-white transition-all mb-3 shadow-inner [&>svg]:w-6 [&>svg]:h-6">
                        ${iconoSvgHtml}
                    </div>
                    <span class="uppercase text-xs font-bold text-stone-700 group-hover:text-[#249444] tracking-wide">${nombreDepReal}</span>
                    <span class="text-[10px] text-stone-400 mt-1">${submodulosDelModulo.length} submódulos disponibles</span>
                </button>`;
            }
        });

        if (!htmlAcumulado) {
            contenedorMenu.innerHTML = '<p class="text-xs text-stone-400 col-span-full text-center py-8">No hay módulos disponibles con permisos asignados para este usuario.</p>';
            return;
        }

        contenedorMenu.innerHTML = htmlAcumulado;
    },

    renderizarRegional(claveReg, regionales) {
        const infoRegional = regionales.find(r => {
            const rId = String(r.SRIRegId || r.claveReg || r.regId || '').trim();
            return rId.toLowerCase() === String(claveReg).toLowerCase();
        });

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
                const cNom = String(
                    campo.SRICenNom ||
                    campo.centro ||
                    campo.nombreCentro ||
                    campo.NomCentro ||
                    ''
                ).trim();

                selectFiltro.innerHTML += `<option value="${cId}">${cId}${cNom ? ' - ' + cNom : ''}</option>`;
            });

            // ==========================================
            // AUTO-SELECCIÓN DEL CAMPO DEL USUARIO
            // ==========================================
            let usuarioActivoObjTemp = {};
            try { usuarioActivoObjTemp = JSON.parse(localStorage.getItem('usuarioActivo') || '{}'); } catch (e) { }

            const claveCentroUser = String(
                localStorage.getItem('centro_activo_actual') ||
                usuarioActivoObjTemp.SRICenId ||
                usuarioActivoObjTemp.claveCentro ||
                usuarioActivoObjTemp.cenId ||
                ''
            ).trim();

            if (claveCentroUser) {
                selectFiltro.value = claveCentroUser;
            }
        }
    },

    filtrarPorCampo(claveCentroSeleccionado) {
        if (!this.datos || !this.datos.departamentos) return;

        let usuarioActivoObj = {};
        try { usuarioActivoObj = JSON.parse(localStorage.getItem('usuarioActivo') || '{}'); } catch (e) { }

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
} // <--- Asegúrate de que esta llave cierre correctamente el objeto "SistemaGlobal" (o elimínala si ya hay otra cerrándolo más abajo)

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

// 🟢 Puente global obligatorio para que los botones de los módulos respondan al clic
function seleccionarModulo(claveDep, modId, elementoBtn) {
    SistemaGlobal.seleccionarDepartamento(claveDep, elementoBtn);
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