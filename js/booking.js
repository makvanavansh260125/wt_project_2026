/**
 * AKSHAR TOURS & TRAVELS - BOOKING SYSTEM
 * 10-Step Interactive Booking Engine, Dynamic Price Breakdown, ID Generator & Confirmation
 */

// Generate Unique Booking Reference (e.g. ATT-2026-94812)
function generateBookingId() {
  const year = new Date().getFullYear();
  const randomCode = Math.floor(10000 + Math.random() * 90000);
  return `ATT-${year}-${randomCode}`;
}

// Retrieve Bookings from LocalStorage
function getAllBookings() {
  const bookings = localStorage.getItem('akshar_bookings');
  return bookings ? JSON.parse(bookings) : [];
}

// Save a booking into LocalStorage
function saveBooking(bookingObj) {
  const bookings = getAllBookings();
  bookings.unshift(bookingObj); // Add to beginning
  localStorage.setItem('akshar_bookings', JSON.stringify(bookings));
  return bookingObj;
}

// Booking State Object for active booking session
let currentBookingState = {
  itemType: 'package', // 'package', 'hotel', 'flight', 'train', 'bus', 'cruise'
  itemId: '',
  title: '',
  destination: '',
  image: '',
  basePrice: 0,
  travelDate: '',
  travellers: 2,
  transportSelected: 'Flight',
  transportFarePerPerson: 0,
  roomType: 'Deluxe Room',
  nights: 1,
  customerName: '',
  customerEmail: '',
  customerMobile: '',
  customerAddress: '',
  specialRequests: '',
  promoDiscount: 0,
  promoCode: '',
  taxes: 0,
  totalAmount: 0
};

// Initialize Booking Engine on booking.html
function initBookingWizard() {
  const urlParams = new URLSearchParams(window.location.search);
  const type = urlParams.get('type') || 'package';
  const id = urlParams.get('id') || 'IND-01';
  const preSelectedTransport = urlParams.get('transport');

  currentBookingState.itemType = type;
  currentBookingState.itemId = id;

  if (type === 'hotel') {
    const hotel = getHotelById(id);
    if (!hotel) {
      showToast('Hotel not found. Redirecting...', 'error');
      setTimeout(() => { window.location.href = '../hotels/hotels.html'; }, 1500);
      return;
    }
    currentBookingState.title = hotel.name;
    currentBookingState.destination = `${hotel.location}, ${hotel.country}`;
    currentBookingState.image = hotel.image;
    currentBookingState.basePrice = hotel.pricePerNight;
    currentBookingState.transportSelected = 'Hotel Stay';
  } else {
    // Package
    const pkg = getPackageById(id);
    if (!pkg) {
      showToast('Package not found. Redirecting...', 'error');
      setTimeout(() => { window.location.href = '../packages/india.html'; }, 1500);
      return;
    }
    currentBookingState.title = pkg.title;
    currentBookingState.destination = pkg.destination;
    currentBookingState.image = pkg.image;
    currentBookingState.basePrice = pkg.basePrice;

    const isIndia = pkg.id.startsWith('IND');
    if (preSelectedTransport) {
      currentBookingState.transportSelected = preSelectedTransport;
    } else {
      currentBookingState.transportSelected = isIndia ? 'Flight' : 'Flight';
    }
  }

  // Pre-fill user details if logged in
  const currentUser = getCurrentUser();
  if (currentUser) {
    currentBookingState.customerName = currentUser.name || '';
    currentBookingState.customerEmail = currentUser.email || '';
    currentBookingState.customerMobile = currentUser.mobile || '';
    currentBookingState.customerAddress = currentUser.address || '';
  }

  // Set default travel date to 10 days from today
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 10);
  currentBookingState.travelDate = defaultDate.toISOString().split('T')[0];

  renderBookingWizardUI();
}

