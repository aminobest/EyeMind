const { ipcMain } = require('electron')
const {
  saveSession,
  recoverSession,
} = require('../app/server/node/utils/session')

// check the return
function sessionListeners() {
  ipcMain.handle('saveSession', function (e, args) {
    return saveSession(...args)
  })

  ipcMain.handle('recoverSession', function (e, args) {
    return recoverSession(...args)
  })
}

exports.sessionListeners = sessionListeners
