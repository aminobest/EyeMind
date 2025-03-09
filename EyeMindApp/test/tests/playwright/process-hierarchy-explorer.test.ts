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

test('process-hierarchy-explorer-browser-2-hierarchy-levels', async () => {
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
  await firstWindow
    .locator('[data-element-id="p_1_2_movemortgagetomaindepot.bpmn"]')
    .click()

  // delay
  await delay(1000)

  const expectedTab = 'p_1_2_movemortgagetomaindepot.bpmn'

  const activeTab = await firstWindow.evaluate(() => {
    return window.clientTests.getClientState().activeTab
  })

  expect(activeTab).toBe(expectedTab)
})

test('process-hierarchy-explorer-browser-2-hierarchy-levels-back', async () => {
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
  await firstWindow
    .locator('[data-element-id="p_1_2_movemortgagetomaindepot.bpmn"]')
    .click()

  await firstWindow
    .locator('[data-element-id="process-hierarchy-sub-process-link-to_Gather Data"]')
    .click()
  await firstWindow
    .locator('[data-element-id="process-hierarchy-sub-process-link-to_main"]')
    .click()

  // delay
  await delay(1000)

  const expectedTab = 'p_mainprocess.bpmn'

  const activeTab = await firstWindow.evaluate(() => {
    return window.clientTests.getClientState().activeTab
  })

  expect(activeTab).toBe(expectedTab)
})

test('process-hierarchy-explorer-browser-2-hierarchy-levels-back-then-2-forward', async () => {
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
  await firstWindow
    .locator('[data-element-id="p_1_2_movemortgagetomaindepot.bpmn"]')
    .click()

  await firstWindow
    .locator('[data-element-id="process-hierarchy-sub-process-link-to_Gather Data"]')
    .click()
  await firstWindow
    .locator('[data-element-id="process-hierarchy-sub-process-link-to_main"]')
    .click()

  await firstWindow.locator('[data-element-id="p_2_generatedocument.bpmn"]').click()
  await firstWindow
    .locator('[data-element-id="p_2_1_generateandappendreturncoversheets.bpmn"]')
    .click()

  // delay
  await delay(1000)

  const expectedTab = 'p_2_1_generateandappendreturncoversheets.bpmn'

  const activeTab = await firstWindow.evaluate(() => {
    return window.clientTests.getClientState().activeTab
  })

  expect(activeTab).toBe(expectedTab)
})
