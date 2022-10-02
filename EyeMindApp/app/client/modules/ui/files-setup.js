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

/*  Files setup   */ 

import BpmnModeler from 'bpmn-js/lib/Modeler';
import BpmnNavigatedViewer from 'bpmn-js/lib/NavigatedViewer';

import OdmModeler from '../../../../extra/object-diagram-modeler/lib/Modeler';
import OdmNavigatedViewer from '../../../../extra/object-diagram-modeler/lib/NavigatedViewer';

import {takesnapshot} from './data-collection'
import {cancelDefault,readFileContent} from '../utils/utils'

import {prepareDataCollectionContent} from './data-collection'
import {addToTabHeader,changeTab,openInTab,openWithinTab} from './tabs'
import {loadQuestions} from './questions'
import {loadModels} from './shared-interactions'
import {enableHeatmapOption} from './heatmap'

import {sendClickEvent} from './click-stream'

import {showGeneralWaitingScreen, hideGeneralWaitingScreen} from './progress'

import {infoAlert,errorAlert} from '../utils/utils'
import {hideElement} from '../utils/dom'



import {addModel} from '../DataModels/generalModelsRegistry'
import {setState,getState} from '../dataModels/state'


import DataFrame from "dataframe-js";
import $ from 'jquery';

// types of modeler objects supported by the tool
const modelers = {"BpmnModeler":BpmnModeler,
"BpmnNavigatedViewer":BpmnNavigatedViewer, 
"OdmModeler":OdmModeler,
"OdmNavigatedViewer":OdmNavigatedViewer
}




/**
 * Title: register file upload
 *
 * Description: file upload listeners handling the drag and drop interactions to the upload-zone
 *
 * Control-flow summary: set container to document.getElementById("upload-zone") and add event listeners for dragover and drop events
 *
 * @param {void} . .
 *
 * Returns {void}
 *
*
 * Additional notes: none
 *
 */
function registerFileUpload() {

  console.log("registerFileUpload",arguments);


  var container = document.getElementById("upload-zone"); 

  /// drag and drop event listeners
  container.addEventListener('dragover', handleDragOver, false);
  container.addEventListener('drop', function(e) {handleDroppedFiles(e);}  , false); 

  
}


/**
 * Title: handle drag over
 *
 * Description: handling of drag over event 
 *
 * Control-flow summary: cancel default interaction, set e.dataTransfer.dropEffect to copy 
 *
 * @param {void} . .
 *
 * Returns {void}
 *
*
 * Additional notes: none
 *
 */
function handleDragOver(e) {

  console.log("handleDragOver function",arguments);

  cancelDefault(e);

  e.dataTransfer.dropEffect = 'copy'; 
}


/**
 * Title: handle dropped files
 *
 * Description: handle files when they are dropped
 *
 * Control-flow summary: cancel default interaction, get list of dropped items, differ execution denpending on the state.importMode (i.e., multiple or single), call traverseItemTree or traverseItem depending on tate.importMode. traverseItemTree allows to delve into directories
 *
 * @param {object} event
 *
 * Returns {void}
 *
*
 * Additional notes: none
 *
 */
async function handleDroppedFiles(event) {

    console.log("handleDroppedFiles",arguments);

    //////////////////////////////////////////////////////
    // a hack to support the testing of a single file upload using the drag/drop feature as the testing library playwright have an issue with webkitGetAsEntry returning always null
    if(event.dataTransfer.isForTestingPurpose) {
      traverseItem(event.dataTransfer.files[0],"");
      return;
    }
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    var state = getState();

    cancelDefault(event);

    // get dropped items
    const items = event.dataTransfer.items;


    //  differ execution denpending on the state.importMode
    // state.importMode=="multiple"
    if(state.importMode=="multiple") {

      console.log("multiple files import mode");
      
      // iterate the through the different items
      for (let i=0; i<items.length; i++) {

        // get item
        const item = items[i].webkitGetAsEntry();
        console.log("item",item);
        if (item) {
            // traverse the item tree to delve into any potential directories
            await traverseItemTree(item);
          }

      
      }

    }
    // state.importMode=="single"
    else if(state.importMode=="single") {

      console.log("single file import mode");

      // ensure that you have only one single item
      if(items.length==1 && items[0].webkitGetAsEntry().isFile) {

        // traverse the item
        items[0].webkitGetAsEntry().file(async function(file) {
          await traverseItem(file, "/"); 
        });

      }
      // not a single item
      else {
        const msg = "only a single file can be imported"; // check third argument 
        console.error(msg);
        errorAlert(msg);
      }
      
    }

}


