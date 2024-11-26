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

import { cancelDefault } from '../utils/utils'
import { takesnapshot } from './data-collection'
import {
  createUpdateProcessHierarchyExplorer,
  renderProcessHierarchyExplorer,
} from './process-hierarchy-explorer'
import { getState } from '../dataModels/state'
import { sendClickEvent } from './click-stream'
//import {registerClickEventForLogging} from './click-stream'
import { resetModel } from './canvas'
import $ from 'jquery'

/**
 * Title: add tab to header
 *
 * Description: adding a tab to the header
 *
 * @param {string} id file id
 *
 * Returns {void}
 *
 *
 * Additional notes: none
 *
 */
function addToTabHeader(id) {
  // create tab header if not already there
  console.log('addToTabHeader', arguments)

  // get state
  var state = getState()

  // get file name
  const fileName = document
    .getElementById('model' + id + '-content')
    .getAttribute('fileName')

  // if a tab header is not already in nav-tabs
  if (document.getElementById('model' + id) == null) {
    const tabHeader = document.createElement('div')
    tabHeader.setAttribute('id', 'model' + id)
    tabHeader.setAttribute('class', 'tab-link gaze-element')
    tabHeader.setAttribute(
      'data-element-id',
      'tab-header-tab-link-to_' + fileName
    )
    tabHeader.setAttribute('file', fileName)

    // support for dragging and dropping tabs
    tabHeader.setAttribute('draggable', true)
    tabHeader.addEventListener('dragstart', tabDragStart)
    tabHeader.addEventListener('drop', tabDropped)
    tabHeader.addEventListener('dragenter', cancelDefault)
    tabHeader.addEventListener('dragover', cancelDefault)

    /// a tab header has a filename span and a close img
    const tabHeader_fileName = document.createElement('span')
    tabHeader_fileName.innerHTML = fileName
    tabHeader_fileName.setAttribute('class', 'fileName gaze-element')
    tabHeader_fileName.setAttribute(
      'data-element-id',
      'tab-link-to_' + fileName
    )
    tabHeader_fileName.setAttribute('file', fileName)
    tabHeader_fileName.addEventListener('click', function (e) {
      sendClickEvent(
        Date.now(),
        tabHeader_fileName.getAttribute('data-element-id')
      ) // send click event
      changeTab(id, false, true)
    })
    // since a tabHeader_fileName DOM is created every time addToTabHeader() is called and document.getElementById("model"+id)==null, registerClickEventForLogging is used to log clicks on this element
    //registerClickEventForLogging(tabHeader_fileName);

    tabHeader.appendChild(tabHeader_fileName)

    const tabHeader_close = document.createElement('img')
    tabHeader_close.setAttribute('class', 'close gaze-element')
    tabHeader_close.setAttribute(
      'data-element-id',
      'close-button-tab-link-to_' + fileName
    )
    tabHeader_close.setAttribute('file', fileName)
    tabHeader_close.setAttribute('src', 'icons/close-tab.svg')
    // since a tabHeader_close DOM is created every time addToTabHeader() is called and document.getElementById("model"+id)==null, registerClickEventForLogging is used to log clicks on this element
    //registerClickEventForLogging(tabHeader_close);

    tabHeader_close.onclick = () => {
      sendClickEvent(
        Date.now(),
        tabHeader_close.getAttribute('data-element-id')
      ) // send click event
      closeTabInteraction(id, tabHeader, true) //close tab and take snapshot
    }

    /// append only if the task is not unclosable
    if (state.models[id].unclosable != null && !state.models[id].unclosable) {
      tabHeader.appendChild(tabHeader_close)
    }

    document.getElementById('nav-tabs').appendChild(tabHeader)

    // set scroll position
    setScrollPosition(
      document.getElementById('nav-tabs'),
      'openning',
      tabHeader
    )
  }
}

/**
 * Title: set scroll position
 *
 * Description: changing the scroll in container depending on the position of the tabHeader
 *
 * @param {object} container  the dom object container of the tab header
 * @param {string} context  the context in which the function is called (openning, changingTab)
 * @param {object} tabHeader  dom object
 *
 * Returns {void}
 *
 *
 * Additional notes: none. // to do: closing tabs and going back to an already opened tab + testing
 *
 */
