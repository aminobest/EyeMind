const { app, ipcMain } = require('electron')
const path = require('path')
const child = require('child_process')
const request = require('request-promise')
const { globalParameters } = require('../globals')
const {
  fixationFilter,
} = require('../app/server/node/connectors/fixation-filter')
const {
  setLocalRpid,
  getLocalRpid,
} = require('../app/server/node/dataModels/processes')

const fs = require('fs')
const detect = require('detect-port')

var kill = require('tree-kill')

function fixationFilterListeners(mainWindow) {
  //console.log("fixationFilterListener function",arguments);

  ipcMain.once('startRserver', async function () {
    /* lunch R server */
    console.log('start R server')

    const suggestedPort = await detect(globalParameters.R_PORT)

    if (suggestedPort != globalParameters.R_PORT) {
      console.log('killing old running R instance')
      const childRProcessID = JSON.parse(
        fs.readFileSync(
          path.join(app.getAppPath(), globalParameters.LAST_CONFIG_FILE_PATH)
        )
      )['childRProcessID']
      kill(childRProcessID)
    }

    var mainRPath = path
      .join(
        app.getAppPath(),
        'app',
        'server',
        'R',
        'fixationDetection',
        'main.R'
      )
      .replace(/\\/g, '\\\\')
    var execPath = path.join(
      app.getAppPath(),
      'environments',
      'R',
      'bin',
      'RScript.exe'
    )

    const childRProcess = child.spawn(execPath, [
      '-e',
      "library(plumber); pr('" +
        mainRPath +
        "') %>% pr_run(port=" +
        globalParameters.R_PORT +
        ');',
    ])
    childRProcess.stdout.on('data', (data) => {
      console.log(`stdout -:${data}`)

      // log RserverPid
      if (globalParameters.R_SERVER_PID_PRINT_PATTERN.test(data)) {
        logRserverPid(
          globalParameters.R_SERVER_PID_PRINT_PATTERN.exec(data.toString())[1]
        )
      }
    })
    childRProcess.stderr.on('data', (data) => {
      console.log(`stderr -:${data}`)
    })
  })

  ipcMain.handle('fixationFilter', function (e, args) {
    args.push(mainWindow)
    return fixationFilter(...args)
  })
}

function logRserverPid(childRProcessID) {
  console.log('logRserverPid', arguments)
  // setLocalRpid
  setLocalRpid(childRProcessID)
  // save the childRProcessID into a file to termine the process if found already running when re-starting the app
  const objectToSave = { childRProcessID: childRProcessID }
  fs.writeFileSync(
    path.join(app.getAppPath(), globalParameters.LAST_CONFIG_FILE_PATH),
    JSON.stringify(objectToSave)
  )
}

async function shutdownFixationFilterServer() {
  console.log('shutdownFixationFilterServer function', arguments)

  var childRProcessID = getLocalRpid()

  if (childRProcessID != -1) {
    kill(childRProcessID)
  }

  //await request({method: globalParameters.COMMUNICATION_METHOD_TO_R_SERVER, uri: globalParameters.COMMUNICATION_HOST_TO_R_SERVER+":"+globalParameters.R_PORT+"/quit", body:""})
}

exports.fixationFilterListeners = fixationFilterListeners
exports.shutdownFixationFilterServer = shutdownFixationFilterServer
