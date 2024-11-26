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

function readFileContent(file, callback) {
  var reader = new FileReader()
  reader.onload = async function (e) {
    // get file content
    const content = e.target.result
    // call back function
    await callback(content)
  }

  reader.readAsText(file)
}

function infoAlert(message) {
  if (window.hasOwnProperty('electron')) {
    window.electron.message('info', message)
  } else {
    alert(msg)
  }
}

function errorAlert(message) {
  if (window.hasOwnProperty('electron')) {
    window.electron.message('error', message)
  } else {
    alert(msg)
  }
}

function assign(obj, prop, value) {
  if (typeof prop === 'string') prop = prop.split('.')

  if (prop.length > 1) {
    var e = prop.shift()
    assign(
      (obj[e] =
        Object.prototype.toString.call(obj[e]) === '[object Object]'
          ? obj[e]
          : {}),
      prop,
      value
    )
  } else obj[prop[0]] = value
}

function cancelDefault(e) {
  // console.log("cancelDefault",arguments);
  e.preventDefault()
  e.stopPropagation()
}

// can be removed if no more used in the client side
function calculateProgress(i, max) {
  const progress = (i / max) * 100
  return Math.round(progress * 100) / 100
}

export {
  cancelDefault,
  calculateProgress,
  infoAlert,
  errorAlert,
  readFileContent,
}
