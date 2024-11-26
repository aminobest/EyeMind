/* inits */
var state = {
  snapshotsCounter: 0,
  activeTab: null,
  processedGazeData: {},
  isEtOn: false,
  models: {},
  mode: null,
  temp: {},
  linkingSubProcessesMode: null,
  questions: null,
}

var states = {}

/* data collection */

function getState() {
  return state
}

function setState(newState) {
  state = newState
}

function clearState() {
  state = {
    snapshotsCounter: 0,
    activeTab: null,
    processedGazeData: {},
    isEtOn: false,
    models: {},
    mode: null,
    temp: {},
    linkingSubProcessesMode: null,
    questions: null,
  }
}

/* Analysis */

function getStates() {
  return states
}

function clearStates() {
  states = {}
}

function addState(filepath, state) {
  states[filepath] = state
}

function removeState(filePath) {
  delete states[filePath]
}

function doesStateExist(filePath) {
  return states.hasOwnProperty(filePath)
}

function getSnapshotsOfState(filePath) {
  return states[filePath].snapshots
}

function getStyleParametersOfState(filePath) {
  console.log(filePath)
  console.log(states[filePath].styleParameters)
  return states[filePath].styleParameters
}

function setAreGazesCorrectedOfState(filePath, val) {
  states[filePath]['processedGazeData']['areGazesCorrected'] = val
}

function areAreGazesCorrectedOfState(filePath) {
  return states[filePath]['processedGazeData']['areGazesCorrected']
}

function getQuestions() {
  return state.questions
}

exports.getState = getState
exports.setState = setState
exports.clearState = clearState

exports.getStates = getStates
exports.clearStates = clearStates
exports.addState = addState
exports.removeState = removeState
exports.doesStateExist = doesStateExist
exports.getStyleParametersOfState = getStyleParametersOfState
exports.setAreGazesCorrectedOfState = setAreGazesCorrectedOfState
exports.getSnapshotsOfState = getSnapshotsOfState
exports.areAreGazesCorrectedOfState = areAreGazesCorrectedOfState

exports.getQuestions = getQuestions
