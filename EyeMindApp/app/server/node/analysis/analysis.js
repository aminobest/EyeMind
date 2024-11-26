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

const {
  getMostCommon,
  hasOneElement,
  randomNumberInRange,
} = require('../utils/utils')
const { DataFrame } = require('dataframe-js')
const _ = require('lodash')
const $ = require('jquery')
const { getStates } = require('../dataModels/state')
const { globalParameters } = require('../../../../globals.js')
const { calculateProgress } = require('../utils/utils')

/* 

For Heatmap analysis

Summerized fixation log
Modes:
  Hard: Group gazes by Fixation. If the gazes within the group are mapped to different elements, discard the group
  Soft: Group gazes by Fixation. For each group , set the fixated element to be the common element that has been mapped with the majority of the gazes within the group


*/

function shouldEnableHeatmap() {
  // get states
  var states = getStates()

  // all states should have fixation data to enable heatmaps
  for (const state of Object.values(states)) {
    if (
      state.processedGazeData.fixationData == null ||
      state.processedGazeData.fixationFilterData == null ||
      state.processedGazeData.fixationFilterData.status != 'complete'
    ) {
      return false
    }
  }

  return true
}

function summerizedFixationLog(data, mode, areGazesCorrected) {
  console.log(
    'summerizedFixationLog function',
    mode,
    areGazesCorrected,
    typeof data
  )

  /// choose the element attribute to consider depending on wehther gazes where corrected or not
  const elementAttrName = areGazesCorrected
    ? 'element-with-correction'
    : 'element'
  // console.log("element attribute name", elementAttrName);

  // create dataframe with relevant attributes
  var fixationDataFrame = new DataFrame(data, [
    'FixID',
    'Fixation X',
    'Fixation Y',
    'Fixation Start',
    'Fixation End',
    'Fixation Duration',
    'Fixation Dispersion',
    elementAttrName,
    'tabName',
    'currentQuestion',
  ])

  // filter out gaze which do not belong to fixations
  fixationDataFrame = fixationDataFrame.filter(
    (row) =>
      row.get('FixID') != null &&
      row.get(elementAttrName) != null &&
      row.get('tabName') != null
  )

  fixationDataFrame = fixationDataFrame
    .groupBy(
      'FixID',
      'Fixation X',
      'Fixation Y',
      'Fixation Start',
      'Fixation End',
      'Fixation Duration',
      'Fixation Dispersion'
    )
    .aggregate((group) => {
      if (
        hasOneElement(
          group.select(elementAttrName, 'tabName', 'currentQuestion').toArray()
        )
      ) {
        return getfirstValue(
          group,
          elementAttrName,
          'tabName',
          'currentQuestion'
        )
      }
      //Soft: Group gazes by Fixation. For each group , set the fixated element to be the common element (defined with elementAttrName,'tabName','currentQuestion') that has been mapped with the majority of the gazes within the group
      else if (mode == 'soft') {
        return getMostCommon(
          group.select(elementAttrName, 'tabName', 'currentQuestion').toArray()
        )
      }
      // Hard: Group gazes by Fixation. If the gazes within the group are mapped to different elements (defined with elementAttrName,'tabName','currentQuestion'), return null (to discard the group afterwards)
      else if (mode == 'hard') {
        return null
      }
    })
    .rename('aggregation', 'Element in Tab for question')

  // discard the groups with null
  fixationDataFrame = fixationDataFrame.filter(
    (row) => row.get('Element in Tab for question') != null
  )

  // separate element, tab and question
  fixationDataFrame = fixationDataFrame.withColumn(
    'element',
    (row) => row.get('Element in Tab for question')[0]
  )
  fixationDataFrame = fixationDataFrame.withColumn(
    'tabName',
    (row) => row.get('Element in Tab for question')[1]
  )
  fixationDataFrame = fixationDataFrame.withColumn(
    'questionID',
    (row) => row.get('Element in Tab for question')[2]
  )

  // drop Element in Tab Element in Tab for question
  fixationDataFrame = fixationDataFrame.drop('Element in Tab for question')

  return fixationDataFrame.toCollection()
}

function getfirstValue(group, element, tab, currentQuestion) {
  //console.log("getfirstValue function",arguments);

  // since all the rows with the same FixID have the same attribute value, then return the first one
  return group.select(element, tab, currentQuestion).toArray()[0]
}

