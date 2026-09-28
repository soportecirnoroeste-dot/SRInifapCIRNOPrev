// js/cirnorh/personal_form.js

async function mostrarFormularioNuevoPersonal() {
    const formContainer = document.getElementById('contenedor-formulario-personal');
    const gestionContainer = document.getElementById('contenedor-gestion-personal');
    const listadoContainer = document.getElementById('contenedor-listado-personal');
    const form = document.getElementById('form-nuevo-personal');
    const titulo = document.getElementById('formulario');
    const inputNumEmp = document.getElementById('input-numEmp');

    if (formContainer && form) {
        form.reset();
        if (!window._catRegs || window._catRegs.length === 0) {
            await cargarCatalogosSheets(true);
        }

        if (typeof poblarSelectoresCascada === 'function') {
            poblarSelectoresCascada('', '', '');
        }

        inputNumEmp.removeAttribute('readonly');
        titulo.innerHTML = `Capturar Nuevo Empleado`;
        formContainer.classList.remove('hidden');
        if (gestionContainer) gestionContainer.classList.add('hidden');
        if (listadoContainer) listadoContainer.classList.add('hidden');
        formContainer.scrollIntoView({ behavior: 'smooth' });
    }
}

function ocultarFormularioPersonal() {
    const formContainer = document.getElementById('contenedor-formulario-personal');
    const gestionContainer = document.getElementById('contenedor-gestion-personal');
    const listadoContainer = document.getElementById('contenedor-listado-personal');

    if (formContainer) formContainer.classList.add('hidden');
    if (gestionContainer) gestionContainer.classList.remove('hidden');
    if (listadoContainer) listadoContainer.classList.remove('hidden');

    if (window._empleadosCache && window._empleadosCache.length > 0) {
        renderizarTablaPersonal(window._empleadosCache);
    }
}

function cancelarEdicionPersonal() {
    const formContainer = document.getElementById('contenedor-formulario-personal');
    const gestionContainer = document.getElementById('contenedor-gestion-personal');
    const listadoContainer = document.getElementById('contenedor-listado-personal');

    if (formContainer) formContainer.classList.add('hidden');
    if (gestionContainer) gestionContainer.classList.remove('hidden');
    if (listadoContainer) listadoContainer.classList.remove('hidden');

    if (window._empleadosCache && window._empleadosCache.length > 0) {
        renderizarTablaPersonal(window._empleadosCache);
    }
}

async function seleccionarEmpleadoParaEditar(numEmpParam) {
    if (!window._empleadosCache || window._empleadosCache.length === 0) {
        try {
            const data = await FetchAPI('obtenerPersonal');
            window._empleadosCache = data || [];
        } catch (error) {
            console.error("❌ Error al recuperar empleados:", error);
        }
    }

    const busqueda = String(numEmpParam || '').trim();

    // Buscamos de forma segura por número de empleado
    let emp = window._empleadosCache.find(e => String(e.numEmp || e.noEmp || '').trim() === busqueda);

    if (!emp) {
        alert("No se pudieron cargar los datos del empleado.");
        return;
    }

    await cargarCatalogosSheets();

    const form = document.getElementById('form-nuevo-personal');
    const formContainer = document.getElementById('contenedor-formulario-personal');
    const gestionContainer = document.getElementById('contenedor-gestion-personal');
    const listadoContainer = document.getElementById('contenedor-listado-personal');
    const titulo = document.getElementById('titulo-formulario');
    const inputNumEmp = document.getElementById('input-numEmp');

    if (formContainer && form) {
        const regVal = extraerClave(emp.claveReg || emp.textoReg);
        const centroVal = extraerClave(emp.claveCentro || emp.textoCentro);
        let rawSit = extraerClave(emp.claveSit || emp.textoSit);
        const sitVal = (!rawSit || rawSit === 0 || rawSit === '0' || String(rawSit).trim().toUpperCase() === 'N/A') ? 'N/A' : rawSit;

        if (typeof poblarSelectoresCascada === 'function') {
            poblarSelectoresCascada(regVal, centroVal, sitVal);
        }

        form.elements['numEmp'].value = limpiarValor(emp.numEmp || emp.noEmp);
        inputNumEmp.setAttribute('readonly', true);
        form.elements['nombre'].value = limpiarValor(emp.nombre);
        form.elements['ext'].value = limpiarValor(emp.ext);
        form.elements['numPers'].value = limpiarValor(emp.numPers);
        form.elements['escolaridad'].value = limpiarValor(emp.escolaridad);
        form.elements['direccion'].value = limpiarValor(emp.direccion);
        form.elements['cp'].value = limpiarValor(emp.cp);
        form.elements['email'].value = limpiarValor(emp.email);
        form.elements['rfc'].value = limpiarValor(emp.rfc);

        // Mapeo a las nuevas columnas
        form.elements['NumPto'].value = limpiarValor(emp.NumPto || emp.numPto || emp.puesto);
        form.elements['NomCorDep'].value = limpiarValor(emp.NomCorDep || emp.nomCorDep || emp.departamento);

        form.elements['ciudad'].value = limpiarValor(emp.ciudad);
        form.elements['estado'].value = limpiarValor(emp.estado);

        // Título estilizado adaptado exactamente como lo pediste
        if (titulo) {
            titulo.innerHTML = `<div class="p-4 border-stone-100 flex flex-wrap justify-between items-center gap-4 bg-white">
                        <div class="font-bold text-xs text-stone-700 uppercase tracking-wider"> 
                            <p class="text-xs text-stone-500">Editando permisos para: <span class="font-bold text-stone-800">${limpiarValor(emp.nombre)}</span> (No. Empleado: ${limpiarValor(emp.numEmp)})</p>
                        </div>
                    </div>`;
        }

        formContainer.classList.remove('hidden');
        if (gestionContainer) gestionContainer.classList.add('hidden');
        if (listadoContainer) listadoContainer.classList.add('hidden');
    }
}

