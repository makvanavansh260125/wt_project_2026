/**
 * AKSHAR TOURS & TRAVELS - CUSTOMER DASHBOARD ENGINE
 * Customer Profile, Booking History, Hotel Reservations, Cancellation, Receipts & Wishlist
 */

// Initialize Customer Dashboard
function initCustomerDashboard(pathPrefix = '../') {
  // Ensure user is authenticated as customer
  const user = getCurrentUser();
  if (!user) {
    window.location.href = `${pathPrefix}login.html?redirect=${encodeURIComponent(window.location.href)}`;
    return;
  }

  // Update profile header
  updateCustomerHeader(user);

  // Render stats
  renderCustomerStats(user);

  // Render bookings
  renderCustomerBookings(user.email, 'all', pathPrefix);

  // Render wishlist
  renderCustomerWishlist(pathPrefix);

  // Populate profile form
  populateProfileForm(user);
}

// Update header with welcome and user initials
function updateCustomerHeader(user) {
  const nameEl = document.getElementById('customer-welcome-name');
  if (nameEl) nameEl.textContent = user.name;

  const emailEl = document.getElementById('customer-email-display');
  if (emailEl) emailEl.textContent = user.email;

  const avatarEl = document.getElementById('customer-avatar-display');
  if (avatarEl) {
    const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    avatarEl.textContent = initials;
  }
}

// Render Overview Statistics
function renderCustomerStats(user) {
  const allBookings = getAllBookings();
  const myBookings = allBookings.filter(b => b.userEmail.toLowerCase() === user.email.toLowerCase());
  
  const totalBookings = myBookings.length;
  const confirmed = myBookings.filter(b => b.bookingStatus === 'Confirmed').length;
  const pending = myBookings.filter(b => b.bookingStatus === 'Pending').length;
  const wishlistCount = getWishlist().length;

  updateTextById('stat-total-bookings', totalBookings);
  updateTextById('stat-confirmed-bookings', confirmed);
  updateTextById('stat-pending-bookings', pending);
  updateTextById('stat-wishlist-count', wishlistCount);
}

