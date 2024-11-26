const { ipcMain } = require('electron')
const {
  getState,
  clearState,
  getSnapshotsOfState,
  getStyleParametersOfState,
  setAreGazesCorrectedOfState,
  getQuestions,
  getStates,
  clearStates,
  removeState,
  doesStateExist,
  areAreGazesCorrectedOfState,
} = require('../app/server/node/dataModels/state')

// check the return
function stateListeners() {
  ipcMain.handle('getState', async function () {
    return await getState()
  })

  ipcMain.handle('clearState', async function (e, args) {
    return await clearState()
  })

  ipcMain.handle('getSnapshotsOfState', async function (e, args) {
    return await getSnapshotsOfState(...args)
  })

  ipcMain.handle('getStyleParametersOfState', async function (e, args) {
    return await getStyleParametersOfState(...args)
  })

  ipcMain.handle('setAreGazesCorrectedOfState', async function (e, args) {
    return await setAreGazesCorrectedOfState(...args)
  })

  ipcMain.handle('getQuestions', async function () {
    return await getQuestions()
  })

  ipcMain.handle('getStates', async function () {
    return await getStates()
  })

  ipcMain.handle('clearStates', async function () {
    return await clearStates()
  })

  ipcMain.handle('removeState', async function () {
    return await removeState()
  })

  ipcMain.handle('doesStateExist', async function (e, args) {
    return await doesStateExist(...args)
  })

  ipcMain.handle('areAreGazesCorrectedOfState', async function (e, args) {
    return await areAreGazesCorrectedOfState(...args)
  })
}

exports.stateListeners = stateListeners
