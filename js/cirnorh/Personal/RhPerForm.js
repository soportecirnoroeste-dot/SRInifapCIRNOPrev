// js/cirnorh/personal_form.js

async function mostrarFormularioNuevoPersonal() {
    const formContainer = document.getElementById('contenedor-formulario-personal');
    const gestionContainer = document.getElementById('contenedor-gestion-personal');
    const listadoContainer = document.getElementById('contenedor-listado-personal');
    const form = document.getElementById('form-nuevo-personal');
    const titulo = document.getElementById('titulo-formulario'); // Corregido ID
    const inputNumEmp = document.getElementById('input-SRIPerNumE'); // Corregido ID

    if (formContainer && form) {
        form.reset();
        if (!window._catRegs || window._catRegs.length === 0) {
            await cargarCatalogosSheets(true);
        }

        if (typeof poblarSelectoresCascada === 'function') {
            poblarSelectoresCascada('', '', '');
        }

        if (inputNumEmp) inputNumEmp.removeAttribute('readonly');
        if (titulo) titulo.innerHTML = `Capturar Nuevo Empleado`;
        
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
        // Llamar al filtro global en lugar de renderizar la caché cruda
        if (typeof aplicarFiltroYRenderizar === 'function') {
            aplicarFiltroYRenderizar(window._empleadosCache);
        } else {
            renderizarTablaPersonal(window._empleadosCache);
        }
    }
}

function cancelarEdicionPersonal() {
    ocultarFormularioPersonal();
}

// Función auxiliar para seleccionar opciones de forma flexible (ignora ceros, espacios y descripciones)
function seleccionarOpcionFlexible(selectElement, valorBuscado) {
    if (!selectElement || !valorBuscado) return;
    const limpioBuscado = extraerClave(valorBuscado);
    
    for (let option of selectElement.options) {
        const valorOpt = extraerClave(option.value);
        const textoOpt = extraerClave(option.text);
        
        // Compara si coincide la clave numérica, el texto o el valor completo
        if (matchClave(valorOpt, limpioBuscado) || matchClave(textoOpt, limpioBuscado) || matchClave(option.value, valorBuscado)) {
            selectElement.value = option.value;
            selectElement.dispatchEvent(new Event('change'));
            return;
        }
    }
}

async function seleccionarEmpleadoParaEditar(numEmpParam) {
    if (!window._empleadosCache || window._empleadosCache.length === 0) {
        try {
            const params = {
                usuario: window.usuarioLogueado?.SRIPerNumE || window.numEmpUsuario || '',
                SRIRegId: window.usuarioLogueado?.SRIRegId || window.regIdUsuario || '',
                SRICenId: window.usuarioLogueado?.SRICenId || window.cenIdUsuario || ''
            };

            const data = await FetchAPI('obtenerPersonalSQL', params);
            window._empleadosCache = data || [];
        } catch (error) {
            console.error("❌ Error al recuperar empleados:", error);
        }
    }

    const busqueda = String(numEmpParam || '').trim();
    let emp = window._empleadosCache.find(e => String(e.SRIPerNumE || '').trim() === busqueda);

    if (!emp) {
        alert("No se pudieron cargar los datos del empleado.");
        return;
    }

    // 1. IMPORTANTE: Esperar a que los catálogos estén completamente cargados y pintados en el DOM
    await cargarCatalogosSheets();

    const form = document.getElementById('form-nuevo-personal');
    const formContainer = document.getElementById('contenedor-formulario-personal');
    const gestionContainer = document.getElementById('contenedor-gestion-personal');
    const listadoContainer = document.getElementById('contenedor-listado-personal');
    const titulo = document.getElementById('titulo-formulario');
    const inputNumEmp = document.getElementById('input-SRIPerNumE');

    if (formContainer && form) {
        const regVal = extraerClave(emp.SRIRegId);
        const centroVal = extraerClave(emp.SRICenId);
        let rawSit = extraerClave(emp.SRISitId);
        const sitVal = (!rawSit || rawSit === 0 || rawSit === '0' || String(rawSit).trim().toUpperCase() === 'N/A') ? 'N/A' : rawSit;

        // 2. Poblar cascada de Región -> Centro -> Sitio
        if (typeof poblarSelectoresCascada === 'function') {
            poblarSelectoresCascada(regVal, centroVal, sitVal);
        }

        form.elements['SRIPerNumE'].value = limpiarValor(emp.SRIPerNumE);
        if (inputNumEmp) inputNumEmp.setAttribute('readonly', true);
        
        form.elements['SRIPerNomE'].value = limpiarValor(emp.SRIPerNomE);
        form.elements['SRIPerNExt'].value = limpiarValor(emp.SRIPerNExt);
        form.elements['SRIPerNCel'].value = limpiarValor(emp.SRIPerNCel);
        form.elements['SRIPerEsco'].value = limpiarValor(emp.SRIPerEsco);
        form.elements['SRIPerDir'].value = limpiarValor(emp.SRIPerDir);
        form.elements['SRIPerCP'].value = limpiarValor(emp.SRIPerCP);
        form.elements['SRIPerEml'].value = limpiarValor(emp.SRIPerEml);
        form.elements['SRIPerRFC'].value = limpiarValor(emp.SRIPerRFC);
        
        // 3. Forzar selección explícita del puesto y departamento con un pequeño respiro (setTimeout)
        // Esto garantiza que el navegador haya terminado de renderizar las opciones del <select>
        setTimeout(() => {
            seleccionarOpcionFlexible(form.elements['SRIPtoId'], emp.SRIPtoId);
            seleccionarOpcionFlexible(form.elements['SRIModNomC'], emp.SRIModNomC);
        }, 50);

        form.elements['SRIPerCd'].value = limpiarValor(emp.SRIPerCd);
        form.elements['SRIPerEdo'].value = limpiarValor(emp.SRIPerEdo);

        if (titulo) {
            titulo.innerHTML = `Editando empleado: <span class="text-[#249444]">${limpiarValor(emp.SRIPerNomE)}</span> (No. Empleado: ${limpiarValor(emp.SRIPerNumE)})`;
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

    if (!datosEmpleado.SRISitId || String(datosEmpleado.SRISitId).trim() === '') {
        datosEmpleado.SRISitId = '0';
    }

    const formDataFinal = new FormData();
    for (const key in datosEmpleado) {
        formDataFinal.append(key, datosEmpleado[key]);
    }

    const existe = window._empleadosCache.some(e => String(e.SRIPerNumE).trim() === String(datosEmpleado.SRIPerNumE).trim());
    const actionName = existe ? 'actualizarPersonalSQL' : 'guardarPersonalSQL';

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

