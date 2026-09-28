// js/SisPer/SisPerCasc.js

function cargarPermisosSis() {
    if (typeof window.renderizarListadoPermisosSis === 'function') {
        window.renderizarListadoPermisosSis();
    } else {
        console.error("SisPerCore no está cargado correctamente.");
    }
}

function actualizarDatosPermisosSis() {
    cargarPermisosSis();
}

// Exportamos únicamente las de este archivo de cascada de forma segura
window.cargarPermisosSis = cargarPermisosSis;
window.actualizarDatosPermisosSis = actualizarDatosPermisosSis;