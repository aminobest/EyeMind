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

/* progress */

/**
 * Title: update processing message listener
 *
 * Description: a listener for receving processing messages from the server side
 *
 * @param {void} .
 *
 * Returns {void}
 *
 *
 * Additional notes: none
 *
 */
function updateProcessMessageListener() {
  window.progress.onUpdateProcessingMessage(async function (args) {
    console.log('onUpdateProcessingMessage', arguments)
    const msg = args[0]
    const externalProgressWindow = args[1]
    await updateProcessingMessage(msg, externalProgressWindow)
  })
}

/**
 * Title: update processing message
 *
 * Description: update the content of documentContainer.getElementById("wait-progress")
 *
 * @param {string} msg message to show
 * @param {object} the container of the "wait-progress" DOM object
 *
 * Returns {void}
 *
 *
 * Additional notes: none
 *
 */
async function updateProcessingMessage(msg, container) {
  console.log('updateProcessingMessage', arguments)

  var documentContainer

  if (typeof container == 'string' && container != '') {
    documentContainer = window.externalProgressWindows[container].document
  } else {
    documentContainer = document
  }

  documentContainer.getElementById('wait-progress').innerHTML = msg

  await delay(window.globalParameters.DELAY_FOR_RENDRING)
}

/**
 * Title: delay
 *
 * Description: sleep for some milliseconds
 *
 * @param {int} delayInms sleep time in milliseconds
 *
 * Returns {void}
 *
 *
 * Additional notes: none
 *
 */
function delay(delayInms) {
  console.log('delay', arguments)

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(2)
    }, delayInms)
  })
}

/**
 * Title: show general waiting screen
 *
 * Description: show general waiting screen
 *
 * @param {string} text to display in document.getElementById("wait-title")
 * @param {string} show id of the DOM element to show
 * @param {string} hide id of the DOM element to hide
 *
 * Returns {void}
 *
 *
 * Additional notes: none
 *
 */
async function showGeneralWaitingScreen(text, show, hide) {
  console.log('showGeneralWaitingScreen', arguments)

  if (text != null) {
    document.getElementById('wait-title').innerHTML = text
  }

  document.getElementById(hide).style.display = 'none'
  document.getElementById(show).style.display =
    show == 'all-content' ? 'inline-block' : 'block' // specific display types based on the element can be implemented here

  await delay(window.globalParameters.DELAY_FOR_RENDRING)
}

/**
 * Title: hide general waiting screen
 *
 * Description: hide general waiting screen
 *
 * @param {string} show id of the DOM element to show
 * @param {string} hide id of the DOM element to hide
 *
 * Returns {void}
 *
 *
 * Additional notes: none
 *
 */
async function hideGeneralWaitingScreen(show, hide) {
  console.log('hideGeneralWaitingScreen', arguments)

  document.getElementById(show).style.display =
    show == 'all-content' ? 'inline-block' : 'block' // specific display types based on the element can be implemented here
  document.getElementById(hide).style.display = 'none'

  document.getElementById('wait-title').innerHTML = ''
  document.getElementById('wait-progress').innerHTML = ''

  await delay(window.globalParameters.DELAY_FOR_RENDRING)
}

export {
  updateProcessingMessage,
  updateProcessMessageListener,
  showGeneralWaitingScreen,
  hideGeneralWaitingScreen,
}