function setScrollPosition(container, context, tabHeader) {
  console.log('setScrollPosition', arguments)

  const tabHeaderStartPos = tabHeader.offsetLeft
  const tabHeaderEndPos = tabHeaderStartPos + tabHeader.offsetWidth
  const containerWidth = container.offsetWidth

  const containerViewStart = container.scrollLeft
  const containerViewEnd = container.scrollLeft + containerWidth

  console.log('tabHeaderStartPos', tabHeaderStartPos)
  console.log('tabHeaderEndPos', tabHeaderEndPos)
  console.log('container width', containerWidth)

  console.log('containerViewStart', containerViewStart)
  console.log('containerViewEnd', containerViewEnd)

  if (context == 'openning') {
    if (tabHeaderEndPos > containerWidth) {
      const scrollDistance = tabHeaderEndPos - containerWidth
      container.scrollLeft = scrollDistance
    }
  } else if (context == 'changingTab') {
    /// tabheader is not within [containerViewStart,containerViewEnd]
    if (
      !(
        tabHeaderStartPos >= containerViewStart &&
        tabHeaderStartPos < containerViewEnd
      )
    ) {
      container.scrollLeft = tabHeaderStartPos
    }
  }
}

/**
 * Title: tab drag start
 *
 * Description: drag a tab
 *
 * @param {object} e drag event
 *
 * Returns {void}
 *
 * Tests: none
 *
 * Additional notes: none
 *
 */
function tabDragStart(e) {
  console.log('tabDragStart', arguments)

  // find the selectedFile
  const selected = e.target
  const selectedFile = selected.getAttribute('file')

  // locate the corresponding tab header
  const target = document.querySelector(
    '.tab-link[file="' + selectedFile + '"]'
  )
  // console.log("tabDragStart target",target);

  // find its index
  const index = Array.prototype.slice
    .call(document.getElementById('nav-tabs').children)
    .indexOf(target)
  // console.log("index", index);

  // start the transfer of this index
  e.dataTransfer.setData('text/plain', index)
}

/**
 * Title: tab dropped
 *
 * Description: dropping a tab after a drag
 *
 * @param {object} e drop event
 *
 * Returns {void}
 *
 *
 * Additional notes: none
 *
 */
function tabDropped(e) {
  console.log('tabDropped', arguments)

  cancelDefault(e)

  // get old index (i.e., transfered index)
  const oldIndex = e.dataTransfer.getData('text/plain')

  // find the selectedFile
  const selected = e.target
  const selectedFile = selected.getAttribute('file')
  // locate the corresponding tab header
  const target = document.querySelector(
    '.tab-link[file="' + selectedFile + '"]'
  )
  // console.log("dropped target",target);
  // find its index which will be the new index
  const newIndex = Array.prototype.slice
    .call(document.getElementById('nav-tabs').children)
    .indexOf(target)
  // console.log("newIndex", newIndex);

  /// only when the indices are different
  if (oldIndex != newIndex) {
    // remove the dropped item from the old place
    const element = document.getElementById('nav-tabs').children[oldIndex]
    element.remove()

    // insert the dropped item at the new place
    if (newIndex < oldIndex) {
      target.before(element)
      // // console.log("tab set before");
    } else {
      target.after(element)
      // // console.log("tab set after");
    }
  }
}

/**
 * Title: close tab interaction
 *
 * Description: interaction to close a tab
 *
 * @param {string} id id of the file
 * @param {object} tabHeader dom element refering to a file tab header
 * @param {boolean} takeSnapshot whether or not to take a snapshot
 *
 * Returns {void}
 *
 *
 * Additional notes: none
 *
 */
function closeTabInteraction(id, tabHeader, takeSnapshot) {
  console.log('closeTabInteraction', arguments)

  var state = getState()

  // reset the model of the closed tab
  resetModel(id)

  // remove tabHeader
  tabHeader.remove()

  /// if the tab to be closed is the one which is actually shown, hide it and set state.activeTab to ""
  if (
    document.getElementById('model' + id + '-container').style.display == 'flex'
  ) {
    document.getElementById('model' + id + '-container').style.display = 'none'
    state.activeTab = ''
    // console.log("active tab changed ",state.activeTab);
  }

  // take snapshot if takeSnapshot==true
  if (takeSnapshot) {
    takesnapshot(
      Date.now(),
      document.body.innerHTML,
      window.screenX,
      window.screenY
    )
  }
}

/**
 * Title: change tab
 *
 * Description: moving to a new tab
 *
 * @param {string} destinationId id of the destination file
 * @param {boolean} ignoreTabLinks whether or not to ignore tab links, allows to change active navigation tab link if tab links are allowed
 * @param {boolean} takeSnapshot whether or not to take a snapshot
 *
 * Returns {void}
 *
 *
 * Additional notes: none
 *
 */
