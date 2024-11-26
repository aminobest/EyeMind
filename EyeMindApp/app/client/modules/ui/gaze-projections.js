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

import { enableHeatmapOption, disableHeatmapOption } from './heatmap.js'
import { mapGazetoElementsFromSvgSnapshot } from './mapping'
import { calculateProgress } from '../utils/utils'
import {
  showGeneralWaitingScreen,
  hideGeneralWaitingScreen,
  updateProcessingMessage,
} from './progress'
import { infoAlert, errorAlert } from '../utils/utils'
import {
  SetProjectionAndMappingActive,
  areProjectionAndMappingActive,
} from '../dataModels/activeFeatures'
import { setSnapshots, getSnapshots } from '../dataModels/snapshots'
import {
  hideElement,
  displayElement,
  populateParticipantFileSelect,
  updateShownUserConfig,
} from '../utils/dom'

async function projectionInteraction() {
  // console.log("projectionInteraction function",arguments);

  // populate participant file select
  await populateParticipantFileSelect('participant-file-gaze-projection')

  // toggling mechanism of projectionAndMapping
  if (areProjectionAndMappingActive()) {
    // clear projections
    await showGeneralWaitingScreen(
      'Clearing the gaze projections',
      'wait',
      'all-content'
    )

    await clearProjections()

    await hideGeneralWaitingScreen('all-content', 'wait')

    hideElement('user-configuration')
  } else {
    document.getElementById('close-gaze-projection').onclick =
      closeProjectionSettingsInteraction
    document.getElementById('submit-gaze-projection-form').onclick = () =>
      applyProjectionSettings()
    displayElement('gaze-projection-modal', 'block')
    infoAlert(
      'For correct gaze corrections, make sure to set the same screen dimension as the one used for the data collection'
    )
  }
}

function closeProjectionSettingsInteraction() {
  // console.log("closeDownloadSettingsInteraction function",arguments);

  hideElement('gaze-projection-modal')
}

async function applyProjectionSettings() {
  console.log('applyProjectionSettings', arguments)

  var samplingRatio = document.getElementById(
    'gaze-sample-size-in-percentage'
  ).value
  const stateFile = document.getElementById(
    'participant-file-gaze-projection'
  ).value
  console.log('stateFile', stateFile)
  const stateFileLabel = document.getElementById(
    'participant-file-gaze-projection'
  ).options[
    document.getElementById('participant-file-gaze-projection').selectedIndex
  ].text

  if (isNaN(samplingRatio) || stateFile == '') {
    errorAlert('missing/incorrect input fields')
    return false
  }

  if (await window.state.areAreGazesCorrectedOfState(stateFile)) {
    infoAlert(
      'A gaze-correction for this participant/file already exist.\nIMPORTANT NOTE: The gaze projections and corrections will be applied on the raw data and not the corrected one'
    )
  }

  samplingRatio = parseFloat(samplingRatio) / 100

  // set user config to display
  const userConfig = {
    'Sampling Ratio': samplingRatio,
    'Participant/file': stateFileLabel,
  }

  // update shown user config
  updateShownUserConfig(userConfig)

  // select random gaze sequence to consider for the projections
  const randomGazeSet = await window.analysis.getRandomGazeSet(
    samplingRatio,
    stateFile
  )

  console.log('randomGazeSet', randomGazeSet)

  // get snapshots
  const snapshots = await window.state.getSnapshotsOfState(stateFile)

  // generate projections
  await showGeneralWaitingScreen(
    'Generating gaze projections',
    'wait',
    'all-content'
  )

  // set state.projectionAndMappingActive to true
  SetProjectionAndMappingActive(true)

  document.getElementById('feature-text').innerText =
    'Gaze Projections and Mapping'
  disableHeatmapOption()
  hideModels()

  /// provide the sample to her -- new parameters
  const gazeProjections = await generateGazeProjection(
    randomGazeSet,
    snapshots,
    0,
    0,
    samplingRatio
  )

  // corrections interactions
  correctionsInteractions(
    randomGazeSet,
    snapshots,
    samplingRatio,
    stateFile,
    userConfig
  )

  generateProjectionsContainers(gazeProjections, null, null)

  displayElement('user-configuration', 'block')
  displayElement('gaze-correction', 'block')

  await hideGeneralWaitingScreen('all-content', 'wait')
  closeProjectionSettingsInteraction()
}

