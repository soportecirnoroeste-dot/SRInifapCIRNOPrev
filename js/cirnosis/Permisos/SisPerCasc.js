// ==========================================
// MÓDULO DE PERMISOS - SISPER CASCADA / UTILIDADES
// ==========================================
async function cargarPermisosSis() {
    const contenedorDinamico = document.getElementById('contenido-submodulo-dinamico');
    if (!contenedorDinamico) return;

    // 1. Restaurar la estructura principal de la tabla
    contenedorDinamico.className = "col-span-1 sm:col-span-2 md:col-span-3 space-y-6 animate-fade-in";
    contenedorDinamico.innerHTML = `
        <div class="w-full space-y-6 bg-white p-6 md:p-8 rounded-2xl soft-shadow border border-[#249444]/10 mb-8 animate-fade-in">
            <div class="flex items-center justify-between pb-4 border-b border-stone-100">
                <div class="flex items-center gap-3">
                    <div class="p-2.5 bg-[#f0fdf4] border border-[#c6f6d5] text-[#059669] rounded-xl flex items-center justify-center">
                        <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M19 11v6'/><path d='M19 13h2'/><path d='M2 21a8 8 0 0 1 12.868-6.349'/><circle cx='10' cy='8' r='5'/><circle cx='19' cy='19' r='2'/></svg>
                    </div>
                    <div><h3 class="font-black text-stone-800 text-lg uppercase tracking-wide">Permisos</h3></div>
                </div>
                <button onclick="actualizarDatosPermisosSis()" class="bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                    Actualizar Datos
                </button>
            </div>

            <div class="rounded-xl border border-stone-200 overflow-hidden shadow-sm">
                <div class="p-4 border-b border-stone-100 bg-white flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p class="text-xs font-bold text-stone-700 uppercase">Listado General de Empleados</p>
                    <input type="text" id="input-buscar-permisos" oninput="filtrarTarjetasPermisosSis()" placeholder="Buscar por nombre, puesto, centro..." class="border border-stone-200 rounded-xl px-4 py-2 text-xs w-full sm:w-80 focus:outline-none focus:border-[#249444]">
                </div>

                <div class="max-h-[500px] overflow-y-auto custom-scrollbar">
                    <table class="w-full text-left border-collapse text-xs">
                        <thead class="sticky top-0 z-10 bg-stone-100">
                            <tr class="text-stone-600 font-bold border-b border-stone-200 text-[11px]">
                                <th class="p-3 pl-4">REGIÓN</th>
                                <th class="p-3">CENTRO</th>
                                <th class="p-3">NO. EMP</th>
                                <th class="p-3">NOMBRE</th>
                                <th class="p-3">PUESTO</th>
                                <th class="p-3">DEPARTAMENTO</th>
                            </tr>
                        </thead>
                        <tbody id="tabla-personal-body" class="divide-y divide-stone-100 text-stone-700">
                            <tr>
                                <td colspan="6" class="p-8 text-center text-stone-400 italic">Sincronizando datos...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    // 2. Si ya tenemos los datos en caché (_empleadosCache), los pintamos de inmediato sin recargar el servidor
    if (window._empleadosCache && window._empleadosCache.length > 0) {
        if (typeof renderizarTarjetasPermisosSis === 'function') {
            renderizarTarjetasPermisosSis(window._empleadosCache);
        }
    } else {
        // Si no hay caché, ejecutamos la carga normal con catálogos
        if (typeof cargarDatosPermisosConCatalogos === 'function') {
            await cargarDatosPermisosConCatalogos();
        }
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