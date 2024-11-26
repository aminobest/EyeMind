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

/* Process hierarchy explorer */

import { openWithinTab } from './tabs'
//import {registerClickEventForLogging} from './click-stream'
import { getState } from '../dataModels/state'
import { sendClickEvent } from './click-stream'
import $ from 'jquery'

/**
 * Title: create or update the process hierarchy explorer
 *
 * Description: create or update the process hierarchy explorer
 *
 * @param {string} mainModelId id of the file with the main model
 * @param {string} mainModelprocessId id of the process in the main model
 * @param {string} subProcessId id of the file with the subprocess model
 * @param {string} subProcessActivityLabelInMainModel subprocess activity label in the main model
 * @param {string} position in the hierarchy

 *
 * Returns {void}
 *
 *
 * Additional notes: none
 *
 */
function createUpdateProcessHierarchyExplorer(
  mainModelId,
  mainModelprocessId,
  SubProcessId,
  subProcessActivityLabelInMainModel,
  position
) {
  console.log('createUpdateProcessHierarchyExplorer', arguments)

  var state = getState()

  /// condition/mechanism to initiate state.processHierarchyExplorer
  if (state.processHierarchyExplorer == null) {
    state.processHierarchyExplorer = [
      { id: mainModelId, label: mainModelprocessId },
    ]
  }
  // condition/mechanism to move backward
  else if (position < state.processHierarchyExplorer.length) {
    state.processHierarchyExplorer = state.processHierarchyExplorer.splice(
      0,
      position
    )
  }

  // add subprocess info to state.processHierarchyExplorer
  state.processHierarchyExplorer.push({
    id: SubProcessId,
    label: subProcessActivityLabelInMainModel,
  })
}

/**
 * Title: render process hierarchy explorer
 *
 * Description:  render process hierarchy explorer
 *
 * @param {string} mainModelName id of the file with the main model
 * @param {string} mainModelprocessId id of the process in the main model
 *
 * Returns {void}
 *
 *
 * Additional notes: none
 *
 */
function renderProcessHierarchyExplorer(mainModelName, mainModelprocessId) {
  console.log('renderProcessHierarchyExplorer', arguments)

  var state = getState()

  var container = document.getElementById('process-hierarchy-content')

  container.innerHTML = ''

  // show the ProcessHierarchyExplorer steps if there is more than one step in state.processHierarchyExplorer (i.e., more than the main process itself)
  if (state.processHierarchyExplorer.length > 1) {
    state.processHierarchyExplorer.forEach((el, position, array) => {
      // create arrow head
      if (container.innerHTML != '') {
        const arrowhead = document.createElement('span')
        arrowhead.setAttribute('class', 'arrowhead')
        arrowhead.innerHTML = ' > '
        container.appendChild(arrowhead)
      }

      // create a step
      const step = document.createElement('span')
      step.setAttribute(
        'id',
        'process-hierarchy-sub-process-link-to_' + el.label
      )
      step.setAttribute(
        'class',
        (position == array.length - 1 ? 'laststep' : 'step') + ' gaze-element'
      )
      step.setAttribute(
        'data-element-id',
        'process-hierarchy-sub-process-link-to_' + el.label
      )

      step.innerHTML = el.label

      // record click and add onlick event to the step to allow changing the tab
      step.onclick = () => {
        sendClickEvent(Date.now(), step.getAttribute('data-element-id'))
        openWithinTab(
          mainModelName,
          mainModelprocessId,
          el.id,
          el.label,
          position
        )
      }

      // since a step DOM is created every time renderProcessHierarchyExplorer() is called, registerClickEventForLogging is used to log clicks on this element
      //registerClickEventForLogging(step)

      // append step to container
      container.appendChild(step)
    })
  }
}

/**
 * Title: reset process hierarchy
 *
 * Description:  reset process hierarchy
 *
 * @param {void} . .
 *
 * Returns {void}
 *
 *
 * Additional notes: none
 *
 */
function resetProcessHierarchy() {
  var state = getState()

  var container = document.getElementById('process-hierarchy-content')

  // reset destination
  container.innerHTML = ''

  // set state.processHierarchyExplorer to null
  state.processHierarchyExplorer = null
}

export {
  createUpdateProcessHierarchyExplorer,
  renderProcessHierarchyExplorer,
  resetProcessHierarchy,
}
