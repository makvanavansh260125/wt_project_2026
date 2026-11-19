/**
 * AKSHAR TOURS & TRAVELS - MAIN GLOBAL JAVASCRIPT
 * Shared utility functions, session tracking, toast notifications, wishlist manager
 */

// Format numbers in Indian Rupee format (e.g., ₹28,500)
function formatINR(amount) {
  if (isNaN(amount)) return '₹0';
  return '₹' + Number(amount).toLocaleString('en-IN');
}

// Show animated Toast Notification
function showToast(message, type = 'info') {
  let container = document.getElementById('akshar-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'akshar-toast-container';
    container.className = 'toast-container-custom';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `akshar-toast toast-${type}`;
  
  let iconClass = 'bi-info-circle-fill text-primary';
  if (type === 'success') iconClass = 'bi-check-circle-fill text-success';
  if (type === 'error') iconClass = 'bi-exclamation-triangle-fill text-danger';
  if (type === 'warning') iconClass = 'bi-exclamation-circle-fill text-warning';

  toast.innerHTML = `
    <i class="bi ${iconClass} fs-5"></i>
    <div class="flex-grow-1">${message}</div>
    <button type="button" class="btn-close btn-close-white ms-2" aria-label="Close"></button>
  `;

  const closeBtn = toast.querySelector('.btn-close');
  closeBtn.addEventListener('click', () => {
    toast.remove();
  });

  container.appendChild(toast);

  // Auto-dismiss after 4.5 seconds
  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4500);
}

// Get current session user
function getCurrentUser() {
  const userJson = localStorage.getItem('akshar_current_user');
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch (e) {
    return null;
  }
}

// Check if user is logged in
function isLoggedIn() {
  return getCurrentUser() !== null;
}

// Logout helper
function logoutUser(redirectPath = '../index.html') {
  localStorage.removeItem('akshar_current_user');
  showToast('You have been logged out successfully.', 'info');
  setTimeout(() => {
    window.location.href = redirectPath;
  }, 600);
}

// Wishlist Manager
function getWishlist() {
  const list = localStorage.getItem('akshar_wishlist');
  return list ? JSON.parse(list) : [];
}

function isInWishlist(id) {
  const list = getWishlist();
  return list.includes(id);
}

function toggleWishlist(id, title = "Package") {
  let list = getWishlist();
  const index = list.indexOf(id);
  let added = false;
  
  if (index > -1) {
    list.splice(index, 1);
    showToast(`Removed "${title}" from your wishlist`, 'warning');
  } else {
    list.push(id);
    added = true;
    showToast(`Added "${title}" to your wishlist!`, 'success');
  }
  
  localStorage.setItem('akshar_wishlist', JSON.stringify(list));
  updateWishlistBadges();
  
  // Update heart buttons on current page if present
  document.querySelectorAll(`[data-wishlist-id="${id}"]`).forEach(btn => {
    if (added) {
      btn.classList.add('active');
      btn.innerHTML = '<i class="bi bi-heart-fill text-danger"></i>';
    } else {
      btn.classList.remove('active');
      btn.innerHTML = '<i class="bi bi-heart"></i>';
    }
  });

  return added;
}

function updateWishlistBadges() {
  const count = getWishlist().length;
  document.querySelectorAll('.wishlist-count-badge').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'inline-flex' : 'none';
  });
}

// Synchronize global Navbar Authentication status
function syncNavbarAuth(pathPrefix = '') {
  const user = getCurrentUser();
  const authContainer = document.getElementById('navbar-auth-section');
  if (!authContainer) return;

  if (user) {
    // User is logged in
    const isCustomer = user.role === 'customer';
    const dashboardLink = isCustomer 
      ? `${pathPrefix}customer/dashboard.html` 
      : `${pathPrefix}admin/dashboard.html`;
    const dashboardLabel = isCustomer ? 'My Dashboard' : 'Admin Panel';
    const badgeColor = isCustomer ? 'bg-primary' : 'bg-warning text-dark';

    authContainer.innerHTML = `
      <div class="dropdown">
        <button class="btn btn-navy dropdown-toggle d-flex align-items-center gap-2" type="button" data-bs-toggle="dropdown" aria-expanded="false">
          <i class="bi bi-person-circle text-gold fs-5"></i>
          <span class="d-none d-md-inline fw-bold">${user.name.split(' ')[0]}</span>
          <span class="badge ${badgeColor} ms-1 text-uppercase" style="font-size: 0.65rem;">${user.role}</span>
        </button>
        <ul class="dropdown-menu dropdown-menu-end shadow">
          <li class="dropdown-header text-muted small">Signed in as <strong>${user.email}</strong></li>
          <li><hr class="dropdown-divider"></li>
          <li>
            <a class="dropdown-item" href="${dashboardLink}">
              <i class="bi bi-speedometer2"></i> ${dashboardLabel}
            </a>
          </li>
          ${isCustomer ? `
            <li>
              <a class="dropdown-item" href="${pathPrefix}booking/my-bookings.html">
                <i class="bi bi-ticket-perforated"></i> My Bookings
              </a>
            </li>
            <li>
              <a class="dropdown-item" href="${pathPrefix}customer/dashboard.html#wishlist">
                <i class="bi bi-heart"></i> My Wishlist
              </a>
            </li>
          ` : ''}
          <li><hr class="dropdown-divider"></li>
          <li>
            <a class="dropdown-item text-danger" href="javascript:void(0)" onclick="logoutUser('${pathPrefix}index.html')">
              <i class="bi bi-box-arrow-right text-danger"></i> Logout
            </a>
          </li>
        </ul>
      </div>
    `;
  } else {
    // Guest user
    authContainer.innerHTML = `
      <a href="${pathPrefix}login.html" class="btn btn-outline-navy me-2" style="border: 1px solid var(--navy); color: var(--navy);">
        <i class="bi bi-box-arrow-in-right me-1"></i> Login
      </a>
      <a href="${pathPrefix}register.html" class="btn btn-gold">
        <i class="bi bi-person-plus me-1"></i> Register
      </a>
    `;
  }
}

// Global Newsletter Subscription handler
function initNewsletter() {
  const form = document.getElementById('newsletter-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const emailInput = form.querySelector('input[type="email"]');
    if (!emailInput || !emailInput.value.trim()) return;

    let subscribers = localStorage.getItem('akshar_subscribers');
    subscribers = subscribers ? JSON.parse(subscribers) : [];
    
    const email = emailInput.value.trim().toLowerCase();
    if (subscribers.includes(email)) {
      showToast('You are already subscribed to our newsletter!', 'info');
    } else {
      subscribers.push(email);
      localStorage.setItem('akshar_subscribers', JSON.stringify(subscribers));
      showToast('Thank you for subscribing! Check your inbox for exclusive travel deals.', 'success');
    }
    emailInput.value = '';
  });
}

// DOM Ready Handler
document.addEventListener('DOMContentLoaded', () => {
  updateWishlistBadges();
  initNewsletter();
});
