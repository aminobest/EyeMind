const { ipcMain } = require('electron')
const { readState } = require('../app/server/node/utils/files-setup')

// check the return
function fileSetupListener(mainWindow) {
  ipcMain.handle('readState', function (e, args) {
    args.push(mainWindow)
    return readState(...args)
  })
}

exports.fileSetupListener = fileSetupListener