// Render dynamic elements of Booking Wizard
function renderBookingWizardUI() {
  const isHotel = currentBookingState.itemType === 'hotel';
  const pkg = !isHotel ? getPackageById(currentBookingState.itemId) : null;
  const isIndia = pkg ? pkg.id.startsWith('IND') : true;

  // Header and Item Preview
  const previewContainer = document.getElementById('booking-item-preview');
  if (previewContainer) {
    previewContainer.innerHTML = `
      <div class="d-flex align-items-center gap-3">
        <img src="${currentBookingState.image}" alt="${currentBookingState.title}" class="rounded-3 object-fit-cover" style="width: 100px; height: 80px;">
        <div>
          <span class="badge bg-gold text-dark mb-1 text-uppercase">${isHotel ? 'Luxury Hotel' : (isIndia ? 'Indian Tour' : 'International Tour')}</span>
          <h5 class="fw-bold text-navy mb-1">${currentBookingState.title}</h5>
          <div class="text-muted small"><i class="bi bi-geo-alt-fill text-danger me-1"></i>${currentBookingState.destination}</div>
        </div>
      </div>
    `;
  }

  // Render Transport Options section
  const transportContainer = document.getElementById('step-transport-options');
  if (transportContainer) {
    if (isHotel) {
      transportContainer.innerHTML = `
        <div class="alert alert-secondary d-flex align-items-center gap-2">
          <i class="bi bi-building-check fs-4 text-primary"></i>
          <div>
            <strong>Direct Hotel Reservation</strong>
            <p class="small text-muted mb-0">Includes luxury room stay, welcome drink, and hotel breakfast buffet.</p>
          </div>
        </div>
      `;
    } else if (isIndia) {
      // Indian Tour: Flight, Train, Bus
      transportContainer.innerHTML = `
        <div class="row g-3">
          <div class="col-md-4">
            <div class="transport-selector-card ${currentBookingState.transportSelected === 'Flight' ? 'selected' : ''}" 
                 onclick="setBookingTransport('Flight', ${pkg.flightPriceOffset || 6500})">
              <div class="transport-check-badge"><i class="bi bi-check-lg"></i></div>
              <div class="transport-icon"><i class="bi bi-airplane-fill"></i></div>
              <h6 class="fw-bold mb-1">Flight</h6>
              <div class="text-muted small">Return Economy Airfare</div>
              <div class="badge bg-primary mt-2">+${formatINR(pkg.flightPriceOffset || 6500)} / person</div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="transport-selector-card ${currentBookingState.transportSelected === 'Train' ? 'selected' : ''}" 
                 onclick="setBookingTransport('Train', ${pkg.trainPriceOffset || 1200})">
              <div class="transport-check-badge"><i class="bi bi-check-lg"></i></div>
              <div class="transport-icon"><i class="bi bi-train-front-fill text-danger"></i></div>
              <h6 class="fw-bold mb-1">Train</h6>
              <div class="text-muted small">Confirmed 2A / 3A Berth</div>
              <div class="badge bg-secondary mt-2">+${formatINR(pkg.trainPriceOffset || 1200)} / person</div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="transport-selector-card ${currentBookingState.transportSelected === 'Bus' ? 'selected' : ''}" 
                 onclick="setBookingTransport('Bus', ${pkg.busPriceOffset || 0})">
              <div class="transport-check-badge"><i class="bi bi-check-lg"></i></div>
              <div class="transport-icon"><i class="bi bi-bus-front-fill text-success"></i></div>
              <h6 class="fw-bold mb-1">Luxury AC Bus</h6>
              <div class="text-muted small">Multi-axle Volvo / Scania Sleeper</div>
              <div class="badge bg-success mt-2">Standard Base</div>
            </div>
          </div>
        </div>
      `;
    } else {
      // International Tour: ONLY Flight & Cruise! No Train or Bus!
      transportContainer.innerHTML = `
        <div class="row g-3">
          <div class="col-md-6">
            <div class="transport-selector-card ${currentBookingState.transportSelected === 'Flight' ? 'selected' : ''}" 
                 onclick="setBookingTransport('Flight', 0)">
              <div class="transport-check-badge"><i class="bi bi-check-lg"></i></div>
              <div class="transport-icon"><i class="bi bi-airplane-fill"></i></div>
              <h6 class="fw-bold mb-1">International Flight</h6>
              <div class="text-muted small">Return Economy Flight (Included in Package)</div>
              <div class="badge bg-primary mt-2">Standard Included</div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="transport-selector-card ${currentBookingState.transportSelected === 'Cruise' ? 'selected' : ''}" 
                 onclick="setBookingTransport('Cruise', ${pkg.cruisePriceOffset || 45000})">
              <div class="transport-check-badge"><i class="bi bi-check-lg"></i></div>
              <div class="transport-icon"><i class="bi bi-tsunami text-info"></i></div>
              <h6 class="fw-bold mb-1">Luxury Ocean Liner Cruise</h6>
              <div class="text-muted small">Oceanview Balcony Stateroom + Flights</div>
              <div class="badge bg-gold text-dark mt-2">+${formatINR(pkg.cruisePriceOffset || 45000)} / person</div>
            </div>
          </div>
        </div>
      `;
    }
  }

  // Pre-fill form inputs
  const nameInput = document.getElementById('book-name');
  if (nameInput && currentBookingState.customerName) nameInput.value = currentBookingState.customerName;

  const emailInput = document.getElementById('book-email');
  if (emailInput && currentBookingState.customerEmail) emailInput.value = currentBookingState.customerEmail;

  const mobileInput = document.getElementById('book-mobile');
  if (mobileInput && currentBookingState.customerMobile) mobileInput.value = currentBookingState.customerMobile;

  const addressInput = document.getElementById('book-address');
  if (addressInput && currentBookingState.customerAddress) addressInput.value = currentBookingState.customerAddress;

  const dateInput = document.getElementById('book-date');
  if (dateInput) {
    dateInput.value = currentBookingState.travelDate;
    // Disallow past dates
    const todayStr = new Date().toISOString().split('T')[0];
    dateInput.min = todayStr;
  }

  recalculateBookingFinancials();
}

