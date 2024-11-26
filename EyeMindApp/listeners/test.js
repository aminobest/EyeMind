const { getServerState } = require('../app/server/node/utils/test')
const { ipcMain } = require('electron')

function testListeners() {
  ipcMain.handle('getServerState', async function (e) {
    return getServerState()
  })
}

exports.testListeners = testListeners
