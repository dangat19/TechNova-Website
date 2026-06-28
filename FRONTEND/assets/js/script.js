document.addEventListener('DOMContentLoaded', function () {

    // ===== THEME TOGGLE =====
    const themeToggle = document.getElementById('themeToggle');
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    if (themeToggle) {
        themeToggle.innerHTML = currentTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        themeToggle.addEventListener('click', function () {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            this.innerHTML = next === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        });
    }

    // ===== COUNTER ANIMATION (index) =====
    const counters = document.querySelectorAll('.counter');
    const speed = 150;
    const animateCounter = (counter) => {
        const target = parseInt(counter.getAttribute('data-target'));
        let current = 0;
        const increment = target / speed;
        const updateCounter = () => {
            current += increment;
            if (current < target) {
                counter.textContent = Math.ceil(current);
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target;
            }
        };
        updateCounter();
    };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    counters.forEach(counter => observer.observe(counter));

    // ===== PASSWORD TOGGLE =====
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function () {
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if (input) {
                const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                input.setAttribute('type', type);
                const icon = this.querySelector('i');
                if (icon) {
                    icon.classList.toggle('fa-eye');
                    icon.classList.toggle('fa-eye-slash');
                }
            }
        });
    });

    // ===== PASSWORD MATCH (signup) =====
    const password = document.getElementById('signupPassword');
    const confirm = document.getElementById('confirmPassword');
    const matchMsg = document.getElementById('matchMessage');
    if (password && confirm && matchMsg) {
        const checkMatch = () => {
            if (confirm.value.length === 0) { matchMsg.innerHTML = ''; return; }
            if (password.value === confirm.value) {
                matchMsg.innerHTML = '<i class="fas fa-check-circle text-success me-1"></i> Passwords match!';
                matchMsg.style.color = '#198754';
            } else {
                matchMsg.innerHTML = '<i class="fas fa-times-circle text-danger me-1"></i> Passwords do not match';
                matchMsg.style.color = '#dc3545';
            }
        };
        password.addEventListener('input', checkMatch);
        confirm.addEventListener('input', checkMatch);
    }

    // ===== SHOW/HIDE PHONE SECTIONS =====
    const showPhoneSignin = document.getElementById('showPhoneSignin');
    const phoneSigninSection = document.getElementById('phoneSigninSection');
    if (showPhoneSignin && phoneSigninSection) {
        showPhoneSignin.addEventListener('click', function (e) {
            e.preventDefault();
            const isHidden = phoneSigninSection.style.display === 'none';
            phoneSigninSection.style.display = isHidden ? 'block' : 'none';
            this.innerHTML = isHidden
                ? '<i class="fas fa-envelope me-2 text-muted"></i>Use email instead'
                : '<i class="fas fa-phone me-2 text-primary"></i>Sign in with Phone Number';
        });
    }

    const showPhoneSignup = document.getElementById('showPhoneSignup');
    const phoneSignupSection = document.getElementById('phoneSignupSection');
    if (showPhoneSignup && phoneSignupSection) {
        showPhoneSignup.addEventListener('click', function (e) {
            e.preventDefault();
            const isHidden = phoneSignupSection.style.display === 'none';
            phoneSignupSection.style.display = isHidden ? 'block' : 'none';
            this.innerHTML = isHidden
                ? '<i class="fas fa-envelope me-2 text-muted"></i>Use email instead'
                : '<i class="fas fa-phone me-2 text-primary"></i>Sign up with Phone Number';
        });
    }

    // ===== SHOW TOAST MESSAGE (helper) =====
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `alert alert-${type} position-fixed top-0 start-50 translate-middle-x mt-3 shadow-lg`;
        toast.style.zIndex = '9999';
        toast.style.minWidth = '300px';
        toast.style.textAlign = 'center';
        toast.innerHTML = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.transition = 'opacity 0.5s';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 500);
        }, 2500);
    }

    const API_URL = 'http://localhost:5000/api';

    async function readApiResponse(response) {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.message || 'Request failed. Please try again.');
        }
        return data;
    }

    // ===== FIREBASE AUTH =====
    const firebaseConfig = window.NEXACORE_FIREBASE_CONFIG;
    const hasFirebaseConfig = firebaseConfig
        && firebaseConfig.apiKey
        && !firebaseConfig.apiKey.startsWith('YOUR_')
        && firebaseConfig.authDomain
        && !firebaseConfig.authDomain.startsWith('YOUR_');
    const firebaseReady = Boolean(window.firebase && hasFirebaseConfig);
    let auth = null;
    let confirmationResult = null;
    let recaptchaVerifier = null;

    if (firebaseReady) {
        firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
    }

    function showFirebaseSetupMessage() {
        showToast('Firebase is not configured yet. Add your project keys in assets/js/firebase-config.js.', 'warning');
    }

    function getFirebaseError(error) {
        if (!error || !error.code) return 'Authentication failed. Please try again.';
        const messages = {
            'auth/account-exists-with-different-credential': 'An account already exists with this email using another sign-in method.',
            'auth/cancelled-popup-request': 'Another sign-in request interrupted the popup. Please try again.',
            'auth/configuration-not-found': 'Firebase Auth configuration was not found. Enable the provider in Firebase Console and verify project config.',
            'auth/email-already-in-use': 'That email is already registered. Try signing in instead.',
            'auth/invalid-email': 'Please enter a valid email address.',
            'auth/invalid-phone-number': 'Use international phone format, for example +15551234567.',
            'auth/invalid-verification-code': 'The OTP code is incorrect.',
            'auth/missing-verification-code': 'Please enter the OTP code.',
            'auth/operation-not-allowed': 'This sign-in provider is not enabled in Firebase Console.',
            'auth/operation-not-supported-in-this-environment': 'Popup sign-in is not supported in this environment. Redirect sign-in will be used.',
            'auth/popup-closed-by-user': 'The sign-in popup was closed before finishing.',
            'auth/popup-blocked': 'The sign-in popup was blocked. Please allow popups and try again.',
            'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
            'auth/unauthorized-domain': 'This domain is not authorized in Firebase Authentication settings.',
            'auth/user-not-found': 'No account was found with that email.',
            'auth/wrong-password': 'The password is incorrect.'
        };
        const readable = messages[error.code] || error.message || 'Authentication failed. Please try again.';
        return `${readable} (${error.code})`;
    }

    function getProvider(providerName) {
        if (providerName === 'google') {
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });
            return provider;
        }
        if (providerName === 'github') return new firebase.auth.GithubAuthProvider();
        if (providerName === 'microsoft') return new firebase.auth.OAuthProvider('microsoft.com');
        return null;
    }

    function getProviderLabelFromId(providerId) {
        if (providerId === 'google.com') return 'Google';
        if (providerId === 'github.com') return 'GitHub';
        if (providerId === 'microsoft.com') return 'Microsoft';
        return 'Social Provider';
    }

    function shouldUseRedirectFlow() {
        const ua = navigator.userAgent || '';
        const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);
        const isInAppBrowser = /FBAN|FBAV|Instagram|Line|wv\)|; wv\b/i.test(ua);
        return isMobile || isInAppBrowser;
    }

    function authenticateWithProvider(provider, label) {
        if (shouldUseRedirectFlow()) {
            showToast(`Continuing with ${label}...`, 'info');
            return auth.signInWithRedirect(provider);
        }

        return auth.signInWithPopup(provider)
            .then(() => finishAuth(label))
            .catch(error => {
                const canFallbackToRedirect = error && (
                    error.code === 'auth/popup-blocked' ||
                    error.code === 'auth/popup-closed-by-user' ||
                    error.code === 'auth/cancelled-popup-request' ||
                    error.code === 'auth/operation-not-supported-in-this-environment'
                );

                if (canFallbackToRedirect) {
                    showToast(`Popup blocked. Redirecting to ${label} sign-in...`, 'info');
                    return auth.signInWithRedirect(provider);
                }

                throw error;
            });
    }

    function finishAuth(provider) {
        const isSignUp = window.location.pathname.includes('signup.html');
        if (isSignUp) {
            signUpSuccess(provider);
        } else {
            signInSuccess(provider);
        }
    }

    function getRecaptchaContainerId() {
        return document.getElementById('recaptcha-container')
            ? 'recaptcha-container'
            : 'recaptcha-signup-container';
    }

    function getRecaptchaVerifier() {
        if (recaptchaVerifier) return recaptchaVerifier;
        recaptchaVerifier = new firebase.auth.RecaptchaVerifier(getRecaptchaContainerId(), {
            size: 'invisible'
        });
        return recaptchaVerifier;
    }

    // ===== REDIRECT WITH SUCCESS MESSAGE =====
    function signInSuccess(provider) {
        showToast(`Signed in with ${provider}! Redirecting...`, 'success');
        setTimeout(() => {
            window.location.href = 'welcome.html';
        }, 1500);
    }

    function signUpSuccess(provider) {
        showToast(`Account created with ${provider}! Redirecting...`, 'success');
        setTimeout(() => {
            window.location.href = 'signin.html';
        }, 1500);
    }

    if (firebaseReady) {
        auth.getRedirectResult()
            .then(result => {
                if (result && result.user) {
                    const providerId = result.additionalUserInfo && result.additionalUserInfo.providerId;
                    finishAuth(getProviderLabelFromId(providerId));
                }
            })
            .catch(error => showToast(getFirebaseError(error), 'danger'));
    }

    // ===== SOCIAL SIGN-IN BUTTONS =====
    document.querySelectorAll('.social-btn[data-auth-provider]').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            if (!firebaseReady) {
                showFirebaseSetupMessage();
                return;
            }
            const providerName = this.getAttribute('data-auth-provider');
            const provider = getProvider(providerName);
            const label = this.textContent.replace(/Sign in with |Sign up with /i, '').trim();

            if (!provider) {
                showToast('Selected sign-in provider is not available.', 'warning');
                return;
            }

            authenticateWithProvider(provider, label)
                .catch(error => showToast(getFirebaseError(error), 'danger'));
        });
    });

    // ===== PHONE SIGN-IN / SIGN-UP =====
    document.querySelectorAll('#sendOtpBtn, #sendOtpSignupBtn').forEach(btn => {
        if (btn) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                if (!firebaseReady) {
                    showFirebaseSetupMessage();
                    return;
                }
                const parent = this.closest('.phone-input-group');
                const input = parent.querySelector('input[type="tel"]');
                if (!input || input.value.trim().length <= 5) {
                    showToast('Please enter a valid phone number.', 'warning');
                    return;
                }
                auth.signInWithPhoneNumber(input.value.trim(), getRecaptchaVerifier())
                    .then(result => {
                        confirmationResult = result;
                        showToast(`OTP sent to ${input.value.trim()}`, 'info');
                    })
                    .catch(error => {
                        if (recaptchaVerifier) {
                            recaptchaVerifier.clear();
                            recaptchaVerifier = null;
                        }
                        showToast(getFirebaseError(error), 'danger');
                    });
            });
        }
    });

    document.querySelectorAll('#verifyOtpBtn, #verifyOtpSignupBtn').forEach(btn => {
        if (btn) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                if (!firebaseReady) {
                    showFirebaseSetupMessage();
                    return;
                }
                const parent = this.closest('.otp-section');
                const input = parent.querySelector('input[type="text"]');
                if (!confirmationResult) {
                    showToast('Please send the OTP first.', 'warning');
                    return;
                }
                if (!input || input.value.trim().length !== 6) {
                    showToast('Please enter a 6-digit OTP.', 'warning');
                    return;
                }
                confirmationResult.confirm(input.value.trim())
                    .then(() => finishAuth('Phone Number'))
                    .catch(error => showToast(getFirebaseError(error), 'danger'));
            });
        }
    });

    // ===== EMAIL SIGN-IN FORM =====
    const signinForm = document.getElementById('signinForm');
    if (signinForm) {
        signinForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const email = document.getElementById('signinEmail').value.trim();
            const pwd = document.getElementById('signinPassword').value.trim();

            if (!email || !pwd) {
                showToast('Please fill in all fields.', 'warning');
                return;
            }

            const submitButton = signinForm.querySelector('button[type="submit"]');
            const originalText = submitButton.innerHTML;
            submitButton.disabled = true;
            submitButton.innerHTML = 'Signing In...';

            try {
                const data = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password: pwd })
                }).then(readApiResponse);

                localStorage.setItem('nexacoreToken', data.token);
                localStorage.setItem('nexacoreUser', JSON.stringify(data.user));
                signInSuccess('Email');
            } catch (error) {
                showToast(error.message, 'danger');
            } finally {
                submitButton.disabled = false;
                submitButton.innerHTML = originalText;
            }
        });
    }

    // ===== EMAIL SIGN-UP FORM =====
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const firstName = document.getElementById('firstName').value.trim();
            const lastName = document.getElementById('lastName').value.trim();
            const email = document.getElementById('signupEmail').value.trim();
            const pwd = document.getElementById('signupPassword').value.trim();
            const confirmPwd = document.getElementById('confirmPassword').value.trim();
            const terms = document.getElementById('terms').checked;

            if (!firstName || !lastName || !email || !pwd || !confirmPwd) {
                showToast('Please fill in all fields.', 'warning');
                return;
            }
            if (pwd.length < 8) {
                showToast('Password must be at least 8 characters.', 'warning');
                return;
            }
            if (pwd !== confirmPwd) {
                showToast('Passwords do not match.', 'warning');
                return;
            }
            if (!terms) {
                showToast('Please agree to the Terms of Service.', 'warning');
                return;
            }

            const submitButton = signupForm.querySelector('button[type="submit"]');
            const originalText = submitButton.innerHTML;
            submitButton.disabled = true;
            submitButton.innerHTML = 'Creating Account...';

            try {
                await fetch(`${API_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ firstName, lastName, email, password: pwd })
                }).then(readApiResponse);

                signUpSuccess('Email');
            } catch (error) {
                showToast(error.message, 'danger');
            } finally {
                submitButton.disabled = false;
                submitButton.innerHTML = originalText;
            }
        });
    }

    // ===== "FORGOT PASSWORD?" LINK =====
    document.querySelectorAll('a[href="#"]').forEach(link => {
        if (link.textContent.trim() === 'Forgot password?') {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                if (!firebaseReady) {
                    showFirebaseSetupMessage();
                    return;
                }
                const email = document.getElementById('signinEmail').value.trim();
                if (!email) {
                    showToast('Enter your email first, then click forgot password.', 'warning');
                    return;
                }
                auth.sendPasswordResetEmail(email)
                    .then(() => showToast('Password reset link sent to your email.', 'info'))
                    .catch(error => showToast(getFirebaseError(error), 'danger'));
            });
        }
    });
});
