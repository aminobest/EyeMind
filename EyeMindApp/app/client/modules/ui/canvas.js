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

import { closeTabInteraction, openMainTab } from './tabs'
import { takesnapshot } from './data-collection'
import { resetProcessHierarchy } from './process-hierarchy-explorer'
import { getState } from '../dataModels/state'

/**
 * Title: Reset model
 *
 * Description: revert a model to its initial state
 *
 *
 * @param {string} fileId  the id of the file
 *
 *
 * Additional notes: none
 *
 */
function resetModel(fileId) {
  console.log('resetModel', arguments)

  var container = document.querySelector('[id="model' + fileId + '-container"]')

  if (container != null) {
    var djs_overlay_container = container.querySelectorAll(
      '[class="djs-overlay-container"]'
    )
    var viewport = container.querySelectorAll('[class="viewport"]')

    if (
      Object.keys(djs_overlay_container).length == 1 &&
      Object.keys(viewport).length == 1
    ) {
      viewport[0].removeAttribute('transform')
      djs_overlay_container[0].style.removeProperty('transform')
      djs_overlay_container[0].style.removeProperty('transform-origin')
    } else {
      console.error(
        'Object.keys(djs_overlay_container).length==1 && Object.keys(viewport).length==1 not satified'
      )
    }
  } else {
    console.error(
      "document.querySelector('[id=model'+fileId+'-container]') is null"
    )
  }
}

/**
 * Title: Reset navigation tabs and tabs view
 *
 * Description: reset the view by closing all closable tabs, reset the main model and reset proess hierary explorer
 *
 * @param {string} modelsGroupId models group id
 *
 * Additional notes: none
 *
 */
function resetNavTabsAndTabs(modelsGroupId) {
  console.log('resetNavTabsAndTabs', arguments)

  const state = getState()

  if (modelsGroupId != null) {
    // differ the execution depending on the linkingSubProcessesMode
    if (
      state.linkingSubProcessesMode == 'newTab' ||
      state.linkingSubProcessesMode == 'no'
    ) {
      // get all opened navTabs
      var navTabs = document
        .getElementById('nav-tabs')
        .querySelectorAll('.tab-link')

      for (let i = 0; i < navTabs.length; ++i) {
        const tabHeader = navTabs[i]
        const fileName = tabHeader.getAttribute('file')
        const fileId = fileName.replace(
          new RegExp(window.globalParameters.MODELS_ID_REGEX, 'g'),
          ''
        )

        // close tab
        closeTabInteraction(fileId, tabHeader, false)

        /*
            // check the navTab refers to a main process or not
            const isMain = state.models[fileId].isMain;
            console.log(fileName+" isMain? "+isMain)
            
            if (!isMain) {
              // close all closable tabs (implies reseting the underlying models as well), the third argument implies not to take snapshot
              closeTabInteraction(fileId,tabHeader,false);
            }
            else {
              // reset the main model
              resetModel(fileId);
            }*/
      }

      // open main tab
      openMainTab(false, false, modelsGroupId)

      // takesnapshot
      takesnapshot(
        Date.now(),
        document.body.innerHTML,
        window.screenX,
        window.screenY
      )
    } else if (state.linkingSubProcessesMode == 'withinTab') {
      // reset all models
      for (const [key, model] of Object.entries(state.models)) {
        resetModel(key)
      }

      // open main tab
      openMainTab(true, false, modelsGroupId)

      // reset process-hierarchy content if the DOM element exists
      resetProcessHierarchy()

      // takesnapshot
      takesnapshot(
        Date.now(),
        document.body.innerHTML,
        window.screenX,
        window.screenY
      )
    }
  } else {
    // hide nav-tabs-and-tabs
    document.getElementById('nav-tabs-and-tabs').style.display = 'none'

    // takesnapshot
    takesnapshot(
      Date.now(),
      document.body.innerHTML,
      window.screenX,
      window.screenY
    )
  }
}

/**
 * Title: show models corresponding to a specific process
 *
 * Description: show models corresponding to a specific process
 *
 *
 * @param {void} .  .
 *
 * Returns {void}
 *
 *
 * Additional notes: none
 *
 */
function showModelsGroup(groupId) {
  console.log('showModelsGroup', arguments)

  var state = getState()

  if (groupId != null) {
    for (const model of Object.values(state.models)) {
      //console.log(model,model.id,document.getElementById("model"+model.id+"-explorerItem"))

      if (model.groupId == groupId) {
        document.getElementById(
          'model' + model.id + '-explorerItem'
        ).style.display = 'block'
      } else {
        document.getElementById(
          'model' + model.id + '-explorerItem'
        ).style.display = 'none'
      }
    }
  } else {
    for (const model of Object.values(state.models)) {
      document.getElementById(
        'model' + model.id + '-explorerItem'
      ).style.display = 'none'
    }
  }
}

export { resetModel, resetNavTabsAndTabs, showModelsGroup }
