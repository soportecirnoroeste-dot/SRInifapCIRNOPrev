// ==========================================
// PUENTES GLOBALES PARA EL ROUTER DE LA APP
// ==========================================
window.manejarAccionSeccion_cirnosis = function(idOpt) {
    manejarAccionSeccionSis(idOpt);
};

window.manejarAccionSeccionCirnosis = function(idOpt) {
    manejarAccionSeccionSis(idOpt);
};

// ==========================================
// CARGA INSTÁNTANEA CON CACHÉ Y RED EN SEGUNDO PLANO
// ==========================================
function cargarDatosDelSistema() {
    return new Promise((resolve) => {
        // 1. CARGA INMEDIATA DESDE CACHÉ (Velocidad de 0 milisegundos)
        let datosCacheados = { success: true, submodulos: [] };
        try {
            const cacheGuardada = localStorage.getItem('sistema_cache_datos');
            if (cacheGuardada) {
                datosCacheados = JSON.parse(cacheGuardada);
            }
        } catch (err) {}

        window.allSubModulosData = datosCacheados.submodulos || [];
        window.datosSistema = datosCacheados;

        // Pintar el menú al instante con los datos guardados
        if (typeof window.cargarMenuDepartamento === 'function') {
            window.cargarMenuDepartamento();
        }

        resolve(datosCacheados);

        // 2. SINCRONIZACIÓN EN SEGUNDO PLANO (No bloquea la pantalla al usuario)
        setTimeout(async () => {
            try {
                let respuesta = null;
                if (typeof window.FetchAPI === 'function') {
                    respuesta = await window.FetchAPI('obtenerDatosSistema');
                } else {
                    const response = await fetch("https://script.google.com/macros/s/AKfycbz1wzz5zC_6Cf4thUdl_5BkAca6m_MM7IWQyPwVAQcMaraPqfX8nBGMQpSdy31_tjz1Aw/exec", {
                        method: "POST",
                        redirect: "follow",
                        headers: { "Content-Type": "text/plain;charset=utf-8" },
                        body: JSON.stringify({ action: "obtenerDatosSistema" })
                    });
                    respuesta = await response.json();
                }

                if (respuesta && respuesta.success && respuesta.submodulos) {
                    window.allSubModulosData = respuesta.submodulos;
                    window.datosSistema = respuesta;
                    localStorage.setItem('sistema_cache_datos', JSON.stringify(respuesta));
                    
                    // Si hubo cambios en Sheets, actualiza el menú visualmente de forma imperceptible
                    if (typeof window.cargarMenuDepartamento === 'function') {
                        window.cargarMenuDepartamento();
                    }
                }
            } catch (e) {
                // Silencioso si no hay internet o falla la red, la caché sigue respondiendo
            }
        }, 100);
    });
}

// ==========================================
// CONFIGURACIÓN OFICIAL (DETECTADA POR EL ROUTER)
// ==========================================
window.cirnosisConfig = {
    deptoKey: "cirnosis",
    claveDep: "7", // Clave numérica para buscar en la pestaña SubModulo de Sheets
    subtitle: "Gestión de infraestructura tecnológica, redes y soporte técnico.",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-terminal"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="m8 16 2-2-2-2"/><path d="M12 18h4"/></svg>`,

    get options() {
        if (window.AppConfigUtils && typeof window.AppConfigUtils.crearOpcionesDinamicas === 'function') {
            return window.AppConfigUtils.crearOpcionesDinamicas(this.claveDep, this.deptoKey);
        }

        const fuenteDatos = window.allSubModulosData || (window.datosSistema && window.datosSistema.submodulos);
        if (!fuenteDatos || !Array.isArray(fuenteDatos)) return [];

        const submodulosFiltrados = fuenteDatos.filter(item => {
            const dep = item.ClaveDep !== undefined ? item.ClaveDep : item.claveDep;
            return String(dep) === String(this.claveDep);
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
                action: `manejarAccionSeccion_cirnosis('${idSheet}')`
            };
        });
    }
};

// Alias por si algún otro script busca directamente 'window.cirnosis'
window.cirnosis = window.cirnosisConfig;

// ==========================================
// FUNCIONES DE ACCIÓN Y CARGA DE SECCIONES
// ==========================================
function obtenerContenedor() {
    return document.getElementById('app-container') || document.querySelector('main') || document.body;
}

