# AKSHAR TOURS & TRAVELS
## Premium Travel & Tourism Management Website

A complete, responsive, multi-page travel agency website built using **HTML5, CSS3, JavaScript, Bootstrap 5, and Bootstrap Icons**, utilizing **LocalStorage** for data persistence.

---

## 🌟 Key Features & Requirements Matrix

| Requirement | Implementation Details | Status |
| :--- | :--- | :---: |
| **Design & Branding** | Navy Blue (`#0A192F`), Royal Blue (`#1A56DB`), White, and Gold (`#D4AF37`) color system, custom SVG vector logos (light and dark backgrounds), Plus Jakarta Sans typography, smooth hover transitions. | ✅ Complete |
| **30 Indian Packages** | Exactly 30 packages with destination, duration, price, hotels, food, sightseeing, inclusions/exclusions, and day-by-day itineraries. | ✅ Complete |
| **Indian Transport Rule** | **Flight**, **Train**, and **Luxury Bus** options with real-time price updates. | ✅ Complete |
| **25 International Packages** | Exactly 25 packages: Dubai, Thailand, Singapore, Malaysia, Bali, Maldives, Switzerland, France, Italy, London, Australia, Japan, Vietnam, Mauritius, Nepal, etc. | ✅ Complete |
| **International Transport Rule** | Strictly **Flight** (included in base) and **Luxury Cruise** (upgrade) options. No train or bus. | ✅ Complete |
| **20+ Luxury Hotels** | 22 luxury 4★ and 5★ properties with star ratings, room types, locations, amenities, price per night, and direct booking. | ✅ Complete |
| **Authentication Engine** | LocalStorage user registration with validation (Name, Email, Mobile, Password, Gender, Address, T&C), login switcher, demo credentials autofill, password reset demo. | ✅ Complete |
| **Customer Dashboard** | Profile overview, My Bookings, Hotel Reservations, Wishlist, Status badges (*Pending*, *Confirmed*, *Cancelled*), Cancel booking action, Download/Printable receipt. | ✅ Complete |
| **Admin Control Panel** | Overview stats (Customers, Bookings, Packages, Hotels, Revenue), Packages CRUD, Hotels CRUD, Bookings Status updates (*Confirm / Reject / Pending*), Messages inquiry management. | ✅ Complete |
| **10-Step Booking Flow** | Step-by-step wizard: Package selection → Travel date → Travelers count → Transportation selection → Real-time price breakdown → Customer details → Summary review → Confirm → Unique ID (`ATT-2026-XXXXX`) → Printable receipt voucher. | ✅ Complete |
| **Search & Filters** | Real-time destination search, category filtering, duration filtering, price sliders, sorting (Price, Duration, Rating). | ✅ Complete |

---

## 🔑 Demo Access Credentials

> **Notice:** This application uses frontend client-side authentication and LocalStorage for demonstration purposes.

### 👤 Customer Login
- **Email:** `rahul.sharma@example.com`
- **Mobile:** `9876543210`
- **Password:** `customer123`
*(A 1-click "Auto-fill Demo Customer" button is available on the login page)*

### 🛡️ Administrator Login
- **Email / User:** `admin@akshartours.com`
- **Password:** `admin123`
*(A 1-click "Auto-fill Admin Credentials" button is available on the admin login page)*

---

## 📁 Project Directory Structure

```text
akshar-tours-travels/
│
├── index.html                  # Home Page
├── about.html                  # About Us
├── contact.html                # Contact Us (with working inquiry submission)
├── login.html                  # Dual Customer & Admin Login
├── register.html               # Customer Registration with form validation
├── forgot-password.html        # Password Reset Demo
├── terms.html                  # Terms & Conditions
├── privacy.html                # Privacy Policy
│
├── packages/
│   ├── india.html              # Indian Tour Packages (30 circuits + Flight/Train/Bus)
│   ├── international.html      # International Tour Packages (25 destinations + Flight/Cruise)
│   └── package-details.html    # Detailed package page with interactive transport price calculator
│
├── booking/
│   ├── booking.html            # 10-Step Interactive Booking Wizard
│   ├── confirmation.html       # Booking Request Voucher & Print Receipt
│   └── my-bookings.html        # Quick Reservation Search & Status Tracker
│
├── hotels/
│   └── hotels.html             # Hotel Booking (22 luxury properties + search & filters)
│
├── transport/
│   ├── flights.html            # Flight Search & Airline Booking
│   ├── trains.html             # IRCTC-style Train Ticket Booking
│   ├── buses.html              # Luxury Multi-Axle Bus Booking
│   └── cruises.html            # Ocean Liner & Coastal Cruise Booking
│
├── customer/
│   └── dashboard.html          # Customer Dashboard (Profile, Bookings, Wishlist, Receipts)
│
├── admin/
│   ├── login.html              # Dedicated Admin Login
│   ├── dashboard.html          # Executive Dashboard Metrics & Activity
│   ├── packages.html           # Tour Packages CRUD (Add, Edit, Delete)
│   ├── hotels.html             # Luxury Hotels CRUD (Add, Edit, Delete)
│   ├── customers.html          # Registered Customers Directory
│   └── bookings.html           # Booking Operations (Confirm, Reject, Status Updates)
│
├── css/
│   ├── style.css               # Core Design System (Navy, Royal Blue, Gold, White)
│   ├── responsive.css          # Mobile, Tablet & Desktop Media Queries
│   ├── admin.css               # Admin Dashboard Stylesheet
│   └── customer.css            # Customer Dashboard & Printable Receipt Styles
│
├── js/
│   ├── data.js                 # Initial Seed Data (30 Indian, 25 Intl, 22 Hotels, Users, Bookings)
│   ├── main.js                 # Global utilities, Toast alerts, Wishlist badges, Currency formatter
│   ├── auth.js                 # Registration, Login, Forgot Password & Route Protection
│   ├── packages.js             # Dynamic Packages rendering, Filters, Transport price calculator
│   ├── hotels.js               # Dynamic Hotel catalog, Star rating & Price filters
│   ├── booking.js              # 10-Step Interactive Wizard, Promo codes, ID generator, Confirmation
│   ├── customer.js             # Customer dashboard actions, Booking cancellation, Profile update
│   └── admin.js                # Admin CRUD operations, Status transitions, Revenue calculations
│
└── assets/
    ├── logos/
    │   ├── logo.svg            # Scalable Vector Brand Logo (Navy/Gold for light backgrounds)
    │   └── logo-white.svg      # White Vector Brand Logo (For dark headers/footers)
    └── images/
```

---

## 🚀 How to Run in VS Code Live Server

1. Open this project folder in **Visual Studio Code**.
2. Right-click on `index.html` (either at the root or inside `akshar-tours-travels/`).
3. Select **"Open with Live Server"**.
4. The website will open in your default browser at `http://127.0.0.1:5500/` or `http://localhost:5500/`.
5. All relative navigation links, package filters, search bars, modals, and LocalStorage data operations work seamlessly without requiring any external server.