/**
 * Title: traverse item tree
 *
 * Description: iterate over items and differ the execution depending on whether the item is a file or a directory. 
 *
 * Control-flow summary: iterate over items and differ the execution depending on whether the item is a file or a directory. If the item is a file then call traverseItem() if the item is a directory then recurseively call traverseItemTree() for the directory
 *
 * @param {object} item item 
 * @param {string} path item path 
 *
 * Returns {void}
 *
*
 * Additional notes: the function calls either traverseItem or traverseItemTree
 *
 */
async function traverseItemTree(item, path) {

  console.log("traverseItemTree", arguments);

  path = path || "";

  /// apply a different processing depending on whether the item is a file or a directory
  // item.isFile
  if (item.isFile) {
    console.log("item.isFile", item);
    // get file
    item.file(async function(file) {
      await traverseItem(file, path);
    });
  // item.isDirectory
  } else if (item.isDirectory) {
    console.log("item.isDirectory", item);
    // get folder contents
    var dirReader = item.createReader();
    dirReader.readEntries(async function(entries) {
      // iterate through the directory entries
      for (var i=0; i<entries.length; i++) {
        // recursively call traverseItemTree()
        await traverseItemTree(entries[i], path + item.name + "/");
      }

    });
  }
}

/**
 * Title: traverse item 
 *
 * Description: differ the execution depending on whether the item refers to a data-collection file or an analysis file
 *
 * Control-flow summary: get state, apply a different processing depending on whether the item refers to a data-collection file or an analysis file
 *
 * @param {object} file file  
 * @param {string} path file path 
 *
 * Returns {void}
 *
*
 * Additional notes: none
 *
 */
async function traverseItem(file, path) {

      console.log("traverseItem arguments",arguments);

      var state = getState();

      // apply a different processing to the file depending on whether it is a model for data collection or a json file for the analysis
      // data-collection mode
      if(state.mode=="data-collection") {
        // readFileContent then traverseDataCollectionFile
        readFileContent(file, async (content) => { await traverseDataCollectionFile(file,path,content) });      
      }
      // analysis mode
      else if(state.mode=="analysis") {
        // traverseAnalysisFile
        await traverseAnalysisFile(file);
      }
  
 }


/**
 * Title: traverse analysis file 
 *
 * Description: differ the execution depending on whether the item refers to a data-collection file or an analysis file
 *
 * Control-flow summary: get state, get file extentsion, check if the file has the expected extension and artifact for the analysis mode, if so, call window.utils.readState(file.path,state) to read the state within the file in the server side, then call modelsReadListener() to listen to an event incoming from the server side when the models are read
 *
 * @param {object} file file  
 *
 * Returns {void}
 *
*
 * Additional notes: none
 *
 */
async function traverseAnalysisFile(file) {

  console.log("traverseAnalysisFile",arguments);

  var state = getState();

  const fileName = file.name;
  const fileExtension = fileName.split('.').pop();

  var filePath = file.path
  ////////////////////////////////////////////////////////////////////////////////////////////////////////
  // a hack to support the testing of a single file upload using the drag/drop feature
    if(file.isForTestingPurpose) {
      filePath = file.localFilePath;
    }
  ////////////////////////////////////////////////////////////////////////////////////////////////////////


  // check if the file has the expected extension and artifact for the analysis mode
  if(state.temp.expectedExtensions.includes(fileExtension) && state.temp.expectedArtifact=="analysis") {
    
      await showGeneralWaitingScreen("Please wait while the file is being loaded <br> This step can take several minutes depending on the size of the file","wait","all-content");          

      window.utils.readState(filePath,state);

      modelsReadListener();
  }
  else {

      const msg = "unkown analysis file"; 
      errorAlert(msg);
  }

}



/**
 * Title: traverse data collection file 
 *
 * Description: differ the execution depending on whether the item refers to a data-collection file or an analysis file
 *
 * Control-flow summary: get state, get file extension, apply different processing depending on the file extension and expected artifact
 *
 * @param {object} file file  
 *
 * Returns {void}
 *
*
 * Additional notes: none
 *
 */
