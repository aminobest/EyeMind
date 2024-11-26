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

/*  Shared interactions between data collection and anaylsis  */

import { eyeTrackingModeInteraction } from './data-collection'
import { analysisModeInteraction } from './analysis'
import { infoAlert, errorAlert } from '../utils/utils'
import { getState } from '../dataModels/state'
import $ from 'jquery'

/**
 * Title: Mode selection listeners.
 *
 * Description: Definition of event listeners to guide the app control-flow depending on whether the user chooses the eye-tracking mode or the analysis mode
 *
 * Control-flow summary: event listeners associated to different buttons
 *
 * @param {void} . .
 *
 * Returns {void}
 *
 *
 *
 * Additional notes: none
 *
 */
function modeSelectionListeners() {
  console.log('modeSelectionListeners', arguments)

  document.getElementById('eye-tracking').onclick = () => {
    eyeTrackingModeInteraction()
  }
  document.getElementById('analysis').onclick = () => analysisModeInteraction()
}

/**
 * Title: load models
 *
 * Description:  load the models
 *
 * @param {void} . .
 *
 * Returns {void}
 *
 *
 * Additional notes: none
 *
 */
function loadModels() {
  console.log('loadModels', arguments)

  var state = getState()

  /// move to loaded-content-view
  document.getElementById('import-view').style.display = 'none'
  document.getElementById('loaded-content-view').style.display = 'flex'

  // display index-tab in data-collection mode
  if (state.mode == 'data-collection') {
    document.getElementById('index-tab').style.display = 'block'
  }

  /// set tab scroll button events
  const buttonRight = document.getElementById('to-tab-right')
  const buttonLeft = document.getElementById('to-tab-left')
  const scrollDistance = 20

  buttonRight.onclick = function () {
    document.getElementById('nav-tabs').scrollLeft += scrollDistance
  }
  buttonLeft.onclick = function () {
    document.getElementById('nav-tabs').scrollLeft -= scrollDistance
  }

  return true
}

/**
 * Title: close the modal with clicks outside the modal area
 *
 * Description:  close the modal with clicks outside the modal area
 *
 * @param {object} event click event
 *
 * Returns {void}
 *
 *
 * Additional notes: none
 *
 */
function closeModalOutsideClickInteraction(event) {
  console.log('closeModalOutsideClickInteraction', arguments)

  if (
    event.target == document.getElementById('startET-modal') ||
    event.target == document.getElementById('heatmap-settings-modal') ||
    event.target == document.getElementById('download-modal')
  ) {
    event.target.style.display = 'none'
  }
}

export { modeSelectionListeners, loadModels, closeModalOutsideClickInteraction }
