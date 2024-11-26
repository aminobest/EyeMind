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

/* Window Events */

import { takesnapshot, stopETInteraction } from './data-collection'
import { getState } from '../dataModels/state'
import { openMainTab } from './tabs'
import { resetModel, resetNavTabsAndTabs } from './canvas'

const { ipcRenderer } = window

import $ from 'jquery'

/**
 * Title: Handle window refresh.
 *
 * Description: Calls to be made when the window is refreshed
 *
 * Control-flow summary: call window.electron.removeFullScreen(), window.state.clearState() andwindow.state.clearStates
 *
 * @param {void} . .
 *
 * Returns {void}
 *
 * Tests: none
 *
 * Additional notes: none
 *
 */
function handleWindowRefresh() {
  console.log('handleWindowRefresh', arguments)

  // remove full screen in case of window refresh
  window.electron.removeFullScreen()

  // clear sever state in case of window refresh (for data collection)
  window.state.clearState()

  // clear sever state in case of window refresh (for analysis)
  window.state.clearStates()
}

/**
 * Title: Take snapshot when the app window is resized
 *
 * Description: Definition of an event listener to take a snapshot when the window is resized
 *
 * Control-flow summary: window.electron.onBrowserResize() is called, take a snapshot
 *
 * @param {void} . .
 *
 * Returns {void}
 *
 * Tests: none
 *
 * Additional notes: none
 *
 */
function takeSnapshotOnWindowResize() {
  console.log('takeSnapshotOnWindowResize', arguments)
  window.electron.onBrowserResize(function (message) {
    console.log('onBrowserResize')
    takesnapshot(
      Date.now(),
      document.body.innerHTML,
      window.screenX,
      window.screenY
    )
  })
}

/**
 * Title: Take snapshot when the app window is moved
 *
 * Description: Definition of an event listener to take a snapshot when the window is moved
 *
 * Control-flow summary: when window.electron.onBrowserMovement() is called, take a snapshot
 *
 * @param {void} . .
 *
 * Returns {void}
 *
 * Tests: none
 *
 * Additional notes: none
 *
 */
function takeSnapshotOnWindowMovement() {
  console.log('takeSnapshotOnWindowMovement', arguments)

  window.electron.onBrowserMovement(function (message) {
    console.log('onBrowserMovement')
    takesnapshot(
      Date.now(),
      document.body.innerHTML,
      window.screenX,
      window.screenY
    )
  })
}

/**
 * Title: Exposing the client state to the window context (for testing purpose)
 *
 * Description: Exposing the client state to the window context (for testing purpose)
 *
 *
 * @param {void} . .
 *
 * Returns {void}
 *
 * Tests: none
 *
 * Additional notes: none
 *
 */
function testListeners() {
  console.log('testListeners', arguments)

  window.clientTests = {}
  window.clientTests.getClientState = () => getState()
  window.clientTests.openMainTabInWithinTabLinks = (modelsGroupId) =>
    openMainTab(true, false, modelsGroupId)
  window.clientTests.resetModel = (fileId) => resetModel(fileId)
  window.clientTests.resetNavTabsAndTabs = (modelsGroupId) =>
    resetNavTabsAndTabs(modelsGroupId)
}

/**
 * Title: disable critical keys
 *
 * Description: prevent ctrl and alt, except (ctrl + R for refresh, and ctrl+shift+i to see the developer tool)
 *
 *
 * @param {void} . .
 *
 * Returns {void}
 *
 * Tests: none
 *
 * Additional notes: none
 *
 */
function DisableCriticalKeys() {
  console.log('DisableCriticalKeys', arguments)

  window.onkeydown = function (evt) {
    if ((evt.ctrlKey || evt.altKey) && evt.keyCode != 82 && evt.keyCode != 73) {
      evt.preventDefault()
    }
  }
}

export {
  handleWindowRefresh,
  takeSnapshotOnWindowResize,
  takeSnapshotOnWindowMovement,
  testListeners,
  DisableCriticalKeys,
}
