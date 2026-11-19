/**
 * AKSHAR TOURS & TRAVELS - ADMIN PANEL ENGINE
 * Complete Admin Management: Overview Stats, Packages CRUD, Hotels CRUD, Bookings Status, Messages, Customers
 */

// Route Guard Check
function initAdminAuth(pathPrefix = '../') {
  const user = getCurrentUser();
  if (!user || user.role !== 'admin') {
    window.location.href = `${pathPrefix}admin/login.html`;
    return null;
  }
  return user;
}

// Render Dashboard Metrics Overview
function renderAdminDashboardStats() {
  const users = getAllUsers();
  const customers = users.filter(u => u.role === 'customer');
  const bookings = getAllBookings();
  const indiaPkgs = JSON.parse(localStorage.getItem('akshar_indian_packages') || '[]');
  const intlPkgs = JSON.parse(localStorage.getItem('akshar_international_packages') || '[]');
  const hotels = getHotels();

  // Calculate gross revenue from confirmed & completed bookings
  const revenue = bookings
    .filter(b => b.bookingStatus === 'Confirmed' || b.bookingStatus === 'Completed')
    .reduce((acc, b) => acc + (b.totalAmount || 0), 0);

  updateTextById('admin-stat-customers', customers.length);
  updateTextById('admin-stat-bookings', bookings.length);
  updateTextById('admin-stat-india-pkgs', indiaPkgs.length);
  updateTextById('admin-stat-intl-pkgs', intlPkgs.length);
  updateTextById('admin-stat-hotels', hotels.length);
  updateTextById('admin-stat-revenue', formatINR(revenue));

  // Render recent bookings on dashboard overview table
  renderRecentBookingsTable(bookings.slice(0, 5));
}