async function clearProjections() {
  SetProjectionAndMappingActive(false)
  document.getElementById('feature-text').innerText = ''
  hideElement('gaze-correction')
  removeOldProjections()
  showModels()
  enableHeatmapOption()
}

function correctionsInteractions(
  randomGazeSet,
  snapshots,
  samplingRatio,
  stateFile,
  userConfig
) {
  // correction
  document.getElementById('apply-correction-offset').disabled = true
  document.getElementById('update-correction-offset').onclick = () => {
    updateCorrectionOffsetInteraction(
      randomGazeSet,
      snapshots,
      samplingRatio,
      userConfig
    )
  }
  document.getElementById('apply-correction-offset').onclick = () => {
    applyCorrectionOffsetInteraction(snapshots, stateFile)
  }
}

function clearGazeCorrectionOffset() {
  document.getElementById('gaze-correction-x-offset-model').value = ''
  document.getElementById('gaze-correction-y-offset-model').value = ''
}

async function updateCorrectionOffsetInteraction(
  randomGazeSet,
  snapshots,
  samplingRatio,
  userConfig
) {
  // console.log("updateCorrectionOffsetInteraction function",arguments);

  // parse input fields to float
  const xOffset = parseFloat(
    document.getElementById('gaze-correction-x-offset-model').value
  )
  const yOffset = parseFloat(
    document.getElementById('gaze-correction-y-offset-model').value
  )
  // console.log("xOffset ",xOffset, "yOffset ", yOffset);

  // add more info to userConfig
  userConfig['X offset'] = xOffset
  userConfig['Y offset'] = yOffset

  // update shown userConfig
  updateShownUserConfig(userConfig)

  clearGazeCorrectionOffset()

  // if xOffset and yOffset are not NaN
  if (!isNaN(xOffset) && !isNaN(yOffset)) {
    await showGeneralWaitingScreen(
      'Updating gaze projections using the given offset.',
      'wait',
      'all-content'
    )

    // generate new gaze projection
    // const gazeProjections = await generateGazeProjection(state.processedGazeData.gazeData,state.snapshots,xOffset,yOffset,samplingRatio);
    const gazeProjections = await generateGazeProjection(
      randomGazeSet,
      snapshots,
      xOffset,
      yOffset,
      samplingRatio
    )

    // remove old projections from the UI
    removeOldProjections()

    // generate new projections containers
    generateProjectionsContainers(gazeProjections, xOffset, yOffset)

    /// enable the user to apply the correct offset
    document.getElementById('apply-correction-offset').disabled = false

    await hideGeneralWaitingScreen('all-content', 'wait')
  } else {
    errorAlert('Please provide a valid value for both x offset and y offset.')
    document.getElementById('apply-correction-offset').disabled = true
  }
}

async function applyCorrectionOffsetInteraction(snapshots, stateFile) {
  console.log('applyCorrectionOffsetInteraction', arguments)

  const xOffset = parseFloat(
    document.getElementById('gaze-correction-x-offset-model').value
  )
  const yOffset = parseFloat(
    document.getElementById('gaze-correction-y-offset-model').value
  )

  if (Number.isInteger(xOffset) && Number.isInteger(yOffset)) {
    await initiateOffsetCorrection(snapshots, xOffset, yOffset, stateFile)
    clearGazeCorrectionOffset()
  } else {
    errorAlert('Please provide a valid value for both x offset and y offset.')
  }
}

function hideModels() {
  const tabContainers = document.querySelectorAll('.tab-container')

  for (const tabContainer of tabContainers) {
    const tabContent = tabContainer.querySelector('.model-content[filename]')
    tabContent.style.display = 'none'
  }
}

function showModels() {
  const tabContainers = document.querySelectorAll('.tab-container')

  for (const tabContainer of tabContainers) {
    const tabContent = tabContainer.querySelector('.model-content[filename]')
    tabContent.style.display = 'block'
  }
}

