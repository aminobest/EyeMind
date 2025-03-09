import { ipcMain } from 'electron'
import {
  dataMapped,
  processGazeData,
  sendClickEvent,
  sendFullSnapshot,
  sendQuestionEvent,
  sendSnapshotID,
  setupTracking,
} from '@/app/server/node/connectors/eye-tracker'

export function eyeTrackerListeners(mainWindow) {
  ipcMain.handle('setupTracking', function (e, args) {
    return setupTracking(...args)
  })

  ipcMain.handle('sendSnapshotID', function (e, args) {
    return sendSnapshotID(...args)
  })

  ipcMain.handle('sendFullSnapshot', function (e, args) {
    return sendFullSnapshot(...args)
  })

  ipcMain.handle('sendQuestionEvent', function (e, args) {
    return sendQuestionEvent(...args)
  })

  ipcMain.handle('processGazeData', function (e, args) {
    args.push(mainWindow)
    return processGazeData(...args)
  })

  ipcMain.handle('dataMapped', function (e, args) {
    args.push(mainWindow)
    return dataMapped(...args)
  })

  ipcMain.handle('sendClickEvent', function (e, args) {
    return sendClickEvent(...args)
  })
}