function fixationsToElementVisits(dataFrame) {
  // Note: a visit to an element refers to the time interval from the onset of the first fixation on that element, to the offset of the last consecuctive fixation on that element
  // console.log("fixationsToElementVisits function",arguments);

  var visits = []

  var visit_start
  var visit_end
  var visit_potential_end
  var visit_tabName
  var visit_question
  var visit

  dataFrame.map((row, i, rows) => {
    const el = row

    // first iteration
    if (i == 0) {
      /// start new visit
      visit = el.get('element')
      visit_start = el.get('Fixation Start')
      visit_tabName = el.get('tabName')
      visit_potential_end = el.get('Fixation End')
      visit_question = el.get('questionID')
    }

    /// change if element (i.e., visit) or tab happens
    else if (visit != el.get('element') || visit_tabName != el.get('tabName')) {
      /// finish with the current visit event
      visit_end = visit_potential_end
      visits.push({
        element: visit,
        tabName: visit_tabName,
        questionID: visit_question,
        visit_start: visit_start,
        visit_end: visit_end,
        visit_duration: visit_end - visit_start,
      })

      /// start new visit
      visit = el.get('element')
      visit_start = el.get('Fixation Start')
      visit_tabName = el.get('tabName')
      visit_potential_end = el.get('Fixation End')
      visit_question = el.get('questionID')
    }
    // no change in element (i.e., visit) or tab happens
    else {
      visit_potential_end = el.get('Fixation End')
    }

    // last iteration
    if (i == dataFrame.count() - 1) {
      /// finish with the current visit event
      visit_end = visit_potential_end
      visits.push({
        element: visit,
        tabName: visit_tabName,
        questionID: visit_question,
        visit_start: visit_start,
        visit_end: visit_end,
        visit_duration: visit_end - visit_start,
      })
    }
  })

  // console.log("visits", visits);
  return visits
}

function gazesToElementVisits(data, areGazesCorrected) {
  // console.log("gazesToElementVisits function",arguments);

  /// choose the element attribute to consider depending on wehther gazes where corrected or not
  const elementAttrName = areGazesCorrected
    ? 'element-with-correction'
    : 'element'
  // console.log("element attribute name", elementAttrName);

  var visits = []

  var visit_start
  var visit_end
  var visit_tabName
  var visit_question
  var visit

  for (var i = 0; i < data.length; i++) {
    const el = data[i]

    // skip data with "eventSource"!="eye-tracker"
    if (el['eventSource'] != 'eye-tracker') {
      continue
    }

    // first iteration
    if (i == 0) {
      /// start new visit
      visit = el[elementAttrName]
      visit_start = el.Timestamp
      visit_tabName = el.tabName
      visit_question = el.currentQuestion
    } else if (visit != el[elementAttrName]) {
      /// finish with the current visit event
      visit_end = el.Timestamp
      visits.push({
        element: visit,
        tabName: visit_tabName,
        questionID: visit_question,
        visit_start: visit_start,
        visit_end: visit_end,
        visit_duration: visit_end - visit_start,
      })

      /// start new visit (if this the last element in the array that it will be ignored since it does not have a visit_end)
      visit = el[elementAttrName]
      visit_start = el.Timestamp
      visit_tabName = el.tabName
      visit_question = el.currentQuestion
    }

    // last iteration
    else if (i == data.length - 1) {
      /// finish with the current visit event
      visit_end = el.Timestamp
      visits.push({
        element: visit,
        tabName: visit_tabName,
        questionID: visit_question,
        visit_start: visit_start,
        visit_end: visit_end,
        visit_duration: visit_end - visit_start,
      })
    } else {
      continue
    }
  }

  return visits
}