// Update transport selection
window.setBookingTransport = function(mode, offset) {
  currentBookingState.transportSelected = mode;
  currentBookingState.transportFarePerPerson = offset;
  renderBookingWizardUI();
};

// Recalculate all numbers
function recalculateBookingFinancials() {
  const isHotel = currentBookingState.itemType === 'hotel';
  const travellers = Number(currentBookingState.travellers) || 1;
  const baseRate = Number(currentBookingState.basePrice) || 0;
  const transportOffset = Number(currentBookingState.transportFarePerPerson) || 0;

  const subtotalBase = baseRate * travellers;
  const subtotalTransport = transportOffset * travellers;
  const grossTotal = subtotalBase + subtotalTransport;

  // 5% GST for tourism packages
  const gstRate = 0.05;
  const calculatedTax = Math.round(grossTotal * gstRate);
  currentBookingState.taxes = calculatedTax;

  const discount = currentBookingState.promoDiscount || 0;
  const netTotal = Math.max(0, grossTotal + calculatedTax - discount);
  currentBookingState.totalAmount = netTotal;

  // Update UI Elements
  updateTextById('summary-base-rate', formatINR(baseRate));
  updateTextById('summary-travellers-count', travellers);
  updateTextById('summary-subtotal-base', formatINR(subtotalBase));
  updateTextById('summary-transport-name', currentBookingState.transportSelected);
  updateTextById('summary-transport-fare', formatINR(subtotalTransport));
  updateTextById('summary-taxes', formatINR(calculatedTax));
  updateTextById('summary-discount', discount > 0 ? `-${formatINR(discount)}` : '₹0');
  updateTextById('summary-grand-total', formatINR(netTotal));
}

function updateTextById(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// Apply Promo Code
window.applyPromoCode = function() {
  const promoInput = document.getElementById('promo-code-input');
  if (!promoInput) return;
  const code = promoInput.value.trim().toUpperCase();

  if (code === 'AKSHAR10') {
    const gross = (currentBookingState.basePrice + currentBookingState.transportFarePerPerson) * currentBookingState.travellers;
    currentBookingState.promoDiscount = Math.round(gross * 0.10);
    currentBookingState.promoCode = code;
    showToast(`Promo code AKSHAR10 applied! You saved ${formatINR(currentBookingState.promoDiscount)}`, 'success');
  } else if (code === 'HOLIDAY500' || code === 'WELCOME500') {
    currentBookingState.promoDiscount = 500;
    currentBookingState.promoCode = code;
    showToast(`Promo code applied! Flat ₹500 off.`, 'success');
  } else {
    showToast('Invalid promo code. Try "AKSHAR10" for 10% discount.', 'error');
    currentBookingState.promoDiscount = 0;
    currentBookingState.promoCode = '';
  }
  recalculateBookingFinancials();
};

// Wizard Step Navigation
let currentWizardStep = 1;

window.goToWizardStep = function(step) {
  if (step > currentWizardStep) {
    // Validate current step before advancing
    if (currentWizardStep === 1) {
      const dateVal = document.getElementById('book-date').value;
      if (!dateVal) {
        showToast('Please select your preferred travel date', 'warning');
        return;
      }
      currentBookingState.travelDate = dateVal;
      currentBookingState.travellers = Number(document.getElementById('book-travellers').value);
      recalculateBookingFinancials();
    } else if (currentWizardStep === 2) {
      // Customer Details validation
      const name = document.getElementById('book-name').value.trim();
      const email = document.getElementById('book-email').value.trim();
      const mobile = document.getElementById('book-mobile').value.trim();
      const address = document.getElementById('book-address').value.trim();

      if (!name || name.length < 3) {
        showToast('Please enter your full name', 'warning');
        return;
      }
      if (!email || !email.includes('@')) {
        showToast('Please enter a valid email address', 'warning');
        return;
      }
      if (!mobile || mobile.length < 10) {
        showToast('Please enter a valid 10-digit mobile number', 'warning');
        return;
      }
      if (!address) {
        showToast('Please enter your address for booking documents', 'warning');
        return;
      }

      currentBookingState.customerName = name;
      currentBookingState.customerEmail = email;
      currentBookingState.customerMobile = mobile;
      currentBookingState.customerAddress = address;
      currentBookingState.specialRequests = document.getElementById('book-requests')?.value || '';

      // Populate review step
      populateReviewStep();
    }
  }

  currentWizardStep = step;

  // Toggle step panels
  document.querySelectorAll('.wizard-panel').forEach((panel, idx) => {
    panel.style.display = (idx + 1 === step) ? 'block' : 'none';
  });

  // Toggle step circles
  document.querySelectorAll('.step-item').forEach((item, idx) => {
    item.classList.remove('active', 'completed');
    if (idx + 1 === step) item.classList.add('active');
    else if (idx + 1 < step) item.classList.add('completed');
  });

  window.scrollTo({ top: 120, behavior: 'smooth' });
};

// Populate Review Step
function populateReviewStep() {
  updateTextById('review-pkg-title', currentBookingState.title);
  updateTextById('review-destination', currentBookingState.destination);
  updateTextById('review-travel-date', new Date(currentBookingState.travelDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }));
  updateTextById('review-travellers', `${currentBookingState.travellers} Person(s)`);
  updateTextById('review-transport', currentBookingState.transportSelected);
  updateTextById('review-cust-name', currentBookingState.customerName);
  updateTextById('review-cust-email', currentBookingState.customerEmail);
  updateTextById('review-cust-mobile', currentBookingState.customerMobile);
  updateTextById('review-final-amount', formatINR(currentBookingState.totalAmount));
}

