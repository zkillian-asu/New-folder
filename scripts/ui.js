window.UI = (() => {
  const waterLabelEl = document.getElementById("waterLabel");
  const waterFillEl = document.getElementById("waterFill");
  const plantsSeededValueEl = document.getElementById("plantsSeededValue");
  const plantsGrownValueEl = document.getElementById("plantsGrownValue");
  const happinessValueEl = document.getElementById("happinessValue");
  const gardenEl = document.getElementById("garden");
  const gardenHintEl = document.getElementById("gardenHint");
  const dropletsEl = document.getElementById("waterDroplets");
  const centralPlantButtonEl = document.getElementById("centralPlantButton");

  const swipeShellEl = document.getElementById("swipeShell");
  const panelsTrackEl = document.getElementById("panelsTrack");
  const panelCount = 2;
  const panelDotEls = [
    document.getElementById("panelDot0"),
    document.getElementById("panelDot1")
  ];
  const panelPrevEl = document.getElementById("panelPrev");
  const panelNextEl = document.getElementById("panelNext");

  const centralWaterButtonEl = document.getElementById("centralWaterButton");
  const sustainabilityBadgeEl = document.getElementById("sustainabilityBadge");
  const sustainabilityModalEl = document.getElementById("sustainabilityModal");
  const sustainabilityActionButtonEl = document.getElementById("sustainabilityActionButton");
  const thrivingModalEl = document.getElementById("thrivingModal");
  const thrivingContinueButtonEl = document.getElementById("thrivingContinueButton");

  const wellEls = {
    a: {
      card: document.getElementById("wellA"),
      role: document.getElementById("wellARole"),
      button: document.getElementById("wellAButton"),
      icon: document.getElementById("wellAIcon"),
      progress: document.getElementById("wellAProgress")
    },
    b: {
      card: document.getElementById("wellB"),
      role: document.getElementById("wellBRole"),
      button: document.getElementById("wellBButton"),
      icon: document.getElementById("wellBIcon"),
      progress: document.getElementById("wellBProgress")
    }
  };

  const restartButtonEl = document.getElementById("restartButton");

  let panelIndex = 0;
  let panelChangeHandler = null;
  let swipeStartX = 0;
  let swipeStartY = 0;
  let pointerDown = false;

  function updateHud({ water, maxWater, plantsSeeded, plantsGrown, happinessFace }) {
    const clampedWater = Math.max(0, Math.min(maxWater, water));
    const fillPercent = maxWater > 0 ? (clampedWater / maxWater) * 100 : 0;

    waterLabelEl.textContent = `${clampedWater.toFixed(1)} / ${maxWater.toFixed(0)}`;
    waterFillEl.style.width = `${fillPercent}%`;
    waterFillEl.style.setProperty("--fill", `${fillPercent}%`);
    waterFillEl.classList.toggle("is-low", fillPercent <= 30);
    waterFillEl.parentElement.setAttribute("aria-valuenow", clampedWater.toFixed(1));
    waterFillEl.parentElement.setAttribute("aria-valuemax", maxWater.toFixed(0));

    plantsSeededValueEl.textContent = String(plantsSeeded);
    plantsGrownValueEl.textContent = String(plantsGrown);
    happinessValueEl.textContent = happinessFace;
  }

  function formatSeconds(seconds) {
    return `${Math.ceil(Math.max(0, seconds))}s`;
  }

  function setWellDisplay(wellId, display) {
    const refs = wellEls[wellId];
    if (!refs) {
      return;
    }

    refs.role.textContent = display.roleLabel;
    refs.button.disabled = display.disabled;
    refs.card.classList.toggle("is-dry", Boolean(display.isDry));
    refs.card.classList.toggle("is-cooling", Boolean(display.isCooling));
    refs.card.classList.toggle("is-permanent-drained", Boolean(display.isPermanentlyDrained));
    refs.card.classList.toggle("is-temporary", display.role === "temporary");
    refs.card.classList.toggle("is-sustainable", display.role === "sustainable");
    refs.progress.classList.toggle("show", Boolean(display.showProgress));
    refs.progress.style.setProperty("--progress", `${(display.progress ?? 0).toFixed(3)}`);
    refs.card.style.setProperty("--progress", `${(display.progress ?? 0).toFixed(3)}`);
  }

  function updateUnassignedWells() {
    setWellDisplay("a", {
      role: "unassigned",
      roleLabel: "Unassigned",
      statusText: "First tapped well becomes temporary source.",
      buttonText: "Draw Water",
      disabled: false,
      isDry: false,
      isCooling: false,
      showProgress: false,
      progress: 0
    });

    setWellDisplay("b", {
      role: "unassigned",
      roleLabel: "Unassigned",
      statusText: "First tapped well becomes temporary source.",
      buttonText: "Draw Water",
      disabled: false,
      isDry: false,
      isCooling: false,
      showProgress: false,
      progress: 0
    });
  }

  function updateSourceStatus({ roles, temporary, sustainable, sustainabilityMode }) {
    if (!roles.assigned) {
      updateUnassignedWells();
      sustainabilityBadgeEl.classList.add("hide");
      return;
    }

    const temporaryWellId = roles.temporary;
    const sustainableWellId = roles.sustainable;

    const temporaryDryRecovering = temporary.isDry && temporary.replenishTimer > 0;
    const temporaryCooling = temporary.cooldown > 0;
    const temporaryReady = !temporaryDryRecovering && !temporaryCooling;

    let temporaryStatus = "Temporary source ready.";
    if (temporaryDryRecovering) {
      temporaryStatus = "Dry source. Underground recharge in progress.";
    } else if (temporaryCooling) {
      temporaryStatus = `Recovered source refilling (${formatSeconds(temporary.cooldown)}).`;
    } else if (temporary.drawsRemainingInitial > 0) {
      temporaryStatus = `Temporary source: ${temporary.drawsRemainingInitial} draw(s) left before dry-up.`;
    }

    setWellDisplay(temporaryWellId, {
      role: "temporary",
      roleLabel: "Temporary Source",
      statusText: temporaryStatus,
      buttonText: temporaryReady ? "Draw Temporary Water" : "Unavailable",
      disabled: !temporaryReady || temporary.isPermanentlyDrained,
      isDry: temporaryDryRecovering,
      isCooling: temporaryCooling,
      isPermanentlyDrained: temporary.isPermanentlyDrained,
      showProgress: false,
      progress: 0
    });

    const sustainableCooling = sustainable.cooldown > 0;
    const sustainableProgress =
      sustainable.maxCooldown > 0 ? 1 - sustainable.cooldown / sustainable.maxCooldown : 1;

    const sustainableStatus = sustainableCooling
      ? `Recharging (${formatSeconds(sustainable.cooldown)}). Next yield +${sustainable.currentYield.toFixed(0)}.`
      : `Ready. Current yield +${sustainable.currentYield.toFixed(0)} water.`;

    setWellDisplay(sustainableWellId, {
      role: "sustainable",
      roleLabel: "Replenishing Source",
      statusText: sustainableStatus,
      buttonText: sustainableCooling ? "Recharging" : "Collect Replenishing Water",
      disabled: sustainableCooling,
      isDry: false,
      isCooling: sustainableCooling,
      showProgress: sustainableCooling,
      progress: sustainableProgress
    });

    sustainabilityBadgeEl.classList.toggle("hide", !sustainabilityMode);
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
      plant.variant.juvenileVariant
    ].join(" ");

    el.style.left = `${plant.x}%`;
    el.style.top = `${plant.y}%`;

    const baseImageEl = document.createElement("img");
    baseImageEl.className = "plant-image plant-image-base";
    baseImageEl.alt = `${plant.speciesName} stage 1`;
    baseImageEl.draggable = false;
    baseImageEl.src = plant.stageImages[0];

    const overlayImageEl = document.createElement("img");
    overlayImageEl.className = "plant-image plant-image-overlay";
    overlayImageEl.alt = "";
    overlayImageEl.draggable = false;
    overlayImageEl.src = plant.stageImages[0];

    const washEl = document.createElement("span");
    washEl.className = "plant-wash";

    el.appendChild(baseImageEl);
    el.appendChild(overlayImageEl);
    el.appendChild(washEl);
    el.dataset.stage = String(plant.stage);

    gardenEl.appendChild(el);
    return el;
  }

  function playStageTransition(el, nextImageSrc) {
    const baseImageEl = el.querySelector(".plant-image-base");
    const overlayImageEl = el.querySelector(".plant-image-overlay");

    if (!baseImageEl || !overlayImageEl || !nextImageSrc) {
      return;
    }

    overlayImageEl.src = nextImageSrc;
    el.classList.remove("is-aging");
    void el.offsetWidth;
    el.classList.add("is-aging");

    window.setTimeout(() => {
      baseImageEl.src = nextImageSrc;
      el.classList.remove("is-aging");
    }, 430);
  }

  function updatePlantElement(el, plant) {
    const stage = plant.stage;
    const previousStage = Number(el.dataset.stage ?? "-1");
    const stageChanged = previousStage !== -1 && previousStage !== stage;
    const nextImageSrc = plant.stageImages[stage];
    const washScales = [0.82, 0.96, 1.08, 1.22];
    const washOpacities = [0.45, 0.65, 0.82, 1];

    el.classList.remove("stage-0", "stage-1", "stage-2", "stage-3");
    el.classList.add(`stage-${stage}`);
    el.style.setProperty("--wash-scale", String(washScales[stage] ?? 1));
    el.style.setProperty("--wash-opacity", String(washOpacities[stage] ?? 1));

    const baseImageEl = el.querySelector(".plant-image-base");
    if (baseImageEl) {
      baseImageEl.alt = `${plant.speciesName} stage ${stage + 1}`;
      if (!stageChanged && nextImageSrc) {
        baseImageEl.src = nextImageSrc;
      }
    }

    if (stageChanged) {
      playStageTransition(el, nextImageSrc);
    }

    el.setAttribute("aria-label", `${plant.speciesName}, growth stage ${stage + 1}`);
    el.style.setProperty("--stage-scale", String([0.64, 0.98, 1.32, 1.62][stage] ?? 1));
    el.style.zIndex = String(Math.round(plant.y * 10));
    el.dataset.stage = String(stage);
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

  function onWaterHover(startHandler, stopHandler) {
    const supportsHover = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!supportsHover) {
      return;
    }

    centralWaterButtonEl.addEventListener("mouseenter", startHandler);
    centralWaterButtonEl.addEventListener("mouseleave", stopHandler);
  }

  function onPlantPress(handler) {
    centralPlantButtonEl.addEventListener("click", handler);
  }

  function onWellInteract(handler) {
    wellEls.a.button.addEventListener("click", () => handler("a"));
    wellEls.b.button.addEventListener("click", () => handler("b"));
  }

  function setSustainabilityPopupVisible(isVisible) {
    sustainabilityModalEl.classList.toggle("hide", !isVisible);
    sustainabilityModalEl.classList.toggle("show", isVisible);
  }

  function onSustainabilityAction(handler) {
    sustainabilityActionButtonEl.addEventListener("click", handler);
  }

  function setThrivingPopupVisible(isVisible) {
    if (!thrivingModalEl) {
      return;
    }

    thrivingModalEl.classList.toggle("hide", !isVisible);
    thrivingModalEl.classList.toggle("show", isVisible);
  }

  function onThrivingContinue(handler) {
    if (!thrivingContinueButtonEl) {
      return;
    }

    thrivingContinueButtonEl.addEventListener("click", handler);
  }

  function onRestart(handler) {
    restartButtonEl.addEventListener("click", handler);
  }

  function getGardenRect() {
    return gardenEl.getBoundingClientRect();
  }

  function setPanel(index) {
    const previous = panelIndex;
    panelIndex = Math.max(0, Math.min(panelCount - 1, index));
    panelsTrackEl.style.transform = `translateX(-${panelIndex * 100}%)`;
    panelDotEls.forEach((dot, dotIndex) => {
      dot.classList.toggle("active", dotIndex === panelIndex);
      dot.setAttribute("aria-selected", String(dotIndex === panelIndex));
    });
    if (panelPrevEl) {
      panelPrevEl.disabled = panelIndex === 0;
    }

    if (panelNextEl) {
      panelNextEl.disabled = panelIndex === panelCount - 1;
    }

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

    if (panelPrevEl) {
      panelPrevEl.addEventListener("click", () => setPanel(panelIndex - 1));
    }

    if (panelNextEl) {
      panelNextEl.addEventListener("click", () => setPanel(panelIndex + 1));
    }
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
  updateUnassignedWells();
  setSustainabilityPopupVisible(false);
  setThrivingPopupVisible(false);

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
    onWaterHover,
    onPlantPress,
    onWellInteract,
    setSustainabilityPopupVisible,
    onSustainabilityAction,
    setThrivingPopupVisible,
    onThrivingContinue,
    onPanelChange,
    setPanel,
    onRestart,
    getGardenRect
  };
})();
