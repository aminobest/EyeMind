/* 
	Tested clicks
			- Question component:
				- next-button-inner-in-questionID_ ok
				- long-answer-for-questionID_ ok
				- option-answer-radio-for-question_ ok
			- Tabs
				- tab-link-to_ ok
				- close-button-tab-link-to_ ok
			- File explorer
				-  file-explorer-file_ ok 
			- Process explore
				- process-hierarchy-sub-process-link-to_
			- BPMN model
				- sub-process activity id

*/
import { expect, test } from '@playwright/test'
import { _electron as electron } from 'playwright'
import { delay, dragAndDropFile } from '../utils/utils'

const fs = require('fs')

test('click-next-button-inner-in-questionID', async () => {
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
  // a delay for ET to start and start ET snapshot to be record
  await delay(2000)

  await firstWindow.locator('id=next-question0-btn').click()

  // a delay for the lastRelevantClick to update
  await delay(1000)

  const lastRelevantClick = await firstWindow.evaluate(() => {
    return window.clientTests.lastRelevantClick
  })

  expect.soft(lastRelevantClick.clickedElement).toBe('next-button-inner-in-questionID_1')
})

/*
test("click-long-answer-for-questionID", async () => {


  const electronApp = await electron.launch({ args: ["."] });
  const firstWindow = await electronApp.firstWindow();


  // except no errors in console.error()
  firstWindow.on("console", (message) => {
    if (message.type() === "error") {
       expect(message.text()).toBe("");
    }
  })


  await firstWindow.locator('id=eye-tracking').click();
  await firstWindow.locator('id=load-session').click();

  await dragAndDropFile(firstWindow,'id=upload-zone','test/data/import-view/sessions/links/session-no-link.json','session-no-link.json'); 

  await  delay(3000);

  await firstWindow.locator('id=record-btn').click();
  await firstWindow.locator('id=submit-recording-form').click();
  // a delay for ET to start and start ET snapshot to be record
  await  delay(2000);


  await firstWindow.locator('id=long-answer-question0-answer').click();

  // a delay for the lastRelevantClick to update
  await  delay(1000);

  const lastRelevantClick = await firstWindow.evaluate(() => {return window.clientTests.lastRelevantClick});

  expect.soft(lastRelevantClick.clickedElement).toBe("long-answer-for-questionID_1");
 
});
*/

test('click-tab-link-to', async () => {
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
  // a delay for ET to start and start ET snapshot to be record
  await delay(2000)

  await firstWindow
    .locator('[data-element-id="tab-header-tab-link-to_p_mainprocess.bpmn"]')
    .click()

  // a delay for the lastRelevantClick to update
  await delay(1000)

  const lastRelevantClick = await firstWindow.evaluate(() => {
    return window.clientTests.lastRelevantClick
  })

  expect.soft(lastRelevantClick.clickedElement).toBe('tab-link-to_p_mainprocess.bpmn')
})

test('click-close-button-tab-link-to', async () => {
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
  // a delay for ET to start and start ET snapshot to be record
  await delay(2000)

  await firstWindow.locator('id=modelp3approveandsigndocumentsbpmn-explorerItem').click()
  await firstWindow.locator('id=modelp4certifydocumentsbpmn-explorerItem').click()
  await firstWindow
    .locator(
      '[data-element-id="close-button-tab-link-to_p_3_approveandsigndocuments.bpmn"]',
    )
    .click()

  // a delay for the lastRelevantClick to update
  await delay(1000)

  const lastRelevantClick = await firstWindow.evaluate(() => {
    return window.clientTests.lastRelevantClick
  })

  expect
    .soft(lastRelevantClick.clickedElement)
    .toBe('close-button-tab-link-to_p_3_approveandsigndocuments.bpmn')
})

test('click-file-explorer-file', async () => {
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
  // a delay for ET to start and start ET snapshot to be record
  await delay(2000)

  await firstWindow.locator('id=modelp3approveandsigndocumentsbpmn-explorerItem').click()

  // a delay for the lastRelevantClick to update
  await delay(1000)

  const lastRelevantClick = await firstWindow.evaluate(() => {
    return window.clientTests.lastRelevantClick
  })

  expect
    .soft(lastRelevantClick.clickedElement)
    .toBe('file-explorer-file_p_3_approveandsigndocuments.bpmn')
})

test('click-process-hierarchy-sub-process-link-to', async () => {
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

  await firstWindow.locator('id=record-btn').click()
  await firstWindow.locator('id=submit-recording-form').click()
  // a delay for ET to start and start ET snapshot to be record
  await delay(2000)

  await firstWindow.locator('[data-element-id="p_1_gatherdata.bpmn"]').click()
  await firstWindow
    .locator('[data-element-id="p_1_2_movemortgagetomaindepot.bpmn"]')
    .click()

  await firstWindow
    .locator('[data-element-id="process-hierarchy-sub-process-link-to_Gather Data"]')
    .click()

  // a delay for the lastRelevantClick to update
  await delay(1000)

  const lastRelevantClick = await firstWindow.evaluate(() => {
    return window.clientTests.lastRelevantClick
  })

  expect
    .soft(lastRelevantClick.clickedElement)
    .toBe('process-hierarchy-sub-process-link-to_Gather Data')
})

test('click-sub-process-activity-id', async () => {
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

  await firstWindow.locator('id=record-btn').click()
  await firstWindow.locator('id=submit-recording-form').click()
  // a delay for ET to start and start ET snapshot to be record
  await delay(2000)

  await firstWindow.locator('[data-element-id="p_1_gatherdata.bpmn"]').click()
  await firstWindow
    .locator('[data-element-id="p_1_2_movemortgagetomaindepot.bpmn"]')
    .click()

  // a delay for the lastRelevantClick to update
  await delay(1000)

  const lastRelevantClick = await firstWindow.evaluate(() => {
    return window.clientTests.lastRelevantClick
  })

  expect.soft(lastRelevantClick.clickedElement).toBe('p_1_2_movemortgagetomaindepot.bpmn')
})