// Final Submit Booking Request
window.submitBookingRequest = function() {
  const termsChecked = document.getElementById('book-confirm-terms')?.checked;
  if (!termsChecked) {
    showToast('Please check the confirmation box agreeing to the terms.', 'warning');
    return;
  }

  const bookingId = generateBookingId();

  const newBooking = {
    bookingId: bookingId,
    itemType: currentBookingState.itemType,
    itemId: currentBookingState.itemId,
    title: currentBookingState.title,
    destination: currentBookingState.destination,
    image: currentBookingState.image,
    userEmail: currentBookingState.customerEmail.toLowerCase(),
    customerName: currentBookingState.customerName,
    customerMobile: currentBookingState.customerMobile,
    customerAddress: currentBookingState.customerAddress,
    travelDate: currentBookingState.travelDate,
    travellers: currentBookingState.travellers,
    transportSelected: currentBookingState.transportSelected,
    baseFare: currentBookingState.basePrice * currentBookingState.travellers,
    transportFare: currentBookingState.transportFarePerPerson * currentBookingState.travellers,
    taxes: currentBookingState.taxes,
    discount: currentBookingState.promoDiscount,
    totalAmount: currentBookingState.totalAmount,
    bookingStatus: 'Pending', // Initial status
    paymentStatus: 'Payment on Confirmation / Demo Card',
    bookedAt: new Date().toISOString()
  };

  saveBooking(newBooking);

  showToast('Booking Request Generated Successfully!', 'success');

  // Redirect to confirmation page
  setTimeout(() => {
    window.location.href = `confirmation.html?id=${bookingId}`;
  }, 1000);
};

