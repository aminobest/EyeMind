const request = require('request-promise')
const { globalParameters } = require('../../../../globals.js')
const { stateDownload } = require('../utils/download')
const { calculateProgress } = require('../utils/utils')
const { getState, setState } = require('../dataModels/state')

async function setupTracking(xScreenDim, yScreenDim) {
  // console.log("setupTracking function");
  const res = {}

  // send setup data to the eye-tracking server
  const setupData = {
    action: 'setup',
    xScreenDim: xScreenDim,
    yScreenDim: yScreenDim,
  }
  const communication = {
    method: globalParameters.COMMUNICATION_METHOD_TO_ET_SERVER,
    uri: globalParameters.COMMUNICATION_URI_TO_ET_SERVER,
    body: setupData,
    json: true,
  }

  try {
    const response = await request(communication)
    console.log(response)
    if (response['isETready'] == 1) {
      res.sucess = true
    } else {
      const error = 'The tracker sent a not ready signal'
      throw error
    }
  } catch (error) {
    const msg = 'A problem occured when setting up the eye-tracker. ' + error
    res.msg = msg
    res.sucess = false
  }

  return res
}

async function sendSnapshotID(snapshot) {
  // console.log("sendSnapshotID function ",arguments);
  const res = {}

  const snapshotData = {
    action: 'addSnapshot',
    timestamp: snapshot.timestamp,
    id: snapshot.id,
  }
  const communication = {
    method: globalParameters.COMMUNICATION_METHOD_TO_ET_SERVER,
    uri: globalParameters.COMMUNICATION_URI_TO_ET_SERVER,
    body: snapshotData,
    json: true,
  }

  // console.log("communication object to be sent", communication);

  try {
    const response = await request(communication)
    res.sucess = true
  } catch (error) {
    const msg = 'A problem occured when sending the snapshot id. ' + error
    res.msg = msg
    res.sucess = false
  }

  return res
}

async function sendFullSnapshot(snapshot) {
  // console.log("sendFullSnapshot function ",arguments);
  const res = {}

  const snapshotData = { action: 'logFullSnapshot', content: snapshot }
  const communication = {
    method: globalParameters.COMMUNICATION_METHOD_TO_ET_SERVER,
    uri: globalParameters.COMMUNICATION_URI_TO_ET_SERVER,
    body: snapshotData,
    json: true,
  }

  // console.log("communication object to be sent", communication);

  try {
    const response = await request(communication)
    res.sucess = true
  } catch (error) {
    const msg = 'A problem occured when sending the full snapshot. ' + error
    res.msg = msg
    res.sucess = false
  }

  return res
}

async function sendQuestionEvent(
  questionTimestamp,
  questionEventType,
  questionPosition,
  questionText,
  questionAnswer,
  questionID
) {
  const res = {}

  // send question event data to the eye-tracking server
  const data = {
    action: 'addQuestionEvent',
    questionTimestamp: questionTimestamp,
    questionEventType: questionEventType,
    questionPosition: questionPosition,
    questionText: questionText,
    questionAnswer: questionAnswer,
    questionID: questionID,
  }

  const communication = {
    method: globalParameters.COMMUNICATION_METHOD_TO_ET_SERVER,
    uri: globalParameters.COMMUNICATION_URI_TO_ET_SERVER,
    body: data,
    json: true,
  }

  try {
    const response = await request(communication)
    res.sucess = true
  } catch (error) {
    const msg = 'A problem occured when sending the question event. ' + error
    res.msg = msg
    res.sucess = false
  }

  return res
}

async function sendClickEvent(clickTimestamp, clickedElement) {
  const res = {}

  // send question event data to the eye-tracking server
  const data = {
    action: 'addClickEvent',
    clickTimestamp: clickTimestamp,
    clickedElement: clickedElement,
  }

  const communication = {
    method: globalParameters.COMMUNICATION_METHOD_TO_ET_SERVER,
    uri: globalParameters.COMMUNICATION_URI_TO_ET_SERVER,
    body: data,
    json: true,
  }

  try {
    const response = await request(communication)
    res.sucess = true
  } catch (error) {
    const msg = 'A problem occured when sending the click event. ' + error
    res.msg = msg
    res.sucess = false
  }

  return res
}

async function processGazeData(
  clientState,
  externalProgressWindow,
  mainWindow
) {
  // console.log("processGazeData function ",arguments);
  console.log('externalProgressWindow in connector', externalProgressWindow)

  //const res = {};

  mainWindow.webContents.send(
    'updateProcessingMessage',
    'Preparing eye-tracking data',
    externalProgressWindow
  )

  await requestGazeData(clientState, externalProgressWindow, mainWindow)
}

