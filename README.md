# SmartCompare: Your Price Navigator

Build a modern, full-stack Price Comparison Aggregator web application named "SmartCompare". The app allows users to search for any commodity or item and instantly compare real-time prices and live photos across multiple e-commerce platforms.

### 1. Primary Market Focus & Platforms

- Core Vendors: Jumia, Kilimall, Jiji, Amazon, Naivas, Quickmart, Carrefour.

- Dynamic Expansion: Support extensible store cards for additional regional e-commerce vendors.

### 2. Core User Experience & Layout

- Hero Header: Clean, sticky search bar with autocomplete suggestions, category filters (Electronics, Groceries, Fashion, Household), and a location/region switcher.

- Results Dashboard:

  - Top Recommendation Banner: Automatically highlight the "Best Overall Deal" (factoring in lowest price, store reliability rating, and stock status).

  - Platform Grid / Comparison Matrix: Display side-by-side product cards showing:

    * High-quality real product photo extracted directly from the vendor.

    * Item title & matched specifications.

    * Live price (formatted in local currency e.g., KES / USD) with discount badges.

    * Platform logo and vendor name.

    * "Best Value", "Lowest Price", or "Fastest Delivery" badges.

    * Direct "Buy Now" link redirecting to the official store page.

- Visual Price Analytics: Include an interactive chart showing 30-day historical price trends for the searched item so users know if it's a good time to buy.

### 3. Real-Time Data & Backend Architecture

- Data Fetching Strategy:

  - Integrate a unified backend service (via Supabase Edge Functions or Firecrawl API) to perform live searches across supported vendor sites.

  - Parse real product image URLs, accurate live titles, current prices, and product availability directly from vendor search pages.

  - Fallback Mechanism: Implement mock fallback data with realistic product photos and prices to ensure smooth visual rendering while live scrapers load.

  - Caching Layer: Cache search queries in Supabase PostgreSQL for 30 minutes to optimize load times and prevent API rate-limiting.

### 4. User Features & Engagement

- User Accounts: Authentication (Email/Password & Google login via Supabase Auth).

- Saved Wishlists: Allow logged-in users to save favorite products to a watchlist.

- Price Drop Alerts: Create a "Notify Me" feature where users set a target price for an item and receive an email or dashboard notification when a platform hits that price.

### 5. UI/UX Design Aesthetic

- Clean, modern e-commerce dashboard using Tailwind CSS and Lucide icons.

- Responsive layout (mobile-first for shoppers on smartphones).

- Subtle skeleton loading states while real-time vendor prices are being fetched.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1f68af92-3a23-4018-8c60-dc262afff80f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
