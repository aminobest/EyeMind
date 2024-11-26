/*MIT License

Copyright (c) 2022 Eye-Mind Tool (Author: Amine Abbad-Andaloussi)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.*/

const { contextBridge, ipcRenderer, screen } = require('electron')
const { globalParameters } = require('./globals')

// contextBridge.exposeInMainWorld listeners/window.js
contextBridge.exposeInMainWorld('electron', {
  putFullScreen: () => ipcRenderer.send('putFullScreen'),
  message: (type, text) => ipcRenderer.send('message', [type, text]),
  removeFullScreen: () => ipcRenderer.send('removeFullScreen'),
  onBrowserMovement: (func) =>
    ipcRenderer.on('browserMovement', (event, ...args) => func(args)),
  onBrowserResize: (func) =>
    ipcRenderer.on('browserResize', (event, ...args) => func(args)),
})

// contextBridge.exposeInMainWorld listeners/test.js
contextBridge.exposeInMainWorld('serverTests', {
  getServerState: () => ipcRenderer.invoke('getServerState'),
})

// contextBridge.exposeInMainWorld globals.js
contextBridge.exposeInMainWorld('globalParameters', globalParameters)

// contextBridge.exposeInMainWorld listeners/analysis.js
contextBridge.exposeInMainWorld('analysis', {
  summerizedFixationLog: (data, mode, areGazesCorrected) =>
    ipcRenderer.invoke('summerizedFixationLog', [
      data,
      mode,
      areGazesCorrected,
    ]),
  generateHeatMap: (
    filePaths,
    elementRegistryTypes,
    measure,
    measureType,
    aggregation,
    additionalElementsToIclude,
    questionID
  ) =>
    ipcRenderer.invoke('generateHeatMap', [
      filePaths,
      elementRegistryTypes,
      measure,
      measureType,
      aggregation,
      additionalElementsToIclude,
      questionID,
    ]),
  shouldEnableHeatmap: () => ipcRenderer.invoke('shouldEnableHeatmap', []),
  getRandomGazeSet: (samplingRatio, stateFile) =>
    ipcRenderer.invoke('getRandomGazeSet', [samplingRatio, stateFile]),
  applyCorrectionOffset: (
    externalMappingWindow,
    stateFile,
    snapshotId,
    xOffset,
    yOffset
  ) =>
    ipcRenderer.invoke('applyCorrectionOffset', [
      externalMappingWindow,
      stateFile,
      snapshotId,
      xOffset,
      yOffset,
    ]),
  onApplyCorrectionOnGazeFragment: (func) =>
    ipcRenderer.on('applyCorrectionOnGazeFragment', (event, ...args) =>
      func(args)
    ),
  gazeDataFragmentMapped: (
    stateFile,
    gazeDataFragment,
    start,
    gazeDataSize,
    externalMappingWindow,
    snapshotId,
    xOffset,
    yOffset
  ) =>
    ipcRenderer.invoke('gazeDataFragmentMapped', [
      stateFile,
      gazeDataFragment,
      start,
      gazeDataSize,
      externalMappingWindow,
      snapshotId,
      xOffset,
      yOffset,
    ]),
  onCompleteCorrectionListener: (func) =>
    ipcRenderer.on('completeCorrectionListener', (event, ...args) =>
      func(args)
    ),
  getStatesInfo: () => ipcRenderer.invoke('getStatesInfo'),
})

// contextBridge.exposeInMainWorld listeners/download.js, session.js
contextBridge.exposeInMainWorld('utils', {
  stateDownload: (fileName, includeTimeStampInFileName, customDownload) =>
    ipcRenderer.invoke('stateDownload', [
      fileName,
      includeTimeStampInFileName,
      customDownload,
    ]),
  readState: (fileName, filePath, state) =>
    ipcRenderer.invoke('readState', [fileName, filePath, state]),
  onStateRead: (func) =>
    ipcRenderer.once('stateRead', (event, ...args) => func(args)),
  saveSession: (state) => ipcRenderer.invoke('saveSession', [state]),
  recoverSession: (gazeDataFilename, snapshotsContentDataFilename) =>
    ipcRenderer.invoke('recoverSession', [
      gazeDataFilename,
      snapshotsContentDataFilename,
    ]),
  onSessionRead: (func) =>
    ipcRenderer.once('sessionRead', (event, ...args) => func(args)),
})

