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
SOFTWARE. */

import { infoAlert, errorAlert } from '../utils/utils'
import {
  updateProcessingMessage,
  showGeneralWaitingScreen,
  hideGeneralWaitingScreen,
} from '../ui/progress'

var _ = require('lodash')

var REPORT_FREQUENCY = 10000

function downloadInteraction() {
  // console.log("downloadInteraction function",arguments);

  document.getElementById('close-download').onclick =
    closeDownloadSettingsInteraction
  document.getElementById('submit-download-form').onclick = () =>
    applyDownloadSettings()
  document.getElementById('download-modal').style.display = 'block'
}

function closeDownloadSettingsInteraction() {
  // console.log("closeDownloadSettingsInteraction function",arguments);

  document.getElementById('download-modal').style.display = 'none'
}

async function applyDownloadSettings() {
  // console.log("applyDownloadSettings function",arguments);

  const select = document.getElementById('download-file-type')
  const value = select.options[select.selectedIndex].value

  console.log(value)

  await showGeneralWaitingScreen(
    'Please wait while the download is being prepared',
    'wait',
    'all-content'
  )

  const downloadOutput = await window.utils.stateDownload(
    'EyeMind',
    true,
    value
  ) // stateDownload is called for the analysis in this context this is why the file name is AnalysisData

  await hideGeneralWaitingScreen('all-content', 'wait')

  if (downloadOutput.sucess) {
    infoAlert(downloadOutput.msg)
  } else {
    errorAlert(downloadOutput.msg)
  }
}

export { downloadInteraction }
