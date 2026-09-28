// js/cirnodirad.js
window.cirnodiradConfig = {
    deptoKey: "cirnodirad",
    subtitle: "Supervisión general, toma de decisiones estratégicas y vinculación institucional.",
    options: [
        { id: "dashboard", title: "Resumen", icon: "📊", action: "cargarDashboardDir()" },
        { id: "proyectos", title: "Proyectos", icon: "🚀", action: "cargarProyectosDir()" },
        { id: "agenda", title: "Agenda", icon: "📅", action: "cargarAgendaDir()" },
        { id: "reportes", title: "Reportes", icon: "📈", action: "cargarReportesDir()" },
        { id: "normativa", title: "Normativa", icon: "⚖️", action: "cargarNormativaDir()" },
        { id: "generar-oficios", title: "Generar Oficios", icon: "✍️", action: "cargarGenerarOficiosDir()" }
    ]
};

// Función de Bienvenida Específica para Dirección de Administración
function cargarBienvenidaDirAd() {
    const nombreUsuario = localStorage.getItem('session_userName') || 'Usuario';
    document.getElementById('app-container').innerHTML = `
        <div class="bg-white rounded-2xl p-8 border border-stone-200 shadow-sm animate-fade-in">
            <div class="flex items-center gap-4 mb-6 pb-6 border-b border-stone-100">
                <div class="p-3 bg-stone-100 rounded-2xl text-2xl">🏢</div>
                <div>
                    <h2 class="font-black text-stone-900 text-2xl mb-1">👋 ¡Bienvenido/a, ${nombreUsuario}!</h2>
                    <p class="text-sm text-stone-600 max-w-xl">Te encuentras en el portal de la Dirección de Administración (CIRNODIRAD). Selecciona una opción en el menú superior para comenzar.</p>
                </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="p-5 bg-[#f0fdf4] rounded-xl border border-[#c6f6d5]">
                    <h4 class="font-bold text-[#059669] text-sm mb-1.5">Control Estratégico</h4>
                    <p class="text-xs text-stone-700">Monitorea los indicadores clave, proyectos y el avance operativo general.</p>
                </div>
                <div class="p-5 bg-[#fffbeb] rounded-xl border border-[#fef3c7]">
                    <h4 class="font-bold text-[#d97706] text-sm mb-1.5">Agenda y Gestión</h4>
                    <p class="text-xs text-stone-700">Consulta compromisos institucionales, reportes gerenciales y normativa interna.</p>
                </div>
                <div class="p-5 bg-[#eff6ff] rounded-xl border border-[#bfdbfe]">
                    <h4 class="font-bold text-[#2563eb] text-sm mb-1.5">Documentación Oficial</h4>
                    <p class="text-xs text-stone-700">Emite oficios y documentos normativos firmados por la dirección de manera ágil.</p>
                </div>
            </div>
            <p class="mt-6 text-xs text-stone-400 italic text-center">Última actualización de datos: ${new Date().toLocaleDateString()}</p>
        </div>
    `;
}

// Funciones de visualización específicas de la Dirección de Administración
function cargarDashboardDir() {
    document.getElementById('app-container').innerHTML = `
        <div class="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm animate-fade-in">
            <h3 class="font-black text-stone-800 text-lg mb-2">📊 Resumen Ejecutivo y Estadísticas</h3>
            <p class="text-xs text-stone-500">Indicadores clave de desempeño y estatus general de la región.</p>
        </div>
    `;
}

function cargarProyectosDir() {
    document.getElementById('app-container').innerHTML = `
        <div class="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm animate-fade-in">
            <h3 class="font-black text-stone-800 text-lg mb-2">🚀 Proyectos Estratégicos</h3>
            <p class="text-xs text-stone-500">Seguimiento y avances de los proyectos prioritarios de investigación y operación.</p>
        </div>
    `;
}

function cargarAgendaDir() {
    document.getElementById('app-container').innerHTML = `
        <div class="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm animate-fade-in">
            <h3 class="font-black text-stone-800 text-lg mb-2">📅 Agenda Institucional</h3>
            <p class="text-xs text-stone-500">Calendario de eventos, juntas directivas y compromisos de la dirección.</p>
        </div>
    `;
}

function cargarReportesDir() {
    document.getElementById('app-container').innerHTML = `
        <div class="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm animate-fade-in">
            <h3 class="font-black text-stone-800 text-lg mb-2">📈 Reportes Gerenciales</h3>
            <p class="text-xs text-stone-500">Generación y consulta de informes consolidados para oficinas centrales.</p>
        </div>
    `;
}

function cargarNormativaDir() {
    document.getElementById('app-container').innerHTML = `
        <div class="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm animate-fade-in">
            <h3 class="font-black text-stone-800 text-lg mb-2">⚖️ Normativa y Lineamientos</h3>
            <p class="text-xs text-stone-500">Políticas internas, manuales de procedimientos y marcos legales de operación.</p>
        </div>
    `;
}

function cargarGenerarOficiosDir() {
    document.getElementById('app-container').innerHTML = `
        <div class="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm animate-fade-in">
            <h3 class="font-black text-stone-800 text-lg mb-2">✍️ Generación de Oficios - Dirección de Administración</h3>
            <p class="text-xs text-stone-500 mb-4">Elaboración y emisión de documentos oficiales firmados por la dirección.</p>
            <div class="p-4 bg-stone-50 rounded-xl border border-dashed border-stone-300 text-xs text-stone-400 text-center">
                Aquí irá el formulario o generador de documentos específico para Dirección.
            </div>
        </div>
    `;
}
