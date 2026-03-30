(() => {
  const speciesCatalog = [
    {
      id: "suncrest",
      name: "Suncrest Daisy",
      rarityWeight: 20,
      growthRateMultiplier: 1.03,
      stemType: "reed",
      leafType: "oval",
      flowerType: "star",
      seedlingType: "teardrop",
      primaryColor: "#f2c14e",
      stemColor: "#4f8b39",
      leafColor: "#8ccf61",
      accentColor: "#fff3bd"
    },
    {
      id: "coralfern",
      name: "Coral Fern",
      rarityWeight: 20,
      growthRateMultiplier: 1,
      stemType: "jointed",
      leafType: "frond",
      flowerType: "bell",
      seedlingType: "round",
      primaryColor: "#ff7f50",
      stemColor: "#3d7d4f",
      leafColor: "#5cb471",
      accentColor: "#ffe2d3"
    },
    {
      id: "azurethistle",
      name: "Azure Thistle",
      rarityWeight: 20,
      growthRateMultiplier: 0.97,
      stemType: "spike",
      leafType: "spike",
      flowerType: "tuft",
      seedlingType: "point",
      primaryColor: "#3b82f6",
      stemColor: "#456341",
      leafColor: "#6fa963",
      accentColor: "#dff0ff"
    },
    {
      id: "rubyvine",
      name: "Ruby Vine",
      rarityWeight: 5,
      growthRateMultiplier: 1.05,
      stemType: "vine",
      leafType: "heart",
      flowerType: "cluster",
      seedlingType: "split",
      primaryColor: "#e63946",
      stemColor: "#4f7d3d",
      leafColor: "#79be57",
      accentColor: "#ffd6da"
    },
    {
      id: "moonwell",
      name: "Moonwell Bloom",
      rarityWeight: 4,
      growthRateMultiplier: 0.88,
      stemType: "glass",
      leafType: "lance",
      flowerType: "orb",
      seedlingType: "halo",
      primaryColor: "#a5b4fc",
      stemColor: "#4f8b63",
      leafColor: "#8fd0a1",
      accentColor: "#f3f4ff"
    }
  ];

  const config = {
    startWater: 30,
    startMaxWater: 100,
    regenRate: 0.1,
    plantCost: 4,
    waterDrainPerSecond: 20,
    sustainabilityDrainMultiplier: 0.58,
    growthCheckInterval: 2,
    growthChance: 0.08,
    temporaryInitialDraws: 2,
    temporaryReplenishDuration: 120,
    temporaryRecoveredCooldown: 10,
    sustainableBaseYield: 65,
    sustainableYieldMultiplier: 1.8,
    sustainableCooldown: 30,
    stageWaterRequirementMin: 50,
    stageWaterRequirementMax: 150,
    stageWaterRequirementMoonwellMin: 72,
    stageWaterRequirementRubyvineMin: 86,
    plantRows: [86, 78, 70, 62],
    plantColumns: [28, 34, 40, 46, 50, 54, 60, 66, 72],
    plantRowDiagonalSlope: 0.09,
    minPlantDistance: 4.2,
    wateringRadius: 180,
    wateringAcceleration: 6
  };

  const difficultyProfiles = {
    easy: {
      stageWaterRequirementMultiplier: 0.88,
      wateringDrainMultiplier: 0.9,
      plantCostMultiplier: 0.9
    },
    normal: {
      stageWaterRequirementMultiplier: 1,
      wateringDrainMultiplier: 1,
      plantCostMultiplier: 1
    },
    hard: {
      stageWaterRequirementMultiplier: 1.12,
      wateringDrainMultiplier: 1.1,
      plantCostMultiplier: 1.1
    }
  };

  const imageBasePath = "assets/images";
  const audioBasePath = "assets/audio";

  const sfx = {
    plant: new Audio(`${audioBasePath}/freesound_community-big-plants-crops-growing-quickly-43721.mp3`),
    growth: [
      new Audio(`${audioBasePath}/u_xjrmmgxfru-hit-plant-01-266293.mp3`),
      new Audio(`${audioBasePath}/u_xjrmmgxfru-hit-plant-02-266291.mp3`)
    ],
    nextGrowthIndex: 0,
    lastGrowthPlayedAt: 0,
    growthMinIntervalMs: 220
  };

  sfx.plant.preload = "auto";
  sfx.plant.volume = 0.12;
  sfx.growth.forEach((clip) => {
    clip.preload = "auto";
    clip.volume = 0.09;
  });
  const plantArtBySpecies = {
    suncrest: {
      seedling: [`${imageBasePath}/Seedling suncrest.png`],
      sprout: [
        `${imageBasePath}/Sprout Suncrest (stem).png`,
        `${imageBasePath}/sprout suncrest 1 (stem).png`
      ],
      juvenile: [`${imageBasePath}/Suncrest juvenile.png`, `${imageBasePath}/Suncrest juvenile 1.png`]
    },
    coralfern: {
      seedling: [`${imageBasePath}/Seedling coralfern.png`],
      sprout: [
        `${imageBasePath}/sprout coralfern  (stem).png`,
        `${imageBasePath}/Sprout Coralfern 1 (stem).png`
      ],
      juvenile: [`${imageBasePath}/Coralfern Juvenile.png`, `${imageBasePath}/Coralfern Juvenile 1.png`]
    },
    azurethistle: {
      seedling: [`${imageBasePath}/seedling azurethistle.png`],
      sprout: [
        `${imageBasePath}/sprout Azurethistle (stem).png`,
        `${imageBasePath}/sprout azurethistle 1 (stem).png`
      ],
      juvenile: [
        `${imageBasePath}/Azurethistle Juvenile.png`,
        `${imageBasePath}/Azurethistle Juvenile 1.png`
      ]
    },
    rubyvine: {
      seedling: [`${imageBasePath}/Seedling Rubyvine.png`],
      sprout: [
        `${imageBasePath}/sprout Rubyvine (stem).png`,
        `${imageBasePath}/sprout Rubyvine 1 (stem).png`
      ],
      juvenile: [`${imageBasePath}/Rubyvine Juvenile.png`, `${imageBasePath}/Rubyvine Juvenile 1.png`]
    },
    moonwell: {
      seedling: [`${imageBasePath}/Seedling moonwell.png`],
      sprout: [
        `${imageBasePath}/sprout moonwell (stem).png`,
        `${imageBasePath}/Sprout Moonwell 1 (stem).png`
      ],
      juvenile: [`${imageBasePath}/Juvenile Moonwell.png`, `${imageBasePath}/Moonwell juvenile 1.png`]
    }
  };

  const state = {
    water: config.startWater,
    maxWater: config.startMaxWater,
    passiveRegenMultiplier: 1,
    totalPlantsSeeded: 0,
    totalPlantsGrown: 0,
    sustainableDraws: 0,
    plants: [],
    sources: {
      rolesAssigned: false,
      roleByWellId: {
        a: null,
        b: null
      },
      temporary: {
        drawsRemainingInitial: config.temporaryInitialDraws,
        isDry: false,
        replenishTimer: 0,
        cooldown: 0,
        isPermanentlyDrained: false
      },
      sustainable: {
        cooldown: 0,
        maxCooldown: config.sustainableCooldown,
        currentYield: config.sustainableBaseYield
      },
      sustainabilityMode: false,
      dryupModalShown: false
    },
    isWatering: false,
    wateringPoint: null,
    thrivingPopupShown: false,
    difficulty: "normal",
    nextPlantId: 1,
    lastFrameAt: performance.now()
  };

  const totalSpeciesWeight = speciesCatalog.reduce((sum, species) => sum + species.rarityWeight, 0);

  function playClip(clip) {
    if (!clip) {
      return;
    }

    try {
      clip.currentTime = 0;
      const playPromise = clip.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {});
      }
    } catch (_error) {
      // Ignore playback interruptions to keep gameplay fluid.
    }
  }

  function playPlantSound() {
    playClip(sfx.plant);
  }

  function playGrowthSound() {
    const now = performance.now();
    if (now - sfx.lastGrowthPlayedAt < sfx.growthMinIntervalMs) {
      return;
    }

    const clip = sfx.growth[sfx.nextGrowthIndex % sfx.growth.length];
    sfx.nextGrowthIndex += 1;
    sfx.lastGrowthPlayedAt = now;
    playClip(clip);
  }

  function clampWater() {
    state.water = Math.min(state.maxWater, Math.max(0, state.water));
  }

  function getDifficultyProfile(mode = state.difficulty) {
    return difficultyProfiles[mode] || difficultyProfiles.normal;
  }

  function getEffectivePlantCost() {
    const profile = getDifficultyProfile();
    const baseCost = config.plantCost * profile.plantCostMultiplier;
    const sustainabilityAdjusted = state.sources.sustainabilityMode ? Math.max(3, baseCost - 1) : baseCost;
    return Math.max(1, sustainabilityAdjusted);
  }

  function applyDifficultyBackdrop(mode = state.difficulty) {
    if (!document.body) {
      return;
    }

    document.body.classList.remove("difficulty-easy", "difficulty-normal", "difficulty-hard");
    document.body.classList.add(`difficulty-${mode}`);
  }

  function getHappinessFace() {
    if (state.totalPlantsGrown >= 3) {
      return ":)";
    }
    if (state.sustainableDraws > 0) {
      return ":/";
    }
    return ":(";
  }

  function syncHud() {
    const happinessFace = getHappinessFace();

    UI.updateHud({
      water: state.water,
      maxWater: state.maxWater,
      plantsSeeded: state.totalPlantsSeeded,
      plantsGrown: state.totalPlantsGrown,
      happinessFace
    });

    if (!state.thrivingPopupShown && happinessFace === ":)") {
      state.thrivingPopupShown = true;
      UI.setThrivingPopupVisible(true);
    }

    const temporaryWell = state.sources.roleByWellId.a === "temporary" ? "a" : "b";
    const sustainableWell = temporaryWell === "a" ? "b" : "a";

    UI.updateSourceStatus({
      roles: {
        assigned: state.sources.rolesAssigned,
        temporary: temporaryWell,
        sustainable: sustainableWell
      },
      temporary: state.sources.temporary,
      sustainable: state.sources.sustainable,
      sustainabilityMode: state.sources.sustainabilityMode
    });

    UI.setHintVisible(state.plants.length === 0);
  }

  function resetGame() {
    state.water = config.startWater;
    state.maxWater = config.startMaxWater;
    state.passiveRegenMultiplier = 1;
    state.totalPlantsSeeded = 0;
    state.totalPlantsGrown = 0;
    state.sustainableDraws = 0;
    state.plants = [];
    state.sources.rolesAssigned = false;
    state.sources.roleByWellId.a = null;
    state.sources.roleByWellId.b = null;
    state.sources.temporary.drawsRemainingInitial = config.temporaryInitialDraws;
    state.sources.temporary.isDry = false;
    state.sources.temporary.replenishTimer = 0;
    state.sources.temporary.cooldown = 0;
    state.sources.temporary.isPermanentlyDrained = false;
    state.sources.sustainable.cooldown = 0;
    state.sources.sustainable.currentYield = config.sustainableBaseYield;
    state.sources.sustainabilityMode = false;
    state.sources.dryupModalShown = false;
    state.isWatering = false;
    state.wateringPoint = null;
    state.thrivingPopupShown = false;
    state.nextPlantId = 1;

    UI.clearPlants();
    UI.setWateringVisual(false);
    UI.setSustainabilityPopupVisible(false);
    UI.setThrivingPopupVisible(false);
    UI.setPanel(0);
    applyDifficultyBackdrop();
    syncHud();
  }

  function pickSpecies() {
    let threshold = Math.random() * totalSpeciesWeight;

    for (const species of speciesCatalog) {
      threshold -= species.rarityWeight;
      if (threshold <= 0) {
        return species;
      }
    }

    return speciesCatalog[speciesCatalog.length - 1];
  }

  function pickFrom(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function getPlantStageImages(speciesId, plantIndex) {
    const art = plantArtBySpecies[speciesId];
    if (!art) {
      return ["", "", "", ""];
    }

    const seedlingIndex = plantIndex % art.seedling.length;
    const sproutIndex = (plantIndex + 1) % art.sprout.length;
    const juvenileIndex = (plantIndex + 2) % art.juvenile.length;
    const juvenileMatureIndex = art.juvenile.length > 1
      ? (juvenileIndex + 1) % art.juvenile.length
      : juvenileIndex;

    return [
      art.seedling[seedlingIndex],
      art.sprout[sproutIndex],
      art.juvenile[juvenileIndex],
      art.juvenile[juvenileMatureIndex]
    ];
  }

  function createPlantVariant(species) {
    const juvenileVariantIndex = Math.floor(Math.random() * 3);

    return {
      species,
      juvenileVariant: `juvenile-${juvenileVariantIndex}`,
      growthRateMultiplier: species.growthRateMultiplier
    };
  }

  function buildPlantRecord(position) {
    const species = pickSpecies();
    const variant = createPlantVariant(species);
    const stageWaterRequired = getStageWaterRequired(species.id);

    return {
      id: state.nextPlantId,
      x: position.x,
      y: position.y,
      stage: 0,
      stageWaterApplied: 0,
      stageWaterRequired,
      speciesId: species.id,
      speciesName: species.name,
      variant,
      stageImages: getPlantStageImages(species.id, state.nextPlantId),
      hasCountedGrown: false,
      element: null
    };
  }

  function getStageWaterRequired(speciesId) {
    let minimum = config.stageWaterRequirementMin;

    if (speciesId === "moonwell") {
      minimum = config.stageWaterRequirementMoonwellMin;
    } else if (speciesId === "rubyvine") {
      minimum = config.stageWaterRequirementRubyvineMin;
    }

    const max = config.stageWaterRequirementMax;
    const profile = getDifficultyProfile();
    const required = minimum + Math.random() * (max - minimum);
    return required * profile.stageWaterRequirementMultiplier;
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

  function addPlantAt(position) {
    const plant = buildPlantRecord(position);

    state.nextPlantId += 1;
    plant.element = UI.createPlantElement(plant);
    UI.updatePlantElement(plant.element, plant);
    state.plants.push(plant);
    state.totalPlantsSeeded += 1;
  }

  function plantSeedAt(position) {
    const effectivePlantCost = getEffectivePlantCost();

    if (state.water < effectivePlantCost) {
      return;
    }

    state.water -= effectivePlantCost;
    clampWater();

    addPlantAt(position);
    playPlantSound();
    syncHud();
  }

  function findRowPlantPosition() {
    const maxAttempts = 18;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const rowY = pickFrom(config.plantRows);
      const colX = pickFrom(config.plantColumns);
      const x = Math.max(24, Math.min(76, colX + (Math.random() * 4 - 2)));
      const diagonalOffset = (x - 50) * config.plantRowDiagonalSlope;
      const y = Math.max(14, Math.min(95, rowY + diagonalOffset + (Math.random() * 2.8 - 1.4)));

      const crowded = state.plants.some((plant) => {
        const dx = plant.x - x;
        const dy = (plant.y - y) * 1.6;
        return Math.hypot(dx, dy) < config.minPlantDistance;
      });

      if (!crowded) {
        return { x, y };
      }
    }

    const fallbackX = pickFrom(config.plantColumns);
    const fallbackY = pickFrom(config.plantRows) + (fallbackX - 50) * config.plantRowDiagonalSlope;
    return { x: fallbackX, y: Math.max(14, Math.min(95, fallbackY)) };
  }

  function plantSeedRandomRow() {
    if (state.isWatering) {
      return;
    }

    const effectivePlantCost = getEffectivePlantCost();
    if (state.water < effectivePlantCost) {
      return;
    }

    state.water -= effectivePlantCost;
    clampWater();

    addPlantAt(findRowPlantPosition());
    addPlantAt(findRowPlantPosition());
    playPlantSound();
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

  function assignSourceRoles(temporaryWellId) {
    if (state.sources.rolesAssigned) {
      return;
    }

    const sustainableWellId = temporaryWellId === "a" ? "b" : "a";
    state.sources.roleByWellId[temporaryWellId] = "temporary";
    state.sources.roleByWellId[sustainableWellId] = "sustainable";
    state.sources.rolesAssigned = true;
  }

  function refillWaterCanToMax() {
    state.water = state.maxWater;
    clampWater();
  }

  function enableSustainabilityMode() {
    state.sources.sustainabilityMode = true;
    UI.setSustainabilityPopupVisible(false);
  }

  function triggerTemporaryDryup() {
    state.sources.temporary.isDry = true;
    state.sources.temporary.replenishTimer = config.temporaryReplenishDuration;
    state.sources.temporary.cooldown = 0;
    state.sources.temporary.isPermanentlyDrained = true;

    if (!state.sources.dryupModalShown) {
      state.sources.dryupModalShown = true;
      UI.setSustainabilityPopupVisible(true);
    }
  }

  function drawTemporarySource() {
    const temporary = state.sources.temporary;

    if (temporary.isPermanentlyDrained) {
      return;
    }

    if (temporary.isDry && temporary.replenishTimer > 0) {
      return;
    }

    if (temporary.cooldown > 0) {
      return;
    }

    refillWaterCanToMax();
    state.water += 50;
    clampWater();

    if (temporary.drawsRemainingInitial > 0) {
      temporary.drawsRemainingInitial -= 1;
      if (temporary.drawsRemainingInitial <= 0) {
        triggerTemporaryDryup();
      }
    } else {
      temporary.cooldown = config.temporaryRecoveredCooldown;
    }

    syncHud();
  }

  function drawSustainableSource() {
    const sustainable = state.sources.sustainable;
    if (sustainable.cooldown > 0) {
      return;
    }

    state.water += sustainable.currentYield;
    clampWater();
    state.sustainableDraws += 1;
    state.passiveRegenMultiplier *= 2;
    sustainable.cooldown = sustainable.maxCooldown;
    sustainable.currentYield *= config.sustainableYieldMultiplier;
    syncHud();
  }

  function interactWithWell(wellId) {
    assignSourceRoles(wellId);

    if (state.sources.roleByWellId[wellId] === "temporary") {
      drawTemporarySource();
    } else {
      drawSustainableSource();
    }
  }

  function updateSources(deltaSeconds) {
    const temporary = state.sources.temporary;
    const sustainable = state.sources.sustainable;

    if (temporary.isDry && temporary.replenishTimer > 0) {
      temporary.replenishTimer = Math.max(0, temporary.replenishTimer - deltaSeconds);
      if (temporary.replenishTimer <= 0) {
        temporary.isDry = false;
        state.sources.sustainabilityMode = false;
      }
    }

    temporary.cooldown = Math.max(0, temporary.cooldown - deltaSeconds);
    sustainable.cooldown = Math.max(0, sustainable.cooldown - deltaSeconds);
  }

  function updatePlantGrowth(deltaSeconds) {
    if (!state.isWatering) {
      return;
    }

    const profile = getDifficultyProfile();
    const drainMultiplier = (state.sources.sustainabilityMode ? config.sustainabilityDrainMultiplier : 1) * profile.wateringDrainMultiplier;
    const stageWaterGain = config.waterDrainPerSecond * drainMultiplier * deltaSeconds;

    for (const plant of state.plants) {
      if (plant.stage >= 3) {
        continue;
      }

      plant.stageWaterApplied += stageWaterGain;

      while (plant.stageWaterApplied >= plant.stageWaterRequired && plant.stage < 3) {
        plant.stageWaterApplied -= plant.stageWaterRequired;
        plant.stage += 1;
        UI.updatePlantElement(plant.element, plant);
        playGrowthSound();

        if (plant.stage >= 3 && !plant.hasCountedGrown) {
          plant.hasCountedGrown = true;
          state.totalPlantsGrown += 1;
        } else if (plant.stage < 3) {
          plant.stageWaterRequired = getStageWaterRequired(plant.speciesId);
        }
      }
    }
  }

  function tick(timestamp) {
    const deltaSeconds = Math.min(0.1, (timestamp - state.lastFrameAt) / 1000);
    state.lastFrameAt = timestamp;

    state.water += config.regenRate * state.passiveRegenMultiplier * deltaSeconds;
    updateSources(deltaSeconds);

    if (state.isWatering) {
      const profile = getDifficultyProfile();
      const drainMultiplier = (state.sources.sustainabilityMode ? config.sustainabilityDrainMultiplier : 1) * profile.wateringDrainMultiplier;
      state.water -= config.waterDrainPerSecond * drainMultiplier * deltaSeconds;
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

  UI.onPlantPress(() => {
    plantSeedRandomRow();
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

  UI.onWaterHover(
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

  UI.onWellInteract((wellId) => {
    interactWithWell(wellId);
  });

  UI.onDifficultyChange((nextDifficulty) => {
    const currentProfile = getDifficultyProfile();
    const nextProfile = getDifficultyProfile(nextDifficulty);

    if (state.difficulty === nextDifficulty) {
      return;
    }

    const ratio = nextProfile.stageWaterRequirementMultiplier / currentProfile.stageWaterRequirementMultiplier;
    state.difficulty = nextDifficulty;
    applyDifficultyBackdrop();

    for (const plant of state.plants) {
      plant.stageWaterRequired *= ratio;
      plant.stageWaterApplied *= ratio;
    }

    syncHud();
  });

  UI.onSustainabilityAction(() => {
    enableSustainabilityMode();
    syncHud();
  });

  UI.onThrivingContinue(() => {
    UI.setThrivingPopupVisible(false);
  });

  UI.onRestart(() => {
    resetGame();
  });

  state.difficulty = UI.getSelectedDifficulty();
  applyDifficultyBackdrop();

  resetGame();
  requestAnimationFrame(tick);
})();
