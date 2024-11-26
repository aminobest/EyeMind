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
import { getState } from '../dataModels/state'

/**
 * Title: send click event to the ET server through the server side
 *
 * Description: send click event to the ET server through the server side

 * @param {int} clickTimestamp timestamp when the click occured
 * @param {string} clickedElement clicked element
 * 
 * Returns {void}
 *
 *
 *
 */
async function sendClickEvent(clickTimestamp, clickedElement) {
  console.log('sendClickEvent', arguments)

  var state = getState()

  if (state.isEtOn) {
    const res = await window.eyeTracker.sendClickEvent(
      clickTimestamp,
      clickedElement
    )
    if (!res.sucess) {
      console.error(res.msg)
    }

    // for testing purpose
    if (window.hasOwnProperty('clientTests')) {
      window.clientTests.lastRelevantClick = {
        clickTimestamp: clickTimestamp,
        clickedElement: clickedElement,
      }
    }
  }
}

/**
 * Title: clicks listener
 *
 * Description: iterate through document.querySelectorAll(".click-record") and registerClickEventForLogging() for all DOM elements in document.querySelectorAll(".click-record")
 *
 * @param {void} . .
 * Returns {void}
 *
 *
 * Additional notes: clicks should have a class tag "click-record" and attribute data-element-id
 *
 */
/*function clicksListener() {

	const relevantElements = document.querySelectorAll(".click-record");

	for (let i = 0; i < relevantElements.length; i++) {

	 	const el = relevantElements[i];
	 	registerClickEventForLogging(el);
	 		
	}

}*/

/**
 * Title: register click event for logging
 *
 * Description: send the click event to the eye-tracking server (through the server side)
 *
 * @param {void} . .
 * Returns {void}
 *
 *
 * Additional notes:  some variables are exposed in window.clientTests for testing purpose
 *
 */
/*
function registerClickEventForLogging(el) {

	el.addEventListener("click", async() => {

	var state = getState();

	console.log("state",state);



	const clickTimestamp = Date.now();
	const clickedElement= el.getAttribute("data-element-id");

	  // for testing purpose
	  if(window.hasOwnProperty('clientTests')) {
	    window.clientTests.lastRelevantClick = {
	      "clickTimestamp":clickTimestamp,
	      "clickedElement": clickedElement,
	    };
	  }

	console.log("click",clickTimestamp,clickedElement);

	await sendClickEvent(clickTimestamp,clickedElement)



	});

} 
*/

export { sendClickEvent }
