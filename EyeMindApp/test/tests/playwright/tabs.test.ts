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

test('open-new-tab-from-model', async () => {
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

  await firstWindow.locator('id=record-btn').click()
  await firstWindow.locator('id=submit-recording-form').click()
  // a delay for ET to start
  await delay(2000)

  await firstWindow.locator('id=modelpmainprocessbpmn').click()
  await firstWindow.locator('[data-element-id="p_4_certifydocuments.bpmn"]').click()

  const expectedTab = 'p_4_certifydocuments.bpmn'

  // delay for tab to open
  await delay(1000)

  const activeTab = await firstWindow.evaluate(() => {
    return window.clientTests.getClientState().activeTab
  })

  expect(activeTab).toBe(expectedTab)
})

test('close-tabs-and-leave-no-tab-visible', async () => {
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

  await firstWindow.locator('id=record-btn').click()
  await firstWindow.locator('id=submit-recording-form').click()
  // a delay for ET to start
  await delay(2000)

  await firstWindow.locator('id=modelpmainprocessbpmn').click()
  await firstWindow
    .locator('[data-element-id="p_3_approveandsigndocuments.bpmn"]')
    .click()
  await firstWindow.locator('id=modelpmainprocessbpmn').click()
  await firstWindow.locator('[data-element-id="p_4_certifydocuments.bpmn"]').click()
  await firstWindow
    .locator(
      '[data-element-id="close-button-tab-link-to_p_3_approveandsigndocuments.bpmn"]',
    )
    .click()
  await firstWindow
    .locator('[data-element-id="close-button-tab-link-to_p_4_certifydocuments.bpmn"]')
    .click()

  const expectedTab = ''

  // delay for tab to open
  await delay(1000)

  const activeTab = await firstWindow.evaluate(() => {
    return window.clientTests.getClientState().activeTab
  })

  expect(activeTab).toBe(expectedTab)
})

test('close-an-already-hidden-tab', async () => {
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

  await firstWindow.locator('id=record-btn').click()
  await firstWindow.locator('id=submit-recording-form').click()
  // a delay for ET to start
  await delay(2000)

  await firstWindow.locator('id=modelpmainprocessbpmn').click()
  await firstWindow
    .locator('[data-element-id="p_3_approveandsigndocuments.bpmn"]')
    .click()
  await firstWindow.locator('id=modelpmainprocessbpmn').click()
  await firstWindow.locator('[data-element-id="p_4_certifydocuments.bpmn"]').click()
  await firstWindow
    .locator(
      '[data-element-id="close-button-tab-link-to_p_3_approveandsigndocuments.bpmn"]',
    )
    .click()

  const expectedTab = 'p_4_certifydocuments.bpmn'

  // delay for tab to open
  await delay(1000)

  const activeTab = await firstWindow.evaluate(() => {
    return window.clientTests.getClientState().activeTab
  })

  expect(activeTab).toBe(expectedTab)
})

test('close-tabs-and-check-that-model-is-reset', async () => {
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

  await firstWindow.locator('id=record-btn').click()
  await firstWindow.locator('id=submit-recording-form').click()
  // a delay for ET to start
  await delay(2000)

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

  // a delay for the last snapshot to be recorded
  await delay(1000)

  await firstWindow
    .locator(
      '[data-element-id="close-button-tab-link-to_p_3_approveandsigndocuments.bpmn"]',
    )
    .click()

  // a delay for closing
  await delay(1000)

  // retrieve the transform attribute
  const transformAttribute = await firstWindow.$eval(
    '#modelp3approveandsigndocumentsbpmn-content-modelp3approveandsigndocumentsbpmn-object g.viewport',
    (element) => element.getAttribute('transform'),
  )

  expect(transformAttribute).toBe(null)
})

// the following tests operate only with a screen resolution of 1920*1080. Once this is applied you can ucomment these tests and use them

