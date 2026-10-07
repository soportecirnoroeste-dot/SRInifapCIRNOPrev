// ==========================================
// CASCADA DE SELECTORES (REGIONES -> CENTROS -> SITIOS -> DEPTOS)
// ==========================================

function matchClave(a, b) {
    const strA = String(a || '').trim();
    const strB = String(b || '').trim();
    if (strA === strB) return true;
    if (!isNaN(strA) && !isNaN(strB) && strA !== '' && strB !== '') {
        return Number(strA) === Number(strB);
    }
    return false;
}

function extraerClave(val) {
    if (!val) return '';
    const str = String(val).trim();
    if (str.includes(' - ')) return str.split(' - ')[0].trim();
    return str;
}

function poblarSelectoresCascada(regSeleccionada = '', centroSeleccionado = '', sitioSeleccionado = '', deptoSeleccionado = '') {
    const selectReg = document.getElementById('select-SRIRegId');
    const selectCentro = document.getElementById('select-SRICenId');
    const selectSitio = document.getElementById('select-SRISitId');
    const selectDepto = document.getElementById('select-SRIModNomC');

    if (!selectReg || !selectCentro || !selectSitio) return;

    // 1. Llenar Regiones
    const regsArray = Array.isArray(window._catRegs) ? window._catRegs : [];
    selectReg.innerHTML = '<option value="" disabled selected>Seleccione una región...</option>' +
        regsArray.map(r => {
            const idR = r.SRIRegId || r.claveReg || '';
            const nomR = r.SRIRegNom || r.regional || '';
            return `<option value="${idR}">${idR} - ${nomR}</option>`;
        }).join('');

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

    // 3. Evaluar región seleccionada para activar cascada de centros/sitios delegando al núcleo
    if (regSeleccionada) {
        selectReg.value = extraerClave(regSeleccionada);
        if (typeof window.filtrarCentrosPorRegion === 'function') {
            window.filtrarCentrosPorRegion(centroSeleccionado, sitioSeleccionado);
        }
    } else {
        selectCentro.innerHTML = '<option value="" disabled selected>Seleccione un centro...</option>';
        selectSitio.innerHTML = '<option value="" disabled selected>Seleccione un sitio...</option>';
    }
}