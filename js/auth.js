/**
 * AKSHAR TOURS & TRAVELS - AUTHENTICATION ENGINE
 * LocalStorage Frontend Registration, Login, Password Reset, and Route Guards
 */

// Retrieve all registered users
function getAllUsers() {
  const users = localStorage.getItem('akshar_users');
  return users ? JSON.parse(users) : [];
}

// Save users list
function saveUsers(users) {
  localStorage.setItem('akshar_users', JSON.stringify(users));
}

// Customer Registration Handler
function handleRegister(event) {
  event.preventDefault();
  const form = event.target;
  
  const fullName = form.fullName.value.trim();
  const email = form.email.value.trim().toLowerCase();
  const mobile = form.mobile.value.trim();
  const gender = form.gender.value;
  const password = form.password.value;
  const confirmPassword = form.confirmPassword.value;
  const address = form.address.value.trim();
  const terms = form.terms.checked;

  // Clear previous errors
  form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));

  // Validation
  let hasError = false;

  if (fullName.length < 3) {
    markInvalid(form.fullName, 'Please enter your full name (at least 3 characters)');
    hasError = true;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    markInvalid(form.email, 'Please enter a valid email address');
    hasError = true;
  }

  const mobileRegex = /^[6-9]\d{9}$/;
  const cleanMobile = mobile.replace(/[^0-9]/g, '').slice(-10);
  if (!mobileRegex.test(cleanMobile)) {
    markInvalid(form.mobile, 'Please enter a valid 10-digit Indian mobile number');
    hasError = true;
  }

  if (password.length < 6) {
    markInvalid(form.password, 'Password must be at least 6 characters');
    hasError = true;
  }

  if (password !== confirmPassword) {
    markInvalid(form.confirmPassword, 'Passwords do not match');
    hasError = true;
  }

  if (!address) {
    markInvalid(form.address, 'Please provide your contact address');
    hasError = true;
  }

  if (!terms) {
    markInvalid(form.terms, 'You must agree to the Terms & Conditions');
    hasError = true;
  }

  if (hasError) {
    showToast('Please fix the errors in the form before submitting.', 'error');
    return false;
  }

  // Check if user email already exists
  const users = getAllUsers();
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    markInvalid(form.email, 'This email address is already registered. Please log in.');
    showToast('Email address already registered. Please login.', 'error');
    return false;
  }

  // Create new customer user
  const newUser = {
    id: 'USR-' + Math.floor(1000 + Math.random() * 9000),
    name: fullName,
    email: email,
    mobile: '+91 ' + cleanMobile,
    gender: gender || 'Not Specified',
    password: password,
    role: 'customer',
    address: address,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers(users);

  // Set as current logged in user
  localStorage.setItem('akshar_current_user', JSON.stringify(newUser));

  showToast('Account created successfully! Welcome to Akshar Tours & Travels.', 'success');

  // Check for redirect parameter
  const urlParams = new URLSearchParams(window.location.search);
  const redirectUrl = urlParams.get('redirect') || 'customer/dashboard.html';

  setTimeout(() => {
    window.location.href = redirectUrl;
  }, 1000);

  return true;
}

// User / Customer Login Handler
function handleLogin(event, roleType = 'customer') {
  event.preventDefault();
  const form = event.target;

  const loginId = form.loginId.value.trim().toLowerCase();
  const password = form.password.value;
  const rememberMe = form.rememberMe ? form.rememberMe.checked : false;

  if (!loginId || !password) {
    showToast('Please enter both your identifier and password', 'error');
    return false;
  }

  const users = getAllUsers();
  
  // Find user by email or 10-digit mobile number
  const user = users.find(u => {
    const emailMatch = u.email.toLowerCase() === loginId;
    const cleanUPhone = u.mobile.replace(/[^0-9]/g, '').slice(-10);
    const cleanInputPhone = loginId.replace(/[^0-9]/g, '').slice(-10);
    const phoneMatch = cleanUPhone && cleanInputPhone && cleanUPhone === cleanInputPhone;
    return (emailMatch || phoneMatch);
  });

  if (!user || user.password !== password) {
    showToast('Invalid credentials. Please verify your details or use demo credentials.', 'error');
    return false;
  }

  // If logging in via admin portal or tab, check permissions
  if (roleType === 'admin' && user.role !== 'admin') {
    showToast('Access denied. Administrator privileges are required for this login.', 'error');
    return false;
  }

  // Save active session
  localStorage.setItem('akshar_current_user', JSON.stringify(user));

  showToast(`Welcome back, ${user.name}!`, 'success');

  const urlParams = new URLSearchParams(window.location.search);
  let redirectUrl = urlParams.get('redirect');

  if (!redirectUrl) {
    redirectUrl = user.role === 'admin' ? 'admin/dashboard.html' : 'customer/dashboard.html';
  }

  setTimeout(() => {
    window.location.href = redirectUrl;
  }, 800);

  return true;
}

// Forgot Password Reset Handler (Frontend Demo)
function handleForgotPassword(event) {
  event.preventDefault();
  const form = event.target;
  const identifier = form.identifier.value.trim().toLowerCase();
  const newPassword = form.newPassword.value;
  const confirmNewPassword = form.confirmNewPassword.value;

  if (newPassword.length < 6) {
    showToast('New password must be at least 6 characters', 'error');
    return false;
  }

  if (newPassword !== confirmNewPassword) {
    showToast('Passwords do not match', 'error');
    return false;
  }

  const users = getAllUsers();
  const userIndex = users.findIndex(u => {
    const emailMatch = u.email.toLowerCase() === identifier;
    const cleanUPhone = u.mobile.replace(/[^0-9]/g, '').slice(-10);
    const cleanInputPhone = identifier.replace(/[^0-9]/g, '').slice(-10);
    return emailMatch || (cleanUPhone && cleanInputPhone && cleanUPhone === cleanInputPhone);
  });

  if (userIndex === -1) {
    showToast('No account found with this email or mobile number.', 'error');
    return false;
  }

  // Update password in demo store
  users[userIndex].password = newPassword;
  saveUsers(users);

  showToast('Password updated successfully! You can now log in with your new password.', 'success');

  setTimeout(() => {
    window.location.href = 'login.html';
  }, 1200);

  return true;
}

// Helper: Mark field invalid
function markInvalid(inputElement, message) {
  inputElement.classList.add('is-invalid');
  let feedback = inputElement.parentElement.querySelector('.invalid-feedback');
  if (!feedback) {
    feedback = document.createElement('div');
    feedback.className = 'invalid-feedback';
    inputElement.parentElement.appendChild(feedback);
  }
  feedback.textContent = message;
}

// Route Guard: Protect Customer Dashboard
function guardCustomerRoute(pathToLogin = '../login.html') {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = `${pathToLogin}?redirect=${encodeURIComponent(window.location.pathname)}`;
    return null;
  }
  return user;
}

// Route Guard: Protect Admin Dashboard
function guardAdminRoute(pathToAdminLogin = 'login.html') {
  const user = getCurrentUser();
  if (!user || user.role !== 'admin') {
    window.location.href = `${pathToAdminLogin}?redirect=${encodeURIComponent(window.location.pathname)}`;
    return null;
  }
  return user;
}
