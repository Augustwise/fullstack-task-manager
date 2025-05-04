document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('loginForm');
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');

    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        let isValid = true;

        emailError.style.display = 'none';
        passwordError.style.display = 'none';
        email.classList.remove('error');
        password.classList.remove('error');

        if (!validateEmail(email.value)) {
            emailError.textContent = 'Please enter a valid email address';
            emailError.style.display = 'block';
            email.classList.add('error');
            isValid = false;
        }

        if (!password.value) {
            passwordError.textContent = 'Please enter your password';
            passwordError.style.display = 'block';
            password.classList.add('error');
            isValid = false;
        }

        if (isValid) {
            fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email.value,
                    password: password.value
                })
            })
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(data => {
                            throw new Error(data.message || 'Invalid email or password');
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    window.location.href = '/frontend/tasks.html';
                })
                .catch(error => {
                    passwordError.textContent = error.message;
                    passwordError.style.display = 'block';
                    password.classList.add('error');
                });
        }
    });
});
