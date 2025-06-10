document.getElementById('loginForm').addEventListener('submit', function (event) {
    let valid = true;
    document.getElementById('usernameError').innerHTML = '';
    document.getElementById('passwordError').innerHTML = '';

    const username = document.getElementById('username').value;
    if (username.trim() === '') {
        document.getElementById('usernameError').innerHTML = '"Por favor, ingrese un nombre de usuario"'
        valid = false;
    }

    const password = document.getElementById('password').value;
    if (username.trim() === '') {
        document.getElementById('passwordError').innerHTML = '"Por favor, ingrese su contraseña"'
        valid = false;
    }

    if (!valid) {
        event.preventDefault();
    }
    
})
/*mostrar ocultar contraseña*/

document.getElementById("togglePassword").addEventListener("click", function() {
    let passwordInput = document.getElementById("password");
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        this.textContent = "visibility";
    } else {
        passwordInput.type = "password";
        this.textContent = "visibility_off";
    }
});