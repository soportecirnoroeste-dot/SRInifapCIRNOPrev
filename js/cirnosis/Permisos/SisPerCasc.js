// js/SisPer/SisPerCasc.js

function cargarPermisosSis() {
    if (typeof window.renderizarListadoPermisosSis === 'function') {
        window.renderizarListadoPermisosSis();
    } else {
        console.error("SisPerCore no está cargado correctamente.");
    }
}

function actualizarDatosPermisosSis() {
    if (typeof window._empleadosCache !== 'undefined') {
        window._empleadosCache = null;
    }
    cargarPermisosSis();
}

// Exportaciones seguras
window.cargarPermisosSis = cargarPermisosSis;
window.actualizarDatosPermisosSis = actualizarDatosPermisosSis;