function generateProjectionsContainers(gazeProjections, xOffset, yOffset) {
  // console.log("generateProjections function",arguments);

  const tabContainers = document.querySelectorAll('.tab-container')

  // foreach tabContainer
  for (const tabContainer of tabContainers) {
    const tabContent = tabContainer.querySelector('.model-content[filename]')

    const fileName = tabContent.getAttribute('filename')
    const fileId = fileName.replace(
      new RegExp(window.globalParameters.MODELS_ID_REGEX, 'g'),
      ''
    )

    // create projectionsContainer
    var projectionsContainer = document.createElement('div')
    projectionsContainer.setAttribute(
      'id',
      'model' + fileId + '-projections-container'
    )
    projectionsContainer.setAttribute('class', 'projections-container')

    // find the tabContentHolder and append the projectionsContainer to it
    const tabContentHolder = tabContainer.querySelector(
      "[id='model" + fileId + "-content-holder']"
    )
    tabContentHolder.appendChild(projectionsContainer)

    // if the tab has gazes (i.e., gazeProjections.hasOwnProperty(fileId))
    if (gazeProjections.hasOwnProperty(fileId)) {
      populateProjectionsContainers(
        null,
        -1,
        gazeProjections[fileId],
        fileId,
        projectionsContainer
      ) // preview view
      gazeProjections[fileId].forEach((svg, i, svgs) =>
        populateProjectionsContainers(
          svg,
          i,
          svgs,
          fileId,
          projectionsContainer
        )
      ) // views with remaining snapshots
    }
  }
}

function removeOldProjections() {
  // console.log("removeOldProjections", arguments);

  const projectionContainers = document.querySelectorAll(
    '.projections-container'
  )

  // console.log("projectionContainers", projectionContainers);

  for (let i = 0; i < projectionContainers.length; i++) {
    // console.log("remove", projectionContainers[i]);
    projectionContainers[i].remove()
  }
}

function populateProjectionsContainers(
  svg,
  i,
  svgs,
  fileId,
  projectionsContainer
) {
  // console.log("populateProjectionsContainers function",arguments);

  // create projectedSnapshot and append it to projectionsContainer
  var projectedSnapshot = document.createElement('div')
  projectedSnapshot.setAttribute(
    'id',
    'model' + fileId + '-projected-model-snapshot' + i
  )
  projectedSnapshot.setAttribute('class', 'projected-snapshot')
  projectionsContainer.appendChild(projectedSnapshot)

  // i-1 corresponds to the preview view
  if (i == -1) projectedSnapshot.style.display = 'block'

  // create snapshotsNagivation
  var snapshotsNagivation = document.createElement('div')
  snapshotsNagivation.setAttribute(
    'id',
    'model' + fileId + '-snapshots-navigation'
  )
  snapshotsNagivation.setAttribute('class', 'snapshots-navigation')
  projectedSnapshot.appendChild(snapshotsNagivation)

  if (svg != null) {
    // create snapshot
    var snapshot = document.createElement('div')
    snapshot.setAttribute('id', 'model' + fileId + '-snapshot' + i)
    snapshot.setAttribute('class', 'snapshot')

    // set width and height
    const width = svg.area.width
    const height = svg.area.height

    snapshot.style.width = width + 'px'
    snapshot.style.height = height + 'px'

    // append svg.code to snapshot
    snapshot.appendChild(svg.code)

    // append snapshot to projectedSnapshot
    projectedSnapshot.appendChild(snapshot)
  }

  // previous and next buttons
  if (i != -1) {
    snapshotsNagivation.innerHTML =
      "<button id='model" +
      fileId +
      '-snapshots-navigation-prev-btn-snapshot' +
      i +
      "' class='btn'>Previous snapshot</button><button id='model" +
      fileId +
      '-snapshots-navigation-next-btn-snapshot' +
      i +
      "' class='btn'>Next snapshot</button>"

    // disaling and enabling of previous and next buttons
    document.getElementById(
      'model' + fileId + '-snapshots-navigation-prev-btn-snapshot' + i
    ).disabled = i > 0 ? false : true
    document.getElementById(
      'model' + fileId + '-snapshots-navigation-next-btn-snapshot' + i
    ).disabled = i < svgs.length - 1 ? false : true

    document.getElementById(
      'model' + fileId + '-snapshots-navigation-prev-btn-snapshot' + i
    ).onclick = () => {
      moveToSnapshot(i, i - 1, fileId)
    }
    document.getElementById(
      'model' + fileId + '-snapshots-navigation-next-btn-snapshot' + i
    ).onclick = () => {
      moveToSnapshot(i, i + 1, fileId)
    }
  } else {
    snapshotsNagivation.innerHTML =
      "<button id='model" +
      fileId +
      "-snapshots-navigation-preview-btn-snapshot' class='btn'>Preview snapshots</button>"
    document.getElementById(
      'model' + fileId + '-snapshots-navigation-preview-btn-snapshot'
    ).onclick = () => {
      moveToSnapshot(i, i + 1, fileId)
    }
  }
}