async function traverseDataCollectionFile(file,path,content) {

    console.log("traverseDataCollectionFile function", arguments);

    var state = getState();

    const fileName = file.name;
    const fileExtension = fileName.split('.').pop();

    console.log("fileExtension",fileExtension);

    /// apply different processing depending on the file extension and expected artifact
    if(state.temp.expectedExtensions.includes(fileExtension) && state.temp.expectedArtifact=="session") {
      // traverseSessionFile
      await traverseSessionFile(file);
    }
    else if(state.temp.expectedExtensions.includes(fileExtension) && state.temp.expectedArtifact=="models") {
      // traverseModelsFile
      await traverseModelsFile(fileName,content,path)
    }
    else if(state.temp.expectedExtensions.includes(fileExtension) && state.temp.expectedArtifact=="questions") {
       // traverseQuestionsFile
      await traverseQuestionsFile(file);
    }

    else {
     const msg = "File type or content not expected"
     errorAlert(msg);
     console.error(msg);
    }

}

/**
 * Title: traverse session file 
 *
 * Description: read the session file in the server side and then call sessionReadListener() to listen to an event incoming from the server side when the session is read
 *
 * Control-flow summary: get state, get file extension, read the session file in the server side and then call sessionReadListener() to listen to an event incoming from the server side when the session is read
 *
 * @param {object} file file  
 *
 * Returns {void}
 *
*
 * Additional notes: none
 *
 */
async function traverseSessionFile(file,callback) {

  console.log("traverseSessionFile",arguments);

  var state = getState();
  
  var filePath = file.path
  ////////////////////////////////////////////////////////////////////////////////////////////////////////
  // a hack to support the testing of a single file upload using the drag/drop feature
    if(file.isForTestingPurpose) {
      filePath = file.localFilePath;
    }
  ////////////////////////////////////////////////////////////////////////////////////////////////////////


  await window.utils.readState(filePath,state,callback);
  sessionReadListener();
}


/**
 * Title: traverse questions file 
 *
 * Description: load the questions from the file and call prepareDataCollectionContent()
 *
 * Control-flow summary: if questions are loaded, then call prepareDataCollectionContent()

 * @param {object} file file  
 *
 * Returns {void}
 *
*
 * Additional notes: prepareDataCollectionContent is called assuming that traversing the questions is the last step of the important process
 *
 */
async function traverseQuestionsFile(file) {

   console.log("traverseQuestionsFile",arguments);

  if(await loadQuestions(file) /* load questions file */) { 
      // last step of file import
      const unclosableTabsDefined = false;
      prepareDataCollectionContent(unclosableTabsDefined);
   } 
}

/**
 * Title: traverse models file 
 *
 * Description: 
 *
 * Control-flow summary: 

 * @param {string} fileName  name of the file  
 * @param {string} content file content 
 *
 * Returns {void}
 *
*
 * Additional notes: none
 *
 */
async function traverseModelsFile(fileName,content,path) {

  console.log("traverseModelsFile",arguments);

  var state = getState();

  const fileId = fileName.replace(new RegExp(window.globalParameters.MODELS_ID_REGEX,"g"),"");

  // if the file has not been already added to the processing buffer
  if(!state.models.hasOwnProperty(fileId)) {

      // create file object
      const file = {"id": fileId, "fileName": fileName,"path": path,"xml": content};

      /// add a new model to the state object
      state.models[fileId] = file

      try {
          // process model
          await processModel(file.xml,file.id,file.fileName,file.path); 
          // create file info menu
          createFileInfoBlock(file);
      }
      catch(error) {
        // something wrong happened with the opening of the diagram
        removeFile(file);
        console.error(file.fileName+" is invalid");
        errorAlert(file.fileName+" is invalid");
      }

  }
  // if not give an alert and log error
  else {
      const msg = fileName+" (id: "+fileId+") is already added"
      errorAlert(msg);
      console.error(msg);
  }


}



/**
 * Title: create file info block
 *
 * Description: creating a file info block with information and setting options about the imported file
 *
 * Control-flow summary: create fileInfo block about the imported model,  hide upload label, fill in the file info block with filename, a radio-box allowing to set the file as a main model and a checkbox allowing to set the tab refering to the model as unclosabled. Then, allow to remove the file

 * @param {object} file file with the following attributes {"id", "fileName" ,"path", "xml"}
 *
 * Returns {void}
 *
*
 * Additional notes: none
 *
 */
