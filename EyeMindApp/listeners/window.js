const { ipcMain, dialog } = require('electron')

function windowListeners(mainWindow) {
  mainWindow.on('moved', function () {
    mainWindow.webContents.send('browserMovement')
  })

  mainWindow.on('resized', function () {
    mainWindow.webContents.send('browserResize')
  })

  ipcMain.on('putFullScreen', function () {
    mainWindow.setFullScreen(true)
  })

  ipcMain.on('removeFullScreen', function () {
    mainWindow.setFullScreen(false)
  })

  ipcMain.on('message', function (e, args) {
    var options = null
    if (args[0] == 'info') {
      options = {
        type: 'info',
        message: args[1],
      }
    } else if (args[0] == 'error') {
      options = {
        type: 'error',
        message: args[1],
      }
    }
    dialog.showMessageBox(mainWindow, options)
  })
}

exports.windowListeners = windowListeners
