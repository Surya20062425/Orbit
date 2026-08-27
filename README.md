# 🌌 Near-Earth Object (NEO) Solar Orrery & Planetary Defense Simulator

An interactive, scientifically grounded 3D Solar System Orrery and astrodynamics visualizer built with **Three.js**, **React 19**, **Tailwind CSS**, and powered by **Google Gemini 3.7 Flash AI**.

Track Near-Earth Asteroids (NEAs), Comets, Potentially Hazardous Asteroids (PHAs), and planetary orbits in real time, calculate Keplerian orbital trajectories, simulate close approaches to Earth, and test planetary defense kinetic deflection missions.

---

## ✨ Features

- **🪐 Interactive 3D Orrery (Three.js WebGL)**
  - Physically-proportioned Keplerian orbital propagation (semi-major axis, eccentricity, inclination, longitude of ascending node, argument of perihelion, mean anomaly).
  - Procedurally textured planetary bodies, the Sun with dynamic coronal glare, and the Moon with geocentric orbit rendering.
  - Interactive orbital trajectory ribbons with true-anomaly position vectors.
  - Orbit camera modes: Free Orbit, Top-Down Ecliptic, Earth-Centric Follow, Inner Solar System, and Target-Track.

- **☄️ Near-Earth Object & PHA Tracking**
  - Catalog of major Near-Earth Asteroids: **99942 Apophis**, **101955 Bennu**, **65803 Didymos / Dimorphos**, **433 Eros**, **162173 Ryugu**, **153814 (2001 WN5)**, **1950 DA**, and more.
  - Color-coded threat categorizations (Potentially Hazardous Asteroids, Atens, Apollos, Amors, Atiras).
  - Real-time Earth distance calculations in Astronomical Units (AU), Lunar Distances (LD), and kilometers ($km$), with light travel time telemetry.

- **⏱️ 4D Time Engine & Timeline Controls**
  - Continuous forward/reverse simulation speed from real-time $1\times$ up to $365\text{ days/sec}$.
  - Warp directly to historic close-approach milestones (e.g., **Apophis April 13, 2029 Flyby**, **DART Impact on Dimorphos 2022**, **2001 WN5 2028 encounter**).
  - Interactive Julian Date (JD) / UTC scrubber and calendar date picker.

- **🛡️ Planetary Defense Deflection Simulator**
  - Interactive kinetic impactor and deflection sandbox.
  - Calculate impact energy ($E = \frac{1}{2}mv^2$), crater scaling dimensions, and TNT equivalent in Megatons (Mt).
  - Simulate $\Delta v$ velocity impulses, lead warning times (years prior to close approach), and assess deflection success margins with visual trajectory shifts.

- **📡 Close Approach Radar & Dossier**
  - Polar radar display plotting upcoming Earth flybys ordered by distance and relative velocity.
  - Detailed scientific dossier covering spectral classification, diameter, rotation period, discovery mission, and Palermo / Torino impact risk indices.

- **🤖 AI Astrodynamicist (Gemini 3.7 Flash)**
  - Server-side integration with Google's Gemini 3.7 Flash model.
  - Ask in-depth questions about astrodynamics, orbital resonance, Yarkovsky effect, crater mechanics, or planetary defense strategies.
  - Full fallback offline telemetry engine for seamless operation anywhere.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Three.js, Lucide Icons, Motion.
- **Backend**: Node.js, Express, tsx, esbuild.
- **AI / LLM**: `@google/genai` (Gemini 3.7 Flash).
- **Physics**: Analytical Kepler solver, Newton-Raphson eccentric anomaly iteration, Gaussian gravitational parameters.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git
   cd <YOUR_REPO_NAME>
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables (Optional):**
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   Add your Google Gemini API key if you wish to use live AI queries:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```
   *(Note: The app runs with full orbital visualization and fallback astrodynamics answers even without an API key).*

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Production Build

To bundle both the client and server for deployment:

```bash
npm run build
npm start
```

This compiles the Vite frontend into `dist/` and bundles the Express server into a standalone `dist/server.cjs` file.

---

## 🌐 Deployment Options

- **Google Cloud Run / Render / Railway**: Connect your GitHub repository, set `npm run build` as the build command, `npm start` as the start command, and add `GEMINI_API_KEY` in your environment secrets.
- **Static Hosting (Vercel / Netlify / GitHub Pages)**: Build the static frontend with `npm run build` and deploy the outputted `dist/` directory.

---

## 📄 License

MIT License. Educational and scientific telemetry data referenced from NASA JPL Solar System Dynamics (SSD) and CNEOS.
