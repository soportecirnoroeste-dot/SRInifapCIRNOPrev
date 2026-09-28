// js/cirnorh/personal_cascada.js

function poblarSelectoresCascada(regSeleccionada = '', centroSeleccionado = '', sitioSeleccionado = '', deptoSeleccionado = '') {
    const selectReg = document.getElementById('select-claveReg');
    const selectCentro = document.getElementById('select-claveCentro');
    const selectSitio = document.getElementById('select-claveSit');
    const selectDepto = document.getElementById('select-departamento');

    if (!selectReg || !selectCentro || !selectSitio) return;

    // 1. Llenar Regiones (Original)
    const regsArray = Array.isArray(window._catRegs) ? window._catRegs : [];
    selectReg.innerHTML = '<option value="" disabled selected>Seleccione una región...</option>' +
        regsArray.map(r => `<option value="${r.claveReg}">${r.claveReg} - ${r.regional}</option>`).join('');

    // 2. Llenar Departamentos
    if (selectDepto) {
        const deptosArray = Array.isArray(window._catDepartamentos) ? window._catDepartamentos : [];
        
        selectDepto.innerHTML = '<option value="" disabled selected>Seleccione un departamento...</option>' +
            deptosArray.map(d => {
                const nombreCortoValor = d.nomCorDep || ''; // 👈 AQUÍ ESTÁ EL TRUCO: Usamos nomCorDep para que sea el value
                const nombreLargoTexto = d.nomDep || '';     // 👈 Este es el texto descriptivo que ve el usuario

                return `<option value="${nombreCortoValor}">${nombreLargoTexto}</option>`;
            }).join('');

        if (deptoSeleccionado) {
            selectDepto.value = deptoSeleccionado;
        }
    }

    // 3. Si hay región seleccionada (al editar), disparamos tu cascada original intacta
    if (regSeleccionada) {
        selectReg.value = regSeleccionada;
        filtrarCentrosPorRegion(centroSeleccionado, sitioSeleccionado);
    } else {
        selectCentro.innerHTML = '<option value="" disabled selected>Seleccione un centro...</option>';
        selectSitio.innerHTML = '<option value="" disabled selected>Seleccione un sitio...</option>';
    }
}

function filtrarCentrosPorRegion(centroActual = '', sitActual = '') {
    const selReg = document.getElementById('select-claveReg');
    const selCentro = document.getElementById('select-claveCentro');
    const selSit = document.getElementById('select-claveSit');

    if (!selReg || !selCentro || !selSit) return;

    const regionSeleccionada = selReg.value;

    // Resetear Centros y Sitios (Exactamente como lo tenías)
    selCentro.innerHTML = `<option value="" disabled selected>Seleccione un centro...</option>`;
    selSit.innerHTML = `<option value="" disabled selected>Seleccione un sitio...</option>`;

    // Filtrar Centros por Región (Exactamente como lo tenías)
    const centrosArray = Array.isArray(window._catCentros) ? window._catCentros : [];
    const centrosFiltrados = regionSeleccionada ? centrosArray.filter(c => {
        const regEnFila = String(c.ClaveReg || c.claveReg || c.CLAVEREG || '').trim();
        return regEnFila === String(regionSeleccionada).trim();
    }) : [];

    if (centrosFiltrados.length > 0) {
        selCentro.innerHTML += centrosFiltrados.map(c => {
            const claveC = c.ClaveCentro || c.claveCentro || c.CLAVECENTRO || c.clave || '';
            const nombreC = c.Centro || c.centro || c.nombre || '';
            const selected = (String(claveC) === String(centroActual)) ? 'selected' : '';
            return `<option value="${claveC}" ${selected}>${claveC} - ${nombreC}</option>`;
        }).join('');
    }

    // Si hay un centro a evaluar, filtramos los sitios (Exactamente como lo tenías)
    const centroIdAUsar = centroActual || selCentro.value;
    if (centroIdAUsar) {
        filtrarSitiosPorCentro(centroIdAUsar, sitActual);
    }
}

function filtrarSitiosPorCentro(claveCentro = '', sitActual = '') {
    const selSit = document.getElementById('select-claveSit');
    if (!selSit) return;

    selSit.innerHTML = `<option value="" disabled selected>Seleccione un sitio...</option>`;

    const centroId = (claveCentro || document.getElementById('select-claveCentro')?.value || '').trim();

    if (!centroId || centroId.toLowerCase().includes("seleccione")) {
        selSit.innerHTML = `<option value="" disabled selected>Seleccione un sitio...</option>`;
        return;
    }

    const sitiosArray = Array.isArray(window._catSitios) ? window._catSitios : [];
    const sitiosFiltrados = sitiosArray.filter(s => {
        const cAsociado = String(s.claveCentro || s.ClaveCentro || '').trim();
        return cAsociado === centroId;
    });

    let opcionesHTML = ``;
    if (sitiosFiltrados.length > 0) {
        opcionesHTML += sitiosFiltrados.map(s => {
            const claveS = String(s.claveS || s.claveSit || s.ClaveSitio || s.clave || '').trim();
            const nombreS = s.sitio || s.Sitio || s.nombre || '';
            return `<option value="${claveS}">${claveS} - ${nombreS}</option>`;
        }).join('');
    } else {
        opcionesHTML += `<option value="N/A" selected>N/A - No aplica</option>`;
    }

    selSit.innerHTML = `<option value="N/A">N/A - No aplica</option>` + opcionesHTML;

    // Seleccionar el sitio actual si se provee (Exactamente como lo tenías)
    if (sitActual) {
        selSit.value = sitActual;
    } else if (sitiosFiltrados.length === 0) {
        selSit.value = "N/A";
    }
}

// Auto-conector universal para enlazar los eventos change sin fricción en el DOM
function inicializarEventosCascada() {
    const selReg = document.getElementById('select-claveReg');
    if (selReg) {
        selReg.removeEventListener('change', eventoRegionesChange);
        selReg.addEventListener('change', eventoRegionesChange);
    }

    const selCentro = document.getElementById('select-claveCentro');
    if (selCentro) {
        selCentro.removeEventListener('change', eventoCentrosChange);
        selCentro.addEventListener('change', eventoCentrosChange);
    }
}

function eventoRegionesChange() {
    filtrarCentrosPorRegion();
}

function eventoCentrosChange(e) {
    filtrarSitiosPorCentro(e.target.value);
}

// Auto-conector por si el DOM ya está listo
document.addEventListener("DOMContentLoaded", () => {
    inicializarEventosCascada();
});
