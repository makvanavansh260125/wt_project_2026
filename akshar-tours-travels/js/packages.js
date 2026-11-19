/**
 * AKSHAR TOURS & TRAVELS - PACKAGES ENGINE
 * Dynamic catalog rendering, filters, sorting, transport price calculations, details page
 */

// Retrieve packages from LocalStorage
function getPackages(type = 'all') {
  const india = JSON.parse(localStorage.getItem('akshar_indian_packages') || '[]');
  const intl = JSON.parse(localStorage.getItem('akshar_international_packages') || '[]');
  
  if (type === 'india') return india;
  if (type === 'international') return intl;
  return [...india, ...intl];
}

// Find a single package by ID
function getPackageById(id) {
  const all = getPackages('all');
  return all.find(p => p.id === id) || null;
}

// Calculate effective price per person based on selected transport
function calculatePackagePrice(pkg, transportMode) {
  let price = pkg.basePrice;
  const isIndia = pkg.id.startsWith('IND');

  if (isIndia) {
    if (transportMode === 'Flight') {
      price += (pkg.flightPriceOffset || 6500);
    } else if (transportMode === 'Train') {
      price += (pkg.trainPriceOffset || 1200);
    } else if (transportMode === 'Bus') {
      price += (pkg.busPriceOffset || 0);
    }
  } else {
    // International
    if (transportMode === 'Cruise') {
      price += (pkg.cruisePriceOffset || 45000);
    }
    // Flight is included in basePrice
  }
  return price;
}

