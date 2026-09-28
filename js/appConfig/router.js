// js/router.js
(function () {
    const params = new URLSearchParams(window.location.search);
    let nombreCortoUrl = (params.get('depto') || '').toLowerCase().trim();
    let seccionUrl = (params.get('seccion') || '').toLowerCase().trim();

    if (!nombreCortoUrl) {
        nombreCortoUrl = (localStorage.getItem('depto_activo_actual') || '').toLowerCase().trim();
    }

    if (!nombreCortoUrl) {
        console.warn("No se especificó ningún departamento en la URL.");
        mostrarErrorDepto("No se especificó ningún departamento.");
        return;
    }

    localStorage.setItem('depto_activo_actual', nombreCortoUrl);

    // Si la URL trae una sección, la respaldamos en sessionStorage; si no, intentamos recuperarla
    if (seccionUrl) {
        sessionStorage.setItem('seccion_activa_actual', seccionUrl);
    } else {
        seccionUrl = sessionStorage.getItem('seccion_activa_actual') || '';
    }

    // 1. Obtener el nombre oficial de la caché
    let nombreOficialDep = nombreCortoUrl;
    try {
        const cacheBruto = localStorage.getItem('sistema_cache_datos');
        if (cacheBruto) {
            const cacheObj = JSON.parse(cacheBruto);
            const departamentos = cacheObj.departamentos || [];
            const deptoEncontrado = departamentos.find(row => {
                const cor = (row.nomCorDep || '').toLowerCase().trim();
                if (cor) return cor === nombreCortoUrl;
                return (row.nomDep || '').toLowerCase().includes(nombreCortoUrl);
            });
            if (deptoEncontrado && deptoEncontrado.nomDep) {
                nombreOficialDep = deptoEncontrado.nomDep;
            }
        }
    } catch (e) {
        console.warn("No se pudo leer la caché local.");
    }

    // 2. Cargar dinámicamente el script del departamento
    const script = document.createElement('script');
    script.src = `js/${nombreCortoUrl}/${nombreCortoUrl}.js`;
    script.onload = () => {
        let deptoData = null;

        const posiblesNombres = [
            nombreCortoUrl + 'Config',
            nombreCortoUrl.toUpperCase() + 'Config',
            Object.keys(window).find(k => k.toLowerCase() === nombreCortoUrl + 'config')
        ];

        for (let nombreVar of posiblesNombres) {
            if (nombreVar && window[nombreVar]) {
                deptoData = window[nombreVar];
                break;
            }
        }

        if (deptoData && deptoData.options) {
            const headerDeptoTitle = document.getElementById('header-depto-title');
            if (headerDeptoTitle) {
                headerDeptoTitle.textContent = `SISTEMA REGIONAL INTERNO / ${nombreOficialDep.toUpperCase()}`;
            }

            const contenedorApp = document.getElementById('app-container');
            if (!contenedorApp) return;

            // RUTA DIRECTA: Evaluamos las secciones de Asistencia o Permisos de forma dinámica
            if ((seccionUrl === 'asistencia' || seccionUrl === 'biometrico') && window.RhAsisCasc && typeof window.RhAsisCasc.mostrarVistaBiometrico === 'function') {
                window.RhAsisCasc.mostrarVistaBiometrico();
                
                setTimeout(() => {
                    if (typeof window.actualizarBotonRegresar === 'function') {
                        window.actualizarBotonRegresar('submodulo', nombreCortoUrl);
                    }
                }, 50);

            } else if (seccionUrl === 'permisos' || seccionUrl === 'gestion-permisos') {
                // Soporte directo para el módulo de Permisos SisPer
                if (typeof window.cargarPermisosSis === 'function') {
                    window.cargarPermisosSis();
                } else if (typeof window.renderizarListadoPermisosSis === 'function') {
                    window.renderizarListadoPermisosSis();
                }
                
                setTimeout(() => {
                    if (typeof window.actualizarBotonRegresar === 'function') {
                        window.actualizarBotonRegresar('submodulo', nombreCortoUrl);
                    }
                }, 50);

            } else if (seccionUrl && window.RhAsisCasc && typeof window.RhAsisCasc[seccionUrl] === 'function') {
                window.RhAsisCasc[seccionUrl]();
                setTimeout(() => {
                    if (typeof window.actualizarBotonRegresar === 'function') {
                        window.actualizarBotonRegresar('submodulo', nombreCortoUrl);
                    }
                }, 50);
            } else {
                // Si no hay sección activa, mostramos el menú principal de tarjetas de forma limpia
                window.restaurarMenuDepto(nombreCortoUrl);
            }

        } else {
            console.error("No se encontró una estructura de opciones válida para el depto: " + nombreCortoUrl);
            mostrarErrorConfig(nombreCortoUrl, "El script cargó pero falta el objeto de configuración de opciones.");
        }
    };

    script.onerror = () => {
        console.error("No se pudo cargar el archivo de script: js/" + nombreCortoUrl + "/" + nombreCortoUrl + ".js");
        mostrarErrorConfig(nombreCortoUrl, "Archivo js/" + nombreCortoUrl + "/" + nombreCortoUrl + ".js no encontrado");
    };

    document.head.appendChild(script);
})();

