document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('signupForm');
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');
    const email = document.getElementById('email');

    const lengthReq = document.getElementById('lengthReq');
    const digitReq = document.getElementById('digitReq');
    const specialReq = document.getElementById('specialReq');

    const passwordError = document.getElementById('passwordError');
    const confirmPasswordError = document.getElementById('confirmPasswordError');
    const emailError = document.getElementById('emailError');

    function validatePassword(password) {
        const hasMinLength = password.length >= 12;
        const hasDigit = /\d/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        const hasNoCyrillic = !/[\u0400-\u04FF]/.test(password);

        lengthReq.className = `requirement ${hasMinLength ? 'met' : 'unmet'}`;
        digitReq.className = `requirement ${hasDigit ? 'met' : 'unmet'}`;
        specialReq.className = `requirement ${hasSpecial ? 'met' : 'unmet'}`;

        return hasMinLength && hasDigit && hasSpecial && hasNoCyrillic;
    }

    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    password.addEventListener('input', function () {
        validatePassword(this.value);
    });

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        let isValid = true;

        passwordError.style.display = 'none';
        confirmPasswordError.style.display = 'none';
        emailError.style.display = 'none';
        password.classList.remove('error');
        confirmPassword.classList.remove('error');
        email.classList.remove('error');

        if (!validateEmail(email.value)) {
            emailError.textContent = 'Please enter a valid email address';
            emailError.style.display = 'block';
            email.classList.add('error');
            isValid = false;
        }

        if (/[\u0400-\u04FF]/.test(password.value)) {
            passwordError.textContent = 'Password cannot contain Cyrillic characters';
            passwordError.style.display = 'block';
            password.classList.add('error');
            isValid = false;
        } else if (!validatePassword(password.value)) {
            passwordError.textContent = 'Password does not meet the requirements';
            passwordError.style.display = 'block';
            password.classList.add('error');
            isValid = false;
        }

        if (password.value !== confirmPassword.value) {
            confirmPasswordError.textContent = 'Passwords do not match';
            confirmPasswordError.style.display = 'block';
            confirmPassword.classList.add('error');
            isValid = false;
        }

        if (isValid) {
            fetch('/api/signup', {
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
                            throw new Error(data.message || 'Registration failed');
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    window.location.href = '/frontend/tasks.html';
                })
                .catch(error => {
                    emailError.textContent = error.message;
                    emailError.style.display = 'block';
                    email.classList.add('error');
                });
        }
    });
});