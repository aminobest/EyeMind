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

const request = require('request-promise')
const { globalParameters } = require('../../../../globals.js')
const { calculateProgress } = require('../utils/utils')
const { summerizedFixationLog } = require('../analysis/analysis')
const { addState, getStates } = require('../dataModels/state')

async function fixationFilter(fixationFilterSettings, mainWindow) {
  // note: the fixation filter uses the corrected data if state.processedGazeData.areGazesCorrected = true; (see R code)

  // console.log("fixationFilter function",arguments);

  // get states
  var states = getStates()

  // apply fixation filter to the states
  for (const [id, state] of Object.entries(states)) {
    await applyFixationFilter(fixationFilterSettings, id, state, mainWindow)
  }

  // notify client on completion
  const msg = 'fixation filter completed'
  const sucess = true
  mainWindow.webContents.send('completeFixationFilterListener', msg, sucess)
}

async function applyFixationFilter(
  fixationFilterSettings,
  id,
  state,
  mainWindow
) {
  /// add the fixationFilterSettings to state
  state.processedGazeData.fixationFilterData = fixationFilterSettings

  const partialCommunicationUriToRerver =
    globalParameters.COMMUNICATION_HOST_TO_R_SERVER +
    ':' +
    globalParameters.R_PORT
  var params = {}

  params.xScreenDim = state.processedGazeData.xScreenDim
  params.yScreenDim = state.processedGazeData.yScreenDim
  params.screenDistance = state.processedGazeData.screenDistance
  params.monitorSize = state.processedGazeData.monitorSize
  params.areGazesCorrected = state.processedGazeData.areGazesCorrected
  params.fixationFilterData = state.processedGazeData.fixationFilterData

  /// SetParamData request
  mainWindow.webContents.send(
    'updateProcessingMessage',
    'Processing ' + id + '... <br><br> Sending fixation filter parameters.',
    ''
  )

  var message = { params: params }
  var communication = {
    method: globalParameters.COMMUNICATION_METHOD_TO_R_SERVER,
    uri: partialCommunicationUriToRerver + '/SetParamData',
    body: message,
    json: true,
  }
  await request(communication)

  // OpenDataTransfer request
  mainWindow.webContents.send(
    'updateProcessingMessage',
    'Processing ' +
      id +
      '... <br><br> Initiating the transfer of the data to the server.',
    ''
  )

  communication = {
    method: globalParameters.COMMUNICATION_METHOD_TO_R_SERVER,
    uri: partialCommunicationUriToRerver + '/OpenDataTransferETR',
    body: null,
    json: true,
  }
  await request(communication)

  /// send gaze data in folds
  mainWindow.webContents.send(
    'updateProcessingMessage',
    'Processing ' + id + '... <br><br> Sending the data to the server',
    ''
  )

  for (
    let i = 0;
    i < state.processedGazeData.gazeData.length;
    i = i + globalParameters.DATA_FRAGMENT_SIZE
  ) {
    const dataFragment = state.processedGazeData.gazeData.slice(
      i,
      i + globalParameters.DATA_FRAGMENT_SIZE
    )
    message = { dataFragment: dataFragment }
    communication = {
      method: globalParameters.COMMUNICATION_METHOD_TO_R_SERVER,
      uri: partialCommunicationUriToRerver + '/TransferDataFragmentETR',
      body: message,
      json: true,
    }
    await request(communication)
    mainWindow.webContents.send(
      'updateProcessingMessage',
      'Processing ' +
        id +
        '... <br><br> Sending the data to the server: ' +
        calculateProgress(i, state.processedGazeData.gazeData.length - 1) +
        '% complete.',
      ''
    )
  }

  // apply fixation filter
  mainWindow.webContents.send(
    'updateProcessingMessage',
    'Processing ' +
      id +
      '... <br><br> Applying the fixation filter. This operation can take several minutes.',
    ''
  )
  communication = {
    method: globalParameters.COMMUNICATION_METHOD_TO_R_SERVER,
    uri: partialCommunicationUriToRerver + '/ApplyFilter',
    body: null,
  }

  await request(communication)

  // OpenDataTransferRTE request
  mainWindow.webContents.send(
    'updateProcessingMessage',
    'Processing ' + id + '... <br><br> Transfering data to the client.',
    ''
  )

  communication = {
    method: globalParameters.COMMUNICATION_METHOD_TO_R_SERVER,
    uri: partialCommunicationUriToRerver + '/OpenDataTransferRTE',
    body: null,
    json: true,
  }

  const response = await request(communication)

  const fullFixationFilterOutput = []
  const dataSize = response[0]

  /// receive data in folds
  for (let i = 0; i < dataSize; i = i + globalParameters.DATA_FRAGMENT_SIZE) {
    const start = i
    const end =
      start + globalParameters.DATA_FRAGMENT_SIZE <= dataSize
        ? start + globalParameters.DATA_FRAGMENT_SIZE
        : dataSize

    const req = { start: start, end: end }
    const com = {
      method: globalParameters.COMMUNICATION_METHOD_TO_R_SERVER,
      uri: partialCommunicationUriToRerver + '/TransferDataFragmentRTE',
      body: req,
      json: true,
    }

    const res = await request(com)

    // add res to fullFixationFilterOutput
    fullFixationFilterOutput.push.apply(fullFixationFilterOutput, res)

    mainWindow.webContents.send(
      'updateProcessingMessage',
      'Processing ' +
        id +
        '... <br><br> Transfering data to the client: ' +
        calculateProgress(i, dataSize - 1) +
        '% complete.',
      ''
    )
  }

  //console.log("fullFixationFilterOutput",fullFixationFilterOutput);

  // integrate the data in state.processedGazeData

  // Note: the saccade data is generated by the R server, but not used for now
  /// state.processedGazeData.fullFixationFilterOutput = fullFixationFilterOutput // optional

  state.processedGazeData.fixationData = summerizedFixationLog(
    fullFixationFilterOutput,
    state.processedGazeData.fixationFilterData.fixationMappingHandling,
    state.processedGazeData.areGazesCorrected
  )
  state.processedGazeData.fixationFilterData.status = 'complete'
}

exports.fixationFilter = fixationFilter
