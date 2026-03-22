window.UI = (() => {
  const waterLabelEl = document.getElementById("waterLabel");
  const waterFillEl = document.getElementById("waterFill");
  const regenValueEl = document.getElementById("regenValue");
  const sourcesValueEl = document.getElementById("sourcesValue");
  const plantsValueEl = document.getElementById("plantsValue");
  const gardenEl = document.getElementById("garden");
  const gardenHintEl = document.getElementById("gardenHint");
  const dropletsEl = document.getElementById("waterDroplets");

  const swipeShellEl = document.getElementById("swipeShell");
  const panelsTrackEl = document.getElementById("panelsTrack");
  const panelLabelEl = document.getElementById("panelLabel");
  const panelDotEls = [
    document.getElementById("panelDot0"),
    document.getElementById("panelDot1")
  ];

  const centralWaterButtonEl = document.getElementById("centralWaterButton");
  const shortSourceStatusEl = document.getElementById("shortSourceStatus");
  const longSourceStatusEl = document.getElementById("longSourceStatus");
  const shortSourceButtonEl = document.getElementById("shortSourceButton");
  const longSourceButtonEl = document.getElementById("longSourceButton");
  const restartButtonEl = document.getElementById("restartButton");

  let panelIndex = 0;
  let panelChangeHandler = null;
  let swipeStartX = 0;
  let swipeStartY = 0;
  let pointerDown = false;

  function updateHud({ water, maxWater, regenRate, waterSources, plantsCount }) {
    const clampedWater = Math.max(0, Math.min(maxWater, water));
    const fillPercent = maxWater > 0 ? (clampedWater / maxWater) * 100 : 0;

    waterLabelEl.textContent = `${clampedWater.toFixed(1)} / ${maxWater.toFixed(0)}`;
    waterFillEl.style.width = `${fillPercent}%`;
    waterFillEl.style.setProperty("--fill", `${fillPercent}%`);
    waterFillEl.classList.toggle("is-low", fillPercent <= 30);
    waterFillEl.parentElement.setAttribute("aria-valuenow", clampedWater.toFixed(1));
    waterFillEl.parentElement.setAttribute("aria-valuemax", maxWater.toFixed(0));

    regenValueEl.textContent = regenRate.toFixed(1);
    sourcesValueEl.textContent = String(waterSources);
    plantsValueEl.textContent = String(plantsCount);
  }

  function updateSourceStatus({ shortState, longCooldown, longYield }) {
    if (shortState === "available") {
      shortSourceStatusEl.textContent = "Status: Available";
      shortSourceButtonEl.disabled = false;
      shortSourceButtonEl.textContent = "Draw Short-Term Water";
    } else if (shortState === "drawn") {
      shortSourceStatusEl.textContent = "Status: Drawn. Leave and return to reveal outcome.";
      shortSourceButtonEl.disabled = true;
      shortSourceButtonEl.textContent = "Already Drawn";
    } else {
      shortSourceStatusEl.textContent = "Status: Dry";
      shortSourceButtonEl.disabled = true;
      shortSourceButtonEl.textContent = "Dry Source";
    }

    if (longCooldown <= 0) {
      longSourceStatusEl.textContent = `Status: Ready. Current yield +${longYield.toFixed(0)} water`;
      longSourceButtonEl.disabled = false;
      longSourceButtonEl.textContent = "Collect Long-Term Water";
    } else {
      longSourceStatusEl.textContent = `Status: Recharging (${Math.ceil(longCooldown)}s)`;
      longSourceButtonEl.disabled = true;
      longSourceButtonEl.textContent = "Recharging";
    }
  }

  function setHintVisible(isVisible) {
    gardenHintEl.classList.toggle("hide", !isVisible);
  }

  function setWateringVisual(isActive) {
    dropletsEl.classList.toggle("show", isActive);
    gardenEl.classList.toggle("is-watering", isActive);
  }

  function createPlantElement(plant) {
    const el = document.createElement("div");
    const species = plant.variant.species;

    el.className = [
      "plant",
      "stage-0",
      `species-${species.id}`,
      `stem-${species.stemType}`,
      `leaf-${species.leafType}`,
      `flower-${species.flowerType}`,
      `seedling-${species.seedlingType}`,
      `flower-${plant.variant.flowerVariant}`,
      `base-${plant.variant.baseVariant}`
    ].join(" ");

    el.style.left = `${plant.x}%`;
    el.style.top = `${plant.y}%`;
    el.style.setProperty("--species-primary", species.primaryColor);
    el.style.setProperty("--species-stem", species.stemColor);
    el.style.setProperty("--species-leaf", species.leafColor);
    el.style.setProperty("--species-accent", species.accentColor);

    const baseEl = document.createElement("span");
    baseEl.className = "plant-base";

    const stemEl = document.createElement("span");
    stemEl.className = "plant-stem";

    const leftLeafEl = document.createElement("span");
    leftLeafEl.className = "plant-leaf left";

    const rightLeafEl = document.createElement("span");
    rightLeafEl.className = "plant-leaf right";

    const flowerEl = document.createElement("span");
    flowerEl.className = "plant-flower";

    el.appendChild(baseEl);
    el.appendChild(stemEl);
    el.appendChild(leftLeafEl);
    el.appendChild(rightLeafEl);
    el.appendChild(flowerEl);

    gardenEl.appendChild(el);
    return el;
  }

  function updatePlantElement(el, plant) {
    const stage = plant.stage;

    el.classList.remove("stage-0", "stage-1", "stage-2", "stage-3");
    el.classList.add(`stage-${stage}`);

    el.setAttribute("aria-label", `${plant.speciesName}, growth stage ${stage + 1}`);
    el.style.setProperty("--stage-scale", String([0.34, 0.58, 0.82, 1][stage] ?? 1));
    el.style.setProperty("--size-mult", plant.variant.sizeMultiplier.toFixed(3));
    el.style.setProperty("--lean-deg", `${plant.variant.leanDegrees.toFixed(2)}deg`);
    el.style.setProperty("--stem-height", plant.variant.stemHeight.toFixed(3));
    el.style.setProperty("--stem-width", plant.variant.stemThickness.toFixed(3));
    el.style.setProperty("--leaf-spread", plant.variant.leafSpread.toFixed(3));
    el.style.setProperty("--leaf-scale", plant.variant.leafScale.toFixed(3));
    el.style.setProperty("--flower-scale", plant.variant.flowerScale.toFixed(3));
    el.style.setProperty("--flower-offset", `${plant.variant.flowerOffset.toFixed(2)}px`);
    el.style.setProperty("--petal-count", String(plant.variant.petalCount));
  }

  function clearPlants() {
    gardenEl.querySelectorAll(".plant").forEach((node) => node.remove());
  }

  function onGardenClick(handler) {
    gardenEl.addEventListener("click", handler);
  }

  function onGardenPointerMove(handler) {
    gardenEl.addEventListener("pointermove", handler);
  }

  function onWaterPress(startHandler, stopHandler) {
    const begin = (event) => {
      event.preventDefault();
      startHandler();
    };

    const end = (event) => {
      event.preventDefault();
      stopHandler();
    };

    centralWaterButtonEl.addEventListener("pointerdown", begin);
    centralWaterButtonEl.addEventListener("pointerup", end);
    centralWaterButtonEl.addEventListener("pointerleave", end);
    centralWaterButtonEl.addEventListener("pointercancel", end);
  }

  function onShortSource(handler) {
    shortSourceButtonEl.addEventListener("click", handler);
  }

  function onLongSource(handler) {
    longSourceButtonEl.addEventListener("click", handler);
  }

  function onRestart(handler) {
    restartButtonEl.addEventListener("click", handler);
  }

  function getGardenRect() {
    return gardenEl.getBoundingClientRect();
  }

  function setPanel(index) {
    const previous = panelIndex;
    panelIndex = Math.max(0, Math.min(1, index));
    panelsTrackEl.style.transform = `translateX(-${panelIndex * 100}%)`;
    panelDotEls.forEach((dot, dotIndex) => {
      dot.classList.toggle("active", dotIndex === panelIndex);
    });
    panelLabelEl.textContent = panelIndex === 0 ? "Garden" : "Water Sources";

    if (panelChangeHandler && previous !== panelIndex) {
      panelChangeHandler(panelIndex, previous);
    }
  }

  function onPanelChange(handler) {
    panelChangeHandler = handler;
  }

  function bindPanelDots() {
    panelDotEls[0].addEventListener("click", () => setPanel(0));
    panelDotEls[1].addEventListener("click", () => setPanel(1));
  }

  function bindSwipe() {
    swipeShellEl.addEventListener("pointerdown", (event) => {
      pointerDown = true;
      swipeStartX = event.clientX;
      swipeStartY = event.clientY;
    });

    swipeShellEl.addEventListener("pointerup", (event) => {
      if (!pointerDown) {
        return;
      }

      pointerDown = false;
      const dx = event.clientX - swipeStartX;
      const dy = event.clientY - swipeStartY;

      if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) {
          setPanel(panelIndex + 1);
        } else {
          setPanel(panelIndex - 1);
        }
      }
    });

    swipeShellEl.addEventListener("pointercancel", () => {
      pointerDown = false;
    });
  }

  bindPanelDots();
  bindSwipe();
  setPanel(0);

  return {
    updateHud,
    updateSourceStatus,
    setHintVisible,
    setWateringVisual,
    createPlantElement,
    updatePlantElement,
    clearPlants,
    onGardenClick,
    onGardenPointerMove,
    onWaterPress,
    onShortSource,
    onLongSource,
    onPanelChange,
    setPanel,
    onRestart,
    getGardenRect
  };
})();