function createFileInfoBlock(file) {

    console.log("createFileInfoBlock",arguments);

    var state = getState();

    /// create fileInfo block about the imported model
    const fileInfo = document.createElement("div");
    fileInfo.setAttribute("id", "fileinfo-"+file.id);
    fileInfo.setAttribute("class", "row");

    // hide upload label
    hideElement("upload-label")
    
    // fill in the file info block
    const defaultChecked = state.models[file.id].isMain? "checked" : "";
    fileInfo.innerHTML =
    // file name 
    '<div class="column file-info">'+file.fileName+'</div>'+
    // add a radiobox (i.e., set-as-main-'+file.id+') and select it if the file refers to the main model
    '<div class="column"><input type="radio" class="set-as-main" id="set-as-main-'+file.id+'" name="set-as-main" modelId="'+file.id+'" '+defaultChecked+'/>Set as main</div>'+
    // add a checkbox (i.e., unclosable-tab-'+file.id+') and check it if the file refers to the main model
    '<div class="column"><input class="unclosable-tab" id="unclosable-tab-'+file.id+'" modelId="'+file.id+'" type="checkbox" '+defaultChecked+'/>Unclosable Tab</div>'+
    // add a button allowing to remove the file
    '<div class="column"><button class="remove-btn" id="remove-'+file.id+'"">Remove</button></div>';
    /// add a click event listener call the function to remove the file

    /// add the file info block to the file-list
    document.getElementById("file-list").appendChild(fileInfo);

    document.getElementById("remove-"+file.id).onclick = () => removeFile(file);

}



/**
 * Title: remove file
 *
 * Description: procedure to remove an imported file
 *
 * Control-flow summary: get state, remove the file attribute from state.models and remove the DOM elements related to the file

 * @param {object} file file with the following attributes {"id", "fileName" ,"path", "xml"}
 *
 * Returns {void}
 *
*
 * Additional notes: none
 *
 */
function removeFile(file) {
      console.log("removeFileInfoMenu",arguments);

      var state = getState();
      delete state.models[file.id];
      if(document.getElementById("fileinfo-"+file.id)!=null) document.getElementById("fileinfo-"+file.id).remove();
      document.getElementById("model"+file.id+"-container").remove();
      document.getElementById("model"+file.id+"-explorerItem").remove();
}


/**
 * Title: models read listener
 *
 * Description: a listener that enacts when models are read in the server side
 *
 * Control-flow summary: call modelsRead()

 * @param {void} . .
 *
 * Returns {void}
 *
*
 * Additional notes: none
 *
 */

 function modelsReadListener() {

     console.log("modelsReadListener",arguments);

     window.utils.onModelsRead(async function (args) {

        console.log("onModelsRead", arguments);
        const res = args[0];
        
        await modelsRead(res);

  });

}

/**
 * Title: models read
 *
 * Description: update client state with the models read from the server side and call the methods nessary to prepare the analysis view
 *
 * Control-flow summary: update client state with the models read from the server side and call the methods nessary to prepare the analysis view (i.e., processModel(),  loadModels(), enableHeatmapOption() )

 * @param {object} res an object coming from the server side with the following attributes: sucess (boolean), msg (string) and data (object refering to the models)
 *
 * Returns {void}
 *
*
 * Additional notes: none
 *
 */
 async function modelsRead(res) {

          console.log("modelsRead",arguments);

          // get client state
          var state = getState();

          // if the server res.sucess coming from the server is true
          if(res.sucess) {

              // get models
              const models = res.data;

              console.log("loaded models", models);

              // set state.models to models
              state.models = models;

              //process the open the models within the loaded state
              for (const [key, value] of Object.entries(state.models)) {
                   await processModel(state.models[key].xml,state.models[key].id,state.models[key].fileName,state.models[key].path);
                }
              
              // call load models        
              loadModels();
              // call enable heatmap options to see whether the heatmap options should be enabled or not
              enableHeatmapOption();
          
      }
      else {
          console.error(res.msg);
          errorAlert(res.msg);

      }

      await hideGeneralWaitingScreen("all-content","wait");

 }