// Función global para redibujar el menú principal (tarjetas) de cualquier depto
window.restaurarMenuDepto = function (nombreCortoUrl) {
    if (!nombreCortoUrl) {
        nombreCortoUrl = localStorage.getItem('depto_activo_actual') || '';
    }

    sessionStorage.removeItem('seccion_activa_actual');

    const urlClean = new URL(window.location);
    urlClean.searchParams.delete('seccion');
    window.history.replaceState({}, '', urlClean);

    const nombreVarEncontrada = Object.keys(window).find(k => k.toLowerCase() === nombreCortoUrl.toLowerCase() + 'config');
    const deptoData = nombreVarEncontrada ? window[nombreVarEncontrada] : null;
    const contenedorApp = document.getElementById('app-container');

    if (!contenedorApp || !deptoData || !deptoData.options) return;

    contenedorApp.innerHTML = '';

    const wrapper = document.createElement('section');
    wrapper.className = "bg-white rounded-2xl p-6 md:p-8 soft-shadow border border-[#249444]/10 mb-8 w-full box-border animate-fade-in";

    const headerDiv = document.createElement('div');
    headerDiv.style.cssText = "display: flex; align-items: center; gap: 16px; margin-bottom: 24px; padding-bottom: 24px; border-bottom: 2px solid #f3f4f6;";

    headerDiv.innerHTML = `
        <div style="font-size: 24px; background: #f0fdf4; color: #059669; padding: 12px; border-radius: 12px; border: 1px solid #c6f6d5; display: flex; align-items: center; justify-content: center;">
            ${deptoData.icon || ''}
        </div>
        <div>
            <h2 style="font-size: 20px; font-weight: 900; color: #249444; margin: 0 0 4px 0;">MENÚ DEL DEPARTAMENTO</h2>
            <p style="font-size: 14px; color: #4b5563; margin: 0;">${deptoData.subtitle || 'Selecciona una opción para comenzar.'}</p>
        </div>
    `;
    wrapper.appendChild(headerDiv);

    const gridDiv = document.createElement('div');
    gridDiv.style.cssText = "display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; align-items: stretch;";

    deptoData.options.forEach((opt) => {
        const card = document.createElement('div');
        card.style.cssText = "background: #f9fafb; border: 1px solid #e5e7eb; padding: 20px; border-radius: 12px; cursor: pointer; display: flex; flex-direction: column; justify-content: space-between; height: 100%; box-sizing: border-box;";

        if (opt.action) {
            card.onclick = new Function(opt.action);
        }

        card.innerHTML = `
            <div>
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                    <span style="font-size: 20px; background: #d1fae5; color: #065f46; padding: 8px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">${opt.icon}</span>
                    <h4 style="font-size: 14px; font-weight: 700; color: #1f2937; margin: 0;">${opt.title}</h4>
                </div>
                <p style="font-size: 12px; color: #4b5563; margin: 0;">Módulo de gestión para ${opt.title.toLowerCase()}.</p>
            </div>
            <div style="margin-top: 16px; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #059669;">
                Abrir módulo &rarr;
            </div>
        `;
        gridDiv.appendChild(card);
    });

    wrapper.appendChild(gridDiv);
    contenedorApp.appendChild(wrapper);

    if (typeof window.actualizarBotonRegresar === 'function') {
        window.actualizarBotonRegresar('principal', nombreCortoUrl);
    }
};

window.actualizarBotonRegresar = function (modo, deptoKey = '', extraData = null) {
    const btnRegresar = document.getElementById('btn-regresar');
    if (!btnRegresar) return;

    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    let basePath = '';
    if (window.location.hostname.includes('github.io') && pathSegments.length > 0) {
        basePath = `/${pathSegments[0]}`;
    }

    const nuevoBtn = btnRegresar.cloneNode(true);
    btnRegresar.parentNode.replaceChild(nuevoBtn, btnRegresar);

    if (modo === 'submodulo') {
        nuevoBtn.href = "#";
        nuevoBtn.title = "Regresar al menú del departamento";
        nuevoBtn.onclick = (e) => {
            e.preventDefault();
            if (typeof window.restaurarMenuDepto === 'function') {
                window.restaurarMenuDepto(deptoKey);
            } else {
                window.location.href = `main.html?depto=${deptoKey}`;
            }
        };
    } 
    else if (modo === 'vista-interna') {
        nuevoBtn.href = "#";
        nuevoBtn.title = "Regresar al submódulo de asistencia";
        nuevoBtn.onclick = (e) => {
            e.preventDefault();
            if (typeof extraData === 'function') {
                extraData();
            } else if (window.RhAsisCasc && typeof window.RhAsisCasc.mostrarVistaAsistencia === 'function') {
                window.RhAsisCasc.mostrarVistaAsistencia();
            } else {
                window.location.href = `main.html?depto=${deptoKey}&seccion=asistencia`;
            }
        };
    } 
    else {
        nuevoBtn.href = `${basePath}/index.html`;
        nuevoBtn.title = "Regresar al panel principal";
        nuevoBtn.onclick = null;
    }
};

function mostrarErrorDepto(mensaje) {
    const appElem = document.getElementById('app-container');
    if (appElem) appElem.innerHTML = `<div class="text-center py-20 font-bold text-red-500">${mensaje}</div>`;
}

function mostrarErrorConfig(nombreCorto, detalle) {
    const appElem = document.getElementById('app-container');
    if (appElem) {
        appElem.innerHTML = `
        <div class="text-center py-20 bg-white rounded-2xl border border-stone-200 shadow-sm">
            <h2 class="text-2xl font-bold text-red-500">Departamento no configurado</h2>
            <p class="text-xs text-stone-500 mt-2">No se pudo cargar correctamente para: <strong class="text-stone-800">"${nombreCorto}"</strong> (<code class="bg-stone-100 px-2 py-1 rounded text-stone-700">${detalle}</code>)</p>
            <a href="index.html" class="inline-block mt-6 px-6 py-2 bg-[#249444] text-white rounded-xl text-xs font-bold">Regresar al inicio</a>
        </div>
    `;
    }
}