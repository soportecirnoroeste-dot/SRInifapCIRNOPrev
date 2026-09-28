// js/cirnorh/asistencia/RhAsisCore.js

function cargarAsistenciaRh() {
    renderizarVistaModulo('asistencia', "Registro de retardos, faltas, permisos y justificantes.", [
        {
            titulo: "CARGA DE DATOS BIOMÉTRICO",
            desc: "Importación masiva de checadas (TXT/CSV/Excel) del dispositivo físico.",
            action: "RhAsisCasc.mostrarVistaBiometrico()"
        },
        {
            titulo: "CONTROL DE RETARDOS",
            desc: "Monitoreo y acumulación quincenal de entradas tarde.",
            action: "RhAsisCasc.mostrarControlRetardos()"
        },
        {
            titulo: "JUSTIFICANTES MÉDICOS",
            desc: "Carga y validación de incapacidades o permisos oficiales.",
            action: "RhAsisCasc.mostrarModalJustificante()"
        },
        {
            titulo: "REPORTE DE ASISTENCIA",
            desc: "Generación de listas de asistencia globales por centro.",
            action: "RhAsisCasc.mostrarReporteGlobal()"
        }
    ]);
}

window.RhAsisCore = {
    init: function () {
        cargarAsistenciaRh();
    }
};