/**
 * Title: session read listener
 *
 * Description: a listener that enacts when a session is read in the server side
 *
 * Control-flow summary: call sessionRead()

 * @param {void} . .
 *
 * Returns {void}
 *
*
 * Additional notes: none
 *
 */

 function sessionReadListener() {

     console.log("sessionReadListener",arguments);

     window.utils.onSessionRead(async function (args) {

        console.log("onSessionRead", arguments);
        const res = args[0];
        await sessionRead(res);
       

  });

}

/**
 * Title: session read
 *
 * Description: update client state with the state read in the server side (i.e., refering to the loaded session)
 *
 * Control-flow summary: update client state with the state read in the server side (i.e., refering to the loaded session) and call the methods nessary to prepare the data collection view (i.e., processModel(),  prepareDataCollectionContent() )

 * @param {object} res an object coming from the server side with the following attributes: sucess (boolean), msg (string) and data (state)
 *
 * Returns {void}
 *
*
 * Additional notes: none
 *
 */
async function sessionRead(res) {

    console.log("sessionRead",arguments);

    const sucess = res.sucess;
    const msg = res.msg;
    const data = res.data;

    if(sucess) {

      setState(data);

      var state = getState();
      console.log("state",state);

      //process the open the models within the loaded state
      for (const [key, value] of Object.entries(state.models)) {
         await processModel(state.models[key].xml,state.models[key].id,state.models[key].fileName,state.models[key].path);

      }

      // last step of file import
      const unclosableTabsDefined = true;
      prepareDataCollectionContent(unclosableTabsDefined);


      //infoAlert(msg);
    }
    else {
      console.error(res.msg);
      errorAlert(msg);
    }




}



/**
 * Title: process model 
 *
 * Description: prcessing a model file
 *
 * Control-flow summary:  get state, construct/update the directory explorer, reate tab container, create model,  differ the execution depending on the state.mode (data-collection or analysis), if state.mode=="data-collection" then mark the main model, otherwise if state.mode=="analysis" then add the attributes needed to show the heatmaps
 *
 * @param {string} xml  xml refering to the model content
 * @param {string} id  file id
 * @param {string} fileName  file name
 * @param {string} filePath  file path
 *
 * Returns {void}
 *
*
 * Additional notes: none
 *
 */
async function processModel(xml,id,fileName,filePath) {

  console.log('processModel', arguments);

  // get state
  var state = getState();

   /// construct/update the directory explorer
   constructDirectoryExplorer(filePath,fileName,id); 

    // create tab container
    createTabContainer(id,fileName);

    // create model
    console.log("creating model");
    var modeler = await createModel(fileName,id,xml);
    console.log("model created");

    // differ the execution depending on the state.mode
    if(state.mode=="data-collection") {
        // state.models[id].isMain if the model is the main model of the process (cf. isMain())
        state.models[id].isMain = isMain(modeler)
    }
    if(state.mode=="analysis") {

        // add attributes needed to show the heatmaps
        var generalModelRegistry = {}
        generalModelRegistry.elementRegistry = modeler.get("elementRegistry");
        if(modeler.language=="Bpmn") generalModelRegistry.commandStack = modeler.get("commandStack"); /// odm do not have a commandStack
        generalModelRegistry.overlays = modeler.get("overlays");
        generalModelRegistry.language = modeler.language;
        // add model to the generalModelsRegistry
        addModel(id,generalModelRegistry);

      }

       console.log(fileName, 'is valid');
       
}


/**
 * Title: is main
 *
 * Description: is the model a main model
 *
 * Control-flow summary: get the process id and if modeler.language=="Bpmn" and processId.toLowerCase()=="main", then it is a main model
 *
 * @param {object} modeler  a modeler object
 *
 * Returns {boolean} is the model a main model
 *
*
 * Additional notes: none
 *
 */
function isMain(modeler) {
   
  console.log("isMain",arguments);
  // get the process id
  const processId = modeler.get('canvas').getRootElement().id; 
  console.log("processId", processId);

  /// we consider only BPMN files for now and we assume that the main process id should be "main"
  if(modeler.language=="Bpmn" && processId.toLowerCase()=="main") return true;

  return false;
}



