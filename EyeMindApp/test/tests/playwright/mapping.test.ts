import { _electron as electron } from "playwright";
import { test, expect } from "@playwright/test";
import {dragAndDropFile,delay,loadFile, readSmallJSON} from "../utils/utils";
const fs = require("fs");
const request = require('request-promise');


/* 
Notes: 
	- ET server python code needs to be running in testMode
	- Tests should be executed sequentially and no other tests should be running in parrallel (the ET server should be communicate with only one thread at a time)
*/

// increase tests timeout
test.setTimeout(100000)

test.describe("mapping-after-data-collection-is-over", async() => {

	test("mapping-after-data-collection-is-over-no-link", async () => {


	  const electronApp = await electron.launch({ args: ["."] });
	  const firstWindow = await electronApp.firstWindow();
	  

	  // except no errors in console.error()
	  firstWindow.on("console", (message) => {
	    if (message.type() === "error") {
	       expect(message.text()).toBe("");
	    }
	  })

	  // inject styleparameters used during the data collection
	  
	  	//const styleParameters = loadFile('test/data/recording/no-link/styleParameters.css');
		//await firstWindow.evaluate(styleParameters => {
		//	  document.head.innerHTML = "<style>"+styleParameters+"</style>";
		//}, styleParameters);


	  const globalParameters =  await firstWindow.evaluate(() => {return window.globalParameters});


		// load a session start a fake recording // the data is not relevant, this is just to allow stopping the recording afterwards

		await firstWindow.locator('id=eye-tracking').click();
		await firstWindow.locator('id=load-session').click();

		await dragAndDropFile(firstWindow,'id=upload-zone','test/data/import-view/sessions/links/session-no-link.json','session-no-link.json'); 

		await  delay(3000);

		await firstWindow.locator('id=record-btn').click();
		await firstWindow.locator('id=submit-recording-form').click();
		// a delay for ET to start and start ET snapshot to be record
		await  delay(2000);

		//send mock recording data // the paths are in EyeMind\EyeTrackingServer\
		const gazeDataFilename = "test/data/recording/no-link/ETdata.bem"
		const snapshotsContentDataFilename = "test/data/recording/no-link/snapshots.bem"
		const mockRecordingData = {"action": 'mockRecording', "gazeDataFilename": gazeDataFilename, "snapshotsContentDataFilename": snapshotsContentDataFilename}
		await request({
		method: globalParameters.COMMUNICATION_METHOD_TO_ET_SERVER,
		uri: globalParameters.COMMUNICATION_URI_TO_ET_SERVER,
		body: mockRecordingData,
		json: true
		});

		/// stop-recording 
		await firstWindow.locator('id=stop-btn').click();

		// wait 60 second for the mapping to be completed. This time can be changed depending the machine used
		await delay(30000)


		const obtaineMappedGazeData = await firstWindow.evaluate(async() => {
			const serverState = await window.state.getState();
			 return serverState.processedGazeData.gazeData;
			
		}); 

		

		const loadedState = readSmallJSON("test/data/recording/no-link/stateWithMappedGazeData.json");
		const expectedMappedGazeData = loadedState.processedGazeData.gazeData

		// assertions on the mapping
		obtaineMappedGazeData.forEach((gazePoint, index) => {
			//console.log("checking gazepoint",index);
			expect(gazePoint.Timestamp).toBe(expectedMappedGazeData[index].Timestamp);
			expect.soft(gazePoint.element).toBe(expectedMappedGazeData[index].element);
			expect(gazePoint.tabName).toBe(expectedMappedGazeData[index].tabName);
		})
		

	});









	test("mapping-after-data-collection-is-over-new-tab", async () => {



	  const electronApp = await electron.launch({ args: ["."] });
	  const firstWindow = await electronApp.firstWindow();
	  

	  // except no errors in console.error()
	  firstWindow.on("console", (message) => {
	    if (message.type() === "error") {
	       expect(message.text()).toBe("");
	    }
	  })

	  // inject styleparameters used during the data collection
	  
	  //	const styleParameters = loadFile('test/data/recording/new-tab/styleParameters.css');
	  //	await firstWindow.evaluate(styleParameters => {
	 //	  document.head.innerHTML = "<style>"+styleParameters+"</style>";
	//	}, styleParameters);


	  const globalParameters =  await firstWindow.evaluate(() => {return window.globalParameters});


		// load a session start a fake recording // the data is not relevant, this is just to allow stopping the recording afterwards

		await firstWindow.locator('id=eye-tracking').click();
		await firstWindow.locator('id=load-session').click();

		await dragAndDropFile(firstWindow,'id=upload-zone','test/data/import-view/sessions/links/session-new-tab.json','session-new-tab.json'); 

		await  delay(3000);

		await firstWindow.locator('id=record-btn').click();
		await firstWindow.locator('id=submit-recording-form').click();
		// a delay for ET to start and start ET snapshot to be record
		await  delay(2000);

		//send mock recording data // the paths are in EyeMind\EyeTrackingServer\
		const gazeDataFilename = "test/data/recording/new-tab/ETdata.bem"
		const snapshotsContentDataFilename = "test/data/recording/new-tab/snapshots.bem"
		const mockRecordingData = {"action": 'mockRecording', "gazeDataFilename": gazeDataFilename, "snapshotsContentDataFilename": snapshotsContentDataFilename}
		await request({
		method: globalParameters.COMMUNICATION_METHOD_TO_ET_SERVER,
		uri: globalParameters.COMMUNICATION_URI_TO_ET_SERVER,
		body: mockRecordingData,
		json: true
		});

		/// stop-recording 
		await firstWindow.locator('id=stop-btn').click();

		// wait 60 second for the mapping to be completed. This time can be changed depending the machine used
		await delay(30000)


		const obtaineMappedGazeData = await firstWindow.evaluate(async() => {
			const serverState = await window.state.getState();
			 return serverState.processedGazeData.gazeData;
			
		}); 

		

		const loadedState = readSmallJSON("test/data/recording/new-tab/stateWithMappedGazeData.json");
		const expectedMappedGazeData = loadedState.processedGazeData.gazeData

		// assertions on the mapping
		obtaineMappedGazeData.forEach((gazePoint, index) => {
			//console.log("checking gazepoint",index);
			expect(gazePoint.Timestamp).toBe(expectedMappedGazeData[index].Timestamp);
			expect.soft(gazePoint.element).toBe(expectedMappedGazeData[index].element);
			expect(gazePoint.tabName).toBe(expectedMappedGazeData[index].tabName);
		})
		

	});



	test("mapping-after-data-collection-is-over-within-tab", async () => {



	  const electronApp = await electron.launch({ args: ["."] });
	  const firstWindow = await electronApp.firstWindow();
	  

	  // except no errors in console.error()
	  firstWindow.on("console", (message) => {
	    if (message.type() === "error") {
	       expect(message.text()).toBe("");
	    }
	  })

	  // inject styleparameters used during the data collection
	  
	  //	const styleParameters = loadFile('test/data/recording/within-tab/styleParameters.css');
	  //	await firstWindow.evaluate(styleParameters => {
	 //	  document.head.innerHTML = "<style>"+styleParameters+"</style>";
	//	}, styleParameters);


	  const globalParameters =  await firstWindow.evaluate(() => {return window.globalParameters});


		// load a session start a fake recording // the data is not relevant, this is just to allow stopping the recording afterwards

		await firstWindow.locator('id=eye-tracking').click();
		await firstWindow.locator('id=load-session').click();

		await dragAndDropFile(firstWindow,'id=upload-zone','test/data/import-view/sessions/links/session-within-tab.json','session-within-tab.json'); 

		await  delay(3000);

		await firstWindow.locator('id=record-btn').click();
		await firstWindow.locator('id=submit-recording-form').click();
		// a delay for ET to start and start ET snapshot to be record
		await  delay(2000);

		//send mock recording data // the paths are in EyeMind\EyeTrackingServer\
		const gazeDataFilename = "test/data/recording/within-tab/ETdata.bem"
		const snapshotsContentDataFilename = "test/data/recording/within-tab/snapshots.bem"
		const mockRecordingData = {"action": 'mockRecording', "gazeDataFilename": gazeDataFilename, "snapshotsContentDataFilename": snapshotsContentDataFilename}
		await request({
		method: globalParameters.COMMUNICATION_METHOD_TO_ET_SERVER,
		uri: globalParameters.COMMUNICATION_URI_TO_ET_SERVER,
		body: mockRecordingData,
		json: true
		});

		/// stop-recording 
		await firstWindow.locator('id=stop-btn').click();

		// wait 60 second for the mapping to be completed. This time can be changed depending the machine used
		await delay(30000)


		const obtaineMappedGazeData = await firstWindow.evaluate(async() => {
			const serverState = await window.state.getState();
			 return serverState.processedGazeData.gazeData;
			
		}); 

		

		const loadedState = readSmallJSON("test/data/recording/within-tab/stateWithMappedGazeData.json");
		const expectedMappedGazeData = loadedState.processedGazeData.gazeData

		// assertions on the mapping
		obtaineMappedGazeData.forEach((gazePoint, index) => {
			//console.log("checking gazepoint",index);
			expect(gazePoint.Timestamp).toBe(expectedMappedGazeData[index].Timestamp);
			expect.soft(gazePoint.element).toBe(expectedMappedGazeData[index].element);
			expect(gazePoint.tabName).toBe(expectedMappedGazeData[index].tabName);
		})
		

	});

});