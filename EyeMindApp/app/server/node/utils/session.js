const { getState, setState } = require('../dataModels/state')
const { stateDownload } = require('../utils/download')
const { globalParameters } = require('../../../../globals.js')

const fs = require('fs')
const request = require('request-promise')

async function saveSession(state) {
  setState(state)

  const downloadOutput = await stateDownload('EyeMind', true, 'session-data')

  return downloadOutput
}

/* recover session WIP (using the mocking approach of the playwright testing)
 * Additional notes: This method allows to redo the mapping of gazes to model elements, given gazeDataFilename,snapshotsContentDataFilename recorded as backups by the eye-tracking server
 * to enable that: you need to
 * (1) make sure to use the same resolution as the one used in the data collection
 * (2) load the same participant session file as the one used in the data collection
 * (3) start eye-tracking server in testMode
 * (4) start recording with the imported session file
 * (5) open console using control+shift+i in EyeMind, call await window.utils.recoverSession(gazeDataFilename,snapshotsContentDataFilename), the path is relative to "EyetrackingServer/" check that the ET server received the data
 * (6) close the console
 * (7) press end recording button
 */
async function recoverSession(gazeDataFilename, snapshotsContentDataFilename) {
  console.log('recoverSession', arguments)

  // clear data (i.e., to clear events sent when the recording started i.e., questionOnSet)
  const clearAction = { action: 'clear' }
  await request({
    method: globalParameters.COMMUNICATION_METHOD_TO_ET_SERVER,
    uri: globalParameters.COMMUNICATION_URI_TO_ET_SERVER,
    body: clearAction,
    json: true,
  })

  //send mock recording data // the paths are in EyeMind\EyeTrackingServer\
  const mockRecordingData = {
    action: 'mockRecording',
    gazeDataFilename: gazeDataFilename,
    snapshotsContentDataFilename: snapshotsContentDataFilename,
  }
  await request({
    method: globalParameters.COMMUNICATION_METHOD_TO_ET_SERVER,
    uri: globalParameters.COMMUNICATION_URI_TO_ET_SERVER,
    body: mockRecordingData,
    json: true,
  })
}

exports.saveSession = saveSession
exports.recoverSession = recoverSession
