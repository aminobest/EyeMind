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

test('loaded-content-view-no-link-between-sub-processes', async () => {
  const electronApp = await electron.launch({ args: ['.'] })
  const firstWindow = await electronApp.firstWindow()

  // except no errors in console.error()
  firstWindow.on('console', (message) => {
    if (message.type() === 'error') {
      expect(message.text()).toBe('')
    }
  })

  await firstWindow.locator('id=eye-tracking').click()
  await firstWindow.locator('id=new-session').click()
  await firstWindow.locator('id=linking-sub-processes').selectOption('no')
  await firstWindow.locator('id=proceed-data-collection-settings').click()

  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/models/p_1_gatherdata.bpmn',
    'p_1_gatherdata.bpmn',
  )
  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/models/p_1_1_fetchandvalidateonlinedata.bpmn',
    'p_1_1_fetchandvalidateonlinedata.bpmn',
  )
  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/models/p_1_2_movemortgagetomaindepot.bpmn',
    'p_1_2_movemortgagetomaindepot.bpmn',
  )
  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/models/p_2_generatedocument.bpmn',
    'p_2_generatedocument.bpmn',
  )
  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/models/p_2_1_generateandappendreturncoversheets.bpmn',
    'p_2_1_generateandappendreturncoversheets.bpmn',
  )
  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/models/p_3_approveandsigndocuments.bpmn',
    'p_3_approveandsigndocuments.bpmn',
  )
  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/models/p_4_certifydocuments.bpmn',
    'p_4_certifydocuments.bpmn',
  )
  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/models/p_5_1_notifyinvolvedpartiesofjournalentry.bpmn',
    'p_5_1_notifyinvolvedpartiesofjournalentry.bpmn',
  )
  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/models/p_5_2_notifyinvolvedpartiesofjournalentryrefusal.bpmn',
    'p_5_2_notifyinvolvedpartiesofjournalentryrefusal.bpmn',
  )
  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/models/p_5_3_notifyinvolvedpartiesofmainbook.bpmn',
    'p_5_3_notifyinvolvedpartiesofmainbook.bpmn',
  )
  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/models/p_5_4_notifyinvolvedpartiesofmainbookrejection.bpmn',
    'p_5_4_notifyinvolvedpartiesofmainbookrejection.bpmn',
  )
  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/models/p_5_submittolandregistry.bpmn',
    'p_5_submittolandregistry.bpmn',
  )
  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/models/p_7_notifypartnersofcompletion.bpmn',
    'p_7_notifypartnersofcompletion.bpmn',
  )
  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/models/p_mainprocess.bpmn',
    'p_mainprocess.bpmn',
  )

  await firstWindow.locator('id=process-files').click()

  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/questions/questionSet.csv',
    'questionSet.csv',
  )

  const expectedLinkingSubProcessesMode = 'no'

  // a for the material to load
  await delay(3000)

  const linkingSubProcessesMode = await firstWindow.evaluate(() => {
    return window.clientTests.getClientState().linkingSubProcessesMode
  })

  expect(linkingSubProcessesMode).toBe(expectedLinkingSubProcessesMode)
})

test('loaded-content-view-newTab-link-between-sub-processes', async () => {
  const electronApp = await electron.launch({ args: ['.'] })
  const firstWindow = await electronApp.firstWindow()

  // except no errors in console.error()
  firstWindow.on('console', (message) => {
    if (message.type() === 'error') {
      expect(message.text()).toBe('')
    }
  })

  await firstWindow.locator('id=eye-tracking').click()
  await firstWindow.locator('id=new-session').click()
  await firstWindow.locator('id=linking-sub-processes').selectOption('newTab')
  await firstWindow.locator('id=proceed-data-collection-settings').click()

  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/models/p_1_gatherdata.bpmn',
    'p_1_gatherdata.bpmn',
  )
  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/models/p_1_1_fetchandvalidateonlinedata.bpmn',
    'p_1_1_fetchandvalidateonlinedata.bpmn',
  )
  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/models/p_1_2_movemortgagetomaindepot.bpmn',
    'p_1_2_movemortgagetomaindepot.bpmn',
  )
  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/models/p_2_generatedocument.bpmn',
    'p_2_generatedocument.bpmn',
  )
  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/models/p_2_1_generateandappendreturncoversheets.bpmn',
    'p_2_1_generateandappendreturncoversheets.bpmn',
  )
  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/models/p_3_approveandsigndocuments.bpmn',
    'p_3_approveandsigndocuments.bpmn',
  )
  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/models/p_4_certifydocuments.bpmn',
    'p_4_certifydocuments.bpmn',
  )
  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/models/p_5_1_notifyinvolvedpartiesofjournalentry.bpmn',
    'p_5_1_notifyinvolvedpartiesofjournalentry.bpmn',
  )
  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/models/p_5_2_notifyinvolvedpartiesofjournalentryrefusal.bpmn',
    'p_5_2_notifyinvolvedpartiesofjournalentryrefusal.bpmn',
  )
  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/models/p_5_3_notifyinvolvedpartiesofmainbook.bpmn',
    'p_5_3_notifyinvolvedpartiesofmainbook.bpmn',
  )
  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/models/p_5_4_notifyinvolvedpartiesofmainbookrejection.bpmn',
    'p_5_4_notifyinvolvedpartiesofmainbookrejection.bpmn',
  )
  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/models/p_5_submittolandregistry.bpmn',
    'p_5_submittolandregistry.bpmn',
  )
  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/models/p_7_notifypartnersofcompletion.bpmn',
    'p_7_notifypartnersofcompletion.bpmn',
  )
  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/models/p_mainprocess.bpmn',
    'p_mainprocess.bpmn',
  )

  await firstWindow.locator('id=process-files').click()

  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/questions/questionSet.csv',
    'questionSet.csv',
  )

  const expectedLinkingSubProcessesMode = 'newTab'

  // a for the material to load
  await delay(3000)

  const linkingSubProcessesMode = await firstWindow.evaluate(() => {
    return window.clientTests.getClientState().linkingSubProcessesMode
  })

  expect(linkingSubProcessesMode).toBe(expectedLinkingSubProcessesMode)
})

