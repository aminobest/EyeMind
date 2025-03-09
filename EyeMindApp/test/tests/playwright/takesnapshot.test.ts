/* events associated with snapshots 


file-setup.js
	createModel
		canvas.viewbox.changed
			takesnapshot

canavas.js
	resetNavTabsAndTabs (implemented in question interactions - when a question shows up)
		takesnapshot

tabs.js
  changeTab
    takesnapshot
	closeTabInteraction
		takesnapshot

window-events.js (tested manually on 24/09/2022, no automated testing, as these wont occur for now)
	takeSnapshotOnWindowResize
		takesnapshot
	takeSnapshotOnWindowMovement
		takesnapshot

*/
import { expect, test } from '@playwright/test'
import { _electron as electron } from 'playwright'
import { elementAttributesToRemove } from '../utils/globals'
import {
  delay,
  dragAndDropFile,
  loadFile,
  removeElementAttributes,
  saveFile,
} from '../utils/utils'

const fs = require('fs')

/* note: these tests require the ET server to be running with testMode argument  */

test('takesnapshot-start-tracking-DueTo-start-questions-dueTo-resetNavTabsAndTabs', async () => {
  const electronApp = await electron.launch({ args: ['.'] })
  const firstWindow = await electronApp.firstWindow()

  // except no errors in console.error()
  firstWindow.on('console', (message) => {
    if (message.type() === 'error') {
      expect(message.text()).toBe('')
    }
  })

  await firstWindow.locator('id=eye-tracking').click()
  await firstWindow.locator('id=load-session').click()

  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/sessions/links/session-no-link.json',
    'session-no-link.json',
  )

  await delay(3000)

  await firstWindow.locator('id=record-btn').click()
  await firstWindow.locator('id=submit-recording-form').click()
  // a dely for ET to start and start ET snapshot to be record
  await delay(2000)

  const snapshot = await firstWindow.evaluate(() => {
    return window.clientTests.lastSnapshot
  })

  expect.soft(snapshot.screenX).toBe(0)
  expect.soft(snapshot.screenY).toBe(0)
  expect.soft(snapshot.id).toBe(0)
  expect.soft(snapshot.tabName).toBe('p_mainprocess.bpmn')
})

test('takesnapshot-canvas-view-changed', async () => {
  const electronApp = await electron.launch({ args: ['.'] })
  const firstWindow = await electronApp.firstWindow()

  // except no errors in console.error()
  firstWindow.on('console', (message) => {
    if (message.type() === 'error') {
      expect(message.text()).toBe('')
    }
  })

  await firstWindow.locator('id=eye-tracking').click()
  await firstWindow.locator('id=load-session').click()

  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/sessions/links/session-no-link.json',
    'session-no-link.json',
  )

  await delay(3000)

  await firstWindow.locator('id=record-btn').click()
  await firstWindow.locator('id=submit-recording-form').click()
  // a dely for ET to start and start ET snapshot to be record
  await delay(2000)

  await firstWindow.mouse.move(800, 600)

  await firstWindow.mouse.wheel(200, 400)
  // a delay for the snapshot to be recorded
  await delay(1000)

  const snapshot = await firstWindow.evaluate(() => {
    return window.clientTests.lastSnapshot
  })

  expect.soft(snapshot.screenX).toBe(0)
  expect.soft(snapshot.screenY).toBe(0)
  expect.soft(snapshot.id).toBe(1)
  expect.soft(snapshot.tabName).toBe('p_mainprocess.bpmn')
})

test('takesnapshot-canvas-view-changed-multiple-times', async () => {
  const electronApp = await electron.launch({ args: ['.'] })
  const firstWindow = await electronApp.firstWindow()

  // except no errors in console.error()
  firstWindow.on('console', (message) => {
    if (message.type() === 'error') {
      expect(message.text()).toBe('')
    }
  })

  await firstWindow.locator('id=eye-tracking').click()
  await firstWindow.locator('id=load-session').click()

  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/sessions/links/session-no-link.json',
    'session-no-link.json',
  )

  await delay(3000)

  await firstWindow.locator('id=record-btn').click()
  await firstWindow.locator('id=submit-recording-form').click()
  // a dely for ET to start and start ET snapshot to be record
  await delay(2000)

  await firstWindow.mouse.move(800, 600)

  await firstWindow.mouse.wheel(200, 400)
  // a delay to notify the canvas view changed
  await delay(500)

  await firstWindow.mouse.wheel(100, 200)
  // a delay to notify the canvas view changed
  await delay(500)

  await firstWindow.mouse.wheel(400, 300)
  // a delay to notify the canvas view changed
  await delay(500)

  await firstWindow.mouse.wheel(200, 400)
  // a delay to notify the canvas view changed
  await delay(500)

  // a delay for the last snapshot to be recorded
  await delay(1000)

  const snapshot = await firstWindow.evaluate(() => {
    return window.clientTests.lastSnapshot
  })

  expect.soft(snapshot.screenX).toBe(0)
  expect.soft(snapshot.screenY).toBe(0)
  expect.soft(snapshot.id).toBe(4)
  expect.soft(snapshot.tabName).toBe('p_mainprocess.bpmn')
})

