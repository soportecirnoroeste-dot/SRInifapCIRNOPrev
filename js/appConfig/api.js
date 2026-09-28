// ========================================================
// MÓDULO DE CONEXIÓN CON APPS SCRIPT / BACKEND (MEJORADO)
// ========================================================
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz1wzz5zC_6Cf4thUdl_5BkAca6m_MM7IWQyPwVAQcMaraPqfX8nBGMQpSdy31_tjz1Aw/exec";

// Hacemos la URL global para que cualquier submódulo pueda usarla
window.APPS_SCRIPT_URL = APPS_SCRIPT_URL;

async function FetchAPI(action, payload = {}) {
    try {
        let bodyData;

        // Creamos una copia limpia para no mutar el objeto original del usuario
        if (payload instanceof FormData) {
            let plainObject = {};
            payload.forEach((value, key) => {
                plainObject[key] = value;
            });
            plainObject.action = action;
            bodyData = JSON.stringify(plainObject);
        } else {
            let clonedPayload = Object.assign({}, payload);
            clonedPayload.action = action;
            bodyData = JSON.stringify(clonedPayload);
        }

        let response = await fetch(APPS_SCRIPT_URL, {
            method: "POST",
            redirect: "follow", // 👈 Vital para seguir las redirecciones de Google Apps Script sin romper el POST
            headers: {
                "Content-Type": "text/plain;charset=utf-8", // 👈 Evita la pre-verificación OPTIONS que bloquea CORS en Google
            },
            body: bodyData
        });

        // Capturamos el texto primero para depurar si ocurre un error de servidor
        let rawText = await response.text();
        
        try {
            let data = JSON.parse(rawText);
            return data;
        } catch (parseError) {
            console.error("El servidor no devolvió un JSON válido. Respuesta cruda:", rawText);
            throw new Error("Respuesta inválida del servidor (verifica los permisos de implementación en Apps Script).");
        }

    } catch (error) {
        console.error("Error en FetchAPI:", error);
        throw error;
    }
}

window.FetchAPI = FetchAPI;