function changeTab(destinationId, ignoreTabLinks, takeSnapshot) {
  console.log('changeTab', arguments)

  var state = getState()

  const destinationIdModel = document.getElementById(
    'model' + destinationId + '-content'
  )
  const fileName = destinationIdModel.getAttribute('fileName')

  /// hide index-tab once tabs are changed. The goal of this tab is to prevent users from seeing the models before the data collection
  if (document.getElementById('index-tab').style.display != 'none') {
    document.getElementById('index-tab').style.display = 'none'
  }

  // hide the currently opened/active tab container
  var i, tabContainers, tabLinks
  tabContainers = document.getElementsByClassName('tab-container')
  for (i = 0; i < tabContainers.length; i++) {
    tabContainers[i].style.display = 'none'
  }

  // show the destination tab container
  const destinationIdTabContainer = document.getElementById(
    'model' + destinationId + '-container'
  )
  destinationIdTabContainer.style.display = 'flex' //"block";

  // change active navigation tab link if tab links are allowed
  if (!ignoreTabLinks) {
    // hide the currently opened/active tab link
    tabLinks = document.getElementsByClassName('tab-link')
    for (i = 0; i < tabLinks.length; i++) {
      tabLinks[i].className = tabLinks[i].className.replace(' active', '')
    }

    // ´activate the destination tab link
    const destinationIdTabLink = document.getElementById(
      'model' + destinationId
    )
    destinationIdTabLink.className += ' active'

    // set scroll position
    setScrollPosition(
      document.getElementById('nav-tabs'),
      'changingTab',
      destinationIdTabLink
    )
  }

  // update state.activeTab
  state.activeTab = fileName

  // console.log("active tab changed ",state.activeTab);

  // take snapshot on change tab
  if (takeSnapshot) {
    takesnapshot(
      Date.now(),
      document.body.innerHTML,
      window.screenX,
      window.screenY
    )
  }
}

/**
 * Title: open sub-process in a new tab
 *
 * Description: open sub-process in a new tab
 *
 * @param {string} subProcessId id of the file with the sub-process
 *
 * Returns {void}
 *
 *
 * Additional notes: none
 *
 */
function openInTab(subProcessId) {
  console.log('openInTab', arguments)

  addToTabHeader(subProcessId)
  changeTab(subProcessId, false, true)
}

/**
 * Title: open sub-process in within the same tab
 *
 * Description: open sub-process in within the same tab
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
async function openWithinTab(
  mainModelId,
  mainModelprocessId,
  subProcessId,
  subProcessActivityLabelInMainModel,
  position
) {
  console.log('openWithinTab', arguments)

  createUpdateProcessHierarchyExplorer(
    mainModelId,
    mainModelprocessId,
    subProcessId,
    subProcessActivityLabelInMainModel,
    position
  )
  renderProcessHierarchyExplorer(mainModelId, mainModelprocessId)
  changeTab(subProcessId, true, true)
}

/**
 * Title: open the main tab
 *
 * Description: open the main tab
 *
 * @param {boolean} ignoreTabLinks whether or not to ignore tab links, allows to change active navigation tab link if tab links are allowed
 * @param {boolean} takeSnapshot whether or not to take a snapshot
 * @param {string} modelsGroupId models group id
 *
 * Returns {void}
 *
 *
 * Additional notes: none
 *
 */
function openMainTab(ignoreTabLinks, takeSnapshot, modelsGroupId) {
  console.log('openMainTab function', arguments)

  var state = getState()

  for (const [key, model] of Object.entries(state.models)) {
    if (model.mainTab && model.groupId == modelsGroupId) {
      if (!ignoreTabLinks) addToTabHeader(key)
      changeTab(key, ignoreTabLinks, takeSnapshot)
      break
    }
  }
}

/**
 * Title: set main tab
 *
 * Description: find the main tab and set it as a main tab
 *
 * @param {void} . .
 *
 * Returns {void}
 *
 *
 * Additional notes: none
 *
 */
function setMainTab() {
  console.log('setMainTab function', arguments)

  var state = getState()

  const setAsMainRadioBoxList = document.getElementsByClassName('set-as-main')

  for (let i = 0; i < setAsMainRadioBoxList.length; i++) {
    if (setAsMainRadioBoxList[i].checked) {
      state.models[setAsMainRadioBoxList[i].getAttribute('modelId')].mainTab =
        setAsMainRadioBoxList[i].checked
    }
  }
}

/**
 * Title: set unclosable tabs
 *
 * Description: find the unclsable tabs and set the property to be unclosabled to them
 *
 * @param {void} . .
 *
 * Returns {void}
 *
 *
 * Additional notes: none
 *
 */
function setUnclosableTabs() {
  console.log('setUnclosableTabs', arguments)

  var state = getState()

  const setUnclosableTabCheckBoxList =
    document.getElementsByClassName('unclosable-tab')
  // console.log("setUnclosableTabCheckBoxList", setUnclosableTabCheckBoxList);

  for (let i = 0; i < setUnclosableTabCheckBoxList.length; i++) {
    state.models[
      setUnclosableTabCheckBoxList[i].getAttribute('modelId')
    ].unclosable = setUnclosableTabCheckBoxList[i].checked
  }
}

export {
  addToTabHeader,
  changeTab,
  openInTab,
  openWithinTab,
  openMainTab,
  setUnclosableTabs,
  setMainTab,
  closeTabInteraction,
}
