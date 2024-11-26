var activeFeatures = {
  heatmapActive: false,
  projectionAndMappingActive: false,
}

function setheatmapActive(val) {
  activeFeatures['heatmapActive'] = val
}

function isHeatmapActive() {
  return activeFeatures.heatmapActive
}

function SetProjectionAndMappingActive(val) {
  activeFeatures['projectionAndMappingActive'] = val
}

function areProjectionAndMappingActive() {
  return activeFeatures.projectionAndMappingActive
}

export {
  setheatmapActive,
  SetProjectionAndMappingActive,
  isHeatmapActive,
  areProjectionAndMappingActive,
}
