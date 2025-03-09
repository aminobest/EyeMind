import { ipcMain } from 'electron'
import { recoverSession, saveSession } from '@/app/server/node/utils/session'

// check the return
export function sessionListeners() {
  ipcMain.handle('saveSession', function (e, args) {
    return saveSession(...args)
  })

  ipcMain.handle('recoverSession', function (e, args) {
    return recoverSession(...args)
  })
}