test('takesnapshot-on-reset-nav-tabs-and-tabs', async () => {
  const electronApp = await electron.launch({ args: ['.'] })
  const firstWindow = await electronApp.firstWindow()

  // except no errors in console.error()
  firstWindow.on('console', (message) => {
    if (message.type() === 'error') {
      expect(message.text()).toBe('')
    }
  })

  await firstWindow.locator('id=eye-tracking').click()
  await firstWindow.locator('id=load-session').click()

  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/sessions/links/session-new-tab.json',
    'session-new-tab.json',
  )

  await delay(3000)

  // start ET recording
  await firstWindow.locator('id=record-btn').click()
  await firstWindow.locator('id=submit-recording-form').click()
  // a dely for ET to start and start ET snapshot to be record
  await delay(2000)

  await firstWindow.mouse.move(800, 600)

  // save an initial snapshot
  const initialSnapshot = await firstWindow.evaluate(() => {
    return window.document.body.outerHTML
  })

  // open some tabs and scroll
  await firstWindow.locator('[data-element-id="p_1_gatherdata.bpmn"]').click()

  await firstWindow.mouse.wheel(200, 400)
  // a delay to notify the canvas view changed
  await delay(500)

  await firstWindow.mouse.wheel(100, 200)
  // a delay to notify the canvas view changed
  await delay(500)

  await firstWindow.mouse.wheel(400, 300)
  // a delay to notify the canvas view changed
  await delay(500)

  // a delay for the last snapshot to be recorded
  await delay(1000)

  await firstWindow.locator('id=modelpmainprocessbpmn').click()

  await firstWindow
    .locator('[data-element-id="p_3_approveandsigndocuments.bpmn"]')
    .click()

  await firstWindow.mouse.move(800, 600)

  await firstWindow.mouse.wheel(200, 400)
  // a delay to notify the canvas view changed
  await delay(500)

  await firstWindow.mouse.wheel(100, 200)
  // a delay to notify the canvas view changed
  await delay(500)

  await firstWindow.mouse.wheel(400, 300)
  // a delay to notify the canvas view changed
  await delay(500)

  // reset nav tabs and tabs
  await firstWindow.evaluate(() => {
    return window.clientTests.resetNavTabsAndTabs(1)
  })

  // a delay for the last snapshot to be recorded
  await delay(1000)

  const snapshot = await firstWindow.evaluate(() => {
    return window.clientTests.lastSnapshot
  })

  expect.soft(snapshot.screenX).toBe(0)
  expect.soft(snapshot.screenY).toBe(0)
  expect.soft(snapshot.id).toBe(10)
  expect.soft(snapshot.tabName).toBe('p_mainprocess.bpmn')
})

test('takesnapshot-next-question-interactions-dueToresetNavTabsAndTabs', async () => {
  const electronApp = await electron.launch({ args: ['.'] })
  const firstWindow = await electronApp.firstWindow()

  // except no errors in console.error()
  firstWindow.on('console', (message) => {
    if (message.type() === 'error') {
      expect(message.text()).toBe('')
    }
  })

  await firstWindow.locator('id=eye-tracking').click()
  await firstWindow.locator('id=load-session').click()

  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/sessions/links/session-no-link.json',
    'session-no-link.json',
  )

  await delay(3000)

  await firstWindow.locator('id=record-btn').click()
  await firstWindow.locator('id=submit-recording-form').click()
  // a dely for ET to start and start ET snapshot to be record
  await delay(2000)

  await firstWindow.mouse.move(800, 600)

  await firstWindow.mouse.wheel(200, 400)
  // a delay to notify the canvas view changed
  await delay(500)

  await firstWindow.mouse.wheel(100, 200)
  // a delay to notify the canvas view changed
  await delay(500)

  await firstWindow.mouse.wheel(400, 300)
  // a delay to notify the canvas view changed
  await delay(500)

  await firstWindow.mouse.wheel(200, 400)
  // a delay to notify the canvas view changed
  await delay(500)

  await firstWindow.locator('id=next-question0-btn').click()
  await firstWindow.locator('id=next-question1-btn').click()

  // a delay for the last snapshot to be recorded
  await delay(1000)

  const snapshot = await firstWindow.evaluate(() => {
    return window.clientTests.lastSnapshot
  })

  expect.soft(snapshot.screenX).toBe(0)
  expect.soft(snapshot.screenY).toBe(0)
  expect.soft(snapshot.id).toBe(6)
  expect.soft(snapshot.tabName).toBe('p_mainprocess.bpmn')
})