async function guardarOActualizarPersonal(event) {
    event.preventDefault();
    const form = event.target;

    if (typeof mostrarCarga === 'function') mostrarCarga();

    const formData = new FormData(form);
    let datosEmpleado = Object.fromEntries(formData.entries());

    const selectReg = form.querySelector('#select-claveReg');
    if (selectReg && selectReg.selectedIndex >= 0) {
        const optionText = selectReg.options[selectReg.selectedIndex].text;
        datosEmpleado.textoReg = optionText !== 'Seleccione una región...' ? optionText : datosEmpleado.claveReg;
    }

    const selectCentro = form.querySelector('#select-claveCentro');
    if (selectCentro && selectCentro.selectedIndex >= 0) {
        const optionText = selectCentro.options[selectCentro.selectedIndex].text;
        datosEmpleado.textoCentro = optionText !== 'Seleccione un centro...' ? optionText : datosEmpleado.claveCentro;
    }

    // Asegurar valores desde los selects actualizados de Puesto y Departamento
    const selectPuesto = form.querySelector('#select-NumPto');
    if (selectPuesto) {
        datosEmpleado.NumPto = selectPuesto.value || '';
    }

    const selectDepto = form.querySelector('#select-NomCorDep');
    if (selectDepto) {
        datosEmpleado.NomCorDep = selectDepto.value || '';
    }

    if (!datosEmpleado.claveSit || String(datosEmpleado.claveSit).trim() === '') {
        datosEmpleado.claveSit = 'N/A';
    }

    if (typeof convertirObjetoAMayusculas === 'function') {
        datosEmpleado = convertirObjetoAMayusculas(datosEmpleado);
    }

    const formDataFinal = new FormData();
    for (const key in datosEmpleado) {
        formDataFinal.append(key, datosEmpleado[key]);
    }

    const actionName = window._empleadosCache.some(e => String(e.numEmp || e.noEmp).trim() === String(datosEmpleado.numEmp).trim()) ? 'actualizarPersonal' : 'guardarPersonal';

    const btnSubmit = form.querySelector('button[type="submit"]');
    if (btnSubmit) btnSubmit.disabled = true;

    try {
        const res = await FetchAPI(actionName, formDataFinal);
        alert(res.message || "Guardado exitoso");
        ocultarFormularioPersonal();
        cargarDatosGenerales(true);
    } catch (e) {
        console.error("Error al guardar:", e);
        alert("Error de conexión al guardar.");
    } finally {
        if (btnSubmit) btnSubmit.disabled = false;
        if (typeof ocultarCarga === 'function') ocultarCarga();
    }
}

function limpiarValor(val) {
    return (!val || val === 0 || val === '0' || String(val).trim() === '') ? '' : val;
}

function extraerClave(val) {
    if (!val) return '';
    const str = String(val).trim();
    if (str.includes(' - ')) return str.split(' - ')[0].trim();
    return str;
}