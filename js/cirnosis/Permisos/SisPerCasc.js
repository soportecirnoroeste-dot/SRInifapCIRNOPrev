// ==========================================
// MÓDULO DE PERMISOS - SISPER CASCADA / UTILIDADES
// ==========================================

function cargarPermisosSis() {
    if (typeof window.renderizarListadoPermisosSis === 'function') {
        window.renderizarListadoPermisosSis();
    } else {
        console.error("SisPerForm no está cargado correctamente.");
    }
}

function actualizarDatosPermisosSis() {
    if (typeof window._empleadosCache !== 'undefined') {
        window._empleadosCache = null;
    }
    cargarPermisosSis();
}

// Exportaciones globales seguras
window.cargarPermisosSis = cargarPermisosSis;
window.actualizarDatosPermisosSis = actualizarDatosPermisosSis;