/*
test("set-scroll-position-openning-context-tabHeaderEndPos<containerWidth", async () => {


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
  // a delay for ET to start
  await  delay(2000);

 await firstWindow.locator('id=modelp52notifyinvolvedpartiesofjournalentryrefusalbpmn-explorerItem').click();

 await firstWindow.locator('id=modelp11fetchandvalidateonlinedatabpmn-explorerItem').click();

 await firstWindow.locator('id=modelp12movemortgagetomaindepotbpmn-explorerItem').click();


  var scrollLeft = await firstWindow.evaluate(() => {

   return document.getElementById("nav-tabs").scrollLeft

  });

  expect(scrollLeft).toBe(0);

});


test("set-scroll-position-openning-context-tabHeaderEndPos>containerWidth", async () => {


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
  // a delay for ET to start 
  await  delay(2000);

 await firstWindow.locator('id=modelp1gatherdatabpmn-explorerItem').click();
 await firstWindow.locator('id=modelp11fetchandvalidateonlinedatabpmn-explorerItem').click();
 await firstWindow.locator('id=modelp12movemortgagetomaindepotbpmn-explorerItem').click();
 await firstWindow.locator('id=modelp2generatedocumentbpmn-explorerItem').click();
 await firstWindow.locator('id=modelp21generateandappendreturncoversheetsbpmn-explorerItem').click();
 await firstWindow.locator('id=modelp3approveandsigndocumentsbpmn-explorerItem').click();
 await firstWindow.locator('id=modelp4certifydocumentsbpmn-explorerItem').click();
 await firstWindow.locator('id=modelp51notifyinvolvedpartiesofjournalentrybpmn-explorerItem').click();
 await firstWindow.locator('id=modelp52notifyinvolvedpartiesofjournalentryrefusalbpmn-explorerItem').click();
 await firstWindow.locator('id=modelp53notifyinvolvedpartiesofmainbookbpmn-explorerItem').click();
 await firstWindow.locator('id=modelp54notifyinvolvedpartiesofmainbookrejectionbpmn-explorerItem').click();
 await firstWindow.locator('id=modelp5submittolandregistrybpmn-explorerItem').click();
 await firstWindow.locator('id=modelp6bookmortgagesbpmn-explorerItem').click();
 await firstWindow.locator('id=modelp7notifypartnersofcompletionbpmn-explorerItem').click();


  var scrollLeft = await firstWindow.evaluate(() => {
 
   return document.getElementById("nav-tabs").scrollLeft

  });

  expect(scrollLeft).toBe(2560);

});

test("set-scroll-position-changing-tabheader-is-within-nav-tabs-ViewStart-nav-tabs-ViewEnd", async () => {


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
  // a delay for ET to start 
  await  delay(2000);

 await firstWindow.locator('id=modelp1gatherdatabpmn-explorerItem').click();
 await firstWindow.locator('id=modelp11fetchandvalidateonlinedatabpmn-explorerItem').click();
 await firstWindow.locator('id=modelp12movemortgagetomaindepotbpmn-explorerItem').click();
 await firstWindow.locator('id=modelp2generatedocumentbpmn-explorerItem').click();
 await firstWindow.locator('id=modelp21generateandappendreturncoversheetsbpmn-explorerItem').click();
 await firstWindow.locator('id=modelp3approveandsigndocumentsbpmn-explorerItem').click();
 await firstWindow.locator('id=modelp4certifydocumentsbpmn-explorerItem').click();
 await firstWindow.locator('id=modelp51notifyinvolvedpartiesofjournalentrybpmn-explorerItem').click();
 await firstWindow.locator('id=modelp52notifyinvolvedpartiesofjournalentryrefusalbpmn-explorerItem').click();
 await firstWindow.locator('id=modelp53notifyinvolvedpartiesofmainbookbpmn-explorerItem').click();
 await firstWindow.locator('id=modelp54notifyinvolvedpartiesofmainbookrejectionbpmn-explorerItem').click();
 await firstWindow.locator('id=modelp5submittolandregistrybpmn-explorerItem').click();
 await firstWindow.locator('id=modelp6bookmortgagesbpmn-explorerItem').click();
 await firstWindow.locator('id=modelp7notifypartnersofcompletionbpmn-explorerItem').click();

 await firstWindow.locator('id=modelp5submittolandregistrybpmn-explorerItem').click();


  var scrollLeft = await firstWindow.evaluate(() => {
 
   return document.getElementById("nav-tabs").scrollLeft

  });

  expect(scrollLeft).toBe(2560);

});


test("set-scroll-position-changing-tabheader-is-not-within-nav-tabs-ViewStart-nav-tabs-ViewEnd", async () => {


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
  // a delay for ET to start 
  await  delay(2000);

 await firstWindow.locator('id=modelp1gatherdatabpmn-explorerItem').click();
 await firstWindow.locator('id=modelp11fetchandvalidateonlinedatabpmn-explorerItem').click();
 await firstWindow.locator('id=modelp12movemortgagetomaindepotbpmn-explorerItem').click();
 await firstWindow.locator('id=modelp2generatedocumentbpmn-explorerItem').click();
 await firstWindow.locator('id=modelp21generateandappendreturncoversheetsbpmn-explorerItem').click();
 await firstWindow.locator('id=modelp3approveandsigndocumentsbpmn-explorerItem').click();
 await firstWindow.locator('id=modelp4certifydocumentsbpmn-explorerItem').click();
 await firstWindow.locator('id=modelp51notifyinvolvedpartiesofjournalentrybpmn-explorerItem').click();
 await firstWindow.locator('id=modelp52notifyinvolvedpartiesofjournalentryrefusalbpmn-explorerItem').click();
 await firstWindow.locator('id=modelp53notifyinvolvedpartiesofmainbookbpmn-explorerItem').click();
 await firstWindow.locator('id=modelp54notifyinvolvedpartiesofmainbookrejectionbpmn-explorerItem').click();
 await firstWindow.locator('id=modelp5submittolandregistrybpmn-explorerItem').click();
 await firstWindow.locator('id=modelp6bookmortgagesbpmn-explorerItem').click();
 await firstWindow.locator('id=modelp7notifypartnersofcompletionbpmn-explorerItem').click();
 
 await firstWindow.locator('id=modelp11fetchandvalidateonlinedatabpmn-explorerItem').click();

  var scrollLeft = await firstWindow.evaluate(() => {
 
   return document.getElementById("nav-tabs").scrollLeft

  });

  expect(scrollLeft).toBe(395);

});
*/
