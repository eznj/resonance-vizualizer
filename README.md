# Φ Resonance Visualizer

An interactive web app for exploring the golden ratio in sound. Tune three
oscillators and watch their relationships unfold through four live
visualizations: frequency spectrum, Lissajous figure, cymatic pattern, and
waveform.

## Requirements

- Node.js 18+
- npm

## Setup

```sh
npm install
```

## Usage

Start the dev server:

```sh
npm run dev
```

Then open the URL Vite prints (typically `http://localhost:5173`).

Build for production:

```sh
npm run build
npm run preview
```

## Controls

- **Start / Stop** — toggle the audio engine.
- **Snap to φ** — sets f₁ and f₃ to f₂ × φ and f₂ / φ, locking a golden-ratio
  triad.
- **Oscillator sliders** — adjust each frequency, overall volume, and the
  cymatic mode numbers and gain.

Headphones or good speakers recommended.