// contextBridge.exposeInMainWorld listeners/eye-tracker.js
contextBridge.exposeInMainWorld('eyeTracker', {
  setupTracking: (xScreenDim, yScreenDim) =>
    ipcRenderer.invoke('setupTracking', [xScreenDim, yScreenDim]),
  sendSnapshotID: (snapshot) =>
    ipcRenderer.invoke('sendSnapshotID', [snapshot]),
  sendFullSnapshot: (snapshot) =>
    ipcRenderer.invoke('sendFullSnapshot', [snapshot]),
  sendQuestionEvent: (
    questionTimestamp,
    questionEventType,
    questionPosition,
    questionText,
    questionAnswer,
    questionID
  ) =>
    ipcRenderer.invoke('sendQuestionEvent', [
      questionTimestamp,
      questionEventType,
      questionPosition,
      questionText,
      questionAnswer,
      questionID,
    ]),
  processGazeData: (state, externalProgressWindow) =>
    ipcRenderer.invoke('processGazeData', [state, externalProgressWindow]),
  onMapGazestoElementsFromPageSnapshot: (func) =>
    ipcRenderer.on('mapGazestoElementsFromPageSnapshot', (event, ...args) =>
      func(args)
    ),
  dataMapped: (dataMapped, start, gazeDataSize, externalProgressWindow) =>
    ipcRenderer.invoke('dataMapped', [
      dataMapped,
      start,
      gazeDataSize,
      externalProgressWindow,
    ]),
  onCompleteProcessingListener: (func) =>
    ipcRenderer.once('completeProcessingListener', (event, ...args) =>
      func(args)
    ),
  sendClickEvent: (clickTimestamp, clickedElement) =>
    ipcRenderer.invoke('sendClickEvent', [clickTimestamp, clickedElement]),
})

// contextBridge.exposeInMainWorld listeners/fixation-filter.js
contextBridge.exposeInMainWorld('Rserver', {
  startRserver: () => ipcRenderer.send('startRserver'),
  fixationFilter: (fixationFilterSettings) =>
    ipcRenderer.invoke('fixationFilter', [fixationFilterSettings]),
  onCompleteFixationFilterListener: (func) =>
    ipcRenderer.on('completeFixationFilterListener', (event, ...args) =>
      func(args)
    ),
})

// contextBridge.exposeInMainWorld listeners/state.js
contextBridge.exposeInMainWorld('state', {
  getState: () => ipcRenderer.invoke('getState'),
  clearState: () => ipcRenderer.invoke('clearState'),
  getStyleParametersOfState: (filePath) =>
    ipcRenderer.invoke('getStyleParametersOfState', [filePath]),
  setAreGazesCorrectedOfState: (filePath, val) =>
    ipcRenderer.invoke('setAreGazesCorrectedOfState', [filePath, val]),
  getQuestions: () => ipcRenderer.invoke('getQuestions'),
  getStates: () => ipcRenderer.invoke('getStates'),
  clearStates: () => ipcRenderer.invoke('clearStates'),
  removeState: (filePath) => ipcRenderer.invoke('removeState', [filePath]),
  doesStateExist: (filePath) =>
    ipcRenderer.invoke('doesStateExist', [filePath]),
  getSnapshotsOfState: (filePath) =>
    ipcRenderer.invoke('getSnapshotsOfState', [filePath]),
  areAreGazesCorrectedOfState: (filePath) =>
    ipcRenderer.invoke('areAreGazesCorrectedOfState', [filePath]),
})

// contextBridge.exposeInMainWorld
contextBridge.exposeInMainWorld('progress', {
  onUpdateProcessingMessage: (func) =>
    ipcRenderer.on('updateProcessingMessage', (event, ...args) => func(args)), //listeners/eye-tracker.js
})
