# 🌿 The Veg Studio — Web Application Architecture

Welcome to **The Veg Studio** café web application. This project is structured with a modular, maintainable, and high-performance front-end architecture.

---

## 📁 Project Directory & File Structure

```
appi/
+-- index.html                           # Main entry Single Page Application (SPA) HTML
¦
+-- assets/                              # Static visual media & branding assets
¦   +-- images/                          # Organized image assets
¦   ¦   +-- branding/                    # Logos, emblems & brand watermarks
¦   ¦   ¦   +-- logo.jpg                 # Primary brand logo
¦   ¦   ¦   +-- logo-bg.png              # Transparent logo emblem
¦   ¦   ¦   +-- logo-bg2.png             # Secondary emblem
¦   ¦   ¦   +-- veg_studio_logo_hq.jpg   # High-resolution emblem
¦   ¦   +-- hero/                        # Hero canvases & section backgrounds
¦   ¦   ¦   +-- hero_food.jpg            # Luxury feast hero image
¦   ¦   ¦   +-- hero_food_new.png        # Feast canvas alternate
¦   ¦   ¦   +-- explore_menu_bg_new.jpg  # Category banner background
¦   ¦   ¦   +-- menu-hero-bg.webp         # Menu page header backdrop
¦   ¦   +-- about/                       # Story & chef profile photos
¦   ¦       +-- founder_chef_studio.jpg  # Founder Chef portrait
¦   ¦       +-- founder_chef_studio_opt.jpg
¦   +-- media/                           # Video & animation media archives
¦       +-- loader.mp4
¦       +-- loader.webp
¦
+-- css/                                 # Cascading Style Sheets (Modular Architecture)
¦   +-- base/                            # Baseline resets & global theme definitions
¦   ¦   +-- variables.css                # Color variables, fonts, radii & elevations
¦   ¦   +-- reset.css                    # Box-sizing, body setup, paper texture & watermark
¦   +-- components/                      # UI Component Stylesheets
¦   ¦   +-- loader.css                   # Snappy fast beige-green brand loader
¦   ¦   +-- navbar.css                   # Navigation bar, brand emblem & mobile menu
¦   ¦   +-- hero.css                     # Cinematic luxury hero & infinite marquee strip
¦   ¦   +-- menu.css                     # Menu cards, category grid & search filter pills
¦   ¦   +-- modal.css                    # Customization modal dialog & addon spinners
¦   ¦   +-- cart.css                     # Slide-over cart drawer & sticky bottom bar
¦   ¦   +-- checkout.css                 # Checkout form, order breakdown & invoice
¦   ¦   +-- story.css                    # Pinterest bento mosaic & culinary chapters
¦   ¦   +-- contact.css                  # Contact info, map card & inquiry form
¦   ¦   +-- footer.css                   # Multi-column footer & copyright bar
¦   +-- responsive/                      # Device-specific viewport styling
¦   ¦   +-- mobile.css                   # Mobile-first and tablet responsive rules
¦   +-- style.css                        # Core consolidated stylesheet
¦   +-- main.css                         # Master CSS bundle entry point (@import hub)
¦
+-- js/                                  # Client-Side Application JavaScript
¦   +-- config/                          # Configuration & API endpoints
¦   ¦   +-- constants.js                 # Cafe config, WhatsApp phone & Sheets endpoint
¦   +-- data/                            # Structured Data Catalogues
¦   ¦   +-- menuData.js                  # 100+ Menu items, categories, descriptions & prices
¦   +-- modules/                         # Feature-specific JavaScript Modules
¦   ¦   +-- loader.js                    # Fast autoplay loader controller & smooth dissolve
¦   ¦   +-- navigation.js                # SPA view switching & active navigation states
¦   ¦   +-- menu.js                      # Menu renderer, category filtering & live search
¦   ¦   +-- modal.js                     # Item detail popup & dynamic price calculator
¦   ¦   +-- cart.js                      # Cart management, extra pieces & subtotal logic
¦   ¦   +-- checkout.js                  # Checkout submission, Google Sheets sync & WhatsApp
¦   ¦   +-- toast.js                     # User feedback toast notification system
¦   +-- app.js                           # Master bundled script (standard fast script loading)
¦   +-- main.js                          # Application bootstrap & event bindings
¦
+-- backend/                             # Serverless / Cloud Backend Integrations
    +-- google_sheet_script.js           # Google Apps Script for live Google Sheets logging & email invoices
```

---

## ⭐ Key Features

1. **⚡ Fast & Snappy Loader Animation:**
   - 1.9s quick reveal with warm beige + sage green aesthetics.
   - Dual counter-rotating golden & green SVG rings.
   - Smooth 0.45s hardware-accelerated blur/scale exit transition.
   - Instant tap-to-skip support.

2. **🍽️ Dynamic Menu & Search:**
   - Live search bar and categorized filter pills.
   - Dynamic price updates based on crust, toppings, and extra pieces.

3. **🛒 Cart & Checkout:**
   - Real-time cart calculations with persistent state.
   - Sticky cart indicator for mobile.
   - One-click WhatsApp ordering format and automated Google Sheets synchronization.

4. **📱 Responsive Design:**
   - Optimized for mobile, tablet, and desktop screens with tailored touch navigation.
