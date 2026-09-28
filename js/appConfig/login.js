// ========================================================
// MÓDULO DE AUTENTICACIÓN - SISTEMA INIFAP
// ========================================================
var AuthModule = {

    togglePasswordVisibility: function () {
        var passInput = document.getElementById('login-pass');
        var eyeOpen = document.getElementById('eye-open');
        var eyeClosed = document.getElementById('eye-closed');

        if (!passInput) return;

        if (passInput.type === 'password') {
            passInput.type = 'text';
            if (eyeOpen) eyeOpen.style.display = 'none';
            if (eyeClosed) eyeClosed.style.display = 'block';
        } else {
            passInput.type = 'password';
            if (eyeOpen) eyeOpen.style.display = 'block';
            if (eyeClosed) eyeClosed.style.display = 'none';
        }
    },

    ejecutarLogin: async function () {
        if (window._loginEnProceso) return;
        window._loginEnProceso = true;

        var usuarioInput = document.getElementById('login-user').value.trim();
        var passwordInput = document.getElementById('login-pass').value.trim();

        if (!usuarioInput || !passwordInput) {
            alert("Por favor llena todos los campos.");
            window._loginEnProceso = false;
            return;
        }

        // Buscamos el botón directamente en el DOM ya que el HTML no pasa el evento
        const btnIngresar = document.querySelector('button[type="submit"]') || document.getElementById('btn-ingresar');
        const textoOriginal = btnIngresar ? btnIngresar.innerHTML : "Ingresar al Sistema";

        try {
            if (btnIngresar) {
                btnIngresar.disabled = true;
                btnIngresar.style.opacity = "0.8";
                btnIngresar.style.cursor = "not-allowed";
                btnIngresar.innerHTML = `
                    <span style="display: inline-flex; align-items: center; justify-content: center; gap: 8px;">
                        <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="animation: rotarSpinner 0.8s linear infinite;">
                            <style>
                                @keyframes rotarSpinner {
                                    0% { transform: rotate(0deg); }
                                    100% { transform: rotate(360deg); }
                                }
                            </style>
                            <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z" fill="currentColor"/>
                        </svg>
                        Procesando acceso...
                    </span>
                `;
            }

            // Petición al backend
            var res = await FetchAPI("login", { user: usuarioInput, pass: passwordInput });

            if (res && res.success) {
                localStorage.setItem('usuario_sesion', res.usuario || usuarioInput);
                localStorage.setItem('session_userName', res.userName || "Usuario");
                localStorage.setItem('session_area', res.area || "CIRNODIR");
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('usuarioActivo', JSON.stringify(res));
                localStorage.setItem('ultima_seccion', 'home');

                setTimeout(() => {
                    window.location.href = "./index.html";
                }, 400);
            } else {
                var msg = res && res.message ? res.message : "Número de empleado o contraseña incorrectos.";
                alert(msg);
                AuthModule.restaurarBoton(btnIngresar, textoOriginal);
                window._loginEnProceso = false;
            }
        } catch (err) {
            console.error("Error atrapado en el login:", err);
            alert("Error al conectar con el servidor.");
            AuthModule.restaurarBoton(btnIngresar, textoOriginal);
            window._loginEnProceso = false;
        }
    },

    restaurarBoton: function(boton, textoOriginal) {
        if (!boton) return;
        boton.disabled = false;
        boton.style.opacity = "1";
        boton.style.cursor = "pointer";
        boton.innerHTML = textoOriginal;
    }
};

window.AuthModule = AuthModule;

document.addEventListener("DOMContentLoaded", () => {
    var btnToggle = document.getElementById('btn-toggle-pass');
    if (btnToggle) {
        btnToggle.addEventListener('click', AuthModule.togglePasswordVisibility);
    }
});

function logout() {
    localStorage.removeItem('usuario_sesion');
    window.location.href = 'login.html';
}