function moveToSnapshot(curentSnapshotId, nextSnapshotId, fileId) {
  // console.log("moveToSnapshot function", arguments);

  hideElement('model' + fileId + '-projected-model-snapshot' + curentSnapshotId)
  displayElement(
    'model' + fileId + '-projected-model-snapshot' + nextSnapshotId,
    'block'
  )
}

async function generateGazeProjection(
  gazeData,
  snapshots,
  xOffset,
  yOffset,
  samplingRatio
) {
  console.log('generateGazeProjection', arguments)

  var snapshotCode = ''
  var snapshotId = -1
  var tabName = ''
  var tabId = ''
  var snapshotCodes = {}
  var svgModel = {}

  const startSequence = 0
  const endSequence = gazeData.length

  // for each gazePoint
  for (let k = startSequence; k < endSequence; k++) {
    const gazePoint = gazeData[k]

    //console.log("gazePoint",gazePoint)

    if (gazePoint.eventSource == 'eye-tracker') {
      const snapshot = snapshots[gazePoint.snapshotId]

      //console.log(snapshot.boundingClientRect, snapshot.boundingClientRect!=null, !isNaN(snapshot.id));

      if (!isNaN(snapshot.id) && snapshot.boundingClientRect != null) {
        const boundingClientRect = JSON.parse(snapshot.boundingClientRect)

        if (snapshot.id != snapshotId) {
          //console.log("new snapshot ",snapshot.id);
          //console.log("snapshot.boundingClientRect",snapshot.boundingClientRect);

          // update snapshotId
          snapshotId = snapshot.id

          // retreive tabName and derive tabId
          tabName = snapshot.tabName
          tabId = tabName.replace(
            new RegExp(window.globalParameters.MODELS_ID_REGEX, 'g'),
            ''
          )

          // console.log("tabName",tabName);

          // derive snapshotCode as a DOM element
          snapshotCode = createDocument(snapshot.code, '')

          // derive svgModel data
          svgModel = {}
          svgModel.code = snapshotCode.querySelector(
            "[filename='" + tabName + "'].main-model svg[data-element-id]"
          )
          svgModel.area = boundingClientRect

          console.log('svgModel.area', svgModel.area)

          /// push to snapshotCodes[tabId]
          if (snapshotCodes[tabId] == null) {
            snapshotCodes[tabId] = [svgModel]
          } else {
            snapshotCodes[tabId].push(svgModel)
          }
        }

        const relativeX =
          gazePoint.x - snapshot.screenX - boundingClientRect.left + xOffset
        const relativeY =
          gazePoint.y - snapshot.screenY - boundingClientRect.top + yOffset

        // show only the gazes that landed on the model
        if (relativeX > 0 && relativeY > 0) {
          var svgns = 'http://www.w3.org/2000/svg'
          var circle = document.createElementNS(svgns, 'circle')
          circle.setAttributeNS(null, 'cx', relativeX)
          circle.setAttributeNS(null, 'cy', relativeY)
          circle.setAttributeNS(null, 'r', 1)
          circle.setAttributeNS(null, 'style', 'fill: red;')

          svgModel.code.appendChild(circle)
        }
      }
    }

    if (k % window.globalParameters.REPORT_FREQUENCY == 0) {
      await updateProcessingMessage(
        'Projections on ' +
          tabName +
          ': ' +
          calculateProgress(k - startSequence, endSequence - startSequence) +
          '% complete',
        document
      )
    }
  }

  // // console.log("snapshotCodes",snapshotCodes);
  return snapshotCodes
}

