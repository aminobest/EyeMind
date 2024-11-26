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

import { loadModels } from './shared-interactions.js'
import { clearHeatmap, enableHeatmapOption } from './heatmap'
import { calculateProgress } from '../utils/utils'
import { showGeneralWaitingScreen, hideGeneralWaitingScreen } from './progress'
import { infoAlert, errorAlert } from '../utils/utils'
import { hideElement, displayElement } from '../utils/dom'

const request = require('request-promise')
const { DataFrame } = require('dataframe-js')

async function applyFixationSettingsInteraction() {
  // console.log("applyFixationSettingsInteraction function",arguments);

  // show waiting screen
  await showGeneralWaitingScreen(
    'Please wait while the fixation filter is being applied...',
    'wait',
    'all-content'
  )

  // set params
  const fixationFilterSettings = {
    status: 'init',
    algorithm: 'IVT',
    isInterpolation: document.getElementById('is-interpolation').checked,
    maxGapLength: document.getElementById('max-gap-length').value,
    isNoiceReduction: document.getElementById('is-noice-reduction').checked,
    noiseReductionMethod: document.getElementById('noise-reduction-method')
      .value,
    windowSize: document.getElementById('window-size').value,
    windowLength: document.getElementById('window-length').value,
    velocityThreshold: document.getElementById('Velocity-threshold').value,
    isDiscardShortFixations: document.getElementById(
      'is-discard-short-fixations'
    ).checked,
    minimumFixationDuration: document.getElementById(
      'minimum-fixation-duration'
    ).value,
    isMergeAdjacentFixations: document.getElementById(
      'is-merge-adjacent-fixations'
    ).checked,
    maximumTimeBetweenFixations: document.getElementById(
      'maximum-time-between-fixations'
    ).value,
    maximumAngleBetweenFixations: document.getElementById(
      'maximum-angle-between-fixations'
    ).value,
    fixationMappingHandling: document.getElementById(
      'fixation-mapping-handling'
    ).value,
  }

  window.Rserver.fixationFilter(fixationFilterSettings)
}

function FixationFilterCompletedProcessingListener() {
  window.Rserver.onCompleteFixationFilterListener(async function (args) {
    console.log('completeFixationFilterListener', arguments)
    const msg = args[0]
    const sucess = args[1]
    await completeProcessing(msg, sucess)
  })
}

async function completeProcessing(msg, sucess) {
  //// to implement: error handling
  console.log(msg, sucess)

  if (sucess) {
    // clearing the heatmap
    clearHeatmap()

    // enabling the heatmap settings
    enableHeatmapOption()

    /// hide waiting view
    await hideGeneralWaitingScreen('all-content', 'wait')

    /// proceed by hiding fixation-settings-view and displaying loaded-content-view
    displayElement('loaded-content-view', 'flex')
    hideElement('fixation-settings-view')
  } else {
    errorAlert(msg)
    await hideGeneralWaitingScreen('all-content', 'wait')
  }
}

async function loadETSettingsView() {
  console.log('loadETSettingsView', arguments)

  /// move to fixation-settings-view
  hideElement('loaded-content-view')
  displayElement('fixation-settings-view', 'flex')

  // console.log("state by the end of loadETSettingsView function",state);

  document.getElementById('submit-apply-fixation-settings-form').onclick =
    () => {
      applyFixationSettingsInteraction()
    }

  // handle the activation/deactivation of the different sections within fixation-settings-view
  handleFixationSettingSections()

  document.getElementById('close-fixation-settings-projection').onclick =
    () => {
      closeFixationSettings()
    }
}

async function closeFixationSettings() {
  console.log('closeFixationSettings', arguments)
  hideElement('fixation-settings-view')
  displayElement('loaded-content-view', 'flex')
}

function handleFixationSettingSections() {
  // console.log("handleFixationSettingSections function", arguments);

  const sections = [
    'is-interpolation',
    'is-noice-reduction',
    'is-discard-short-fixations',
    'is-merge-adjacent-fixations',
  ]

  sections.forEach((section) => {
    document.getElementById(section).onclick = () => {
      var fields = document.getElementsByClassName(section)

      Array.prototype.forEach.call(fields, function (field) {
        field.disabled = !field.disabled
      })
    }
  })
}

export { loadETSettingsView, FixationFilterCompletedProcessingListener }