test('takesnapshot-on-change-tab-dueToresetNavTabsAndTabs', async () => {
  const electronApp = await electron.launch({ args: ['.'] })
  const firstWindow = await electronApp.firstWindow()

  // except no errors in console.error()
  firstWindow.on('console', (message) => {
    if (message.type() === 'error') {
      expect(message.text()).toBe('')
    }
  })

  await firstWindow.locator('id=eye-tracking').click()
  await firstWindow.locator('id=load-session').click()

  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/sessions/links/session-no-link.json',
    'session-no-link.json',
  )

  await delay(3000)

  await firstWindow.locator('id=record-btn').click()
  await firstWindow.locator('id=submit-recording-form').click()
  // a dely for ET to start and start ET snapshot to be record
  await delay(2000)

  await firstWindow.locator('id=modelp4certifydocumentsbpmn-explorerItem').click()

  // a delay for the last snapshot to be recorded
  await delay(1000)

  const snapshot = await firstWindow.evaluate(() => {
    return window.clientTests.lastSnapshot
  })

  expect.soft(snapshot.screenX).toBe(0)
  expect.soft(snapshot.screenY).toBe(0)
  expect.soft(snapshot.id).toBe(1)
  expect.soft(snapshot.tabName).toBe('p_4_certifydocuments.bpmn')
})

test('takesnapshot-on-close-tab-leave-no-tab-shown', async () => {
  const electronApp = await electron.launch({ args: ['.'] })
  const firstWindow = await electronApp.firstWindow()

  // except no errors in console.error()
  firstWindow.on('console', (message) => {
    if (message.type() === 'error') {
      expect(message.text()).toBe('')
    }
  })

  await firstWindow.locator('id=eye-tracking').click()
  await firstWindow.locator('id=load-session').click()

  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/sessions/links/session-no-link.json',
    'session-no-link.json',
  )

  await delay(3000)

  await firstWindow.locator('id=record-btn').click()
  await firstWindow.locator('id=submit-recording-form').click()
  // a dely for ET to start and start ET snapshot to be record
  await delay(2000)

  await firstWindow.locator('id=modelp4certifydocumentsbpmn-explorerItem').click()
  await firstWindow
    .locator('[data-element-id="close-button-tab-link-to_p_4_certifydocuments.bpmn"]')
    .click()

  // a delay for the last snapshot to be recorded
  await delay(1000)

  const snapshot = await firstWindow.evaluate(() => {
    return window.clientTests.lastSnapshot
  })

  expect.soft(snapshot.screenX).toBe(0)
  expect.soft(snapshot.screenY).toBe(0)
  expect.soft(snapshot.id).toBe(2)
  expect.soft(snapshot.tabName).toBe('')
})

test('takesnapshot-on-close-tab-leave-a-tab-shown', async () => {
  const electronApp = await electron.launch({ args: ['.'] })
  const firstWindow = await electronApp.firstWindow()

  // except no errors in console.error()
  firstWindow.on('console', (message) => {
    if (message.type() === 'error') {
      expect(message.text()).toBe('')
    }
  })

  await firstWindow.locator('id=eye-tracking').click()
  await firstWindow.locator('id=load-session').click()

  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/sessions/links/session-no-link.json',
    'session-no-link.json',
  )

  await delay(3000)

  await firstWindow.locator('id=record-btn').click()
  await firstWindow.locator('id=submit-recording-form').click()
  // a dely for ET to start and start ET snapshot to be record
  await delay(2000)

  await firstWindow.locator('id=modelp3approveandsigndocumentsbpmn-explorerItem').click()
  await firstWindow.locator('id=modelp4certifydocumentsbpmn-explorerItem').click()
  await firstWindow
    .locator(
      '[data-element-id="close-button-tab-link-to_p_3_approveandsigndocuments.bpmn"]',
    )
    .click()

  // a delay for the last snapshot to be recorded
  await delay(1000)

  const snapshot = await firstWindow.evaluate(() => {
    return window.clientTests.lastSnapshot
  })

  expect.soft(snapshot.screenX).toBe(0)
  expect.soft(snapshot.screenY).toBe(0)
  expect.soft(snapshot.id).toBe(3)
  expect.soft(snapshot.tabName).toBe('p_4_certifydocuments.bpmn')
})

//// mechanisms to preview/delay the effects on the window before it closes
//test.setTimeout(1200000) //
//await  delay(1200000);