function manejarAccionSeccionSis(idOpt) {
    if (typeof window.manejarAccionSeccionGenerica === 'function') {
        window.manejarAccionSeccionGenerica(idOpt);
    } else {
        const urlParams = new URLSearchParams(window.location.search);
        const deptoActual = urlParams.get('depto') || 'cirnosis';
        const nuevaUrl = `main.html?depto=${deptoActual}&seccion=${idOpt}`;

        window.history.pushState({ seccion: idOpt }, '', nuevaUrl);
        sessionStorage.setItem(`submodulo_activo_${deptoActual}`, idOpt);
        ejecutarCargaSeccionSis(idOpt);
    }
}

function ejecutarCargaSeccionSis(idOpt) {
    const configDepto = window.cirnosisConfig;
    const opciones = configDepto.options || [];
    const optEncontrada = opciones.find(o => o.id === String(idOpt));
    const tituloOpt = optEncontrada ? optEncontrada.title.toLowerCase() : '';

    // Detectar si es el submódulo de permisos por ID, clave o texto del título en Sheets
    if (idOpt === 'permisos' || idOpt === '6' || tituloOpt.includes('permiso')) { 
        cargarPermisosSis();
    } else {
        renderizarVistaModuloSis(idOpt, optEncontrada ? optEncontrada.title : "Módulo del sistema.");
    }
}

function limpiarSeccionUrlSis() {
    const urlParams = new URLSearchParams(window.location.search);
    const deptoActual = urlParams.get('depto') || 'cirnosis';
    sessionStorage.removeItem(`submodulo_activo_${deptoActual}`);
    
    if (urlParams.has('seccion')) {
        const nuevaUrl = `main.html?depto=${deptoActual}`;
        window.history.replaceState({}, '', nuevaUrl);
    }
}

function cargarPermisosSis() {
    if (typeof window.renderizarListadoPermisosSis === 'function') {
        if (typeof window.actualizarBotonRegresar === 'function') {
            const deptoActual = new URLSearchParams(window.location.search).get('depto') || 'cirnosis';
            window.actualizarBotonRegresar('submodulo', deptoActual);
        }
        window.renderizarListadoPermisosSis();
    } else {
        console.error("No se encontró la función renderizarListadoPermisosSis en SisPerCore.js");
    }
}


// ==========================================
// CONTROLADOR MAESTRO DE NAVEGACIÓN Y HISTORIAL
// ==========================================
function procesarCargaInicialSeccionSis(event) {
    const urlParams = new URLSearchParams(window.location.search);

    const seccion = event && event.state && 'seccion' in event.state
        ? event.state.seccion
        : urlParams.get('seccion');

    const depto = urlParams.get('depto') || 'cirnosis';
    const contenedor = obtenerContenedor();

    if (seccion) {
        sessionStorage.setItem(`submodulo_activo_${depto}`, seccion);

        if (typeof window.actualizarBotonRegresar === 'function') {
            window.actualizarBotonRegresar('submodulo', depto);
        }

        ejecutarCargaSeccionSis(seccion);
    } else {
        sessionStorage.removeItem(`submodulo_activo_${depto}`);

        if (typeof window.actualizarBotonRegresar === 'function') {
            window.actualizarBotonRegresar('principal', depto);
        }

        if (contenedor) {
            contenedor.innerHTML = '';
        }
        if (typeof window.cargarMenuDepartamento === 'function') {
            window.cargarMenuDepartamento();
        } else if (typeof window.restaurarMenuDepto === 'function') {
            window.restaurarMenuDepto(depto);
        }
    }

    if (contenedor) {
        contenedor.style.transition = 'opacity 0.2s ease-in';
        contenedor.style.opacity = '1';
        contenedor.style.visibility = 'visible';
    }
}

// ==========================================
// LISTENERS DE HISTORIAL Y ARRANQUE ULTRA-RÁPIDO
// ==========================================
window.addEventListener('popstate', (event) => {
    procesarCargaInicialSeccionSis(event);
});

document.addEventListener('DOMContentLoaded', () => {
    cargarDatosDelSistema();
    procesarCargaInicialSeccionSis();
});