function generateHeatMap(
  filePaths,
  elementRegistryTypes,
  measure,
  measureType,
  aggregation,
  additionalElementsToIclude,
  questionID
) {
  // console.log("generateHeatmap function");

  // derive the list the elements to exclude
  const elementsToExclude = getElementsToExclude(additionalElementsToIclude)

  var fixationDataFrame = null
  var elementVisitsDfFromGazes = null
  var elementVisitsDfFromFixations = null

  // get state, fixationData, gazeData, areGazesCorrected
  for (const filePath of filePaths) {
    const state = getStates()[filePath]
    const participantID = state.processedGazeData.participantID
    const fixationData = new DataFrame(state.processedGazeData.fixationData)
    const gazeData = state.processedGazeData.gazeData
    const areGazesCorrected = state.processedGazeData.areGazesCorrected

    console.log(
      'generateHeatMap: processing ',
      participantID,
      '(',
      filePath,
      ')'
    )

    // convert FixationData to DataFrame
    var fixationDataOfState = new DataFrame(fixationData)
    // new columns  with participant ID and filePath
    fixationDataOfState = fixationDataOfState.withColumn(
      'participantID',
      () => participantID
    )
    fixationDataOfState = fixationDataOfState.withColumn('file', () => filePath)
    // concat
    fixationDataFrame =
      fixationDataFrame != null
        ? fixationDataFrame.union(fixationDataOfState)
        : fixationDataOfState

    // from gazes to element visits
    const elementVisitsFromGazesOfState = gazesToElementVisits(
      gazeData,
      areGazesCorrected
    )
    // create dataframe from elementVisitsFromGazes
    var elementVisitsDfFromGazesOfState = new DataFrame(
      elementVisitsFromGazesOfState
    )
    // new columns  with participant ID and filePath
    elementVisitsDfFromGazesOfState =
      elementVisitsDfFromGazesOfState.withColumn(
        'participantID',
        () => participantID
      )
    elementVisitsDfFromGazesOfState =
      elementVisitsDfFromGazesOfState.withColumn('file', () => filePath)
    // concat
    elementVisitsDfFromGazes =
      elementVisitsDfFromGazes != null
        ? elementVisitsDfFromGazes.union(elementVisitsDfFromGazesOfState)
        : elementVisitsDfFromGazesOfState

    // from fixations to element visits
    const elementVisitsFromFixationsOfState =
      fixationsToElementVisits(fixationDataOfState)
    // create dataframe from elementVisitsFromFixations
    var elementVisitsDfFromFixationsOfState = new DataFrame(
      elementVisitsFromFixationsOfState
    )
    // new columns  with participant ID and filePath
    elementVisitsDfFromFixationsOfState =
      elementVisitsDfFromFixationsOfState.withColumn(
        'participantID',
        () => participantID
      )
    elementVisitsDfFromFixationsOfState =
      elementVisitsDfFromFixationsOfState.withColumn('file', () => filePath)
    // concat
    elementVisitsDfFromFixations =
      elementVisitsDfFromFixations != null
        ? elementVisitsDfFromFixations.union(
            elementVisitsDfFromFixationsOfState
          )
        : elementVisitsDfFromFixationsOfState
  }

  //fixationDataFrame.toCSV(true, 'fixationDataFrame.csv')
  //elementVisitsDfFromGazes.toCSV(true, 'elementVisitsDfFromGazes.csv')
  //elementVisitsDfFromFixations.toCSV(true, 'elementVisitsDfFromFixations.csv')

  // in fixationDatam filter out rows with empty element or tabName, filter in rows with required questionID
  var fixationDataFiltered = fixationDataFrame.filter(
    (row) =>
      row.get('element') != '' &&
      row.get('tabName') != null &&
      row.get('questionID') == questionID
  )
  // group fixationDataFiltered by element and tabName
  const groupedDfFixationData = fixationDataFiltered.groupBy(
    'element',
    'tabName'
  )

  // in elementVisitsDfFromGazes, filter out rows with empty element or tabName, filter in rows with required questionID
  const elementVisitsDfFromGazesFiltered = elementVisitsDfFromGazes.filter(
    (row) =>
      row.get('element') != '' &&
      row.get('tabName') != null &&
      row.get('questionID') == questionID
  )
  // group elementVisitsDfFromGazesFiltered by element and tabName from gazes
  const groupedDfElementVisitsFromGazes =
    elementVisitsDfFromGazesFiltered.groupBy('element', 'tabName')

  // in elementVisitsDfFromFixations, filter out rows with empty element or tabName, filter in rows with required questionID
  const elementVisitsDfFromFixationsFiltered =
    elementVisitsDfFromFixations.filter(
      (row) =>
        row.get('element') != '' &&
        row.get('tabName') != null &&
        row.get('questionID') == questionID
    )
  // group elementVisitsDfFromFixationsFiltered by element and tabName
  const groupedDfElementVisitsFromFixations =
    elementVisitsDfFromFixationsFiltered.groupBy('element', 'tabName')

  /// generate customized heatmap
  return customizedHeatMap(
    groupedDfFixationData,
    groupedDfElementVisitsFromFixations,
    groupedDfElementVisitsFromGazes,
    elementRegistryTypes,
    measure,
    measureType,
    aggregation,
    elementsToExclude,
    questionID
  )
}

