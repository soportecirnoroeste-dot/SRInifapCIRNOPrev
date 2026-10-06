// ==========================================
// PUENTES GLOBALES PARA EL ROUTER DE LA APP (CIRNORH)
// ==========================================
window.manejarAccionSeccion_cirnorh = function(idOpt) {
    manejarAccionSeccionRh(idOpt);
};

window.manejarAccionSeccionCirnorh = function(idOpt) {
    manejarAccionSeccionRh(idOpt);
};

// ==========================================
// CARGA Y PERSISTENCIA INTELIGENTE (SQL + LOCALSTORAGE)
// ==========================================
async function cargarDatosDelSistema() {
    try {
        let respuesta = null;

        // 1. Intentamos la petición en vivo a SQL Server a través de la API
        if (window.API && typeof window.API.getSistemaDatos === 'function') {
            respuesta = await window.API.getSistemaDatos();
        } else if (typeof window.callAppsScript === 'function') {
            respuesta = await window.callAppsScript('getSistemaDatos');
        }

        // 2. Si SQL responde correctamente, extraemos los departamentos y actualizamos la caché local
        if (respuesta && (respuesta.success || respuesta.departamentos)) {
            const listaSubmodulos = respuesta.departamentos || respuesta.submodulos || respuesta.data || [];
            
            window.datosSession = respuesta;
            window.datosSistema = {
                success: true,
                submodulos: listaSubmodulos
            };
            window.allSubModulosData = listaSubmodulos;

            // Guardamos automáticamente en el localStorage para futuras recargas fluidas
            try {
                localStorage.setItem('sistema_cache_datos', JSON.stringify(respuesta));
            } catch (err) {
                console.warn("⚠️ No se pudo guardar la caché local:", err);
            }

            console.log("✅ Datos sincronizados desde SQL Server:", window.allSubModulosData.length);
            return window.datosSistema;
        }
    } catch (e) {
        console.warn("⚠️ La red falló o la petición a SQL no respondió. Intentando recuperar caché local...", e);
    }

    // 3. PLAN DE RESPALDO: Si SQL falla o no hay red, recuperamos del localStorage si existe
    try {
        const cacheLocal = localStorage.getItem('sistema_cache_datos');
        if (cacheLocal) {
            const datosParseados = JSON.parse(cacheLocal);
            const listaSubmodulos = datosParseados.departamentos || datosParseados.submodulos || datosParseados.data || [];
            
            window.datosSession = datosParseados;
            window.datosSistema = {
                success: true,
                submodulos: listaSubmodulos
            };
            window.allSubModulosData = listaSubmodulos;

            console.log("📦 Datos recuperados exitosamente desde la caché local (localStorage):", window.allSubModulosData.length);
            return window.datosSistema;
        }
    } catch (err) {
        console.error("❌ Error al leer la caché local:", err);
    }

    // Si de plano no hay nada en ningún lado
    return { success: false, submodulos: [] };
}

// ==========================================
// CONFIGURACIÓN OFICIAL
// ==========================================
window.cirnorhConfig = {
    deptoKey: "cirnorh",
    claveDep: "5",
    subtitle: "Gestión de personal, incidencias, nómina y desarrollo humano.",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-handshake"><path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/></svg>`,

    get options() {
        if (window.AppConfigUtils && typeof window.AppConfigUtils.crearOpcionesDinamicas === 'function') {
            return window.AppConfigUtils.crearOpcionesDinamicas(this.claveDep, this.deptoKey);
        }
        return [];
    }
};

window.cirnorh = window.cirnorhConfig;

// ==========================================
// FUNCIONES DE ACCIÓN Y CARGA DE SECCIONES (RH)
// ==========================================
function obtenerContenedor() {
    return document.getElementById('app-container') || document.querySelector('main') || document.body;
}

function manejarAccionSeccionRh(idOpt) {
    if (typeof window.manejarAccionSeccionGenerica === 'function') {
        window.manejarAccionSeccionGenerica(idOpt);
    } else {
        const urlParams = new URLSearchParams(window.location.search);
        const deptoActual = urlParams.get('depto') || 'cirnorh';
        const nuevaUrl = `main.html?depto=${deptoActual}&seccion=${idOpt}`;

        window.history.pushState({ seccion: idOpt }, '', nuevaUrl);
        sessionStorage.setItem(`submodulo_activo_${deptoActual}`, idOpt);
        ejecutarCargaSeccionRh(idOpt);
    }
}

