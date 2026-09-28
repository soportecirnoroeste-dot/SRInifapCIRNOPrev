/**
 * ============================================================================
 * api.js - Cliente Frontend para conectar con Google Apps Script
 * URL del Web App: https://script.google.com/macros/s/AKfycbxCHnQUUDwzdyxkzY9ZzpzGtdWlfTkfBBS0ht6UdHD-ptwiRM1cP6Ilr_ZpHbDg_RhNTw/exec
 * ============================================================================
 */

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxCHnQUUDwzdyxkzY9ZzpzGtdWlfTkfBBS0ht6UdHD-ptwiRM1cP6Ilr_ZpHbDg_RhNTw/exec";

/**
 * Función genérica para enviar peticiones POST a Google Apps Script
 */
async function callAppsScript(action, payload = {}) {
    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: "POST",
            mode: "cors", // Importante para permitir peticiones cross-origin
            headers: {
                "Content-Type": "text/plain;charset=utf-8" // Usar text/plain evita bloqueos de preflight CORS en Apps Script
            },
            body: JSON.stringify({ action, ...payload })
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error("Error al comunicarse con Google Apps Script:", error);
        return {
            success: false,
            message: "Error de conexión con el servidor en la nube.",
            error: error.message
        };
    }
}

/**
 * ==========================================
 * MÉTODOS DE LA API (Endpoints del Cliente)
 * ==========================================
 */

const API = {
    /**
     * Verificar estado del sistema
     */
    async checkHealth() {
        return await callAppsScript("health");
    },

    /**
     * Obtener los datos del sistema (módulos, regiones, sitios, etc.)
     */
    async getSistemaDatos() {
        return await callAppsScript("getSistemaDatos");
    },

    /**
     * Ejemplo de función para el login de usuarios
     */
    async login(usuario, password) {
        return await callAppsScript("login", { usuario, password });
    }
};

// Exportar o hacer global para usarlo en tus otros scripts del frontend
window.API = API;