// Render a single Package Card HTML
function createPackageCardHTML(pkg, pathPrefix = '') {
  const isIndia = pkg.id.startsWith('IND');
  const wishlistActive = isInWishlist(pkg.id);
  
  // Transport pills
  let transportBadgesHTML = '';
  if (isIndia) {
    transportBadgesHTML = `
      <div class="transport-pills-row">
        <span class="transport-pill-label">Transport:</span>
        <span class="transport-pill"><i class="bi bi-airplane-fill text-primary"></i> Flight</span>
        <span class="transport-pill"><i class="bi bi-train-front-fill text-danger"></i> Train</span>
        <span class="transport-pill"><i class="bi bi-bus-front-fill text-success"></i> Bus</span>
      </div>
    `;
  } else {
    transportBadgesHTML = `
      <div class="transport-pills-row">
        <span class="transport-pill-label">Transport:</span>
        <span class="transport-pill"><i class="bi bi-airplane-fill text-primary"></i> Flight</span>
        <span class="transport-pill"><i class="bi bi-tsunami text-info"></i> Luxury Cruise</span>
      </div>
    `;
  }

  const detailUrl = `${pathPrefix}packages/package-details.html?id=${pkg.id}`;
  const bookUrl = `${pathPrefix}booking/booking.html?id=${pkg.id}`;

  return `
    <div class="col-lg-4 col-md-6 mb-4">
      <div class="package-card">
        <div class="package-img-wrapper">
          <img src="${pkg.image}" alt="${pkg.title}" loading="lazy">
          <span class="package-badge-cat">${pkg.category || 'Tour'}</span>
          <span class="package-badge-duration">
            <i class="bi bi-clock-history"></i> ${pkg.days}D / ${pkg.nights}N
          </span>
          <button class="package-wishlist-btn ${wishlistActive ? 'active' : ''}" 
                  data-wishlist-id="${pkg.id}" 
                  title="Save to Wishlist"
                  onclick="toggleWishlist('${pkg.id}', '${pkg.title.replace(/'/g, "\\'")}')">
            <i class="bi ${wishlistActive ? 'bi-heart-fill text-danger' : 'bi-heart'}"></i>
          </button>
        </div>
        <div class="package-body">
          <div class="package-destination">
            <i class="bi bi-geo-alt-fill text-danger"></i> ${pkg.destination}
          </div>
          <h3 class="package-title">
            <a href="${detailUrl}">${pkg.title}</a>
          </h3>
          <div class="package-rating">
            <span class="stars">
              <i class="bi bi-star-fill"></i>
              <strong>${pkg.rating}</strong>
            </span>
            <span class="count">(${pkg.reviewsCount} verified reviews)</span>
          </div>
          <p class="package-desc">${pkg.overview}</p>
          
          ${transportBadgesHTML}

          <div class="package-footer">
            <div class="price-box">
              <span class="price-from">Starts from</span>
              <span class="price-amount">${formatINR(pkg.basePrice)}</span>
              <span class="price-per">/ person</span>
            </div>
            <div class="d-flex gap-2">
              <a href="${detailUrl}" class="btn btn-outline-navy btn-sm" style="border:1px solid var(--navy); color:var(--navy);">
                Details
              </a>
              <a href="${bookUrl}" class="btn btn-gold btn-sm">
                Book Now
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Render dynamic packages list with filtering & sorting
function renderPackagesList(containerId, packageType = 'india', options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  let packages = getPackages(packageType);

  // Filter: Search Keyword
  if (options.searchKeyword) {
    const kw = options.searchKeyword.toLowerCase();
    packages = packages.filter(p => 
      p.title.toLowerCase().includes(kw) || 
      p.destination.toLowerCase().includes(kw) ||
      (p.category && p.category.toLowerCase().includes(kw))
    );
  }

  // Filter: Category
  if (options.category && options.category !== 'all') {
    packages = packages.filter(p => p.category && p.category.toLowerCase() === options.category.toLowerCase());
  }

  // Filter: Max Price
  if (options.maxPrice) {
    packages = packages.filter(p => p.basePrice <= Number(options.maxPrice));
  }

  // Filter: Duration
  if (options.duration && options.duration !== 'all') {
    if (options.duration === 'short') packages = packages.filter(p => p.days <= 4);
    else if (options.duration === 'medium') packages = packages.filter(p => p.days >= 5 && p.days <= 7);
    else if (options.duration === 'long') packages = packages.filter(p => p.days >= 8);
  }

  // Sort
  if (options.sortBy) {
    if (options.sortBy === 'price-low') {
      packages.sort((a, b) => a.basePrice - b.basePrice);
    } else if (options.sortBy === 'price-high') {
      packages.sort((a, b) => b.basePrice - a.basePrice);
    } else if (options.sortBy === 'duration') {
      packages.sort((a, b) => b.days - a.days);
    } else if (options.sortBy === 'rating') {
      packages.sort((a, b) => b.rating - a.rating);
    }
  }

  // Update total count badge
  const countBadge = document.getElementById('results-count');
  if (countBadge) {
    countBadge.textContent = `${packages.length} Packages Found`;
  }

  if (packages.length === 0) {
    container.innerHTML = `
      <div class="col-12 py-5 text-center">
        <div class="py-5 bg-white rounded-4 shadow-sm border p-4">
          <i class="bi bi-search text-muted display-4 mb-3 d-block"></i>
          <h4>No packages matched your filter criteria</h4>
          <p class="text-muted">Try adjusting your filters or search terms to explore other marvelous journeys.</p>
          <button class="btn btn-gold mt-2" onclick="resetFilters()">Reset All Filters</button>
        </div>
      </div>
    `;
    return;
  }

  const pathPrefix = options.pathPrefix || '';
  container.innerHTML = packages.map(pkg => createPackageCardHTML(pkg, pathPrefix)).join('');
}

// Package Details Page Interactive Handler
function initPackageDetailsPage(pathPrefix = '../') {
  const urlParams = new URLSearchParams(window.location.search);
  const pkgId = urlParams.get('id') || 'IND-01';
  const pkg = getPackageById(pkgId);

  if (!pkg) {
    document.getElementById('package-details-container').innerHTML = `
      <div class="container py-5 text-center">
        <h2 class="text-danger">Package Not Found</h2>
        <p>The travel package you are looking for does not exist or has been modified.</p>
        <a href="${pathPrefix}index.html" class="btn btn-gold">Back to Home</a>
      </div>
    `;
    return;
  }

  const isIndia = pkg.id.startsWith('IND');
  let selectedTransport = isIndia ? 'Flight' : 'Flight';

  // Update page title & breadcrumbs
  document.title = `${pkg.title} | Akshar Tours & Travels`;
  const breadcrumbEl = document.getElementById('pkg-breadcrumb-title');
  if (breadcrumbEl) breadcrumbEl.textContent = pkg.title;

  const container = document.getElementById('package-details-container');
  if (!container) return;

  function renderDetails() {
    const calculatedPrice = calculatePackagePrice(pkg, selectedTransport);

    // Transport buttons block based on rules
    let transportSelectorBlock = '';
    if (isIndia) {
      transportSelectorBlock = `
        <div class="transport-selection-wrapper mb-4">
          <h5 class="fw-bold mb-3 text-navy">
            <i class="bi bi-signpost-split-fill text-gold me-2"></i> Select Transportation Option:
          </h5>
          <div class="row g-3">
            <div class="col-4">
              <div class="transport-selector-card ${selectedTransport === 'Flight' ? 'selected' : ''}" 
                   onclick="updateSelectedTransport('Flight')">
                <div class="transport-check-badge"><i class="bi bi-check-lg"></i></div>
                <div class="transport-icon"><i class="bi bi-airplane-fill"></i></div>
                <h6 class="fw-bold mb-1">Flight</h6>
                <div class="text-muted small">Fastest &amp; Convenient</div>
                <div class="badge bg-primary mt-2">+${formatINR(pkg.flightPriceOffset || 6500)}</div>
              </div>
            </div>
            <div class="col-4">
              <div class="transport-selector-card ${selectedTransport === 'Train' ? 'selected' : ''}" 
                   onclick="updateSelectedTransport('Train')">
                <div class="transport-check-badge"><i class="bi bi-check-lg"></i></div>
                <div class="transport-icon"><i class="bi bi-train-front-fill text-danger"></i></div>
                <h6 class="fw-bold mb-1">Train</h6>
                <div class="text-muted small">Comfortable 2A / 3A</div>
                <div class="badge bg-secondary mt-2">+${formatINR(pkg.trainPriceOffset || 1200)}</div>
              </div>
            </div>
            <div class="col-4">
              <div class="transport-selector-card ${selectedTransport === 'Bus' ? 'selected' : ''}" 
                   onclick="updateSelectedTransport('Bus')">
                <div class="transport-check-badge"><i class="bi bi-check-lg"></i></div>
                <div class="transport-icon"><i class="bi bi-bus-front-fill text-success"></i></div>
                <h6 class="fw-bold mb-1">Luxury Bus</h6>
                <div class="text-muted small">AC Sleeper Coach</div>
                <div class="badge bg-success mt-2">Standard Base</div>
              </div>
            </div>
          </div>
          <div class="alert alert-info py-2 px-3 mt-3 d-flex align-items-center gap-2 small">
            <i class="bi bi-info-circle-fill fs-5"></i>
            <span>Estimated package price updates dynamically above based on selected transportation.</span>
          </div>
        </div>
      `;
    } else {
      // International: ONLY Flight & Cruise! No Train or Bus!
      transportSelectorBlock = `
        <div class="transport-selection-wrapper mb-4">
          <h5 class="fw-bold mb-3 text-navy">
            <i class="bi bi-signpost-split-fill text-gold me-2"></i> Select Transportation Option:
          </h5>
          <div class="row g-3">
            <div class="col-6">
              <div class="transport-selector-card ${selectedTransport === 'Flight' ? 'selected' : ''}" 
                   onclick="updateSelectedTransport('Flight')">
                <div class="transport-check-badge"><i class="bi bi-check-lg"></i></div>
                <div class="transport-icon"><i class="bi bi-airplane-fill"></i></div>
                <h6 class="fw-bold mb-1">International Flight</h6>
                <div class="text-muted small">Return Economy Flight Included</div>
                <div class="badge bg-primary mt-2">Base Package Included</div>
              </div>
            </div>
            <div class="col-6">
              <div class="transport-selector-card ${selectedTransport === 'Cruise' ? 'selected' : ''}" 
                   onclick="updateSelectedTransport('Cruise')">
                <div class="transport-check-badge"><i class="bi bi-check-lg"></i></div>
                <div class="transport-icon"><i class="bi bi-tsunami text-info"></i></div>
                <h6 class="fw-bold mb-1">Luxury Ocean Cruise</h6>
                <div class="text-muted small">Ocean Liner Cabin + Flight</div>
                <div class="badge bg-gold text-dark mt-2">+${formatINR(pkg.cruisePriceOffset || 45000)}</div>
              </div>
            </div>
          </div>
          <div class="alert alert-warning py-2 px-3 mt-3 d-flex align-items-center gap-2 small">
            <i class="bi bi-shield-check fs-5"></i>
            <span>For international travel, travel options are strictly limited to premium flights and luxury ocean cruises.</span>
          </div>
        </div>
      `;
    }

    // Itinerary accordion HTML
    const itineraryHTML = (pkg.itinerary || []).map((item, idx) => `
      <div class="accordion-item mb-3 border rounded-3 overflow-hidden shadow-sm">
        <h2 class="accordion-header" id="headingDay${item.day}">
          <button class="accordion-button ${idx === 0 ? '' : 'collapsed'} fw-bold text-navy" type="button" data-bs-toggle="collapse" data-bs-target="#collapseDay${item.day}" aria-expanded="${idx === 0 ? 'true' : 'false'}">
            <span class="badge bg-gold text-dark me-3 px-3 py-2">Day ${item.day}</span>
            <span>${item.title}</span>
          </button>
        </h2>
        <div id="collapseDay${item.day}" class="accordion-collapse collapse ${idx === 0 ? 'show' : ''}" data-bs-parent="#itineraryAccordion">
          <div class="accordion-body text-secondary bg-light">
            ${item.desc}
          </div>
        </div>
      </div>
    `).join('');

    // Inclusions & Exclusions HTML
    const inclusionsHTML = (pkg.inclusions || []).map(inc => `
      <li class="mb-2 d-flex align-items-start gap-2">
        <i class="bi bi-check-circle-fill text-success mt-1"></i>
        <span>${inc}</span>
      </li>
    `).join('');

    const exclusionsHTML = (pkg.exclusions || []).map(exc => `
      <li class="mb-2 d-flex align-items-start gap-2">
        <i class="bi bi-x-circle-fill text-danger mt-1"></i>
        <span>${exc}</span>
      </li>
    `).join('');

    container.innerHTML = `
      <div class="row">
        <!-- Main Content Column -->
        <div class="col-lg-8">
          <!-- Package Header -->
          <div class="d-flex align-items-center gap-2 mb-2">
            <span class="badge bg-navy text-gold px-3 py-2">${pkg.category || 'Tour Package'}</span>
            <span class="badge bg-secondary px-3 py-2"><i class="bi bi-geo-alt"></i> ${pkg.destination}</span>
            <span class="badge bg-info text-dark px-3 py-2"><i class="bi bi-clock"></i> ${pkg.days} Days / ${pkg.nights} Nights</span>
          </div>
          <h1 class="display-6 fw-bold text-navy mb-3">${pkg.title}</h1>
          <div class="d-flex align-items-center gap-3 mb-4">
            <div class="text-gold">
              <i class="bi bi-star-fill"></i>
              <strong class="fs-5">${pkg.rating}</strong>
              <span class="text-muted">(${pkg.reviewsCount} customer reviews)</span>
            </div>
            <div class="vr"></div>
            <div class="text-muted small">
              <i class="bi bi-shield-check text-success"></i> 100% Verified Package
            </div>
          </div>

          <!-- Hero Image -->
          <div class="rounded-4 overflow-hidden shadow-lg mb-5 position-relative" style="max-height: 440px;">
            <img src="${pkg.image}" alt="${pkg.title}" class="w-100 h-100 object-fit-cover">
          </div>

          <!-- Transportation Selector Block -->
          ${transportSelectorBlock}

          <!-- Overview & Tabs -->
          <div class="card border-0 shadow-sm rounded-4 mb-4">
            <div class="card-body p-4">
              <h4 class="fw-bold text-navy mb-3">Package Overview</h4>
              <p class="text-secondary leading-relaxed">${pkg.overview}</p>
              
              <hr class="my-4">

              <div class="row g-4">
                <div class="col-md-6">
                  <div class="d-flex gap-3">
                    <div class="feature-icon-sm bg-primary text-white rounded-3 p-3 d-flex align-items-center justify-content-center" style="width:48px;height:48px;">
                      <i class="bi bi-building fs-4"></i>
                    </div>
                    <div>
                      <h6 class="fw-bold mb-1">Accommodation</h6>
                      <p class="small text-muted mb-0">${pkg.hotel}</p>
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="d-flex gap-3">
                    <div class="feature-icon-sm bg-warning text-dark rounded-3 p-3 d-flex align-items-center justify-content-center" style="width:48px;height:48px;">
                      <i class="bi bi-cup-hot-fill fs-4"></i>
                    </div>
                    <div>
                      <h6 class="fw-bold mb-1">Food &amp; Dining</h6>
                      <p class="small text-muted mb-0">${pkg.food}</p>
                    </div>
                  </div>
                </div>
                <div class="col-12">
                  <div class="d-flex gap-3">
                    <div class="feature-icon-sm bg-success text-white rounded-3 p-3 d-flex align-items-center justify-content-center" style="width:48px;height:48px;">
                      <i class="bi bi-binoculars-fill fs-4"></i>
                    </div>
                    <div>
                      <h6 class="fw-bold mb-1">Sightseeing Covered</h6>
                      <p class="small text-muted mb-0">${pkg.sightseeing}</p>
                    </div>
                  </div>
                </div>
                ${pkg.visaInfo ? `
                  <div class="col-12">
                    <div class="d-flex gap-3">
                      <div class="feature-icon-sm bg-info text-white rounded-3 p-3 d-flex align-items-center justify-content-center" style="width:48px;height:48px;">
                        <i class="bi bi-passport-fill fs-4"></i>
                      </div>
                      <div>
                        <h6 class="fw-bold mb-1">Visa &amp; Entry Requirements</h6>
                        <p class="small text-muted mb-0">${pkg.visaInfo}</p>
                      </div>
                    </div>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>

          <!-- Day by Day Itinerary -->
          <div class="card border-0 shadow-sm rounded-4 mb-4">
            <div class="card-body p-4">
              <h4 class="fw-bold text-navy mb-4">
                <i class="bi bi-calendar-range text-gold me-2"></i> Day-by-Day Travel Itinerary
              </h4>
              <div class="accordion" id="itineraryAccordion">
                ${itineraryHTML}
              </div>
            </div>
          </div>

          <!-- Inclusions & Exclusions -->
          <div class="card border-0 shadow-sm rounded-4 mb-4">
            <div class="card-body p-4">
              <div class="row">
                <div class="col-md-6 border-end-md">
                  <h5 class="fw-bold text-success mb-3">
                    <i class="bi bi-check-circle me-1"></i> What's Included
                  </h5>
                  <ul class="list-unstyled mb-0">
                    ${inclusionsHTML}
                  </ul>
                </div>
                <div class="col-md-6 mt-4 mt-md-0 ps-md-4">
                  <h5 class="fw-bold text-danger mb-3">
                    <i class="bi bi-x-circle me-1"></i> What's Excluded
                  </h5>
                  <ul class="list-unstyled mb-0">
                    ${exclusionsHTML}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sticky Booking Widget Sidebar -->
        <div class="col-lg-4">
          <div class="card border-0 shadow-lg rounded-4 p-4 sticky-top" style="top: 100px; z-index: 10;">
            <div class="text-center pb-3 border-bottom mb-3">
              <div class="text-muted small text-uppercase fw-bold">Package Starting Price</div>
              <div class="display-6 fw-bold text-navy my-1" id="live-calc-price">
                ${formatINR(calculatedPrice)}
              </div>
              <div class="text-muted small">per adult / twin sharing (${selectedTransport} included)</div>
            </div>

            <div class="booking-quick-summary mb-4">
              <div class="d-flex justify-content-between py-2 border-bottom small">
                <span class="text-muted">Duration:</span>
                <span class="fw-bold">${pkg.days} Days / ${pkg.nights} Nights</span>
              </div>
              <div class="d-flex justify-content-between py-2 border-bottom small">
                <span class="text-muted">Transport Mode:</span>
                <span class="fw-bold text-primary" id="live-transport-name">${selectedTransport}</span>
              </div>
              <div class="d-flex justify-content-between py-2 border-bottom small">
                <span class="text-muted">Accommodation:</span>
                <span class="fw-bold">4-Star Deluxe</span>
              </div>
              <div class="d-flex justify-content-between py-2 border-bottom small">
                <span class="text-muted">Instant Confirmation:</span>
                <span class="fw-bold text-success">Guaranteed</span>
              </div>
            </div>

            <a href="${pathPrefix}booking/booking.html?id=${pkg.id}&transport=${selectedTransport}" 
               class="btn btn-gold btn-lg w-100 py-3 mb-3 fw-bold">
              <i class="bi bi-lightning-charge-fill me-1"></i> Proceed to Book Now
            </a>

            <button class="btn btn-outline-navy w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                    onclick="toggleWishlist('${pkg.id}', '${pkg.title.replace(/'/g, "\\'")}')">
              <i class="bi bi-heart"></i> Save to Wishlist
            </button>

            <div class="mt-4 pt-3 border-top text-center">
              <div class="text-muted small mb-2"><i class="bi bi-telephone-fill text-gold me-1"></i> Need help customizing this package?</div>
              <strong class="text-navy">+91 79 2656 7890</strong>
              <div class="text-muted" style="font-size: 0.75rem;">Mon - Sat (9:00 AM - 8:00 PM)</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Window helper to switch transport
  window.updateSelectedTransport = function(transport) {
    selectedTransport = transport;
    renderDetails();
  };

  renderDetails();
}

// Window helper: Reset filters
window.resetFilters = function() {
  const searchInput = document.getElementById('filter-search');
  if (searchInput) searchInput.value = '';
  const catSelect = document.getElementById('filter-category');
  if (catSelect) catSelect.value = 'all';
  const durationSelect = document.getElementById('filter-duration');
  if (durationSelect) durationSelect.value = 'all';
  const priceSlider = document.getElementById('filter-price');
  if (priceSlider) priceSlider.value = priceSlider.max;
  const priceDisplay = document.getElementById('filter-price-val');
  if (priceDisplay) priceDisplay.textContent = formatINR(priceSlider.max);

  const isIndia = window.location.pathname.includes('india.html');
  renderPackagesList('packages-grid', isIndia ? 'india' : 'international');
};