test('loaded-content-view-withinTab-link-between-sub-processes', async () => {
  const electronApp = await electron.launch({ args: ['.'] })
  const firstWindow = await electronApp.firstWindow()

  // except no errors in console.error()
  firstWindow.on('console', (message) => {
    if (message.type() === 'error') {
      expect(message.text()).toBe('')
    }
  })

  await firstWindow.locator('id=eye-tracking').click()
  await firstWindow.locator('id=new-session').click()
  await firstWindow.locator('id=linking-sub-processes').selectOption('withinTab')
  await firstWindow.locator('id=proceed-data-collection-settings').click()

  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/models/p_1_gatherdata.bpmn',
    'p_1_gatherdata.bpmn',
  )
  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/models/p_1_1_fetchandvalidateonlinedata.bpmn',
    'p_1_1_fetchandvalidateonlinedata.bpmn',
  )
  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/models/p_1_2_movemortgagetomaindepot.bpmn',
    'p_1_2_movemortgagetomaindepot.bpmn',
  )
  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/models/p_2_generatedocument.bpmn',
    'p_2_generatedocument.bpmn',
  )
  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/models/p_2_1_generateandappendreturncoversheets.bpmn',
    'p_2_1_generateandappendreturncoversheets.bpmn',
  )
  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/models/p_3_approveandsigndocuments.bpmn',
    'p_3_approveandsigndocuments.bpmn',
  )
  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/models/p_4_certifydocuments.bpmn',
    'p_4_certifydocuments.bpmn',
  )
  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/models/p_5_1_notifyinvolvedpartiesofjournalentry.bpmn',
    'p_5_1_notifyinvolvedpartiesofjournalentry.bpmn',
  )
  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/models/p_5_2_notifyinvolvedpartiesofjournalentryrefusal.bpmn',
    'p_5_2_notifyinvolvedpartiesofjournalentryrefusal.bpmn',
  )
  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/models/p_5_3_notifyinvolvedpartiesofmainbook.bpmn',
    'p_5_3_notifyinvolvedpartiesofmainbook.bpmn',
  )
  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/models/p_5_4_notifyinvolvedpartiesofmainbookrejection.bpmn',
    'p_5_4_notifyinvolvedpartiesofmainbookrejection.bpmn',
  )
  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/models/p_5_submittolandregistry.bpmn',
    'p_5_submittolandregistry.bpmn',
  )
  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/models/p_7_notifypartnersofcompletion.bpmn',
    'p_7_notifypartnersofcompletion.bpmn',
  )
  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/models/p_mainprocess.bpmn',
    'p_mainprocess.bpmn',
  )

  await firstWindow.locator('id=process-files').click()

  await dragAndDropFile(
    firstWindow,
    'id=upload-zone',
    'test/data/import-view/questions/questionSet.csv',
    'questionSet.csv',
  )

  const expectedLinkingSubProcessesMode = 'withinTab'

  // a for the material to load
  await delay(3000)

  const linkingSubProcessesMode = await firstWindow.evaluate(() => {
    return window.clientTests.getClientState().linkingSubProcessesMode
  })

  expect(linkingSubProcessesMode).toBe(expectedLinkingSubProcessesMode)
})

test('loaded-content-view-no-link-between-sub-processes-from-loaded-session', async () => {
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

  const expectedLinkingSubProcessesMode = 'no'

  // a for the material to load
  await delay(3000)

  const linkingSubProcessesMode = await firstWindow.evaluate(() => {
    return window.clientTests.getClientState().linkingSubProcessesMode
  })

  expect(linkingSubProcessesMode).toBe(expectedLinkingSubProcessesMode)
})

test('loaded-content-view-new-tab-link-between-sub-processes-from-loaded-session', async () => {
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

  const expectedLinkingSubProcessesMode = 'newTab'

  // a for the material to load
  await delay(3000)

  const linkingSubProcessesMode = await firstWindow.evaluate(() => {
    return window.clientTests.getClientState().linkingSubProcessesMode
  })

  expect(linkingSubProcessesMode).toBe(expectedLinkingSubProcessesMode)
})

test('loaded-content-view-within-tab-link-between-sub-processes-from-loaded-session', async () => {
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

  const expectedLinkingSubProcessesMode = 'withinTab'

  // a for the material to load
  await delay(3000)

  const linkingSubProcessesMode = await firstWindow.evaluate(() => {
    return window.clientTests.getClientState().linkingSubProcessesMode
  })

  expect(linkingSubProcessesMode).toBe(expectedLinkingSubProcessesMode)
})
