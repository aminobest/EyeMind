import { expect, test } from '@playwright/test'
import { _electron as electron } from 'playwright'
import { elementAttributesToRemove } from '../utils/globals'
import {
  delay,
  dragAndDropFile,
  loadFile,
  removeClassAttrFromSpecificSVGs,
  removeElementAttributes,
  removeHoverClassOption,
  saveFile,
} from '../utils/utils'

const fs = require('fs')

test('reset-model', async () => {
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
    'test/data/import-view/sessions/links/session-within-tab.json',
    'session-within-tab.json',
  )

  await delay(3000)

  await firstWindow.evaluate(() => {
    window.clientTests.openMainTabInWithinTabLinks(1)
  })

  await delay(2000)

  await firstWindow.locator('[data-element-id="p_1_gatherdata.bpmn"]').click()

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

  // a delay for the last snapshot to be recorded
  await delay(1000)

  const data = { fileId: 'p1gatherdatabpmn' }

  const TransformsOfElemtsToReset = await firstWindow.evaluate((data) => {
    const container = document.querySelector('[id="model' + data.fileId + '-container"]')
    const djs_overlay_container = container.querySelectorAll(
      '[class="djs-overlay-container"]',
    )
    const viewport = container.querySelectorAll('[class="viewport"]')

    return {
      djs_overlay_container: {
        'transform': djs_overlay_container[0].style.getPropertyValue('transform'),
        'transform-origin': djs_overlay_container[0].style.getPropertyValue('transform'),
      },
      viewport: viewport[0].getAttribute('transform'),
    }
  }, data)

  // reset model and return new transforms of elemts after reset
  const TransformsOfElemtsAfterReset = await firstWindow.evaluate((data) => {
    window.clientTests.resetModel(data.fileId)

    const container = document.querySelector('[id="model' + data.fileId + '-container"]')
    const djs_overlay_container = container.querySelectorAll(
      '[class="djs-overlay-container"]',
    )
    const viewport = container.querySelectorAll('[class="viewport"]')

    return {
      djs_overlay_container: {
        transform: djs_overlay_container[0].style.getPropertyValue('transform'),
        transformOrigin:
          djs_overlay_container[0].style.getPropertyValue('transform-origin'),
      },
      viewport: viewport[0].getAttribute('transform'),
    }
  }, data)

  //console.log("before reset ",TransformsOfElemtsToReset);
  //console.log("after reset ",TransformsOfElemtsAfterReset);

  // asserts
  expect.soft(TransformsOfElemtsToReset.djs_overlay_container.transform != '')
  expect.soft(TransformsOfElemtsToReset.djs_overlay_container.transformOrigin != '')
  expect.soft(TransformsOfElemtsToReset.viewport != null)

  expect.soft(TransformsOfElemtsAfterReset.djs_overlay_container.transform == '')
  expect.soft(TransformsOfElemtsAfterReset.djs_overlay_container.transformOrigin == '')
  expect.soft(TransformsOfElemtsAfterReset.viewport == null)

  // expect(bodyContent).toBe(expectedContent);
})

test('reset-nav-tabs-and-tabs-no-link-mode', async () => {
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

  // start ET recording
  await firstWindow.locator('id=record-btn').click()
  await firstWindow.locator('id=submit-recording-form').click()
  // a dely for ET to start and start ET snapshot to be record
  await delay(2000)

  await firstWindow.mouse.move(800, 600)

  // save an initial snapshot
  let initialSnapshot = await firstWindow.evaluate(() => {
    return window.document.body.outerHTML
  })

  // open some tabs and scroll
  await firstWindow.locator('id=modelp3approveandsigndocumentsbpmn-explorerItem').click()

  await firstWindow.mouse.wheel(100, 200)
  // a delay to notify the canvas view changed
  await delay(500)

  await delay(2000)

  await firstWindow.mouse.wheel(400, 300)
  // a delay to notify the canvas view changed
  await delay(500)

  // a delay for the last snapshot to be recorded
  await delay(1000)

  await firstWindow.locator('id=modelp4certifydocumentsbpmn-explorerItem').click()

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

  // save a pre-reset snapshot
  let preResetSnapshot = await firstWindow.evaluate(() => {
    return window.document.body.outerHTML
  })

  // reset nav tabs and tabs
  await firstWindow.evaluate(() => {
    return window.clientTests.resetNavTabsAndTabs(1)
  })

  // delay for the changes to occur
  await delay(500)

  // save a post-reset state
  let postResetSnapshot = await firstWindow.evaluate(() => {
    return window.document.body.outerHTML
  })

  //saveFile("postResetSnapshot.html",postResetSnapshot.replace(/>/g, ">\n"))
  //saveFile("initialSnapshot.html",initialSnapshot.replace(/>/g, ">\n"))

  //because of the following difference between snapshots (altough similar) remove the class attribute for svg tags with width="100%" height="100%"
  //-<svg width="100%" height="100%" data-element-id="Collaboration_1u5663f" class="">
  //+<svg width="100%" height="100%" data-element-id="Collaboration_1u5663f">

  initialSnapshot = removeClassAttrFromSpecificSVGs(
    removeHoverClassOption(initialSnapshot),
  )
  preResetSnapshot = removeClassAttrFromSpecificSVGs(
    removeHoverClassOption(preResetSnapshot),
  )
  postResetSnapshot = removeClassAttrFromSpecificSVGs(
    removeHoverClassOption(postResetSnapshot),
  )

  // assertions
  expect.soft(initialSnapshot).not.toBe(preResetSnapshot)
  expect.soft(preResetSnapshot).not.toBe(postResetSnapshot)
  expect.soft(postResetSnapshot).toBe(initialSnapshot)
})