function ejecutarCargaSeccionRh(idOpt) {
    const configDepto = window.cirnorhConfig;
    const opciones = configDepto.options || [];
    let optEncontrada = opciones.find(o => o.id === String(idOpt));

    // PLAN DE RESPALDO: Si no se encuentra en las opciones dinámicas, buscamos por nombre genérico o ID común
    if (!optEncontrada && window.allSubModulosData && Array.isArray(window.allSubModulosData)) {
        const subModEncontrado = window.allSubModulosData.find(s => String(s.id || s.clave || s.seccion) === String(idOpt));
        if (subModEncontrado) {
            optEncontrada = { title: subModEncontrado.nombre || subModEncontrado.titulo || subModEncontrado.descripcion };
        }
    }

    // Títulos predeterminados robustos según el ID o sección si todo lo demás falla
    let tituloFallback = "Módulo de Recursos Humanos";
    const idMinus = String(idOpt).toLowerCase();
    if (idMinus.includes('personal') || idMinus === 'per' || idMinus === '1') {
        tituloFallback = "Personal";
    } else if (idMinus.includes('asistencia') || idMinus.includes('asis') || idMinus === 'biometrico' || idMinus === '2') {
        tituloFallback = "Control Asistencia";
    } else if (idMinus.includes('vacaciones') || idMinus === '3') {
        tituloFallback = "Vacaciones";
    } else if (idMinus.includes('oficios') || idMinus === '4') {
        tituloFallback = "Oficios";
    }

    const tituloFinal = (optEncontrada && optEncontrada.title) ? optEncontrada.title : tituloFallback;

    if (idMinus.includes('personal') || idMinus === 'per' || idMinus === '1' || tituloFinal.toLowerCase().includes('personal')) {
        if (typeof cargarPersonalRh === 'function') {
            cargarPersonalRh(true);
        } else {
            renderizarVistaModuloRh(idOpt, tituloFinal);
        }
    } 
    else if (idMinus.includes('asistencia') || idMinus.includes('asis') || idMinus === 'biometrico' || idMinus === '2' || tituloFinal.toLowerCase().includes('asistencia')) {
        cargarAsistenciaRh();
    } 
    else {
        renderizarVistaModuloRh(idOpt, tituloFinal);
    }
}

function cargarAsistenciaRh() {
    const urlActual = new URL(window.location);
    urlActual.searchParams.set('seccion', 'asistencia');
    window.history.pushState({ seccion: 'asistencia' }, '', urlActual);

    sessionStorage.setItem('seccion_activa_actual', 'asistencia');

    if (typeof window.RhAsisCasc !== 'undefined' && window.RhAsisCasc.mostrarVistaBiometrico) {
        window.RhAsisCasc.mostrarVistaBiometrico();
    } else if (typeof cargarVistaBiometrico === 'function') {
        cargarVistaBiometrico();
    }

    const deptoActual = new URLSearchParams(window.location.search).get('depto') || 'cirnorh';
    if (typeof window.actualizarBotonRegresar === 'function') {
        window.actualizarBotonRegresar('submodulo', deptoActual);
    }
}

function renderizarVistaModuloRh(idOpt, tituloModulo) {
    const contenedor = obtenerContenedor();
    const nombreCortoActual = new URLSearchParams(window.location.search).get('depto') || 'cirnorh';

    if (contenedor) {
        if (typeof window.actualizarBotonRegresar === 'function') {
            window.actualizarBotonRegresar('submodulo', nombreCortoActual);
        }

        contenedor.innerHTML = `
            <section class="bg-white rounded-2xl p-6 md:p-8 soft-shadow border border-[#249444]/10 mb-8 animate-fade-in">
                <div class="flex items-center gap-3 mb-6 pb-4 border-b border-stone-100">
                    <div class="p-2.5 bg-[#f0fdf4] border border-[#c6f6d5] text-[#059669] rounded-xl flex items-center justify-center">
                        <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M18 21a8 8 0 0 0-16 0'/><circle cx='10' cy='8' r='5'/><path d='M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3'/></svg>                    </div>
                    <div>
                        <h3 class="font-black text-stone-800 text-lg uppercase tracking-wide">${tituloModulo}</h3>
                    </div>
                </div>
                <div id="contenido-submodulo-dinamico" class="w-full space-y-6">
                    <div class="p-6 rounded-xl border border-dashed border-stone-200 bg-stone-50 text-center">
                        <p class="text-xs text-stone-500 font-medium">Área de trabajo para: ${tituloModulo}</p>
                    </div>
                </div>
            </section>
        `;
    }
}

// ==========================================
// CONTROLADOR MAESTRO DE NAVEGACIÓN E HISTORIAL
// ==========================================
async function procesarCargaInicialSeccionRh(event) {
    const urlParams = new URLSearchParams(window.location.search);
    const seccion = event && event.state && 'seccion' in event.state
        ? event.state.seccion
        : urlParams.get('seccion');
    const depto = urlParams.get('depto') || 'cirnorh';
    const contenedor = obtenerContenedor();

    if (!window.allSubModulosData || window.allSubModulosData.length === 0) {
        await cargarDatosDelSistema();
    }

    if (seccion) {
        sessionStorage.setItem(`submodulo_activo_${depto}`, seccion);
        if (typeof window.actualizarBotonRegresar === 'function') {
            window.actualizarBotonRegresar('submodulo', depto);
        }
        ejecutarCargaSeccionRh(seccion);
    } else {
        sessionStorage.removeItem(`submodulo_activo_${depto}`);
        if (typeof window.actualizarBotonRegresar === 'function') {
            window.actualizarBotonRegresar('principal', depto);
        }

        if (contenedor) contenedor.innerHTML = '';
        
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

window.addEventListener('popstate', (event) => {
    procesarCargaInicialSeccionRh(event);
});

document.addEventListener('DOMContentLoaded', async () => {
    await cargarDatosDelSistema();
    await procesarCargaInicialSeccionRh();
});