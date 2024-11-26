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

const { app, BrowserWindow, webFrame } = require('electron')
const path = require('path')

const { windowListeners } = require('./listeners/window')
const {
  fixationFilterListeners,
  shutdownFixationFilterServer,
} = require('./listeners/fixation-filter')
const { analysisListeners } = require('./listeners/analysis')
const { fileSetupListener } = require('./listeners/files-setup')
const { downloadListener } = require('./listeners/download')
const { eyeTrackerListeners } = require('./listeners/eye-tracker')
const { stateListeners } = require('./listeners/state')
const { sessionListeners } = require('./listeners/session')
const { testListeners } = require('./listeners/test')

// Create the browser window.
function createWindow() {
  const mainWindow = new BrowserWindow({
    // fullscreen: true,
    // resizable: false,
    autoHideMenuBar: true,
    title: 'EyeMind',
    show: false,
    ///frame: false,

    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  mainWindow.maximize()
  mainWindow.show()

  // used for the pop up windows
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url === 'about:blank') {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          frame: false,
          fullscreen: false,
          backgroundColor: '#E7EAED',
        },
      }
    }
    return { action: 'deny' }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('public/index.html')

  // initiate set listeners
  stateListeners()

  // initiate window listeners
  windowListeners(mainWindow)

  // initiate fixation filter (R) listeners
  fixationFilterListeners(mainWindow)

  // initiate analysis listener
  analysisListeners(mainWindow)

  // initiate download listener
  downloadListener()

  // initiate file-setup listener
  fileSetupListener(mainWindow)

  // initiate eye-tracker listeners
  eyeTrackerListeners(mainWindow)

  // initiate session listeners
  sessionListeners()

  // initiate initiate test listeners
  testListeners()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', async function () {
  await shutdownFixationFilterServer()

  // quit electron app
  if (process.platform !== 'darwin') app.quit()
})