/**
 * Title: construct directory explorer
 *
 * Description: construct the directory explorer
 *
 * Control-flow summary: iterate over the folders and files within the path and populate the directory explorer
 *
 * @param {string} filePath  the path of the file
 * @param {string} fileName  the name of the file
 * @param {string} id  the id of the file
 *
 * Returns {void} 
 *
*
 * Additional notes: none
 *
 */
function constructDirectoryExplorer(filePath,fileName,id) {

  console.log("constructDirectoryExplorer",arguments);

  // get state
  var state = getState();

   /// remove last "/" from the filePath
  filePath = filePath.slice(0,-1);

  /// create/extend the explorer hierarchy
  var dirs = filePath.split("/");
  var path = [];

  // iterate over the folders within the path
  for (let i = 0; i < dirs.length; i++) {
    // for each folder wthin the path

    // push it to path array
    path.push(dirs[i]);

    // if the sub-path (actual path array) does not exist yet
    if(document.getElementById("explorer-group-"+path.join("/"))==null) {
          
          if(dirs[i]!="") {

            // create li and underlying ul with new the sub-path
            var li = document.createElement("li"); 
            li.setAttribute("class", "folder gaze-element");
            li.setAttribute("data-element-id", "file-explorer-folder_"+dirs[i]);

            li.innerHTML = dirs[i];
            var ul = document.createElement("ul");
            ul.setAttribute("id", "explorer-group-"+path.join("/"));
            li.appendChild(ul)
            
            /// if the sub-path has only one folder append it to explorer-groups otherwise append it to its parent
            if(path.length==1) {
              document.getElementById("explorer-groups").appendChild(li);
              }
            else {
              var parent = path.slice(0, -1)
              document.getElementById("explorer-group-"+parent.join("/")).appendChild(li);
            }

          }

      }

    }
    
    // populate the explorer
    var explorerItem = document.createElement("li");
    explorerItem.setAttribute("id", "model"+id+"-explorerItem");
    explorerItem.setAttribute("class", "file gaze-element");
    explorerItem.setAttribute("data-element-id", "file-explorer-file_"+fileName);

    explorerItem.setAttribute("fileName", fileName);
    explorerItem.innerHTML = fileName;
    explorerItem.onclick = function(e) {
      sendClickEvent(Date.now(),explorerItem.getAttribute("data-element-id")); 
      addToTabHeader(id); 
      changeTab(id,false,true); 
    };

    // if filePath!="" then append the explorerItem to the corresponding "explorer-group-"+filePath ul otherwise append directly to explorer-groups (root)
    if(filePath!="") {
      document.getElementById("explorer-group-"+filePath).appendChild(explorerItem);
    }
    else {
      document.getElementById("explorer-groups").appendChild(explorerItem);
    }
}

/**
 * Title: create tab container
 *
 * Description: create a container where the tab containing the model will be located
 *
 * Control-flow summary: create tab container, create tab content holder, create tab content and append to tab container holder
 *
 * @param {string} id  the id of the file
 * @param {string} filename  the name of the file
 *
 * Returns {void} 
 *
*
 * Additional notes: none
 *
 */
function createTabContainer(id,fileName) {

  console.log("createTabContainer",arguments);

  // create tab container
   const tabContainer =  document.createElement("div");
   tabContainer.setAttribute("id", "model"+id+"-container");
   tabContainer.setAttribute("class", "tab-container");
   document.getElementById("tabs-containers").appendChild(tabContainer);


   // create tab content holder
    const tabContentHolder = document.createElement("div");
    tabContentHolder.setAttribute("id", "model"+id+"-content-holder");
    tabContentHolder.setAttribute("class", "model-content-holder");
    tabContainer.appendChild(tabContentHolder);
 

   // create tab content and append to tab container holder
   const tabContent = document.createElement("div");
   tabContent.setAttribute("id", "model"+id+"-content");
   tabContent.setAttribute("fileName", fileName);
   tabContent.setAttribute("class", "model-content");
   tabContentHolder.appendChild(tabContent);
}


/**
 * Title: create model
 *
 * Description: create a model
 *
 * Control-flow summary: create a model container and append it to its parent container, create a model in the model container, add an event listener on canvas.viewbox.changed to take snapshots when the canvas viewbox is changed, remove BPMN.io logo, to avoid unwanted interactions during the data collection, make hierarchy links between the loaded BPMN models
 *
 * @param {string} filename  the name of the file
 * @param {string} id  the id of the file
 * @param {string} xml  xml refering the content of the model
 * @param {string} currentTabContainerId  the container of the model 
 *
 * Returns {object} modeler modeler object 
 *
*
 * Additional notes: none
 *
 */
