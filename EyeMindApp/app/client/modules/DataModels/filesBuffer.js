var files = []

function setFiles(vals) {
  Array.from(vals).forEach((val) => files.push(val))
}

function shiftFile() {
  return files.shift()
}

function nFiles() {
  return files.length
}

export { setFiles, shiftFile, nFiles }
