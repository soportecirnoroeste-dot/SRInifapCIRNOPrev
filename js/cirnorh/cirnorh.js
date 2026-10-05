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
// CARGA INSTÁNTANEA CON CACHÉ Y RED EN SEGUNDO PLANO
// ==========================================
function cargarDatosDelSistema() {
    return new Promise((resolve) => {
        let datosCacheados = { success: true, submodulos: [] };
        try {
            const cacheGuardada = localStorage.getItem('sistema_cache_datos');
            if (cacheGuardada) {
                const parsed = JSON.parse(cacheGuardada);
                // Validar que la caché tenga datos reales de submódulos
                if (parsed && Array.isArray(parsed.submodulos) && parsed.submodulos.length > 0) {
                    datosCacheados = parsed;
                } else {
                    // Si está corrupta o vacía, la eliminamos para forzar red
                    localStorage.removeItem('sistema_cache_datos');
                }
            }
        } catch (err) {
            localStorage.removeItem('sistema_cache_datos');
        }

        window.allSubModulosData = datosCacheados.submodulos || [];
        window.datosSistema = datosCacheados;

        if (typeof window.cargarMenuDepartamento === 'function') {
            window.cargarMenuDepartamento();
        }

        resolve(datosCacheados);
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
                    
                    // Actualizar menú visualmente una vez que llegan los datos frescos de la red
                    if (typeof window.cargarMenuDepartamento === 'function') {
                        window.cargarMenuDepartamento();
                    } else if (typeof window.restaurarMenuDepto === 'function') {
                        window.restaurarMenuDepto(new URLSearchParams(window.location.search).get('depto') || 'cirnorh');
                    }
                }
            } catch (e) {}
        }, 100);
    });
}

// ==========================================
// CONFIGURACIÓN OFICIAL (LECTURA DIRECTA DE SQL / APPS SCRIPT)
// ==========================================
window.cirnorhConfig = {
    deptoKey: "cirnorh",
    claveDep: "5", // Clave numércia o corta exacta mapeada en la BD para Recursos Humanos
    subtitle: "Gestión de personal, incidencias, nómina y desarrollo humano.",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-handshake"><path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/></svg>`,

    get options() {
        // Consulta directamente la utilidad centralizada alimentada por la base de datos
        if (window.AppConfigUtils && typeof window.AppConfigUtils.crearOpcionesDinamicas === 'function') {
            return window.AppConfigUtils.crearOpcionesDinamicas(this.claveDep, this.deptoKey);
        }
        return [];
    }
};

// Alias oficial
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
    const optEncontrada = opciones.find(o => o.id === String(idOpt));
    const tituloOpt = optEncontrada ? optEncontrada.title.toLowerCase() : '';

    const idMinus = String(idOpt).toLowerCase();

    if (idMinus.includes('personal') || idMinus === 'per' || idMinus === '1' || tituloOpt.includes('personal')) {
        if (typeof cargarPersonalRh === 'function') {
            cargarPersonalRh(true);
        } else {
            renderizarVistaModuloRh(idOpt, optEncontrada ? optEncontrada.title : "Personal");
        }
    } 
    else if (idMinus.includes('asistencia') || idMinus.includes('asis') || idMinus === 'biometrico' || idMinus === '2' || tituloOpt.includes('asistencia')) {
        cargarAsistenciaRh();
    } 
    else {
        renderizarVistaModuloRh(idOpt, optEncontrada ? optEncontrada.title : "Módulo de Recursos Humanos.");
    }
}

function limpiarSeccionUrlRh() {
    const urlParams = new URLSearchParams(window.location.search);
    const deptoActual = urlParams.get('depto') || 'cirnorh';
    sessionStorage.removeItem(`submodulo_activo_${deptoActual}`);
    
    if (urlParams.has('seccion')) {
        const nuevaUrl = `main.html?depto=${deptoActual}`;
        window.history.replaceState({}, '', nuevaUrl);
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
// CONTROLADOR MAESTRO DE NAVEGACIÓN Y HISTORIAL
// ==========================================
function procesarCargaInicialSeccionRh(event) {
    const urlParams = new URLSearchParams(window.location.search);

    const seccion = event && event.state && 'seccion' in event.state
        ? event.state.seccion
        : urlParams.get('seccion');

    const depto = urlParams.get('depto') || 'cirnorh';
    const contenedor = obtenerContenedor();

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

        if (contenedor) {
            contenedor.innerHTML = '';
        }
        
        // Llamada unificada para restaurar el menú correctamente
        if (typeof window.cargarMenuDepartamento === 'function') {
            window.cargarMenuDepartamento();
        } else {
            cargarDatosDelSistema();
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
    procesarCargaInicialSeccionRh(event);
});

document.addEventListener('DOMContentLoaded', () => {
    cargarDatosDelSistema();
    procesarCargaInicialSeccionRh();
});

// ==========================================
// CONTROLADOR ROBUSTO PARA EL HISTORIAL (BOTÓN ATRÁS)
// ==========================================
window.addEventListener('popstate', function(event) {
    // Verificar si estamos regresando al menú principal (sin submódulo activo en la URL o estado)
    const urlParams = new URLSearchParams(window.location.search);
    const submoduloActivo = urlParams.get('submodulo') || sessionStorage.getItem('submodulo_activo_cirnorh');

    if (!submoduloActivo) {
        // Asegurar la lectura inmediata de la caché local antes de renderizar
        try {
            const cacheGuardada = localStorage.getItem('sistema_cache_datos');
            if (cacheGuardada) {
                const parsed = JSON.parse(cacheGuardada);
                if (parsed && Array.isArray(parsed.submodulos) && parsed.submodulos.length > 0) {
                    window.allSubModulosData = parsed.submodulos;
                    window.datosSistema = parsed;
                }
            }
        } catch (err) {
            console.error("Error al recuperar caché en popstate:", err);
        }

        // Redibujar el menú principal con los datos recuperados
        if (typeof window.cargarMenuDepartamento === 'function') {
            window.cargarMenuDepartamento();
        }
    }
});