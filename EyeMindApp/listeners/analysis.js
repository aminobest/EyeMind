const { ipcMain } = require('electron')
const {
  summerizedFixationLog,
  generateHeatMap,
  shouldEnableHeatmap,
  getRandomGazeSet,
  applyCorrectionOffset,
  gazeDataFragmentMapped,
  getStatesInfo,
} = require('../app/server/node/analysis/analysis')

// check the return
function analysisListeners(mainWindow) {
  ipcMain.handle('summerizedFixationLog', function (e, args) {
    return summerizedFixationLog(...args)
  })

  ipcMain.handle('generateHeatMap', function (e, args) {
    return generateHeatMap(...args)
  })

  ipcMain.handle('shouldEnableHeatmap', function (e, args) {
    return shouldEnableHeatmap(...args)
  })

  ipcMain.handle('getRandomGazeSet', function (e, args) {
    return getRandomGazeSet(...args)
  })

  ipcMain.handle('applyCorrectionOffset', function (e, args) {
    args.push(mainWindow)
    return applyCorrectionOffset(...args)
  })

  ipcMain.handle('gazeDataFragmentMapped', function (e, args) {
    args.push(mainWindow)
    return gazeDataFragmentMapped(...args)
  })

  ipcMain.handle('getStatesInfo', function () {
    return getStatesInfo()
  })
}

exports.analysisListeners = analysisListeners
