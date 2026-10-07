// ==========================================
// CASCADA DE SELECTORES (REGIONES -> CENTROS -> SITIOS -> DEPTOS)
// ==========================================

function poblarSelectoresCascada(regSeleccionada = '', centroSeleccionado = '', sitioSeleccionado = '', deptoSeleccionado = '') {
    const selectReg = document.getElementById('select-SRIRegId');
    const selectCentro = document.getElementById('select-SRICenId');
    const selectSitio = document.getElementById('select-SRISitId');
    const selectDepto = document.getElementById('select-SRIModNomC');

    if (!selectReg || !selectCentro || !selectSitio) return;

    // 1. Llenar Regiones
    const regsArray = Array.isArray(window._catRegs) ? window._catRegs : [];
    selectReg.innerHTML = '<option value="" disabled selected>Seleccione una región...</option>' +
        regsArray.map(r => `<option value="${r.SRIRegId || r.claveReg}">${r.SRIRegId || r.claveReg} - ${r.SRIRegNom || r.regional}</option>`).join('');

    // 2. Llenar Departamentos si existe el selector
    if (selectDepto) {
        const deptosArray = Array.isArray(window._catDepartamentos) ? window._catDepartamentos : [];
        selectDepto.innerHTML = '<option value="" disabled selected>Seleccione un departamento...</option>' +
            deptosArray.map(d => {
                const nombreCortoValor = d.SRIModNomC || d.nomCorDep || d.NomCorDep || d.claveDep || '';
                const nombreLargoTexto = d.SRIModNom || d.nomDep || d.nombre || '';
                return `<option value="${nombreCortoValor}">${nombreCortoValor} - ${nombreLargoTexto}</option>`;
            }).join('');

        if (deptoSeleccionado) {
            selectDepto.value = deptoSeleccionado;
        }
    }

    // 3. Evaluar región seleccionada para activar cascada de centros/sitios
    if (regSeleccionada) {
        selectReg.value = regSeleccionada;
        if (typeof window.filtrarCentrosPorRegion === 'function') {
            window.filtrarCentrosPorRegion(centroSeleccionado, sitioSeleccionado);
        }
    } else {
        selectCentro.innerHTML = '<option value="" disabled selected>Seleccione un centro...</option>';
        selectSitio.innerHTML = '<option value="" disabled selected>Seleccione un sitio...</option>';
    }
}

function filtrarCentrosPorRegion(centroActual = '', sitActual = '') {
    const selReg = document.getElementById('select-claveReg') || document.querySelector('select[name="claveReg"]');
    const selCentro = document.getElementById('select-claveCentro') || document.querySelector('select[name="claveCentro"]');
    const selSit = document.getElementById('select-claveSit') || document.querySelector('select[name="claveSit"]');

    if (!selReg || !selCentro || !selSit) return;

    const regionSeleccionada = selReg.value;

    selCentro.innerHTML = `<option value="" disabled selected>Seleccione un centro...</option>`;
    selSit.innerHTML = `<option value="" disabled selected>Seleccione un sitio...</option>`;

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
            return `<option value="${claveC}" ${selected}>${claveC} -${nombreC}</option>`;
        }).join('');
    }

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
        return cAsociado === String(centroId).trim();
    });

    let opcionesHTML = ``;
    if (sitiosFiltrados.length > 0) {
        opcionesHTML += sitiosFiltrados.map(s => {
            const claveS = String(s.clave || s.ClaveSitio || s.claveSit || '').trim();
            const nombreS = s.nombre || s.Sitio || s.sitio || '';
            return `<option value="${claveS}">${claveS} - ${nombreS}</option>`;
        }).join('');
    }

    selSit.innerHTML = `<option value="N/A">N/A - No aplica</option>` + opcionesHTML;

    if (sitActual) {
        selSit.value = sitActual;
    } else if (sitiosFiltrados.length === 0) {
        selSit.value = "N/A";
    }
}

// Inicializadores de eventos change
document.addEventListener("DOMContentLoaded", () => {
    const selReg = document.getElementById('select-claveReg');
    if (selReg) {
        selReg.addEventListener('change', () => filtrarCentrosPorRegion());
    }

    const selCentro = document.getElementById('select-claveCentro');
    if (selCentro) {
        selCentro.addEventListener('change', (e) => filtrarSitiosPorCentro(e.target.value));
    }
});