// Render Customer Bookings Cards
function renderCustomerBookings(userEmail, filterType = 'all', pathPrefix = '../') {
  const container = document.getElementById('customer-bookings-list');
  if (!container) return;

  const allBookings = getAllBookings();
  let myBookings = allBookings.filter(b => b.userEmail.toLowerCase() === userEmail.toLowerCase());

  if (filterType === 'packages') {
    myBookings = myBookings.filter(b => b.itemType === 'package');
  } else if (filterType === 'hotels') {
    myBookings = myBookings.filter(b => b.itemType === 'hotel');
  } else if (filterType === 'pending') {
    myBookings = myBookings.filter(b => b.bookingStatus === 'Pending');
  } else if (filterType === 'confirmed') {
    myBookings = myBookings.filter(b => b.bookingStatus === 'Confirmed');
  } else if (filterType === 'cancelled') {
    myBookings = myBookings.filter(b => b.bookingStatus === 'Cancelled');
  }

  if (myBookings.length === 0) {
    container.innerHTML = `
      <div class="card border-0 shadow-sm rounded-4 p-5 text-center">
        <i class="bi bi-ticket-perforated text-muted display-4 mb-3"></i>
        <h5>No bookings found in this category</h5>
        <p class="text-muted">Ready to plan your next dream getaway? Explore our handpicked Indian and International packages.</p>
        <div class="d-flex justify-content-center gap-2 mt-2">
          <a href="${pathPrefix}packages/india.html" class="btn btn-navy btn-sm">Explore India</a>
          <a href="${pathPrefix}packages/international.html" class="btn btn-gold btn-sm">Explore International</a>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = myBookings.map(b => {
    let statusBadgeClass = 'bg-warning text-dark';
    if (b.bookingStatus === 'Confirmed' || b.bookingStatus === 'Completed') statusBadgeClass = 'bg-success text-white';
    if (b.bookingStatus === 'Cancelled') statusBadgeClass = 'bg-danger text-white';

    const canCancel = b.bookingStatus === 'Pending' || b.bookingStatus === 'Confirmed';

    return `
      <div class="booking-history-card">
        <div class="booking-card-header">
          <div class="d-flex align-items-center gap-2">
            <span class="badge bg-navy text-gold fw-bold">ID: ${b.bookingId}</span>
            <span class="badge ${statusBadgeClass} text-uppercase">${b.bookingStatus}</span>
            <span class="badge bg-light text-dark border">${b.itemType.toUpperCase()}</span>
          </div>
          <div class="text-muted small">
            Booked on ${new Date(b.bookedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>
        <div class="booking-card-body">
          <div class="row align-items-center g-3">
            <div class="col-md-7">
              <div class="d-flex align-items-center gap-3">
                <img src="${b.image || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=300&auto=format&fit=crop'}" 
                     alt="${b.title}" class="booking-img-thumb">
                <div>
                  <h5 class="fw-bold text-navy mb-1">${b.title}</h5>
                  <div class="text-muted small mb-1"><i class="bi bi-geo-alt-fill text-danger me-1"></i>${b.destination}</div>
                  <div class="d-flex align-items-center gap-3 small text-secondary">
                    <span><i class="bi bi-calendar-event me-1"></i>${new Date(b.travelDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span><i class="bi bi-people me-1"></i>${b.travellers} Person(s)</span>
                    <span><i class="bi bi-airplane-engines me-1"></i>${b.transportSelected}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-md-5 text-md-end">
              <div class="mb-2">
                <span class="text-muted small d-block">Total Paid / Estimated</span>
                <span class="fs-4 fw-bold text-navy">${formatINR(b.totalAmount)}</span>
              </div>
              <div class="d-flex justify-content-md-end gap-2 flex-wrap">
                <a href="${pathPrefix}booking/confirmation.html?id=${b.bookingId}" class="btn btn-outline-navy btn-sm">
                  <i class="bi bi-receipt me-1"></i> Receipt
                </a>
                ${canCancel ? `
                  <button class="btn btn-outline-danger btn-sm" onclick="promptCancelBooking('${b.bookingId}')">
                    <i class="bi bi-x-circle me-1"></i> Cancel
                  </button>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Prompt Cancel Booking
window.promptCancelBooking = function(bookingId) {
  if (!confirm(`Are you sure you want to cancel booking request #${bookingId}? Our representative will process your cancellation refund.`)) {
    return;
  }

  const bookings = getAllBookings();
  const index = bookings.findIndex(b => b.bookingId === bookingId);
  if (index !== -1) {
    bookings[index].bookingStatus = 'Cancelled';
    localStorage.setItem('akshar_bookings', JSON.stringify(bookings));
    showToast(`Booking #${bookingId} has been cancelled.`, 'warning');
    
    // Refresh UI
    const user = getCurrentUser();
    if (user) {
      renderCustomerStats(user);
      renderCustomerBookings(user.email);
    }
  }
};

// Render Customer Wishlist
function renderCustomerWishlist(pathPrefix = '../') {
  const container = document.getElementById('customer-wishlist-container');
  if (!container) return;

  const wishlistIds = getWishlist();
  if (wishlistIds.length === 0) {
    container.innerHTML = `
      <div class="card border-0 shadow-sm rounded-4 p-5 text-center">
        <i class="bi bi-heart text-muted display-4 mb-3"></i>
        <h5>Your wishlist is currently empty</h5>
        <p class="text-muted">Browse packages and click the heart icon on any card to save your favorites here.</p>
        <a href="${pathPrefix}packages/india.html" class="btn btn-gold btn-sm mx-auto" style="width: fit-content;">
          Explore Indian Tours
        </a>
      </div>
    `;
    return;
  }

  const allPackages = getPackages('all');
  const wishlistPackages = allPackages.filter(p => wishlistIds.includes(p.id));

  container.innerHTML = `
    <div class="row g-4">
      ${wishlistPackages.map(pkg => createPackageCardHTML(pkg, pathPrefix)).join('')}
    </div>
  `;
}

// Populate and Update Profile
function populateProfileForm(user) {
  const form = document.getElementById('customer-profile-form');
  if (!form) return;

  form.fullName.value = user.name || '';
  form.email.value = user.email || '';
  form.mobile.value = user.mobile || '';
  form.gender.value = user.gender || 'Male';
  form.address.value = user.address || '';

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const newName = form.fullName.value.trim();
    const newMobile = form.mobile.value.trim();
    const newGender = form.gender.value;
    const newAddress = form.address.value.trim();
    const newPassword = form.newPassword?.value;

    if (newName.length < 3) {
      showToast('Name must be at least 3 characters', 'error');
      return;
    }

    const users = getAllUsers();
    const idx = users.findIndex(u => u.email.toLowerCase() === user.email.toLowerCase());
    if (idx !== -1) {
      users[idx].name = newName;
      users[idx].mobile = newMobile;
      users[idx].gender = newGender;
      users[idx].address = newAddress;
      if (newPassword && newPassword.length >= 6) {
        users[idx].password = newPassword;
      }
      saveUsers(users);

      // Update current user session
      localStorage.setItem('akshar_current_user', JSON.stringify(users[idx]));
      updateCustomerHeader(users[idx]);
      showToast('Profile updated successfully!', 'success');
    }
  });
}