async function createModel(fileName,id,xml,currentTabContainerId) {

      console.log("createModel function",arguments);

      var state = getState();

      // depending of the argument, either set as a process, or a nested sub-process
      currentTabContainerId = currentTabContainerId  || 'model'+id+'-content';  

      // create a model container
      var modelContainer = document.createElement("div"); 
      modelContainer.setAttribute("id", currentTabContainerId+'-model'+id+'-object');
      modelContainer.setAttribute("hierarchy", "main-model");
      modelContainer.setAttribute("class", "canvas main-model");
      modelContainer.setAttribute("FileName", fileName);

      // append the model container to its parent (i.e., dom element with id=currentTabContainerId)
      document.getElementById(currentTabContainerId).append(modelContainer);

      /// choice based on type of file (bpmn or odm) and whether it is for data-collection (NavigatedViewer) or for anaylsis (Modeler) (i.e., Modeler is used to allow coloring the activities, which is required for the heatmaps)
      var view = null;
      var language = null;
      // support for bpmn and odm file
      if(fileName.endsWith("bpmn")) language = "Bpmn"; else if(fileName.endsWith("odm")) language="Odm"; else throw 'Unknown file format';
      if(state.mode=="data-collection") view="NavigatedViewer"; else if(state.mode=="analysis") view="Modeler"; else throw 'Unknown state';

      // create modeler, set language and import xml file
      var modeler = await setUpModelerObject(language,view,currentTabContainerId,id,xml)
      
      // listen to changes in the canvas.viewbox i.e., scrolling, zooming and take a snapshot
      modeler.on('canvas.viewbox.changed', (context) => {
        // console.log("canvas.viewbox.changed on tab ", state.activeTab);
        // take snapshot on canvas.viewbox.changed
        takesnapshot(Date.now(),document.body.innerHTML,window.screenX,window.screenY); 
      });


      /// remove BPMN.io logo, to avoid unwanted interactions during the data collection
      removeBPMNioLogo(currentTabContainerId+'-model'+id+'-object');

      /// make hierarchy links between the loaded BPMN models
      const processId = modeler.get('canvas').getRootElement().id; 
      linkSubProcesses(modeler, id, processId, currentTabContainerId);

      return modeler;

}


/**
 * Title: setup modeler object
 *
 * Description: create the modeler object
 *
 * Control-flow: create the modeler object, import the XML file and put the model to its specific container
 *
 * @param {string} language e.g., Bpmn, ODM
 * @param {string} view  NavigatedViewer or Modeler
 * @param {string} currentTabContainerId  the container of the model 
 * @param {string} id  the id of the file
 * @param {string} xml  xml refering the content of the model

 *
 * Returns {object} modeler modeler object 
 *
*
 * Additional notes: none
 *
 */
async function setUpModelerObject(language,view,currentTabContainerId,id,xml) {

      const modeler = new modelers[language+view]({ 
      container: '#'+currentTabContainerId+'-model'+id+'-object',
      });
      modeler.language = language;
      
      await modeler.importXML(xml); 

      return modeler;
}

/**
 * Title: remove bpmn io logo
 *
 * Description: remove the bpmn io logo in the model
 *
 * Control-flow summary: remove the element with classname .bjs-powered-by
 *
 * @param {string} container container id
 *
 * Returns {void} 
 *
*
 * Additional notes: none
 *
 */
function removeBPMNioLogo(container) {

  console.log("removeBPMNioLogo function",arguments);

  document.getElementById(container).querySelector('.bjs-powered-by').remove();
          
}



/**
 * Title: link subprocesses
 *
 * Description: link subprocesses to provide support for sub-process interactions 
 *
 * Control-flow summary: iterate the elements of mainModel, then for each element, if the element is a collasped sub-process, get information about the sub-process, locate the svg element refering to a collasped subprocess, add event listeners to etablish the linking of sub-processes and allow the navigation between them (depending on the linkingSubProcessesMode)
 *
 * @param {object} mainModel  a modeler object refering to the main model
 * @param {string} mainModelId  the id of the main model
 * @param {string} mainModelprocessId  the id of the process in the main model
 * @param {string} currentTabContainerId  the id of the current tab container
 *
 * Returns {void} 
 *
*
 * Additional notes: none
 *
 */