function customizedHeatMap(
  groupedDfFixationData,
  groupedDfFromFixations,
  groupedDfFromGazes,
  elementRegistryTypes,
  measure,
  measureType,
  aggregation,
  elementsToExclude,
  questionID
) {
  // console.log("customizedHeatMap function ",arguments);

  var aggregatedDf

  // differ the execution depending on the measure type (see measures in modal in app/client/index.html)
  if (measureType == 'element_level') {
    // i.e., visit level
    aggregatedDf = groupedDfFromFixations
      .aggregate((grpObj) => {
        // for each group apply the following aggregations
        switch (aggregation) {
          case 'sum':
            return grpObj.stat.sum(measure)
          case 'max':
            return grpObj.stat.max(measure)
          case 'min':
            return grpObj.stat.min(measure)
          case 'mean':
            return grpObj.stat.mean(measure)
          case 'count':
            return grpObj.count()
          default: {
            console.error(
              'aggrgation function "',
              aggregation,
              '" is not supported'
            )
            return false
          }
        }
      })
      .rename('aggregation', measure + '_' + aggregation)
  } else if (measureType == 'fixation_level') {
    aggregatedDf = groupedDfFixationData
      .aggregate((grpObj) => {
        // for each group apply the following aggregations
        switch (aggregation) {
          case 'sum':
            return grpObj.stat.sum(measure)
          case 'max':
            return grpObj.stat.max(measure)
          case 'min':
            return grpObj.stat.min(measure)
          case 'mean':
            return grpObj.stat.mean(measure)
          case 'count':
            return grpObj.count()
          default: {
            console.error(
              'aggrgation function "',
              aggregation,
              '" is not supported'
            )
            return false
          }
        }
      })
      .rename('aggregation', measure + '_' + aggregation)
  } else if (measureType == 'gaze_level') {
    aggregatedDf = groupedDfFromGazes
      .aggregate((grpObj) => {
        // for each group apply the following aggregations

        switch (aggregation) {
          case 'sum':
            return grpObj.stat.sum(measure)
          case 'max':
            return grpObj.stat.max(measure)
          case 'min':
            return grpObj.stat.min(measure)
          case 'mean':
            return grpObj.stat.mean(measure)
          case 'count':
            return grpObj.count()
          default: {
            console.error(
              'aggrgation function "',
              aggregation,
              '" is not supported'
            )
            return false
          }
        }
      })
      .rename('aggregation', measure + '_' + aggregation)
  } else {
    console.error('measure type "', measureType, '" is unkown')
  }

  // excludes gazes on elements outside the model
  aggregatedDf = aggregatedDf.filter(
    (row) =>
      !globalParameters.PATTERNS_FOR_ELEMENTS_OUTSIDE_MODEL_AREA.some((rx) =>
        RegExp(rx).test(row.get('element'))
      )
  )

  // include/exclude the BPMN elements selected in the heatMapSettingModal
  aggregatedDf = aggregatedDf.filter((row) =>
    shouldIncludeElement(
      row.get('tabName'),
      row.get('element'),
      elementRegistryTypes,
      elementsToExclude
    )
  )

  // set the measure in a ratio scale which will be used to generate the heatmap color for the corresponding element
  aggregatedDf = putMeasureInColorScale(
    aggregatedDf,
    measure + '_' + aggregation
  )

  // obtain the heatmap color depending on the derived ratio
  aggregatedDf = deriveHeatMapColors(aggregatedDf, measure + '_' + aggregation)

  // console.log(aggregatedDf);

  return aggregatedDf.toCollection()
}

