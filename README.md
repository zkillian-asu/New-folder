# Desert Sanctuary: A Water Impact Game

A mobile-first browser game inspired by charity: water, designed as an experiential contrast between scarcity and abundance.

## Core experience
- Start with limited water (30/50) and low regeneration (0.1/sec).
- Planting costs water, so every seed matters.
- Hold watering to accelerate nearby plant growth, but it drains water quickly.
- Swipe to a second panel to interact with two distinct water sources.
- There is no win/lose state: success is how full and diverse your sanctuary becomes.

## Game rules implemented
- Water cannot exceed max capacity and cannot go below 0.
- Planting requires at least 5 water.
- Plants grow through 4 stages (seed, sprout, small, full).
- Growth checks every 2 seconds with a 30% chance to advance.
- Short-term source gives an instant water boost, then dries up after you leave and return.
- Long-term source can be collected periodically, and each collection becomes more valuable over time.
- Restart resets to the full starting state immediately.

## Run locally
1. Open `index.html` directly in your browser.
2. Interact with the game on mobile or desktop.
3. Use restart to quickly replay balancing changes.

## Optional local server (only if Node/npm is available)
1. Install dependencies:
   npm install
2. Start local server:
   npm start
3. Open browser:
   http://localhost:5173

## Notes
- This is an unofficial fan-made project inspired by charity: water's mission.
- Asset folders are available for optional audio and image additions.
- No build step is required for normal testing.
