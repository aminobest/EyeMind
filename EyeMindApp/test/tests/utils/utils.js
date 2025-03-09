const fs = require('fs')
const jsdom = require('jsdom')
const { JSDOM } = jsdom

async function dragAndDropFile(page, selector, filePath, fileName, fileType = '') {
  const buffer = fs.readFileSync(filePath).toString('base64')

  const dataTransfer = await page.evaluateHandle(
    async ({ bufferData, localFileName, localFileType, localFilePath }) => {
      const dt = new DataTransfer()

      const blobData = await fetch(bufferData).then((res) => res.blob())

      const file = new File([blobData], localFileName, { type: localFileType })
      file.localFilePath = localFilePath
      file.isForTestingPurpose = true

      dt.items.add(file)

      dt.isForTestingPurpose = true

      return dt
    },
    {
      bufferData: `data:application/octet-stream;base64,${buffer}`,
      localFileName: fileName,
      localFileType: fileType,
      localFilePath: filePath,
    },
  )

  // Now dispatch
  await page.dispatchEvent('id=upload-zone', 'drop', { dataTransfer })
}

function delay(delayInms) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(2)
    }, delayInms)
  })
}

function removeElementAttributes(elementsToEdit, data) {
  const dom = new JSDOM(data)
  const elements = dom.window.document.querySelectorAll(
    Object.keys(elementsToEdit).join(', '),
  )
  ;[].forEach.call(elements, function (element) {
    const tagName = element.tagName.toLowerCase()
    element.removeAttribute(elementsToEdit[tagName])
  })

  return dom.window.document.body.outerHTML
}

function loadFile(path) {
  return fs.readFileSync(path).toString()
}

function readSmallJSON(path) {
  const data = fs.readFileSync(path)
  return JSON.parse(data)
}

function saveFile(path, content) {
  fs.writeFile(path, content, () => console.log('file saved'))
}

/* because of the following difference between snapshots (altough similar) remove the class attribute for svg tags with width="100%" height="100%"
  -<svg width="100%" height="100%" data-element-id="Collaboration_1u5663f" class="">
+<svg width="100%" height="100%" data-element-id="Collaboration_1u5663f">
*/
function removeClassAttrFromSpecificSVGs(code) {
  const dom = new JSDOM(code)
  var relevantElements = dom.window.document.querySelectorAll(
    'svg[width="100%"][height="100%"]',
  )

  ;[].forEach.call(relevantElements, function (element) {
    if (element.hasAttribute('class')) {
      element.removeAttribute('class')
    }
  })

  return dom.window.document.body.innerHTML
}

function removeHoverClassOption(code) {
  const dom = new JSDOM(code)
  var relevantElements = dom.window.document.getElementsByClassName('hover')

  ;[].forEach.call(relevantElements, function (element) {
    element.classList.remove('hover')
  })

  return dom.window.document.body.innerHTML
}

export {
  dragAndDropFile,
  delay,
  removeElementAttributes,
  loadFile,
  saveFile,
  removeClassAttrFromSpecificSVGs,
  removeHoverClassOption,
  readSmallJSON,
}
