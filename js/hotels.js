/**
 * AKSHAR TOURS & TRAVELS - HOTELS ENGINE
 * Dynamic hotel rendering, search, filtering by star rating & price, booking modal
 */

// Retrieve hotels from LocalStorage
function getHotels() {
  const hotels = localStorage.getItem('akshar_hotels');
  return hotels ? JSON.parse(hotels) : [];
}

// Find hotel by ID
function getHotelById(id) {
  const hotels = getHotels();
  return hotels.find(h => h.id === id) || null;
}

// Create Hotel Card HTML
function createHotelCardHTML(hotel, pathPrefix = '') {
  const starsArray = Array(hotel.stars).fill('<i class="bi bi-star-fill"></i>').join(' ');
  const bookUrl = `${pathPrefix}booking/booking.html?type=hotel&id=${hotel.id}`;

  const amenitiesBadges = (hotel.amenities || []).slice(0, 3).map(a => `
    <span class="badge bg-light text-dark border me-1 mb-1 font-weight-normal small">
      <i class="bi bi-check2 text-gold me-1"></i>${a}
    </span>
  `).join('');

  return `
    <div class="col-lg-4 col-md-6 mb-4">
      <div class="hotel-card">
        <div class="hotel-img-wrapper">
          <img src="${hotel.image}" alt="${hotel.name}" loading="lazy">
          <div class="hotel-stars">
            ${starsArray}
          </div>
          <span class="position-absolute top-0 end-0 m-3 badge bg-navy text-gold px-2 py-1">
            ${hotel.country}
          </span>
        </div>
        <div class="p-3 d-flex flex-column flex-grow-1">
          <div class="d-flex align-items-center text-muted small mb-1">
            <i class="bi bi-geo-alt-fill text-danger me-1"></i>
            <span>${hotel.location}</span>
          </div>
          <h4 class="h5 fw-bold text-navy mb-2">${hotel.name}</h4>
          
          <div class="d-flex align-items-center gap-2 mb-2">
            <span class="badge bg-success text-white px-2 py-1">
              <i class="bi bi-star-fill"></i> ${hotel.rating}
            </span>
            <span class="text-muted small">(${hotel.reviewsCount} reviews)</span>
          </div>

          <p class="text-muted small mb-3 flex-grow-1" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${hotel.description}
          </p>

          <div class="amenities-preview mb-3">
            ${amenitiesBadges}
          </div>

          <div class="d-flex align-items-center justify-content-between pt-3 border-top mt-auto">
            <div>
              <span class="text-muted small d-block">Starting from</span>
              <span class="fs-5 fw-bold text-navy">${formatINR(hotel.pricePerNight)}</span>
              <span class="text-muted small">/ night</span>
            </div>
            <a href="${bookUrl}" class="btn btn-gold btn-sm">
              <i class="bi bi-calendar-check me-1"></i> Book Hotel
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Render dynamic hotels list with filtering & sorting
function renderHotelsList(containerId, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  let hotels = getHotels();

  // Search keyword (city or hotel name)
  if (options.searchKeyword) {
    const kw = options.searchKeyword.toLowerCase();
    hotels = hotels.filter(h => 
      h.name.toLowerCase().includes(kw) || 
      h.location.toLowerCase().includes(kw) ||
      h.country.toLowerCase().includes(kw)
    );
  }

  // Filter: Star Rating
  if (options.stars && options.stars !== 'all') {
    hotels = hotels.filter(h => h.stars === Number(options.stars));
  }

  // Filter: Country (India vs International)
  if (options.country && options.country !== 'all') {
    if (options.country === 'india') {
      hotels = hotels.filter(h => h.country.toLowerCase() === 'india');
    } else {
      hotels = hotels.filter(h => h.country.toLowerCase() !== 'india');
    }
  }

  // Filter: Max Price
  if (options.maxPrice) {
    hotels = hotels.filter(h => h.pricePerNight <= Number(options.maxPrice));
  }

  // Sort
  if (options.sortBy) {
    if (options.sortBy === 'price-low') {
      hotels.sort((a, b) => a.pricePerNight - b.pricePerNight);
    } else if (options.sortBy === 'price-high') {
      hotels.sort((a, b) => b.pricePerNight - a.pricePerNight);
    } else if (options.sortBy === 'rating') {
      hotels.sort((a, b) => b.rating - a.rating);
    }
  }

  // Update counter badge
  const countBadge = document.getElementById('hotels-results-count');
  if (countBadge) {
    countBadge.textContent = `${hotels.length} Luxury Hotels Found`;
  }

  if (hotels.length === 0) {
    container.innerHTML = `
      <div class="col-12 py-5 text-center">
        <div class="py-5 bg-white rounded-4 shadow-sm border p-4">
          <i class="bi bi-building-slash text-muted display-4 mb-3 d-block"></i>
          <h4>No hotels match your search criteria</h4>
          <p class="text-muted">Try relaxing your price or rating filters to see more luxury properties.</p>
          <button class="btn btn-gold mt-2" onclick="resetHotelFilters()">Reset Hotel Filters</button>
        </div>
      </div>
    `;
    return;
  }

  const pathPrefix = options.pathPrefix || '';
  container.innerHTML = hotels.map(h => createHotelCardHTML(h, pathPrefix)).join('');
}

// Reset hotel filters
window.resetHotelFilters = function() {
  const searchInput = document.getElementById('hotel-filter-search');
  if (searchInput) searchInput.value = '';
  const starSelect = document.getElementById('hotel-filter-stars');
  if (starSelect) starSelect.value = 'all';
  const countrySelect = document.getElementById('hotel-filter-country');
  if (countrySelect) countrySelect.value = 'all';
  const priceSlider = document.getElementById('hotel-filter-price');
  if (priceSlider) {
    priceSlider.value = priceSlider.max;
    const priceVal = document.getElementById('hotel-price-display');
    if (priceVal) priceVal.textContent = formatINR(priceSlider.max);
  }
  renderHotelsList('hotels-grid');
};
