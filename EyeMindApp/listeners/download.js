const { ipcMain } = require('electron')
const { stateDownload } = require('../app/server/node/utils/download')

// check the return
function downloadListener() {
  ipcMain.handle('stateDownload', async function (e, args) {
    return await stateDownload(...args)
  })
}

exports.downloadListener = downloadListener
