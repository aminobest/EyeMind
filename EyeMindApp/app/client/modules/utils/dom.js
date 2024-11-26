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

/**
 * Title: move from one view to another
 *
 * Description:  hide one DOM element and show another one
 *
 * Control-flow summary: hide one DOM element and show another one
 *
 * @param {string} fromDomElementId  the id of the dom element to hide
 * @param {string} toDomElementId  the id of the dom element to show
 * @param {string} toDomElementDisplayMode  the display mode (e.g., flex, block)
 *
 * Returns {void}
 *
 * Tests: none
 *
 * Additional notes: none
 *
 */

function moveFromTo(fromDomElementId, toDomElementId, toDomElementDisplayMode) {
  console.log('moveFromTo', arguments)

  hideElement(fromDomElementId)
  document.getElementById(toDomElementId).style.display =
    toDomElementDisplayMode
}

/**
 * Title: update text and display dom element
 *
 * Description: update the text of a dom element and display it
 *
 * Control-flow summary:  update the text of a dom element and display it
 *
 * @param {string} domElementId  the id of the dom element to update
 * @param {string} text  new text
 * @param {string} domElementDisplayMode  the display mode (e.g., flex, block)
 *
 * Returns {void}
 *
 * Tests: none
 *
 * Additional notes: none
 *
 */

function updateTextAndDisplayDomElement(
  domElementId,
  text,
  domElementDisplayMode
) {
  console.log('updateTextAndDisplayDomElement', arguments)

  document.getElementById(domElementId).innerText = text
  document.getElementById(domElementId).style.display = domElementDisplayMode
}

/**
 * Title: hide dom element
 *
 * Description: hide dom element
 *
 * Control-flow summary:  hide dom element
 *
 * @param {string} domElementId  the id of the dom element to hide
 *
 * Returns {void}
 *
 * Tests: none
 *
 * Additional notes: none
 *
 */
function hideElement(domElementId) {
  console.log('hideElement', arguments)

  document.getElementById(domElementId).style.display = 'none'
}

/**
 * Title: display dom element
 *
 * Description: display dom element
 *
 * Control-flow summary:  display dom element
 *
 * @param {string} domElementId  the id of the dom element to display
 * @param {string} mode  display mode (e.g., block,flex)
 *
 * Returns {void}
 *
 * Tests: none
 *
 * Additional notes: none
 *
 */
function displayElement(domElementId, mode) {
  console.log('displayElement', arguments)

  if (mode != 'none') {
    document.getElementById(domElementId).style.display = mode
  } else {
    console.error('Use hideElement() instead')
  }
}

/**
 * Title: hide html of child elements
 *
 * Description: hide html of child elements
 *
 * Control-flow summary:  iterate through the childs of an element, then for each child set child.style.display = "none"
 *
 * @param {string} domElementId  the id of the dom element
 *
 * Returns {void}
 *
 * Tests: none
 *
 * Additional notes: none
 *
 */

function hideChildElements(domElementId) {
  console.log('hideChildElements', arguments)

  const parentElement = document.getElementById(domElementId)
  for (const child of parentElement.children) {
    child.style.display = 'none'
  }
}

/**
 * Title: populate element with participant/file info
 *
 * Description: populate (select) element with participant/file info
 *
 * @param {string} targetDomId  id of the dom element to populate
 *
 * Returns {void}
 *
 * Tests: none
 *
 * Additional notes: none
 *
 */
async function populateParticipantFileSelect(targetDomId) {
  console.log('populateParticipantFileSelect', arguments)

  var pariticipantFileSelect = document.getElementById(targetDomId)

  if (
    pariticipantFileSelect.options.length == 0 ||
    (pariticipantFileSelect.options.length == 1 &&
      pariticipantFileSelect.options[0].value == '')
  ) {
    const statesInfo = await window.analysis.getStatesInfo()

    for (const [key, participantID] of Object.entries(statesInfo)) {
      var opt = document.createElement('option')
      opt.value = key
      opt.innerHTML = participantID + ' (' + key + ')'
      pariticipantFileSelect.appendChild(opt)
    }
  }
}

/**
 * Title: get select values
 *
 * Description: get select values
 *
 * @param {string} selectId  id of the select dom element
 * @param {string} outType  return the value or the text of the select option
 *
 * Returns an array of the selected opion values
 *
 * Tests: none
 *
 * Additional notes: none
 *
 */
function getSelectValues(selectId, outType) {
  const select = document.getElementById(selectId)
  var result = []
  var options = select && select.options
  var opt

  if (outType != 'value' && outType != 'text') {
    console.error('unsuported outType', outType)
    return null
  }

  for (var i = 0, iLen = options.length; i < iLen; i++) {
    opt = options[i]

    if (opt.selected) {
      result.push(opt[outType])
    }
  }
  return result
}

/**
 * Title: update user configuration
 *
 * Description: update the chosen user configuration
 *
 * @param {object} userConfig  user configuration
 *
 * Returns {void}
 *
 * Tests: none
 *
 * Additional notes: none
 *
 */
function updateShownUserConfig(userConfig) {
  console.log('updateShownUserConfig', arguments)

  document.getElementById('user-config-content').innerHTML = ''

  for (const [key, value] of Object.entries(userConfig)) {
    document.getElementById('user-config-content').innerHTML +=
      '<span class=key>' +
      key +
      '</span>: <span class=value>' +
      value +
      '</span><br>'
  }
}

export {
  moveFromTo,
  updateTextAndDisplayDomElement,
  hideElement,
  hideChildElements,
  displayElement,
  populateParticipantFileSelect,
  getSelectValues,
  updateShownUserConfig,
}