test('reset-nav-tabs-and-tabs-new-tab-mode', async () => {
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
  let initialSnapshot = await firstWindow.evaluate(() => {
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

  // save a pre-reset snapshot
  let preResetSnapshot = await firstWindow.evaluate(() => {
    return window.document.body.outerHTML
  })

  // reset nav tabs and tabs
  await firstWindow.evaluate(() => {
    return window.clientTests.resetNavTabsAndTabs(1)
  })

  // delay for the changes to occur
  await delay(1000)

  // save a post-reset state
  let postResetSnapshot = await firstWindow.evaluate(() => {
    return window.document.body.outerHTML
  })

  // because of the following difference between snapshots (altough similar) remove the class attribute for svg tags with width="100%" height="100%"
  // -<svg width="100%" height="100%" data-element-id="Collaboration_1u5663f" class="">
  // +<svg width="100%" height="100%" data-element-id="Collaboration_1u5663f">

  initialSnapshot = removeClassAttrFromSpecificSVGs(
    removeHoverClassOption(initialSnapshot),
  )
  preResetSnapshot = removeClassAttrFromSpecificSVGs(
    removeHoverClassOption(preResetSnapshot),
  )
  postResetSnapshot = removeClassAttrFromSpecificSVGs(
    removeHoverClassOption(postResetSnapshot),
  )

  // assertions
  expect.soft(initialSnapshot).not.toBe(preResetSnapshot)
  expect.soft(preResetSnapshot).not.toBe(postResetSnapshot)
  expect.soft(postResetSnapshot).toBe(initialSnapshot)
})

test('reset-nav-tabs-and-tabs-within-tab-mode', async () => {
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
    'test/data/import-view/sessions/links/session-within-tab.json',
    'session-within-tab.json',
  )

  await delay(3000)

  // start ET recording
  await firstWindow.locator('id=record-btn').click()
  await firstWindow.locator('id=submit-recording-form').click()
  // a dely for ET to start and start ET snapshot to be record
  await delay(2000)

  await firstWindow.mouse.move(800, 600)

  // save an initial snapshot
  let initialSnapshot = await firstWindow.evaluate(() => {
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

  await firstWindow.locator('id=process-hierarchy-sub-process-link-to_main').click()

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

  // save a pre-reset snapshot
  let preResetSnapshot = await firstWindow.evaluate(() => {
    return window.document.body.outerHTML
  })

  // reset nav tabs and tabs
  await firstWindow.evaluate(() => {
    return window.clientTests.resetNavTabsAndTabs(1)
  })

  // delay for the changes to occur
  await delay(1000)

  // save a post-reset state
  let postResetSnapshot = await firstWindow.evaluate(() => {
    return window.document.body.outerHTML
  })

  //because of the following difference between snapshots (altough similar) remove the class attribute for svg tags with width="100%" height="100%"
  //-<svg width="100%" height="100%" data-element-id="Collaboration_1u5663f" class="">
  //+<svg width="100%" height="100%" data-element-id="Collaboration_1u5663f">

  initialSnapshot = removeClassAttrFromSpecificSVGs(
    removeHoverClassOption(initialSnapshot),
  )
  preResetSnapshot = removeClassAttrFromSpecificSVGs(
    removeHoverClassOption(preResetSnapshot),
  )
  postResetSnapshot = removeClassAttrFromSpecificSVGs(
    removeHoverClassOption(postResetSnapshot),
  )

  // assertions
  expect.soft(initialSnapshot).not.toBe(preResetSnapshot)
  expect.soft(preResetSnapshot).not.toBe(postResetSnapshot)
  expect.soft(postResetSnapshot).toBe(initialSnapshot)
})