// Render Recent Bookings Table
function renderRecentBookingsTable(recentList) {
  const tbody = document.getElementById('admin-recent-bookings-tbody');
  if (!tbody) return;

  if (recentList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No bookings recorded yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = recentList.map(b => {
    let statusClass = 'pending';
    if (b.bookingStatus === 'Confirmed' || b.bookingStatus === 'Completed') statusClass = 'confirmed';
    if (b.bookingStatus === 'Cancelled' || b.bookingStatus === 'Rejected') statusClass = 'cancelled';

    return `
      <tr>
        <td><strong class="text-navy">#${b.bookingId}</strong></td>
        <td>
          <div class="fw-bold">${b.customerName}</div>
          <div class="small text-muted">${b.userEmail}</div>
        </td>
        <td>
          <div class="fw-bold">${b.title}</div>
          <div class="small text-muted">${b.transportSelected}</div>
        </td>
        <td>${new Date(b.travelDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
        <td class="fw-bold">${formatINR(b.totalAmount)}</td>
        <td><span class="status-badge ${statusClass}">${b.bookingStatus}</span></td>
      </tr>
    `;
  }).join('');
}

// ==========================================
// PACKAGES CRUD MANAGEMENT
// ==========================================
function renderAdminPackagesTable(filterType = 'all', searchKeyword = '') {
  const tbody = document.getElementById('admin-packages-tbody');
  if (!tbody) return;

  let indiaPkgs = JSON.parse(localStorage.getItem('akshar_indian_packages') || '[]');
  let intlPkgs = JSON.parse(localStorage.getItem('akshar_international_packages') || '[]');
  let list = [];

  if (filterType === 'india') list = indiaPkgs;
  else if (filterType === 'international') list = intlPkgs;
  else list = [...indiaPkgs, ...intlPkgs];

  if (searchKeyword) {
    const kw = searchKeyword.toLowerCase();
    list = list.filter(p => p.title.toLowerCase().includes(kw) || p.destination.toLowerCase().includes(kw));
  }

  const countBadge = document.getElementById('admin-packages-count');
  if (countBadge) countBadge.textContent = `${list.length} Packages`;

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No packages match the search.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(p => {
    const isIndia = p.id.startsWith('IND');
    return `
      <tr>
        <td>
          <img src="${p.image}" alt="${p.title}" class="rounded-2 object-fit-cover" style="width: 50px; height: 40px;">
        </td>
        <td>
          <strong class="text-navy">${p.id}</strong>
          <span class="badge ${isIndia ? 'bg-primary' : 'bg-warning text-dark'} ms-1" style="font-size:0.65rem;">
            ${isIndia ? 'INDIA' : 'INTL'}
          </span>
        </td>
        <td>
          <div class="fw-bold text-navy">${p.title}</div>
          <div class="small text-muted">${p.destination}</div>
        </td>
        <td>${p.days}D / ${p.nights}N</td>
        <td class="fw-bold">${formatINR(p.basePrice)}</td>
        <td><span class="badge bg-light text-dark border">${p.category || 'General'}</span></td>
        <td>
          <div class="d-flex gap-1">
            <button class="btn btn-sm btn-outline-primary" onclick="openEditPackageModal('${p.id}')" title="Edit Package">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="deletePackage('${p.id}')" title="Delete Package">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Delete Package
window.deletePackage = function(pkgId) {
  if (!confirm(`Are you sure you want to permanently delete package ${pkgId}?`)) return;

  const isIndia = pkgId.startsWith('IND');
  const key = isIndia ? 'akshar_indian_packages' : 'akshar_international_packages';
  let list = JSON.parse(localStorage.getItem(key) || '[]');
  list = list.filter(p => p.id !== pkgId);
  localStorage.setItem(key, JSON.stringify(list));

  showToast(`Package ${pkgId} deleted successfully.`, 'warning');
  renderAdminPackagesTable();
  renderAdminDashboardStats();
};

// Open Add Package Modal
window.openAddPackageModal = function() {
  const form = document.getElementById('package-form');
  if (!form) return;
  form.reset();
  form.packageId.value = ''; // Empty = new
  document.getElementById('packageModalLabel').textContent = 'Add New Travel Package';

  const modalEl = document.getElementById('packageModal');
  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
  modal.show();
};

// Open Edit Package Modal
window.openEditPackageModal = function(pkgId) {
  const form = document.getElementById('package-form');
  if (!form) return;
  const pkg = getPackageById(pkgId);
  if (!pkg) return;

  document.getElementById('packageModalLabel').textContent = `Edit Package (${pkg.id})`;
  form.packageId.value = pkg.id;
  form.packageTitle.value = pkg.title;
  form.packageDestination.value = pkg.destination;
  form.packageCategory.value = pkg.category || 'Heritage';
  form.packageDays.value = pkg.days;
  form.packageNights.value = pkg.nights;
  form.packageBasePrice.value = pkg.basePrice;
  form.packageImage.value = pkg.image;
  form.packageOverview.value = pkg.overview || '';
  form.packageHotel.value = pkg.hotel || '';
  form.packageFood.value = pkg.food || '';
  form.packageSightseeing.value = pkg.sightseeing || '';

  const modalEl = document.getElementById('packageModal');
  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
  modal.show();
};

// Save Package (Add or Edit)
window.savePackageForm = function(event) {
  event.preventDefault();
  const form = event.target;
  const pkgId = form.packageId.value;
  const title = form.packageTitle.value.trim();
  const destination = form.packageDestination.value.trim();
  const category = form.packageCategory.value;
  const days = Number(form.packageDays.value);
  const nights = Number(form.packageNights.value);
  const basePrice = Number(form.packageBasePrice.value);
  const image = form.packageImage.value.trim() || 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?q=80&w=900&auto=format&fit=crop';
  const overview = form.packageOverview.value.trim();
  const hotel = form.packageHotel.value.trim();
  const food = form.packageFood.value.trim();
  const sightseeing = form.packageSightseeing.value.trim();
  const pkgType = form.packageTypeSelect?.value || (pkgId.startsWith('IND') ? 'india' : 'international');

  const isIndia = pkgType === 'india';
  const storageKey = isIndia ? 'akshar_indian_packages' : 'akshar_international_packages';
  let packages = JSON.parse(localStorage.getItem(storageKey) || '[]');

  if (pkgId) {
    // Edit existing
    const idx = packages.findIndex(p => p.id === pkgId);
    if (idx !== -1) {
      packages[idx] = {
        ...packages[idx],
        title, destination, category, days, nights, basePrice, image, overview, hotel, food, sightseeing
      };
      showToast(`Package ${pkgId} updated successfully!`, 'success');
    }
  } else {
    // Add new package
    const newId = (isIndia ? 'IND-' : 'INT-') + Math.floor(100 + Math.random() * 900);
    const newPkg = {
      id: newId,
      title,
      destination,
      category,
      days,
      nights,
      basePrice,
      flightPriceOffset: isIndia ? 6500 : 0,
      trainPriceOffset: isIndia ? 1200 : 0,
      busPriceOffset: 0,
      cruisePriceOffset: isIndia ? 0 : 45000,
      image,
      rating: 4.8,
      reviewsCount: 1,
      hotel,
      food,
      sightseeing,
      overview,
      inclusions: ["Deluxe Hotel Stay", "Daily Breakfast", "Sightseeing Transfers", "Assistance on Arrival"],
      exclusions: ["Personal Expenses", "Tips and laundry"],
      itinerary: [
        { day: 1, title: "Arrival & Sightseeing", desc: `Welcome to ${destination}. Check-in and relax.` },
        { day: 2, title: "Full Day Exploration", desc: `Explore top sights including ${sightseeing}.` },
        { day: 3, title: "Departure", desc: "Breakfast and transfer to airport/station." }
      ]
    };
    packages.unshift(newPkg);
    showToast(`New Package ${newId} created successfully!`, 'success');
  }

  localStorage.setItem(storageKey, JSON.stringify(packages));

  const modalEl = document.getElementById('packageModal');
  const modal = bootstrap.Modal.getInstance(modalEl);
  if (modal) modal.hide();

  renderAdminPackagesTable();
  renderAdminDashboardStats();
};

// ==========================================
// HOTELS CRUD MANAGEMENT
// ==========================================
function renderAdminHotelsTable(searchKeyword = '') {
  const tbody = document.getElementById('admin-hotels-tbody');
  if (!tbody) return;

  let hotels = getHotels();
  if (searchKeyword) {
    const kw = searchKeyword.toLowerCase();
    hotels = hotels.filter(h => h.name.toLowerCase().includes(kw) || h.location.toLowerCase().includes(kw));
  }

  const countBadge = document.getElementById('admin-hotels-count');
  if (countBadge) countBadge.textContent = `${hotels.length} Hotels`;

  if (hotels.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No hotels found.</td></tr>`;
    return;
  }

  tbody.innerHTML = hotels.map(h => `
    <tr>
      <td>
        <img src="${h.image}" alt="${h.name}" class="rounded-2 object-fit-cover" style="width: 50px; height: 40px;">
      </td>
      <td><strong>${h.id}</strong></td>
      <td>
        <div class="fw-bold text-navy">${h.name}</div>
        <div class="small text-muted">${h.location}, ${h.country}</div>
      </td>
      <td>
        <span class="text-gold">
          ${Array(h.stars).fill('<i class="bi bi-star-fill"></i>').join('')}
        </span>
      </td>
      <td class="fw-bold">${formatINR(h.pricePerNight)}</td>
      <td>
        <span class="badge bg-success"><i class="bi bi-star-fill"></i> ${h.rating}</span>
      </td>
      <td>
        <div class="d-flex gap-1">
          <button class="btn btn-sm btn-outline-primary" onclick="openEditHotelModal('${h.id}')" title="Edit Hotel">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteHotel('${h.id}')" title="Delete Hotel">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

window.deleteHotel = function(hotelId) {
  if (!confirm(`Are you sure you want to delete hotel ${hotelId}?`)) return;
  let hotels = getHotels();
  hotels = hotels.filter(h => h.id !== hotelId);
  localStorage.setItem('akshar_hotels', JSON.stringify(hotels));
  showToast(`Hotel ${hotelId} deleted.`, 'warning');
  renderAdminHotelsTable();
  renderAdminDashboardStats();
};

window.openAddHotelModal = function() {
  const form = document.getElementById('hotel-form');
  if (!form) return;
  form.reset();
  form.hotelId.value = '';
  document.getElementById('hotelModalLabel').textContent = 'Add New Hotel';
  const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('hotelModal'));
  modal.show();
};

window.openEditHotelModal = function(hotelId) {
  const form = document.getElementById('hotel-form');
  if (!form) return;
  const hotel = getHotelById(hotelId);
  if (!hotel) return;

  document.getElementById('hotelModalLabel').textContent = `Edit Hotel (${hotel.id})`;
  form.hotelId.value = hotel.id;
  form.hotelName.value = hotel.name;
  form.hotelLocation.value = hotel.location;
  form.hotelCountry.value = hotel.country;
  form.hotelStars.value = hotel.stars;
  form.hotelPrice.value = hotel.pricePerNight;
  form.hotelImage.value = hotel.image;
  form.hotelDescription.value = hotel.description || '';

  const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('hotelModal'));
  modal.show();
};

window.saveHotelForm = function(event) {
  event.preventDefault();
  const form = event.target;
  const hotelId = form.hotelId.value;
  const name = form.hotelName.value.trim();
  const location = form.hotelLocation.value.trim();
  const country = form.hotelCountry.value.trim();
  const stars = Number(form.hotelStars.value);
  const pricePerNight = Number(form.hotelPrice.value);
  const image = form.hotelImage.value.trim() || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=900&auto=format&fit=crop';
  const description = form.hotelDescription.value.trim();

  let hotels = getHotels();

  if (hotelId) {
    const idx = hotels.findIndex(h => h.id === hotelId);
    if (idx !== -1) {
      hotels[idx] = { ...hotels[idx], name, location, country, stars, pricePerNight, image, description };
      showToast(`Hotel ${hotelId} updated!`, 'success');
    }
  } else {
    const newId = 'HTL-' + Math.floor(100 + Math.random() * 900);
    const newHotel = {
      id: newId,
      name,
      location,
      country,
      stars,
      pricePerNight,
      image,
      roomTypes: ["Deluxe King Room", "Executive Suite"],
      amenities: ["Swimming Pool", "Free High-Speed WiFi", "Restaurant", "Spa"],
      rating: 4.8,
      reviewsCount: 1,
      description
    };
    hotels.unshift(newHotel);
    showToast(`New hotel ${newId} added!`, 'success');
  }

  localStorage.setItem('akshar_hotels', JSON.stringify(hotels));
  bootstrap.Modal.getInstance(document.getElementById('hotelModal'))?.hide();
  renderAdminHotelsTable();
  renderAdminDashboardStats();
};

// ==========================================
// BOOKINGS MANAGEMENT
// ==========================================
function renderAdminBookingsTable(statusFilter = 'all', searchKeyword = '') {
  const tbody = document.getElementById('admin-bookings-tbody');
  if (!tbody) return;

  let bookings = getAllBookings();

  if (statusFilter !== 'all') {
    bookings = bookings.filter(b => b.bookingStatus.toLowerCase() === statusFilter.toLowerCase());
  }

  if (searchKeyword) {
    const kw = searchKeyword.toLowerCase();
    bookings = bookings.filter(b => 
      b.bookingId.toLowerCase().includes(kw) || 
      b.customerName.toLowerCase().includes(kw) ||
      b.userEmail.toLowerCase().includes(kw) ||
      b.title.toLowerCase().includes(kw)
    );
  }

  const countBadge = document.getElementById('admin-bookings-count');
  if (countBadge) countBadge.textContent = `${bookings.length} Bookings`;

  if (bookings.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">No bookings match the criteria.</td></tr>`;
    return;
  }

  tbody.innerHTML = bookings.map(b => {
    let statusClass = 'pending';
    if (b.bookingStatus === 'Confirmed' || b.bookingStatus === 'Completed') statusClass = 'confirmed';
    if (b.bookingStatus === 'Cancelled' || b.bookingStatus === 'Rejected') statusClass = 'cancelled';

    return `
      <tr>
        <td><strong class="text-navy">#${b.bookingId}</strong></td>
        <td>
          <div class="fw-bold">${b.customerName}</div>
          <div class="small text-muted">${b.userEmail}</div>
          <div class="small text-muted">${b.customerMobile}</div>
        </td>
        <td>
          <div class="fw-bold">${b.title}</div>
          <div class="small text-muted"><i class="bi bi-airplane-engines me-1"></i>${b.transportSelected}</div>
        </td>
        <td>${new Date(b.travelDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
        <td>${b.travellers}</td>
        <td class="fw-bold text-navy">${formatINR(b.totalAmount)}</td>
        <td><span class="status-badge ${statusClass}">${b.bookingStatus}</span></td>
        <td>
          <div class="dropdown">
            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
              Action
            </button>
            <ul class="dropdown-menu dropdown-menu-end shadow">
              <li>
                <a class="dropdown-item text-success" href="javascript:void(0)" onclick="updateBookingStatus('${b.bookingId}', 'Confirmed')">
                  <i class="bi bi-check-circle me-2"></i> Confirm Booking
                </a>
              </li>
              <li>
                <a class="dropdown-item text-danger" href="javascript:void(0)" onclick="updateBookingStatus('${b.bookingId}', 'Rejected')">
                  <i class="bi bi-x-circle me-2"></i> Reject Booking
                </a>
              </li>
              <li>
                <a class="dropdown-item text-warning" href="javascript:void(0)" onclick="updateBookingStatus('${b.bookingId}', 'Pending')">
                  <i class="bi bi-clock-history me-2"></i> Mark Pending
                </a>
              </li>
              <li><hr class="dropdown-divider"></li>
              <li>
                <a class="dropdown-item" href="../booking/confirmation.html?id=${b.bookingId}" target="_blank">
                  <i class="bi bi-receipt me-2"></i> View Voucher
                </a>
              </li>
            </ul>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.updateBookingStatus = function(bookingId, newStatus) {
  let bookings = getAllBookings();
  const idx = bookings.findIndex(b => b.bookingId === bookingId);
  if (idx !== -1) {
    bookings[idx].bookingStatus = newStatus;
    localStorage.setItem('akshar_bookings', JSON.stringify(bookings));
    showToast(`Booking #${bookingId} status changed to ${newStatus}`, 'success');
    renderAdminBookingsTable();
    renderAdminDashboardStats();
  }
};

// ==========================================
// CUSTOMERS MANAGEMENT
// ==========================================
function renderAdminCustomersTable(searchKeyword = '') {
  const tbody = document.getElementById('admin-customers-tbody');
  if (!tbody) return;

  let users = getAllUsers().filter(u => u.role === 'customer');

  if (searchKeyword) {
    const kw = searchKeyword.toLowerCase();
    users = users.filter(u => u.name.toLowerCase().includes(kw) || u.email.toLowerCase().includes(kw) || u.mobile.includes(kw));
  }

  const countBadge = document.getElementById('admin-customers-count');
  if (countBadge) countBadge.textContent = `${users.length} Customers`;

  if (users.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No registered customers found.</td></tr>`;
    return;
  }

  const allBookings = getAllBookings();

  tbody.innerHTML = users.map(u => {
    const custBookings = allBookings.filter(b => b.userEmail.toLowerCase() === u.email.toLowerCase());
    return `
      <tr>
        <td><strong>${u.id}</strong></td>
        <td>
          <div class="fw-bold">${u.name}</div>
          <div class="small text-muted">${u.gender || 'Not Specified'}</div>
        </td>
        <td>${u.email}</td>
        <td>${u.mobile}</td>
        <td>${u.address || 'N/A'}</td>
        <td>
          <span class="badge bg-primary">${custBookings.length} Bookings</span>
        </td>
      </tr>
    `;
  }).join('');
}

// ==========================================
// CONTACT MESSAGES MANAGEMENT
// ==========================================
function renderAdminMessages() {
  const container = document.getElementById('admin-messages-list');
  if (!container) return;

  const messages = JSON.parse(localStorage.getItem('akshar_messages') || '[]');

  if (messages.length === 0) {
    container.innerHTML = `<div class="p-4 text-center text-muted">No inquiries received yet.</div>`;
    return;
  }

  container.innerHTML = messages.map(m => `
    <div class="card border rounded-3 p-3 mb-3 shadow-sm">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <div>
          <span class="fw-bold text-navy fs-6">${m.name}</span>
          <span class="text-muted small ms-2"><i class="bi bi-envelope"></i> ${m.email} | <i class="bi bi-phone"></i> ${m.mobile}</span>
        </div>
        <span class="badge ${m.status === 'Unread' ? 'bg-danger' : 'bg-secondary'}">${m.status}</span>
      </div>
      <h6 class="fw-bold mb-1 text-primary">${m.subject}</h6>
      <p class="text-secondary small mb-2">${m.message}</p>
      <div class="d-flex justify-content-between align-items-center text-muted small pt-2 border-top">
        <span>${new Date(m.date).toLocaleString('en-IN')}</span>
        <div>
          <button class="btn btn-sm btn-outline-success" onclick="markMessageRead('${m.id}')">Mark as Read</button>
          <a href="mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject)}" class="btn btn-sm btn-gold ms-1">Reply Email</a>
        </div>
      </div>
    </div>
  `).join('');
}

window.markMessageRead = function(msgId) {
  let messages = JSON.parse(localStorage.getItem('akshar_messages') || '[]');
  const idx = messages.findIndex(m => m.id === msgId);
  if (idx !== -1) {
    messages[idx].status = 'Read';
    localStorage.setItem('akshar_messages', JSON.stringify(messages));
    renderAdminMessages();
    showToast('Message marked as read.', 'info');
  }
};

// ==========================================
// WEBSITE & CONTACT SETTINGS MANAGEMENT
// ==========================================
function loadAdminSettings() {
  const form = document.getElementById('adminSettingsForm');
  if (!form) return;

  const s = typeof getBusinessSettings === 'function' ? getBusinessSettings() : null;
  if (!s) return;

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  };

  setVal('bizSettingName', s.name);
  setVal('bizSettingPhone', s.phone);
  setVal('bizSettingWhatsapp', s.whatsapp);
  setVal('bizSettingEmail', s.email);
  setVal('bizSettingAddress', s.address);
  setVal('bizSettingMapsUrl', s.mapsUrl);
  setVal('bizSettingDirectionsUrl', s.directionsUrl);
}

window.handleAdminSettingsSave = function(e) {
  e.preventDefault();
  const getVal = id => {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  };

  const updatedSettings = {
    name: getVal('bizSettingName') || 'Akshar Tours & Travels',
    phone: getVal('bizSettingPhone') || '9723010099',
    phoneFormatted: getVal('bizSettingPhone') || '9723010099',
    whatsapp: getVal('bizSettingWhatsapp') || '+91 9723010099',
    whatsappNumberOnly: (getVal('bizSettingWhatsapp') || '9723010099').replace(/[^0-9]/g, ''),
    email: getVal('bizSettingEmail') || 'info@akshartours.com',
    address: getVal('bizSettingAddress') || 'Near Bus Stand, Talala, Gir Somnath, Gujarat, India.',
    shortAddress: 'Talala, Gir Somnath, Gujarat',
    mapsUrl: getVal('bizSettingMapsUrl') || 'https://maps.google.com/?q=Near+Bus+Stand,+Talala,+Gir+Somnath,+Gujarat,+India',
    directionsUrl: getVal('bizSettingDirectionsUrl') || 'https://www.google.com/maps/dir/?api=1&destination=Near+Bus+Stand,+Talala,+Gir+Somnath,+Gujarat,+India'
  };

  if (typeof saveBusinessSettings === 'function') {
    saveBusinessSettings(updatedSettings);
  } else {
    localStorage.setItem('akshar_business_settings', JSON.stringify(updatedSettings));
  }

  if (typeof syncBusinessContactDetails === 'function') {
    syncBusinessContactDetails();
  }

  showToast('Website & Contact Settings saved successfully to LocalStorage!', 'success');
};

window.resetAdminSettingsDefault = function() {
  if (confirm('Reset contact settings to default (Near Bus Stand, Talala, 9723010099)?')) {
    const defaultSettings = {
      name: 'Akshar Tours & Travels',
      phone: '9723010099',
      phoneFormatted: '+91 9723010099',
      whatsapp: '+91 9723010099',
      whatsappNumberOnly: '919723010099',
      email: 'info@akshartours.com',
      address: 'Near Bus Stand, Talala, Gir Somnath, Gujarat, India.',
      shortAddress: 'Talala, Gir Somnath, Gujarat',
      mapsUrl: 'https://maps.google.com/?q=Near+Bus+Stand,+Talala,+Gir+Somnath,+Gujarat,+India',
      directionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=Near+Bus+Stand,+Talala,+Gir+Somnath,+Gujarat,+India'
    };
    if (typeof saveBusinessSettings === 'function') {
      saveBusinessSettings(defaultSettings);
    } else {
      localStorage.setItem('akshar_business_settings', JSON.stringify(defaultSettings));
    }
    loadAdminSettings();
    if (typeof syncBusinessContactDetails === 'function') {
      syncBusinessContactDetails();
    }
    showToast('Settings reset to default successfully.', 'info');
  }
};
