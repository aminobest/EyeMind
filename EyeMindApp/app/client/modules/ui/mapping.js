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

import { updateProcessingMessage } from './progress'
import { calculateProgress } from '../utils/utils'
import { setSnapshots, getSnapshots } from '../dataModels/snapshots'

function mapGazestoElementsFromPageSnapshotListener() {
  window.eyeTracker.onMapGazestoElementsFromPageSnapshot(function (args) {
    console.log('mapGazestoElementsFromPageSnapshot', arguments)
    const gazeData = args[0]
    const start = args[1]
    const gazeDataSize = args[2]
    const externalProgressWindow = args[3]
    const snapshots = args[4]

    if (snapshots != null) {
      console.log('snapshots set')
      setSnapshots(snapshots)
    }

    const dataMapped = mapGazestoElementsFromPageSnapshot(gazeData)
    window.eyeTracker.dataMapped(
      dataMapped,
      start,
      gazeDataSize,
      externalProgressWindow
    )
  })
}

function mapGazestoElementsFromPageSnapshot(gazeData) {
  console.log('mapGazestoElementsFromPageSnapshot function ', arguments)

  var snapshots = getSnapshots()

  var currentSnapshotID = -1
  var dataMapped = []

  const gazeDataLength = gazeData.length

  for (let i = 0; i < gazeDataLength; i++) {
    const gazepoint = gazeData[i]

    // console.log("gazepoint x,y ",gazepoint.x,gazepoint.y);
    // with gazepoint.x!=null  &&  gazepoint.y!=null && gazepoint.snapshotId != null question event markers are exclued from the mapping
    if (
      gazepoint.x != null &&
      gazepoint.y != null &&
      gazepoint.snapshotId != null &&
      gazepoint.snapshotId != -1 &&
      snapshots[gazepoint.snapshotId] != null
    ) {
      if (currentSnapshotID != gazepoint.snapshotId) {
        currentSnapshotID = gazepoint.snapshotId
        document.body.innerHTML = snapshots[currentSnapshotID].code
        // // // console.log("snapshot loaded", currentSnapshotID);
      }
      /// set tabName
      gazepoint.tabName = snapshots[currentSnapshotID].tabName
      // map gaze point to elements
      gazepoint.element = doMapping(
        gazepoint.x,
        gazepoint.y,
        snapshots[currentSnapshotID].screenX,
        snapshots[currentSnapshotID].screenY
      )
    } else {
      gazepoint.tabName = ''
      gazepoint.element = ''
    }

    //add gaze points
    dataMapped.push(gazepoint)
  }

  //console.log("dataMapped ",dataMapped);

  return dataMapped
}

function mapGazetoElementsFromSvgSnapshot(
  rX,
  rY,
  snapshotSvg,
  screenX,
  screenY
) {
  // console.log("mapGazestoElementsFromSvgSnapshot function,",arguments);

  return doMapping(rX, rY, screenX, screenY, snapshotSvg)
}

function doMapping(x, y, screenX, screenY, container) {
  // console.log("doMapping function ",arguments);

  container = container || document

  // console.log("container",container);

  const relativeX = parseFloat(x) - screenX
  const relativeY = parseFloat(y) - screenY

  const target = container.elementFromPoint(relativeX, relativeY)

  // console.log("relativeX, relativeY", relativeX, relativeY);
  // console.log("target",target);

  const selector = 'svg, .djs-element, .gaze-element'

  const delegateTarget = closest(target, selector, true)

  const out =
    delegateTarget != null ? delegateTarget.getAttribute('data-element-id') : ''

  // console.log("x: ",x,", y: ",y, ", mapped to: ",out);

  return out
}

function closest(element, selector, checkYourSelf) {
  // console.log("closest function ",arguments);

  var currentElem = checkYourSelf ? element : element.parentNode

  while (
    currentElem &&
    currentElem.nodeType !== document.DOCUMENT_NODE &&
    currentElem.nodeType !== document.DOCUMENT_FRAGMENT_NODE
  ) {
    if (matchesSelector(currentElem, selector)) {
      return currentElem
    }

    currentElem = currentElem.parentNode
  }

  return matchesSelector(currentElem, selector) ? currentElem : null
}

function matchesSelector(el, selector) {
  // console.log("matchesSelector function ",arguments);

  if (!el || el.nodeType !== 1) return false
  var nodes = el.parentNode.querySelectorAll(selector)
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i] == el) return true
  }
  return false
}

export {
  mapGazestoElementsFromPageSnapshot,
  mapGazestoElementsFromPageSnapshotListener,
  mapGazetoElementsFromSvgSnapshot,
}