async function requestGazeData(
  clientState,
  externalProgressWindow,
  mainWindow
) {
  // console.log("requestGazeData function ",arguments);

  const gazeRequest = { action: 'PrepareGazeDataAndInitiateTransfer' }
  const communication = {
    method: globalParameters.COMMUNICATION_METHOD_TO_ET_SERVER,
    uri: globalParameters.COMMUNICATION_URI_TO_ET_SERVER,
    body: gazeRequest,
    json: true,
  }

  const response = await request(communication)

  // console.log("gaze data received from eye-tracking server ",response);

  // report progress through updateProcessingMessage
  mainWindow.webContents.send(
    'updateProcessingMessage',
    'Initiating data transfer and mapping',
    externalProgressWindow
  )

  // get gazeDataSize (coming as response from py eye-tracking server)
  const gazeDataSize = response['gazeDataSize']

  // get snapshotsSize (coming as response from py eye-tracking server)
  const snapshotsSize = response['snapshotsSize']

  console.log('gazeDataSize', gazeDataSize)
  console.log('snapshotsSize', snapshotsSize)

  // initiate clientState.processedGazeData.gazeData
  clientState.processedGazeData.gazeData = []

  // initiate clientState.snapshots
  clientState.snapshots = []

  // set state
  setState(clientState)

  // get snapshots in fragements
  var start = 0
  while (start != snapshotsSize) {
    start = await fetchSnapshotsInFragement(
      start,
      snapshotsSize,
      externalProgressWindow,
      mainWindow
    )
  }

  // process gazeData in fragements
  await processDataFragement(
    0,
    gazeDataSize,
    externalProgressWindow,
    mainWindow
  )
}

async function fetchSnapshotsInFragement(
  start,
  snapshotsSize,
  externalProgressWindow,
  mainWindow
) {
  //console.log("fetchSnapshotsInFragement",arguments);

  const end =
    start + globalParameters.SNAPSHOTS_FRAGMENT_SIZE <= snapshotsSize
      ? start + globalParameters.SNAPSHOTS_FRAGMENT_SIZE
      : snapshotsSize

  console.log(
    'start ',
    start,
    'end ',
    end,
    'SNAPSHOTS_FRAGMENT_SIZE',
    globalParameters.SNAPSHOTS_FRAGMENT_SIZE,
    'snapshotsSize',
    snapshotsSize
  )

  const req = { action: 'getSnapshotFragment', start: start, end: end }
  const com = {
    method: globalParameters.COMMUNICATION_METHOD_TO_ET_SERVER,
    uri: globalParameters.COMMUNICATION_URI_TO_ET_SERVER,
    body: req,
    json: true,
  }

  // request to ET server to snapshots in range [start,end]
  await request(com).then(function (res) {
    const state = getState()
    Object.assign(state.snapshots, res)
  })

  const state = getState()
  console.log(Object.keys(state.snapshots).length)

  // report progress through updateProcessingMessage
  mainWindow.webContents.send(
    'updateProcessingMessage',
    'Transferring snapshots data: ' +
      calculateProgress(end, snapshotsSize) +
      '% complete',
    externalProgressWindow
  )

  return end
}

async function processDataFragement(
  start,
  gazeDataSize,
  externalProgressWindow,
  mainWindow
) {
  // console.log("processDataFragement",arguments);

  const end =
    start + globalParameters.DATA_FRAGMENT_SIZE <= gazeDataSize
      ? start + globalParameters.DATA_FRAGMENT_SIZE
      : gazeDataSize

  console.log(
    'start ',
    start,
    'end ',
    end,
    'DATA_FRAGMENT_SIZE',
    globalParameters.DATA_FRAGMENT_SIZE,
    'gazeDataSize',
    gazeDataSize
  )

  const req = { action: 'getDataFragment', start: start, end: end }
  const com = {
    method: globalParameters.COMMUNICATION_METHOD_TO_ET_SERVER,
    uri: globalParameters.COMMUNICATION_URI_TO_ET_SERVER,
    body: req,
    json: true,
  }

  // request to ET server to get gaze data in range [start,end]
  await request(com).then(function (res) {
    const state = getState()
    /// send to UI to the mapping
    var snapshots = start == 0 ? state.snapshots : null
    mainWindow.webContents.send(
      'mapGazestoElementsFromPageSnapshot',
      res,
      start,
      gazeDataSize,
      externalProgressWindow,
      snapshots
    )
  })

  // report progress through updateProcessingMessage
  mainWindow.webContents.send(
    'updateProcessingMessage',
    'Data transfer and mapping: ' +
      calculateProgress(end, gazeDataSize) +
      '% complete',
    externalProgressWindow
  )
}

async function dataMapped(
  dataMapped,
  start,
  gazeDataSize,
  externalProgressWindow,
  mainWindow
) {
  //console.log("dataMapped",arguments);

  /// extend fullGazeData with dataMapped
  const state = getState()
  state.processedGazeData.gazeData.push.apply(
    state.processedGazeData.gazeData,
    dataMapped
  ) // check if the use of a global variable here is ok
  setState(state) // implementation: to be kept so afterwards stateDownload would not need a parameter state.

  // set next start
  start = start + globalParameters.DATA_FRAGMENT_SIZE
  // move to next iteration
  if (start < gazeDataSize) {
    await processDataFragement(
      start,
      gazeDataSize,
      externalProgressWindow,
      mainWindow
    )
  } else {
    // report progress through updateProcessingMessage

    console.log('All is mapped, show making the state download')

    mainWindow.webContents.send(
      'updateProcessingMessage',
      'Exporting the file. This operation can take serveral minutes for long recordings',
      externalProgressWindow
    )
    const downloadOutput = await stateDownload(
      'EyeMind',
      true,
      'collected-data'
    )
    mainWindow.webContents.send(
      'completeProcessingListener',
      externalProgressWindow,
      downloadOutput.msg,
      downloadOutput.sucess
    )
  }
}

exports.setupTracking = setupTracking
exports.sendSnapshotID = sendSnapshotID
exports.sendFullSnapshot = sendFullSnapshot
exports.sendQuestionEvent = sendQuestionEvent
exports.processGazeData = processGazeData
exports.dataMapped = dataMapped
exports.sendClickEvent = sendClickEvent
