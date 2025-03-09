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

test('file-explorer-open-file-tab', async () => {
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

  const expectedTab = 'p_5_2_notifyinvolvedpartiesofjournalentryrefusal.bpmn'

  await delay(3000)

  await firstWindow.locator('id=record-btn').click()
  await firstWindow.locator('id=submit-recording-form').click()
  // a delay for ET to start
  await delay(2000)

  await firstWindow
    .locator('id=modelp52notifyinvolvedpartiesofjournalentryrefusalbpmn-explorerItem')
    .click()

  // delay for tab to open
  await delay(1000)

  const activeTab = await firstWindow.evaluate(() => {
    return window.clientTests.getClientState().activeTab
  })

  expect(activeTab).toBe(expectedTab)
})
