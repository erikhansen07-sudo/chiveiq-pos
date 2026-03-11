# ChiveIQ POS — HTML Mockups

Interactive HTML mockups of the ChiveIQ restaurant operations platform.

## Overview

Complete UI mockups for all major modules:
- **POS** — Order entry, menu browsing, checkout
- **Inventory** — Stock tracking, cost impact, reorder alerts
- **Labor** — Shift scheduling, labor cost management
- **Live P&L** — Real-time profit & loss dashboard
- **Operations** — Central hub for alerts and KPIs
- **Analytics** — Insights and performance tracking

## Getting Started

### Local Viewing
1. Clone this repo: `git clone https://github.com/erikhansen07-sudo/chiveiq-pos.git`
2. Open `index.html` in your browser

### GitHub Pages Deployment

1. **Create the repository** on GitHub (if not already created)
   ```bash
   # After creating the repo on GitHub:
   cd /tmp/chiveiq-pos
   git remote add origin https://github.com/erikhansen07-sudo/chiveiq-pos.git
   git push -u origin main
   ```

2. **Enable GitHub Pages**
   - Go to repo Settings → Pages
   - Select "Deploy from a branch"
   - Choose `main` branch, root folder
   - Save

3. **Access the live site**
   - URL: `https://erikhansen07-sudo.github.io/chiveiq-pos/`

## Features

### Design System
- **ChiveIQ Dark Theme** with green accent colors
- **Color Palette**:
  - Bright Green: `#2ba854` (primary, CTAs)
  - Primary Green: `#1e7145` (secondary)
  - Dark Green: `#0f3d24` (accents)
  - Dark Background: `#0a0a0a`

### Module Details

#### POS Module
- Menu browsing by category
- Real-time order cart
- Quantity adjustment
- Live total calculation

#### Inventory Module
- Stock level tracking
- Unit cost & total cost impact
- Status indicators (OK, Reorder, Critical)
- Ingredient list with reorder points

#### Labor Module
- Staff scheduling overview
- Hours & cost tracking
- Labor cost percentage vs target
- Shift breakdown

#### Live P&L Module
- Key KPIs (Revenue, Food Cost %, Labor Cost %, Profit %)
- Revenue trend chart
- Margin trend visualization
- Period comparison

#### Operations Hub
- Operational alerts (Critical, Warning, Success)
- Today's summary cards
- Quick action buttons
- Real-time KPI snapshot

#### Analytics
- Transaction insights
- Peak hour analysis
- Top-performing items
- Waste & efficiency metrics

## Files

```
chiveiq-pos/
├── index.html          # Module dashboard
├── pos.html           # POS system mockup
├── inventory.html     # Inventory management
├── labor.html         # Labor scheduling
├── livepl.html        # Live P&L dashboard
├── operations.html    # Operations hub
├── analytics.html     # Analytics & insights
└── README.md          # This file
```

## Next Steps

1. **Interactive Elements** — Add click handlers, state management
2. **Real Data Integration** — Connect to API/backend
3. **Responsive Design** — Mobile optimization
4. **Component Library** — Extract reusable UI components
5. **Dark/Light Theme Toggle** — Theme switcher

## Status

**Version**: 2.0  
**Status**: HTML Mockups Complete  
**Last Updated**: March 10, 2026

---

**ChiveIQ** — Restaurant Operations Platform  
Streamline. Simplify. Advance.