function getElementsToExclude(additionalElementsToIclude) {
  // console.log("getElementsToExclude function ",arguments);

  // derive the list the elements to exclude
  var elementsToExclude = [
    'bpmn:Collaboration',
    'bpmn:SubProcess',
    'bpmn:Group',
    'bpmn:SequenceFlow',
    'bpmn:MessageFlow',
    'bpmn:DataInputAssociation',
    'bpmn:DataOutputAssociation',
    'bpmn:Participant',
    'bpmn:Lane',
    'od:OdBoard',
    'od:Link',
  ]

  if (additionalElementsToIclude.poolsLanes) {
    elementsToExclude.splice(elementsToExclude.indexOf('bpmn:Participant'), 1)
    elementsToExclude.splice(elementsToExclude.indexOf('bpmn:Lane'), 1)
  }
  if (additionalElementsToIclude.groups) {
    elementsToExclude.splice(elementsToExclude.indexOf('bpmn:Group'), 1)
  }
  if (additionalElementsToIclude.expendedSubProcesses) {
    elementsToExclude.splice(elementsToExclude.indexOf('bpmn:SubProcess'), 1)
  }
  if (additionalElementsToIclude.processes) {
    elementsToExclude.splice(elementsToExclude.indexOf('bpmn:Collaboration'), 1)
    elementsToExclude.splice(elementsToExclude.indexOf('od:OdBoard'), 1)
  }
  if (additionalElementsToIclude.edges) {
    elementsToExclude.splice(elementsToExclude.indexOf('bpmn:SequenceFlow'), 1)
    elementsToExclude.splice(elementsToExclude.indexOf('bpmn:MessageFlow'), 1)
    elementsToExclude.splice(
      elementsToExclude.indexOf('bpmn:DataInputAssociation'),
      1
    )
    elementsToExclude.splice(
      elementsToExclude.indexOf('bpmn:DataOutputAssociation'),
      1
    )

    elementsToExclude.splice(elementsToExclude.indexOf('od:Link'), 1)
  }

  return elementsToExclude
}

function shouldIncludeElement(
  tabName,
  element,
  elementRegistryTypes,
  elementsToExclude
) {
  // console.log("shouldIncludeElement function ",arguments);

  const fileId =
    tabName != null
      ? tabName.replace(new RegExp(globalParameters.MODELS_ID_REGEX, 'g'), '')
      : ''

  if (
    elementRegistryTypes[fileId] != null &&
    elementRegistryTypes[fileId][element] != null &&
    elementsToExclude.includes(elementRegistryTypes[fileId][element].type)
  ) {
    // special case for sub-process as they can be collapsed and extended. We want to exclude only the extended ones if specified by the user
    if (
      elementRegistryTypes[fileId][element].type == 'bpmn:SubProcess' &&
      elementRegistryTypes[fileId][element].collapsed == true
    ) {
      return true
    }
    // rest
    else {
      return false
    }
  }

  return true
}

function putMeasureInColorScale(df, measure) {
  // console.log("putMeasureInColorScale function ",arguments);

  // df.stat.max(measure) - df.stat.min(measure) == 0 means that all rows have the same value, so they will all have the same intensity in the heatmap

  df = df.map((row) =>
    row.set(
      'heatMapColorScale_' + measure,
      df.stat.max(measure) - df.stat.min(measure) != 0
        ? (row.get(measure) - df.stat.min(measure)) /
            (df.stat.max(measure) - df.stat.min(measure))
        : 1
    )
  )

  return df
}

function deriveHeatMapColors(df, measure) {
  //// console.log("deriveHeatMapColors function ",arguments);

  df = df.map((row) =>
    row.set(
      'heatMapColor_' + measure,
      heatmapColor(row.get('heatMapColorScale_' + measure))
    )
  )

  df.show()

  return df
}

function heatmapColor(value, maxRange = 45, minRange = 97) {
  // console.log("heatmapColor function ",arguments);

  const maxValue = 1
  const minValue = 0

  value =
    ((maxRange - minRange) / (maxValue - minValue)) * (value - maxValue) +
    maxRange

  // console.log(`hsla(0, 100%, ${value}%)`);
  return `hsla(0, 100%, ${value}%)`
}

/*

Gaze correction analysis


*/

function getRandomGazeSet(samplingRatio, filePath) {
  const state = getStates()[filePath]

  const gazeDataKeys = Object.keys(state.processedGazeData.gazeData)
  const numberOfGazesToSelect = Math.floor(samplingRatio * gazeDataKeys.length)
  const min = 0
  const max = gazeDataKeys.length - numberOfGazesToSelect
  const startSequence = randomNumberInRange(min, max)
  const endSequence = startSequence + numberOfGazesToSelect

  const randomGazeSet = state.processedGazeData.gazeData.slice(
    startSequence,
    endSequence
  )

  return randomGazeSet
}