// Init Confirmation Page
function initConfirmationPage(pathPrefix = '') {
  const urlParams = new URLSearchParams(window.location.search);
  const bookingId = urlParams.get('id');

  if (!bookingId) {
    showToast('No booking ID specified', 'error');
    setTimeout(() => { window.location.href = `${pathPrefix}index.html`; }, 1500);
    return;
  }

  const bookings = getAllBookings();
  const booking = bookings.find(b => b.bookingId === bookingId);

  if (!booking) {
    document.getElementById('confirmation-container').innerHTML = `
      <div class="card border-0 shadow rounded-4 p-5 text-center">
        <i class="bi bi-exclamation-triangle text-warning display-3 mb-3"></i>
        <h3>Booking Not Found</h3>
        <p class="text-muted">We could not locate reference ${bookingId} in our system.</p>
        <a href="${pathPrefix}index.html" class="btn btn-gold mt-2">Return Home</a>
      </div>
    `;
    return;
  }

  const container = document.getElementById('confirmation-container');
  if (!container) return;

  container.innerHTML = `
    <div class="text-center mb-4">
      <div class="d-inline-flex p-3 rounded-circle bg-success bg-opacity-10 text-success mb-3">
        <i class="bi bi-check-circle-fill display-4"></i>
      </div>
      <h2 class="fw-bold text-navy">Booking Request Placed!</h2>
      <p class="text-muted">Thank you, <strong>${booking.customerName}</strong>. Your travel reservation request has been received.</p>
    </div>

    <!-- Printable Receipt Card -->
    <div class="receipt-wrapper mb-4">
      <div class="receipt-watermark">AKSHAR TOURS</div>
      <div class="receipt-header d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <img src="${pathPrefix}assets/logos/logo.svg" alt="Akshar Tours &amp; Travels" style="height: 48px;">
          <div class="text-muted small mt-1">Near Bus Stand, Talala, Gir Somnath, Gujarat, India | +91 9723010099</div>
        </div>
        <div class="text-end">
          <span class="badge bg-navy text-gold px-3 py-2 fs-6">RECEIPT / VOUCHER</span>
          <div class="fw-bold text-navy mt-1">ID: ${booking.bookingId}</div>
          <div class="text-muted small">${new Date(booking.bookedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
        </div>
      </div>

      <div class="row g-4 mb-4">
        <div class="col-md-6">
          <h6 class="text-muted text-uppercase fw-bold small">Customer Information</h6>
          <div class="fw-bold fs-6 text-navy">${booking.customerName}</div>
          <div class="text-secondary small"><i class="bi bi-envelope me-1"></i>${booking.userEmail}</div>
          <div class="text-secondary small"><i class="bi bi-telephone me-1"></i>${booking.customerMobile}</div>
          <div class="text-secondary small"><i class="bi bi-geo-alt me-1"></i>${booking.customerAddress}</div>
        </div>
        <div class="col-md-6 text-md-end">
          <h6 class="text-muted text-uppercase fw-bold small">Travel Details</h6>
          <div class="fw-bold fs-6 text-navy">${booking.title}</div>
          <div class="text-secondary small">${booking.destination}</div>
          <div class="text-secondary small"><strong>Travel Date:</strong> ${new Date(booking.travelDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
          <div class="text-secondary small"><strong>Travellers:</strong> ${booking.travellers} Person(s)</div>
          <div class="text-secondary small"><strong>Transport Mode:</strong> ${booking.transportSelected}</div>
        </div>
      </div>

      <!-- Financial Table -->
      <div class="table-responsive mb-4">
        <table class="table table-bordered">
          <thead class="table-light">
            <tr>
              <th>Description</th>
              <th class="text-center">Units / Person</th>
              <th class="text-end">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>${booking.title}</strong>
                <div class="small text-muted">${booking.destination}</div>
              </td>
              <td class="text-center">${booking.travellers}</td>
              <td class="text-end">${formatINR(booking.baseFare)}</td>
            </tr>
            <tr>
              <td>
                <strong>Transportation Charges</strong>
                <div class="small text-muted">${booking.transportSelected} Option</div>
              </td>
              <td class="text-center">${booking.travellers}</td>
              <td class="text-end">${formatINR(booking.transportFare)}</td>
            </tr>
            <tr>
              <td colspan="2" class="text-end">Applicable GST &amp; Tourism Taxes (5%)</td>
              <td class="text-end">${formatINR(booking.taxes)}</td>
            </tr>
            ${booking.discount > 0 ? `
              <tr>
                <td colspan="2" class="text-end text-success fw-bold">Promotional Discount Applied</td>
                <td class="text-end text-success fw-bold">-${formatINR(booking.discount)}</td>
              </tr>
            ` : ''}
            <tr class="table-warning">
              <td colspan="2" class="text-end fs-5 fw-bold text-navy">Total Booking Amount:</td>
              <td class="text-end fs-5 fw-bold text-navy">${formatINR(booking.totalAmount)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 pt-3 border-top small text-muted">
        <div>
          <strong>Status:</strong> 
          <span class="badge ${booking.bookingStatus === 'Confirmed' ? 'bg-success' : 'bg-warning text-dark'} ms-1">
            ${booking.bookingStatus}
          </span>
        </div>
        <div>
          * This is a travel agency booking request demonstration voucher.
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="d-flex justify-content-center gap-3 no-print flex-wrap">
      <button class="btn btn-navy" onclick="window.print()">
        <i class="bi bi-printer me-1"></i> Print / Download Receipt
      </button>
      <a href="${pathPrefix}customer/dashboard.html" class="btn btn-royal">
        <i class="bi bi-speedometer2 me-1"></i> Go to Customer Dashboard
      </a>
      <a href="${pathPrefix}index.html" class="btn btn-outline-navy">
        <i class="bi bi-house me-1"></i> Return to Home
      </a>
    </div>
  `;
}