async function initiateOffsetCorrection(
  snapshots,
  xOffset,
  yOffset,
  stateFile
) {
  console.log('initiateOffsetCorrection', arguments)

  const styleParameters =
    await window.state.getStyleParametersOfState(stateFile)
  console.log('styleParameters', styleParameters)

  // find max dimension of svgs in the snapshots
  const maxArea = deriveMaxSnapshotDimension(snapshots)
  // console.log("maxArea",maxArea);

  // open new window when the redering of svg will occur to enable the application of offset correction
  var wnd = window.open(
    'about:blank',
    '',
    '_blank, width=' +
      (maxArea.width + window.globalParameters.AREA_OFFSET) +
      ', height=' +
      (maxArea.height + window.globalParameters.AREA_OFFSET) +
      ', directories=no,titlebar=no,toolbar=no,location=no,status=no,menubar=no,scrollbars=no,resizable=no'
  )

  // set initial body
  wnd.document.body.innerHTML =
    "<div class='centered-content'><button id='startCorrection' class='start-correction-btn'>Start</button><span class='start-correction-text'>Do not close or resize this window!</span></div>"

  // load style data
  wnd.document.head.innerHTML = '<style>' + styleParameters + '</style>'

  // set the margin and padding of wnd.document.body to 0 for an exact mapping
  wnd.document.body.style.margin = 0
  wnd.document.body.style.padding = 0

  // save to window
  if (!window.hasOwnProperty('externalMappingWindows'))
    window.externalMappingWindows = {}
  const externalMappingWindow = 'Window' + Date.now()
  window.externalMappingWindows[externalMappingWindow] = wnd

  // intiate snapshotId
  var snapshotId = -1

  // startCorrection onclick
  wnd.document.getElementById('startCorrection').onclick = async () => {
    // show waiting screen
    await showGeneralWaitingScreen(
      'Applying the correction offset to the whole gaze data',
      'wait',
      'all-content'
    )
    // hide button
    wnd.document.getElementById('startCorrection').style.display = 'none'
    // apply correctionOffset
    window.analysis.applyCorrectionOffset(
      externalMappingWindow,
      stateFile,
      snapshotId,
      xOffset,
      yOffset
    )
  }
}

function applyCorrectionOnGazeFragmentListener() {
  window.analysis.onApplyCorrectionOnGazeFragment(function (args) {
    console.log('onApplyCorrectionOnGazeFragment', arguments)
    var stateFile = args[0]
    var gazeDataFragment = args[1]
    const start = args[2]
    const gazeDataSize = args[3]
    const externalMappingWindow = args[4]
    var snapshotId = args[5]
    const snapshots = args[6]
    const xOffset = args[7]
    const yOffset = args[8]

    if (snapshots != null) {
      console.log('snapshots set')
      setSnapshots(snapshots)
    }

    const correctionOutput = applyCorrectionOnGazeFragment(
      gazeDataFragment,
      start,
      gazeDataSize,
      externalMappingWindow,
      snapshotId,
      xOffset,
      yOffset
    )

    gazeDataFragment = correctionOutput['gazeDataFragment']
    snapshotId = correctionOutput['snapshotId']

    window.analysis.gazeDataFragmentMapped(
      stateFile,
      gazeDataFragment,
      start,
      gazeDataSize,
      externalMappingWindow,
      snapshotId,
      xOffset,
      yOffset
    )
  })
}

