(() => {
  const plantColors = [
    "#76b947",
    "#2ec4b6",
    "#ff9f1c",
    "#ef476f",
    "#e9c46a",
    "#00bbf9",
    "#8338ec"
  ];

  const config = {
    startWater: 30,
    startMaxWater: 50,
    startRegenRate: 0.1,
    plantCost: 5,
    waterDrainPerSecond: 20,
    growthCheckInterval: 2,
    growthChance: 0.3,
    shortSourceInstantWater: 24,
    longSourceBaseYield: 28,
    longSourceYieldStep: 10,
    longSourceBaseCooldown: 18,
    longSourceCooldownFloor: 9,
    longSourceMaxBoost: 12,
    longSourceRegenBoost: 0.04,
    wateringRadius: 140,
    wateringAcceleration: 2.5
  };

  const state = {
    water: config.startWater,
    maxWater: config.startMaxWater,
    regenRate: config.startRegenRate,
    waterSources: 0,
    plants: [],
    shortSourceState: "available",
    shortSourceLeftAfterDraw: false,
    longSourceCooldown: 0,
    longSourceCollections: 0,
    isWatering: false,
    wateringPoint: null,
    nextPlantId: 1,
    lastFrameAt: performance.now()
  };

  function clampWater() {
    state.water = Math.min(state.maxWater, Math.max(0, state.water));
  }

  function syncHud() {
    const longYield = config.longSourceBaseYield + state.longSourceCollections * config.longSourceYieldStep;

    UI.updateHud({
      water: state.water,
      maxWater: state.maxWater,
      regenRate: state.regenRate,
      waterSources: state.waterSources,
      plantsCount: state.plants.length
    });

    UI.updateSourceStatus({
      shortState: state.shortSourceState,
      longCooldown: state.longSourceCooldown,
      longYield
    });

    UI.setHintVisible(state.plants.length === 0);
  }

  function resetGame() {
    state.water = config.startWater;
    state.maxWater = config.startMaxWater;
    state.regenRate = config.startRegenRate;
    state.waterSources = 0;
    state.plants = [];
    state.shortSourceState = "available";
    state.shortSourceLeftAfterDraw = false;
    state.longSourceCooldown = 0;
    state.longSourceCollections = 0;
    state.isWatering = false;
    state.wateringPoint = null;
    state.nextPlantId = 1;

    UI.clearPlants();
    UI.setWateringVisual(false);
    UI.setPanel(0);
    syncHud();
  }

  function pickPlantColor() {
    const index = Math.floor(Math.random() * plantColors.length);
    return plantColors[index];
  }

  function normalizePosition(event) {
    const rect = UI.getGardenRect();
    const xPx = event.clientX - rect.left;
    const yPx = event.clientY - rect.top;

    const x = Math.max(0, Math.min(100, (xPx / rect.width) * 100));
    const y = Math.max(6, Math.min(92, (yPx / rect.height) * 100));

    return {
      x,
      y,
      xPx,
      yPx,
      width: rect.width,
      height: rect.height
    };
  }

  function plantSeed(event) {
    if (state.isWatering) {
      return;
    }

    if (state.water < config.plantCost) {
      return;
    }

    const position = normalizePosition(event);
    state.water -= config.plantCost;
    clampWater();

    const plant = {
      id: state.nextPlantId,
      x: position.x,
      y: position.y,
      stage: 0,
      growthTimer: 0,
      color: pickPlantColor(),
      element: null
    };

    state.nextPlantId += 1;
    plant.element = UI.createPlantElement(plant);
    state.plants.push(plant);
    syncHud();
  }

  function updateWateringPoint(event) {
    const pos = normalizePosition(event);
    state.wateringPoint = {
      x: pos.xPx,
      y: pos.yPx,
      width: pos.width,
      height: pos.height
    };
  }

  function setWatering(isActive) {
    state.isWatering = isActive;
    if (!isActive) {
      state.wateringPoint = null;
    }
    UI.setWateringVisual(isActive);
  }

  function drawShortSource() {
    if (state.shortSourceState !== "available") {
      return;
    }

    state.water += config.shortSourceInstantWater;
    clampWater();
    state.shortSourceState = "drawn";
    state.waterSources += 1;
    syncHud();
  }

  function collectLongSource() {
    if (state.longSourceCooldown > 0) {
      return;
    }

    const yieldAmount = config.longSourceBaseYield + state.longSourceCollections * config.longSourceYieldStep;
    state.water += yieldAmount;
    state.maxWater += config.longSourceMaxBoost;
    state.regenRate += config.longSourceRegenBoost;
    state.waterSources += 1;
    state.longSourceCollections += 1;
    state.longSourceCooldown = Math.max(
      config.longSourceCooldownFloor,
      config.longSourceBaseCooldown - state.longSourceCollections
    );

    clampWater();
    syncHud();
  }

  function updatePlantGrowth(deltaSeconds) {
    for (const plant of state.plants) {
      if (plant.stage >= 3) {
        continue;
      }

      let growthDelta = deltaSeconds;

      if (state.isWatering && state.wateringPoint) {
        const px = (plant.x / 100) * state.wateringPoint.width;
        const py = (plant.y / 100) * state.wateringPoint.height;
        const dx = px - state.wateringPoint.x;
        const dy = py - state.wateringPoint.y;
        const distance = Math.hypot(dx, dy);

        if (distance <= config.wateringRadius) {
          growthDelta += deltaSeconds * config.wateringAcceleration;
        }
      }

      plant.growthTimer += growthDelta;

      while (plant.growthTimer >= config.growthCheckInterval && plant.stage < 3) {
        plant.growthTimer -= config.growthCheckInterval;
        if (Math.random() <= config.growthChance) {
          plant.stage += 1;
          UI.updatePlantElement(plant.element, plant.stage);
        }
      }
    }
  }

  function tick(timestamp) {
    const deltaSeconds = Math.min(0.1, (timestamp - state.lastFrameAt) / 1000);
    state.lastFrameAt = timestamp;

    state.water += state.regenRate * deltaSeconds;
    state.longSourceCooldown = Math.max(0, state.longSourceCooldown - deltaSeconds);

    if (state.isWatering) {
      state.water -= config.waterDrainPerSecond * deltaSeconds;
      if (state.water <= 0) {
        state.water = 0;
        setWatering(false);
      }
    }

    clampWater();
    updatePlantGrowth(deltaSeconds);
    syncHud();

    requestAnimationFrame(tick);
  }

  UI.onGardenClick((event) => {
    plantSeed(event);
  });

  UI.onGardenPointerMove((event) => {
    if (state.isWatering) {
      updateWateringPoint(event);
    }
  });

  UI.onWaterPress(
    () => {
      if (state.water <= 0) {
        return;
      }
      setWatering(true);
    },
    () => {
      setWatering(false);
    }
  );

  UI.onShortSource(() => {
    drawShortSource();
  });

  UI.onLongSource(() => {
    collectLongSource();
  });

  UI.onPanelChange((nextPanel, previousPanel) => {
    if (previousPanel === 1 && nextPanel === 0 && state.shortSourceState === "drawn") {
      state.shortSourceLeftAfterDraw = true;
    }

    if (nextPanel === 1 && state.shortSourceState === "drawn" && state.shortSourceLeftAfterDraw) {
      state.shortSourceState = "dry";
      syncHud();
    }
  });

  UI.onRestart(() => {
    resetGame();
  });

  resetGame();
  requestAnimationFrame(tick);
})();
