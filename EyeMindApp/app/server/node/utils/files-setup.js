const fs = require('fs');
const path = require('path');
const json = require('big-json');
const {getState,setState,setheatmapActive} = require('../dataModels/state')


function readState(file,state,mainWindow) {

	// read JSON and Save state
	const readStream = fs.createReadStream(file);
	const parseStream = json.createParseStream();


	parseStream.on('data', function(data) {

		if(state.temp.expectedArtifact=="analysis") {

			const res = {};
			res.msg = "File "+file+" read";
			res.data = data.models; // updated to send only the models
			res.sucess = true;
			mainWindow.webContents.send('modelsRead',res);
			
			// populate state for the server with the data obtained from the file
			state = populateState(state,data);
	   
	        // Save state in sever
			setState(state);
		}

		else if(state.temp.expectedArtifact=="session") {
			
			const res = readSession(data);
			mainWindow.webContents.send('sessionRead',res);

		}
	
		else {

			const msg = "Unknown expectedArtifact";
			console.error(msg);
			/// eror reported only on the sever side
		}	
		

	});

	parseStream.on('error', function(error) {

		console.error(error);
		const res = {};
		const msg = "An error occured while reading the file";
		res.msg = msg;
		res.sucess = false;

		if(state.temp.expectedArtifact=="analysis") {
			mainWindow.webContents.send('modelsRead',res);
		}
		else if(state.temp.expectedArtifact=="session") {
			mainWindow.webContents.send('sessionRead',res);
		}

	});


	readStream.pipe(parseStream);




}

function readSession(loadedState) {

	var res = {};

	if(!loadedState.processedGazeData.hasOwnProperty('gazeData')) {
		res.data = loadedState;
		res.msg = "State Loaded";
		res.sucess = true;
	} 

	else {
		res.data = null;
		res.msg = "Could not load the session file because it contains gaze data already";
		res.sucess = false;
	}

	return res;

}


function populateState(state,loadedState) {
    
      state.snapshots = loadedState.snapshots;
      state.snapshotsCounter= loadedState.snapshotsCounter;
      state.processedGazeData = loadedState.processedGazeData;
  
      state.models =  loadedState.models;
      state.questions = loadedState.questions;
      state.styleParameters = loadedState.styleParameters;

      state.isEtOn = loadedState.isEtOn;
      state.linkingSubProcessesMode = loadedState.linkingSubProcessesMode;
      
      // control flow depending on whether the file comes directly from a data-collection or an analysis has been already applied
      if(loadedState.mode=="data-collection") {
        console.log("The file comes directly from a data-collection. Starting new analysis");

      // initiate or use existing value of state.processedGazeData.areGazesCorrected
      state.processedGazeData.areGazesCorrected = false;
      }

      else if(loadedState.mode=="analysis") {
        console.log("Exisiting analysis");
      if(loadedState.processedGazeData.fixationData!=null) {
        // parse fixation data (which enable heatmap options)
        //state.processedGazeData.fixationData = new DataFrame(JSON.parse(loadedState.processedGazeData.fixationData));
        state.processedGazeData.fixationData = loadedState.processedGazeData.fixationData;
      }
      }

      // initiate or use existing value of state.processedGazeData.areGazesCorrected
      state.processedGazeData.areGazesCorrected = state.processedGazeData.areGazesCorrected==null ? false: state.processedGazeData.areGazesCorrected

	// add an additional attribute --- to decide later whether to keep here or remove
	setheatmapActive(false)

	return state; 
	
}


exports.readState = readState;