function applyCorrectionOnGazeFragment(
  gazeDataFragment,
  start,
  gazeDataSize,
  externalMappingWindow,
  snapshotId,
  xOffset,
  yOffset
) {
  // console.log("applyCorrectionOnGazeFragment",arguments);

  const wnd = window.externalMappingWindows[externalMappingWindow]

  const snapshots = getSnapshots()

  // initiate a counter to report the number of mapping disparities
  //var diffCounter = 1;

  /*  to be aligned
  /// number of gazepoints for progress report
    const numberOfGazePoints =  Object.values(processedGazeData.gazeData).length;*/

  // for each gazepoint
  for (const [i, gazePoint] of Object.values(gazeDataFragment).entries()) {
    if (gazePoint.eventSource == 'eye-tracker') {
      // get corresponding snapshot
      const snapshot = snapshots[gazePoint.snapshotId]
      const boundingClientRect = JSON.parse(snapshot.boundingClientRect)

      if (!isNaN(snapshot.id)) {
        // new snapshot?
        if (snapshot.id != snapshotId) {
          // console.log("new snapshot loaded", snapshot.id, snapshot.tabName, snapshot.boundingClientRect);
          // update snapshotId
          snapshotId = snapshot.id
          // snapshotSvg object
          var snapshotSvg =
            snapshot.code != null
              ? createDocument(snapshot.code, '').querySelector(
                  "[filename='" +
                    snapshot.tabName +
                    "'].main-model svg[data-element-id]"
                )
              : null
          /// display
          snapshotSvg =
            snapshotSvg != null
              ? "<div style='padding:0px;margin:0px;width:" +
                boundingClientRect.width +
                'px;height:' +
                boundingClientRect.height +
                "px'>" +
                snapshotSvg.outerHTML +
                '</div>'
              : ''
          wnd.document.body.innerHTML = snapshotSvg
        }

        /// add new correction attributes

        gazePoint['leftX-correction'] = gazePoint.leftX != null ? xOffset : null
        gazePoint['leftX-corrected'] =
          gazePoint.leftX != null ? gazePoint.leftX + xOffset : null

        gazePoint['rightX-correction'] =
          gazePoint.rightX != null ? xOffset : null
        gazePoint['rightX-corrected'] =
          gazePoint.rightX != null ? gazePoint.rightX + xOffset : null

        gazePoint['leftY-correction'] = gazePoint.leftY != null ? yOffset : null
        gazePoint['leftY-corrected'] =
          gazePoint.leftY != null ? gazePoint.leftY + yOffset : null

        gazePoint['rightY-correction'] =
          gazePoint.rightY != null ? yOffset : null
        gazePoint['rightY-corrected'] =
          gazePoint.rightY != null ? gazePoint.rightY + yOffset : null

        gazePoint['x-correction'] = gazePoint.x != null ? xOffset : null
        gazePoint['x-corrected'] =
          gazePoint.x != null ? gazePoint.x + xOffset : null

        gazePoint['y-correction'] = gazePoint.y != null ? yOffset : null
        gazePoint['y-corrected'] =
          gazePoint.y != null ? gazePoint.y + yOffset : null

        // if there is a correction and the snapshot is valid
        if (
          gazePoint['x-corrected'] != null &&
          gazePoint['y-corrected'] != null &&
          boundingClientRect != null
        ) {
          const rX = gazePoint['x-corrected'] - boundingClientRect.left
          const rY = gazePoint['y-corrected'] - boundingClientRect.top

          // do mapping
          gazePoint['element-with-correction'] =
            mapGazetoElementsFromSvgSnapshot(
              rX,
              rY,
              wnd.document,
              snapshot.screenX,
              snapshot.screenY
            )
        } else {
          // set gazePoint["element-with-correction"] to ""
          gazePoint['element-with-correction'] = ''
        }

        // if the new mapping is different from the old one
        /*      if(gazePoint["element-with-correction"]!=gazePoint["element"]) {

            const rX = gazePoint["x-corrected"] - snapshot.boundingClientRect.left;
            const rY = gazePoint["y-corrected"] - snapshot.boundingClientRect.top;


            // console.log(diffCounter,"mapping difference",rX,rY, gazePoint);

            diffCounter += 1;
          }*/
      }
    }
  }

  return { gazeDataFragment: gazeDataFragment, snapshotId: snapshotId }
}

function applyingCorrectionsCompletedListener() {
  window.analysis.onCompleteCorrectionListener(async function (args) {
    console.log('onCompleteCorrectionListener', arguments)
    const externalMappingWindow = args[0]
    const stateFile = args[1]
    await applyingCorrectionsCompleted(externalMappingWindow, stateFile)
  })
}

async function applyingCorrectionsCompleted(externalMappingWindow, stateFile) {
  const wnd = window.externalMappingWindows[externalMappingWindow]

  // close the rendering window
  wnd.close()

  // set processedGazeData.gazesCorrected flag to true
  await window.state.setAreGazesCorrectedOfState(stateFile, true)

  // hide waiting screen
  await hideGeneralWaitingScreen('all-content', 'wait')

  infoAlert(
    'correction offset applied to data. \nRemember to run the fixation filter again to consider the corrected data in your analysis (e.g., for fixation heatmaps and overlays).'
  )
}

function deriveMaxSnapshotDimension(snapshots) {
  // console.log("deriveMaxSnapshotDimension function",arguments);

  const maxArea = { width: 0, height: 0 }

  for (const snapshot of Object.values(snapshots)) {
    // // console.log("snapshot",snapshot);

    const area = JSON.parse(snapshot.boundingClientRect)
    if (area != null) {
      if (area.width > maxArea.width) {
        maxArea.width = area.width
      }
      if (area.height > maxArea.height) {
        maxArea.height = area.height
      }
    }
  }

  // console.log("maxArea",maxArea);
  return maxArea
}

function createDocument(html, title) {
  // console.log("createDocument function", arguments);

  var doc = document.implementation.createHTMLDocument(title)

  doc.body.innerHTML = html

  return doc
}

export {
  projectionInteraction,
  applyCorrectionOnGazeFragmentListener,
  applyingCorrectionsCompletedListener,
}
