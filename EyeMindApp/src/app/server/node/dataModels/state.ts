/* inits */
let state = {
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

let states = {}

/* data collection */

export function getState() {
  return state
}

export function setState(newState) {
  state = newState
}

export function clearState() {
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

export function getStates() {
  return states
}

export function clearStates() {
  states = {}
}

export function addState(filepath, state) {
  states[filepath] = state
}

export function removeState(filePath) {
  delete states[filePath]
}

export function doesStateExist(filePath) {
  return states.hasOwnProperty(filePath)
}

export function getSnapshotsOfState(filePath) {
  return states[filePath].snapshots
}

export function getStyleParametersOfState(filePath) {
  console.log(filePath)
  console.log(states[filePath].styleParameters)
  return states[filePath].styleParameters
}

export function setAreGazesCorrectedOfState(filePath, val) {
  states[filePath]['processedGazeData']['areGazesCorrected'] = val
}

export function areAreGazesCorrectedOfState(filePath) {
  return states[filePath]['processedGazeData']['areGazesCorrected']
}

export function getQuestions() {
  return state.questions
}