function applyCorrectionOffset(
  externalMappingWindow,
  stateFile,
  snapshotId,
  xOffset,
  yOffset,
  mainWindow
) {
  // gaze data size
  const state = getStates()[stateFile]
  const gazeDataSize = state.processedGazeData.gazeData.length

  // set temporary attribute to store the corrections
  state.processedGazeData.temporaryCorrectedGazeData = []

  // fragment start
  const start = 0

  // get gazeData fragment
  correctGazeDataFragment(
    stateFile,
    start,
    gazeDataSize,
    externalMappingWindow,
    snapshotId,
    xOffset,
    yOffset,
    mainWindow
  )
}

function correctGazeDataFragment(
  stateFile,
  start,
  gazeDataSize,
  externalMappingWindow,
  snapshotId,
  xOffset,
  yOffset,
  mainWindow
) {
  //console.log("correctGazeDataFragment",arguments);

  const end =
    start + globalParameters.DATA_FRAGMENT_SIZE <= gazeDataSize
      ? start + globalParameters.DATA_FRAGMENT_SIZE
      : gazeDataSize

  console.log(
    'start ',
    start,
    'end ',
    end,
    'DATA_FRAGMENT_SIZE',
    globalParameters.DATA_FRAGMENT_SIZE,
    'gazeDataSize',
    gazeDataSize
  )

  // get gaze data
  const state = getStates()[stateFile]
  const gazeData = state.processedGazeData.gazeData
  const snapshots = start == 0 ? state.snapshots : null

  // select gaze data fragment
  const gazeDataFragment = gazeData.slice(start, end)

  /// provide data fragment for mapping
  mainWindow.webContents.send(
    'applyCorrectionOnGazeFragment',
    stateFile,
    gazeDataFragment,
    start,
    gazeDataSize,
    externalMappingWindow,
    snapshotId,
    snapshots,
    xOffset,
    yOffset
  )

  // report progress through updateProcessingMessage
  mainWindow.webContents.send(
    'updateProcessingMessage',
    'Applying gaze correction: ' +
      calculateProgress(end, gazeDataSize) +
      '% complete',
    ''
  )
}

async function gazeDataFragmentMapped(
  stateFile,
  gazeDataFragment,
  start,
  gazeDataSize,
  externalMappingWindow,
  snapshotId,
  xOffset,
  yOffset,
  mainWindow
) {
  // console.log("gazeDataFragmentMapped",arguments);

  const state = getStates()[stateFile]
  state.processedGazeData.temporaryCorrectedGazeData.push.apply(
    state.processedGazeData.temporaryCorrectedGazeData,
    gazeDataFragment
  ) // check if the use of a global variable here is ok

  // move to next iteration
  start = start + globalParameters.DATA_FRAGMENT_SIZE
  if (start < gazeDataSize) {
    // to check
    await correctGazeDataFragment(
      stateFile,
      start,
      gazeDataSize,
      externalMappingWindow,
      snapshotId,
      xOffset,
      yOffset,
      mainWindow
    )
  } else {
    console.log('All is mapped, show making the state download')

    // copy state.processedGazeData.temporaryCorrectedGazeData to  state.processedGazeData.gazeData
    state.processedGazeData.gazeData =
      state.processedGazeData.temporaryCorrectedGazeData

    // remove state.processedGazeData.temporaryCorrectedGazeData attribute
    delete state.processedGazeData.temporaryCorrectedGazeData

    // report progress through updateProcessingMessage
    mainWindow.webContents.send(
      'updateProcessingMessage',
      'Corrections complete',
      ''
    )

    // send message to call the complete correction procedure
    mainWindow.webContents.send(
      'completeCorrectionListener',
      externalMappingWindow,
      stateFile
    )
  }
}

function getStatesInfo() {
  const states = getStates()

  var info = {}

  Object.keys(states).forEach((key) => {
    info[key] = states[key].processedGazeData.participantID
  })

  return info
}

exports.summerizedFixationLog = summerizedFixationLog
exports.generateHeatMap = generateHeatMap
exports.shouldEnableHeatmap = shouldEnableHeatmap
exports.getRandomGazeSet = getRandomGazeSet
exports.applyCorrectionOffset = applyCorrectionOffset
exports.gazeDataFragmentMapped = gazeDataFragmentMapped
exports.getStatesInfo = getStatesInfo
