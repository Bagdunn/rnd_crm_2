// API base URL
const API_BASE = '/api';

// DOM elements
const loginForm = document.getElementById('login-form');
const loginBtn = document.getElementById('login-btn');
const btnText = loginBtn.querySelector('.btn-text');
const btnLoading = loginBtn.querySelector('.btn-loading');
const errorMessage = document.getElementById('error-message');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const rememberMeCheckbox = document.getElementById('remember-me');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    checkExistingAuth();
    
    // Focus on username input
    usernameInput.focus();
    
    // Add form event listeners
    loginForm.addEventListener('submit', handleLogin);
    
    // Add enter key support
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !loginBtn.disabled) {
            handleLogin(e);
        }
    });
    
    // Add input validation
    usernameInput.addEventListener('input', clearError);
    passwordInput.addEventListener('input', clearError);
});

// Check if user is already authenticated
async function checkExistingAuth() {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    
    try {
        const response = await fetch(`${API_BASE}/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            // User is already logged in, redirect to main app
            window.location.href = '/';
        } else {
            // Token is invalid, remove it
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
        }
    } catch (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
    }
}

// Handle login form submission
async function handleLogin(e) {
    e.preventDefault();
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const rememberMe = rememberMeCheckbox.checked;
    
    // Basic validation
    if (!username || !password) {
        showError('Будь ласка, заповніть всі поля');
        return;
    }
    
    // Show loading state
    setLoadingState(true);
    clearError();
    
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                password
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Store authentication data
            if (rememberMe) {
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userData', JSON.stringify(data.user));
            } else {
                sessionStorage.setItem('authToken', data.token);
                sessionStorage.setItem('userData', JSON.stringify(data.user));
            }
            
            // Show success message
            showSuccess('Успішний вхід! Перенаправлення...');
            
            // Redirect to main app after short delay
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
            
        } else {
            // Show error message
            showError(data.message || 'Помилка входу в систему');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        showError('Помилка з\'єднання з сервером');
    } finally {
        setLoadingState(false);
    }
}

// Set loading state
function setLoadingState(loading) {
    loginBtn.disabled = loading;
    
    if (loading) {
        btnText.style.display = 'none';
        btnLoading.style.display = 'flex';
        usernameInput.disabled = true;
        passwordInput.disabled = true;
        rememberMeCheckbox.disabled = true;
    } else {
        btnText.style.display = 'block';
        btnLoading.style.display = 'none';
        usernameInput.disabled = false;
        passwordInput.disabled = false;
        rememberMeCheckbox.disabled = false;
    }
}

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

// Show success message
function showSuccess(message) {
    errorMessage.textContent = message;
    errorMessage.className = 'error-message success-message';
    errorMessage.style.display = 'block';
    errorMessage.style.background = '#d4edda';
    errorMessage.style.color = '#155724';
    errorMessage.style.borderColor = '#c3e6cb';
}

// Clear error message
function clearError() {
    errorMessage.style.display = 'none';
    errorMessage.className = 'error-message';
    errorMessage.style.background = '#fee';
    errorMessage.style.color = '#c33';
    errorMessage.style.borderColor = '#fcc';
}

// Toggle password visibility
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.querySelector('.toggle-password .material-icons');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.textContent = 'visibility_off';
    } else {
        passwordInput.type = 'password';
        toggleBtn.textContent = 'visibility';
    }
}

// Add some visual feedback for form interactions
document.addEventListener('DOMContentLoaded', function() {
    // Add focus effects
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
    });
    
    // Add ripple effect to button
    loginBtn.addEventListener('click', function(e) {
        if (this.disabled) return;
        
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');
        
        this.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    });
});

// Add CSS for ripple effect
const style = document.createElement('style');
style.textContent = `
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: scale(0);
        animation: ripple-animation 0.6s linear;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .input-group.focused .material-icons {
        color: #667eea;
    }
`;
document.head.appendChild(style);
