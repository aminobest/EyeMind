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

const { DataFrame } = require('dataframe-js')
const fs = require('fs')
const path = require('path')
const bfj = require('bfj')
const { globalParameters } = require('../../../../globals.js')
const { getState, getStates } = require('../dataModels/state')
const { parseOriginalFileName } = require('../utils/utils')

async function stateDownload(fileName, includeTimeStampInFileName, type) {
  //console.log("stateDownload function",arguments);

  const fileExtension =
    type == 'analysis-data' ||
    type == 'collected-data' ||
    type == 'session-data'
      ? 'json'
      : 'csv'
  const timestamp = Date.now()

  return await downloadFile(
    fileName,
    type,
    fileExtension,
    includeTimeStampInFileName,
    timestamp
  )
}

async function downloadFile(
  fileName,
  type,
  fileExtension,
  includeTimeStampInFileName,
  timestamp
) {
  //console.log("downloadFile function",arguments);

  const res = {}

  if (type == 'collected-data' || type == 'session-data') {
    const savingPath =
      globalParameters.SAVING_PATH +
      '/' +
      globalParameters.EXPORT_FILES_PREFIX +
      (includeTimeStampInFileName ? fileName + '_' + timestamp : fileName) +
      '_' +
      type +
      '.' +
      fileExtension
    const state = getState()

    // create file
    fs.closeSync(fs.openSync(savingPath, 'w'))

    // populate json to file using bfj
    try {
      await bfj.write(savingPath, state)
      const msg = 'File exported to ' + savingPath
      res.msg = msg
      res.sucess = true
    } catch (error) {
      const msg = 'An error occured while exporting the data' + error
      console.error(msg)
      res.msg = msg
      res.sucess = false
    }
  } else if (type == 'analysis-data') {
    const states = getStates()

    const savingDir = globalParameters.SAVING_PATH + '/analysis_' + timestamp
    //create savingDir directory
    fs.mkdirSync(savingDir)

    var error = false
    var errorDetails = {}

    for (const [key, state] of Object.entries(states)) {
      const originalFilename = parseOriginalFileName(key)
      const savingPath =
        savingDir + '/' + originalFilename + '.' + fileExtension

      // create file
      fs.closeSync(fs.openSync(savingPath, 'w'))

      // populate json to file using bfj
      try {
        await bfj.write(savingPath, state)
      } catch (error) {
        error = true
        errorDetails[originalFilename] = error
      }
    }

    if (!error) {
      const msg = 'Files exported to ' + savingDir
      res.msg = msg
      res.sucess = true
    } else {
      const msg =
        'An error occured while exporting the files. See the console for details'
      console.error('errorDetails ', errorDetails)
      res.msg = msg
      res.sucess = false
    }
  } else if (type == 'gaze-data') {
    //const savingPath = globalParameters.SAVING_PATH+"/"+globalParameters.EXPORT_FILES_PREFIX + (includeTimeStampInFileName? fileName+"_"+timestamp : fileName) + "_"+type+"."+fileExtension;

    var error = false
    var errorDetails = {}

    const states = getStates()

    const savingDir = globalParameters.SAVING_PATH + '/gazeData_' + timestamp
    //create savingDir directory
    fs.mkdirSync(savingDir)

    for (const [key, state] of Object.entries(states)) {
      const originalFilename = parseOriginalFileName(key)
      const savingPath =
        savingDir + '/gazeData_' + originalFilename + '.' + fileExtension

      const participantID = state.processedGazeData.participantID

      var dataframeForState = new DataFrame(state.processedGazeData.gazeData)
      dataframeForState = dataframeForState.withColumn(
        'participantID',
        () => participantID
      )
      dataframeForState = dataframeForState.withColumn('file', () => key)

      console.log('saving ', savingPath)
      try {
        dataframeForState.toCSV(true, savingPath)
      } catch (error) {
        error = true
        errorDetails[originalFilename] = error
      }
    }

    if (!error) {
      const msg = 'Files exported to ' + savingDir
      res.msg = msg
      res.sucess = true
    } else {
      const msg =
        'An error occured while exporting the files. See the console for details'
      console.error('errorDetails ', errorDetails)
      res.msg = msg
      res.sucess = false
    }
  } else if (type == 'fixation-data') {
    const savingPath =
      globalParameters.SAVING_PATH +
      '/' +
      globalParameters.EXPORT_FILES_PREFIX +
      (includeTimeStampInFileName ? fileName + '_' + timestamp : fileName) +
      '_' +
      type +
      '.' +
      fileExtension

    const states = getStates()

    var dataframe = null

    var error = false
    var errorDetails = {}

    for (const [key, state] of Object.entries(states)) {
      const participantID = state.processedGazeData.participantID

      if (state.processedGazeData.fixationData != null) {
        var dataframeForState = new DataFrame(
          state.processedGazeData.fixationData
        )
        dataframeForState = dataframeForState.withColumn(
          'participantID',
          () => participantID
        )
        dataframeForState = dataframeForState.withColumn('file', () => key)

        dataframe =
          dataframe != null
            ? dataframe.union(dataframeForState)
            : dataframeForState
      } else {
        error = true
        errorDetails[key] = error
      }
    }

    if (!error) {
      try {
        dataframe.toCSV(true, savingPath)
        const msg = 'File exported to ' + savingPath
        res.msg = msg
        res.sucess = true
      } catch (error) {
        const msg = 'An error occured while exporting the data' + error
        console.error(msg)
        res.msg = msg
        res.sucess = false
      }
    } else {
      const msg =
        'Some files do not have fixation data. Please use the fixation filter to generate it. See the console for details'
      console.error('errorDetails ', errorDetails)
      res.msg = msg
      res.sucess = false
    }
  }

  console.log('res', res)
  return res
}

exports.stateDownload = stateDownload