function linkSubProcesses(mainModel, mainModelId, mainModelprocessId, currentTabContainerId) {  

    console.log("linkSubProcesses",arguments);

    // get state
    var state = getState();
  
    var mainModelElements = mainModel.get("elementRegistry")._elements;

    /// iterate the elements of mainModel
    Object.keys(mainModelElements).forEach(key => {

        //console.log("loop visit",mainModelElements[key] );
      
        // if the element is a collasped sub-process
        if(mainModelElements[key].element.type=="bpmn:SubProcess" && mainModelElements[key].element.collapsed==true ) {

          // console.log("is a collapsed subprocess", mainModelElements[key]);

          // get information about the sub-process
          const subProcessFileName = mainModelElements[key].element.id
          const subProcessId =  subProcessFileName.replace(new RegExp(window.globalParameters.MODELS_ID_REGEX,"g"),""); 
          const subProcessActivityLabelInMainModel = mainModelElements[key].element.businessObject.name;

          // locate the svg element refering to a collasped subprocess
          const subProcessActivitySVGObjectInMainModel = document.getElementById(currentTabContainerId).querySelector('[data-element-id="' + subProcessFileName + '"]');
          
          /// if state.linkingSubProcessesMode is not already set from a loaded session, then based on user input, choose whether the linking of sub-processes is supported and if so what type (newTab or withinTab)
          if(state.linkingSubProcessesMode==null) {
             const linkingSubProcessesSelect = document.getElementById("linking-sub-processes");
             state.linkingSubProcessesMode = linkingSubProcessesSelect.options[linkingSubProcessesSelect.selectedIndex].value;
          }
         
          console.log("state.linkingSubProcessesMode",state.linkingSubProcessesMode);
          
          if(state.linkingSubProcessesMode=="newTab") {
            subProcessActivitySVGObjectInMainModel.addEventListener('click', function(e) {
                  // prevent the implemented bpmn-io interaction assosciated with sub-processes  
                  cancelDefault(e); 
                  // open the sub-process in tab if isFileLoaded
                  if(isFileLoaded(subProcessFileName, subProcessId)) {
                      openInTab(subProcessId); 
                  }
            }); 
            // change the cursor
            subProcessActivitySVGObjectInMainModel.style.cursor = "pointer";

          }
          else if(state.linkingSubProcessesMode=="withinTab") {

            //subProcessActivitySVGObjectInMainModel.classList.add("click-record");
            
            subProcessActivitySVGObjectInMainModel.addEventListener('click', function(e) {
                // prevent the implemented bpmn-io interaction assosciated with sub-processes
                cancelDefault(e); 
                // send click event
                sendClickEvent(Date.now(),subProcessActivitySVGObjectInMainModel.getAttribute("data-element-id")); 

                // open the sub-process within tab if isFileLoaded
                if(isFileLoaded(subProcessFileName, subProcessId)) {
                  openWithinTab(mainModelId,mainModelprocessId,subProcessId,subProcessActivityLabelInMainModel);
                  
              }
            }); 
            // change the cursor
            subProcessActivitySVGObjectInMainModel.style.cursor = "pointer";
          }
          else {

            subProcessActivitySVGObjectInMainModel.addEventListener('click', function(e) {
            // prevent the implemented bpmn-io interaction assosciated with sub-processes
            cancelDefault(e);
            // do nothing more!
            });

          }

        }
  });
}

/**
 * Title: is file loaded
 *
 * Description: check if the file was already loaded
 *
 * Control-flow summary: if state.models.hasOwnProperty(fileId) is true, then the file is already loaded
 *
 * @param {string} fileName  the name of the file
 * @param {string} fileId  the id of the file
 *
 * Returns {boolean} whether the file was already loaded 
 *
*
 * Additional notes: none
 *
 */
function isFileLoaded(fileName, fileId) {

      console.log("isFileLoaded",arguments);

      var state = getState();
    
      /// return null if subProcessFileName was not loaded
      if(!state.models.hasOwnProperty(fileId)) {
            console.log(fileName, "(id: "+fileId+") was not loaded");
            return false;
      }

      return true;
}




export {registerFileUpload,createModel}