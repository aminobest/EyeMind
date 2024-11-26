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

import { showGeneralWaitingScreen, hideGeneralWaitingScreen } from './progress'
import { infoAlert, errorAlert } from '../utils/utils'
import $ from 'jquery'
import { getGeneralModelsRegistry } from '../DataModels/generalModelsRegistry'
import { setheatmapActive, isHeatmapActive } from '../dataModels/activeFeatures'
import { getState } from '../dataModels/state'
import {
  hideElement,
  displayElement,
  populateParticipantFileSelect,
  getSelectValues,
  updateShownUserConfig,
} from '../utils/dom'

const { DataFrame } = require('dataframe-js')

async function enableHeatmapOption() {
  console.log('enableHeatmapOption function', arguments)

  // heatmap options should be enabled only after the fixation filter is complete

  if (await window.analysis.shouldEnableHeatmap()) {
    document.getElementById('heatmap-btn').src = 'icons/heatmap_enabled.svg'
    document.getElementById('heatmap-btn').onclick = () => heatmapInteraction()
    //document.getElementById("heatmap-btn").style.cursor = "pointer";
  }
}

function disableHeatmapOption() {
  console.log('disableHeatmapOption function', arguments)

  document.getElementById('heatmap-btn').onclick = null
  document.getElementById('heatmap-btn').src = 'icons/heatmap_disabled.svg'
  //document.getElementById("heatmap-btn").style.cursor = "default";
}

async function heatmapInteraction() {
  console.log('heatmapInteraction', arguments)

  // toggling mechanism of heatmaps (clearing heatmap and showing heatmap-settings-modal)
  if (isHeatmapActive()) {
    await showGeneralWaitingScreen(
      'Clearing the heatmap and overlays',
      'wait',
      'all-content'
    )

    await clearHeatmap()

    await hideGeneralWaitingScreen('all-content', 'wait')

    hideElement('user-configuration')
  } else {
    await populateQuestionIDSelect()
    await populateParticipantFileSelect('participants-files-heatmap')

    document.getElementById('measure').onchange = heatmapAggregationsInteraction
    document.getElementById('close-heatmap-settings').onclick =
      closeHeatmapSettingsInteraction
    document.getElementById('submit-heatmap-form').onclick = () =>
      applyHeatmapSettingsInteraction()
    displayElement('heatmap-settings-modal', 'block')
  }
}

async function populateQuestionIDSelect() {
  // populate questionIDSelect (i.e., document.getElementById("measure")) if not already populated

  console.log('populateQuestionIDSelect', arguments)

  const questionIDSelect = document.getElementById('question')

  const questionTextLength =
    await window.globalParameters.QUESTION_TEXT_PREVIEW_LENGTH

  if (questionIDSelect.options.length <= 1) {
    const questions = getState().questions

    for (let i = 0; i < questions.length; i++) {
      var opt = document.createElement('option')
      opt.value = questions[i].id
      opt.innerHTML =
        questions[i].id +
        ' (' +
        questions[i].question.slice(0, questionTextLength) +
        (questions[i].question.length > questionTextLength ? '...' : '') +
        ')'
      questionIDSelect.appendChild(opt)
    }
  }
}

async function applyHeatmapSettingsInteraction() {
  console.log('applyHeatmapSettingsInteraction function', arguments)

  // get generalModelsRegistry
  const generalModelsRegistry = getGeneralModelsRegistry()
  console.log('generalModelsRegistry', generalModelsRegistry)

  const stateFiles = getSelectValues('participants-files-heatmap', 'value')
  const stateFilesLabels = getSelectValues('participants-files-heatmap', 'text')

  const measureSelect = document.getElementById('measure')
  const measure =
    measureSelect.options[measureSelect.selectedIndex].getAttribute('measure')
  const measureType =
    measureSelect.options[measureSelect.selectedIndex].getAttribute(
      'measureType'
    )

  const aggregationSelect = document.getElementById('aggregation')
  const aggregation = aggregationSelect.value
  const aggregationType =
    aggregationSelect.options[aggregationSelect.selectedIndex].getAttribute(
      'aggregationType'
    )

  const questionIDSelect = document.getElementById('question')
  const questionID = questionIDSelect.value
  const questionText =
    questionIDSelect.options[questionIDSelect.selectedIndex].innerText

  console.log('questionID', questionID)

  if (
    measure == '' ||
    aggregation == '' ||
    questionID == '' ||
    stateFiles.length == 0
  ) {
    errorAlert('Please select a participants/measure/aggregation/questionID ')
    return false
  }

  await showGeneralWaitingScreen(
    'Preparing the heatmap and the overlays',
    'wait',
    'all-content'
  )

  /// extract additionalElementsToIclude from the heatmapSettingModal
  const additionalElementsToIclude = {
    poolsLanes: document.getElementById('inc-pools-lanes').checked,
    groups: document.getElementById('inc-groups').checked,
    expendedSubProcesses: document.getElementById('inc-expended-sub-processes')
      .checked,
    processes: document.getElementById('inc-processes').checked,
    edges: document.getElementById('inc-edges').checked,
  }

  // generate and show heatmap
  setheatmapActive(true) // used afterwards for the toggling

  const timestampUnit = document.getElementById('timestamp-unit').value

  // set user config to display
  const userConfig = {
    Participants: stateFilesLabels.toString(),
    Question: questionText,
    Measure: measure,
    Aggregation: aggregation,
  }

  // update shown user config
  updateShownUserConfig(userConfig)

  // derive elementRegistryTypes
  const elementRegistryTypes = {}
  Object.keys(generalModelsRegistry).forEach((fileId) => {
    elementRegistryTypes[fileId] = {}
    Object.keys(
      generalModelsRegistry[fileId].elementRegistry._elements
    ).forEach((element) => {
      elementRegistryTypes[fileId][element] = {}
      elementRegistryTypes[fileId][element].type =
        generalModelsRegistry[fileId].elementRegistry._elements[
          element
        ].element.type
      elementRegistryTypes[fileId][element].collapsed =
        generalModelsRegistry[fileId].elementRegistry._elements[
          element
        ].element.collapsed
    })
  })

  console.log('elementRegistryTypes', elementRegistryTypes)

  const heatmap = await window.analysis.generateHeatMap(
    stateFiles,
    elementRegistryTypes,
    measure,
    measureType,
    aggregation,
    additionalElementsToIclude,
    questionID
  )

  visitsHeatMap(
    heatmap,
    generalModelsRegistry,
    measure,
    aggregation,
    aggregationType,
    timestampUnit
  )

  document.getElementById('feature-text').innerText = 'Heatmap and Overlays'
  closeHeatmapSettingsInteraction()

  displayElement('user-configuration', 'block')

  await hideGeneralWaitingScreen('all-content', 'wait')
}

function clearHeatmapContent(generalModelsRegistry) {
  console.log('clearHeatmapContent function', arguments)

  for (const [fileID, generalModelRegistry] of Object.entries(
    generalModelsRegistry
  )) {
    const language = generalModelRegistry.language

    for (const [key, el] of Object.entries(
      generalModelRegistry.elementRegistry._elements
    )) {
      if (language == 'Bpmn' && el.element.type == 'bpmn:Collaboration') {
        el.secondaryGfx.style.backgroundColor = ''
      } else if (
        language == 'Bpmn' &&
        (el.element.type == 'bpmn:SequenceFlow' ||
          el.element.type == 'bpmn:MessageFlow' ||
          el.element.type == 'bpmn:DataInputAssociation' ||
          el.element.type == 'bpmn:DataOutputAssociation')
      ) {
        el.gfx.children[0].children[0].style.stroke = 'black'
      } else if (language == 'Bpmn' && el.element.type == 'bpmn:Group') {
        el.gfx.children[0].children[0].style.stroke = 'black'
        el.gfx.children[0].children[0].style.strokeWidth = '1px'
      } else if (language == 'Bpmn') {
        /// use a method already impelented in bpmn-js
        generalModelsRegistry[fileID].commandStack.execute('element.setColor', {
          elements: [el.element],
          colors: { fill: '' },
        })
      } else if (language == 'Odm' && el.element.type == 'od:OdBoard') {
        el.secondaryGfx.style.backgroundColor = ''
      } else if (language == 'Odm' && el.element.type == 'od:Link') {
        el.gfx.children[0].children[0].style.stroke = 'black'
      } else if (language == 'Odm' && el.element.type == 'od:Object') {
        el.gfx.children[0].children[0].style.fill = 'white'
        el.gfx.children[0].children[0].style.fillOpacity = ''
      }
    }

    /// remove heatmap overlays
    generalModelsRegistry[fileID].overlays.remove({ type: 'heatmap-info' })
  }
}

function visitsHeatMap(
  aggregatedDf,
  generalModelsRegistry,
  measure,
  aggregation,
  aggregationType,
  timestampUnit
) {
  console.log('visitsHeatMap function ', arguments)

  // iterate aggregated, map to element in generalModelsRegistry, asign color in scale to the element
  // iterate aggregated
  aggregatedDf.forEach(function (row) {
    const heatMapColorValueInScale =
      row['heatMapColorScale_' + measure + '_' + aggregation]

    if (!isNaN(heatMapColorValueInScale)) {
      const element = row.element
      const fileId =
        row.tabName != null
          ? row.tabName.replace(
              new RegExp(window.globalParameters.MODELS_ID_REGEX, 'g'),
              ''
            )
          : ''
      const value = row[measure + '_' + aggregation]
      const color = row['heatMapColor_' + measure + '_' + aggregation]

      /// check that the tab and the element (from the aggregated dataset entry) exist in the generalModelsRegistry
      if (
        generalModelsRegistry[fileId] != null &&
        generalModelsRegistry[fileId].elementRegistry._elements[element] != null
      ) {
        console.log('found')
        //map to element in generalModelsRegistry
        const elementInGeneralModelsRegistry =
          generalModelsRegistry[fileId].elementRegistry._elements[element]
            .element

        const language = generalModelsRegistry[fileId].language

        console.log('language', language)

        // asign color in scale to the element
        // different handling to asign the color depending on the element type

        if (
          language == 'Bpmn' &&
          elementInGeneralModelsRegistry.type == 'bpmn:Collaboration'
        ) {
          generalModelsRegistry[fileId].elementRegistry._elements[
            element
          ].secondaryGfx.style.backgroundColor = color
        } else if (
          language == 'Bpmn' &&
          (elementInGeneralModelsRegistry.type == 'bpmn:SequenceFlow' ||
            elementInGeneralModelsRegistry.type == 'bpmn:MessageFlow' ||
            elementInGeneralModelsRegistry.type ==
              'bpmn:DataInputAssociation' ||
            elementInGeneralModelsRegistry.type == 'bpmn:DataOutputAssociation')
        ) {
          generalModelsRegistry[fileId].elementRegistry._elements[
            element
          ].gfx.children[0].children[0].style.stroke = color
        } else if (
          language == 'Bpmn' &&
          elementInGeneralModelsRegistry.type == 'bpmn:Group'
        ) {
          generalModelsRegistry[fileId].elementRegistry._elements[
            element
          ].gfx.children[0].children[0].style.stroke = color
          generalModelsRegistry[fileId].elementRegistry._elements[
            element
          ].gfx.children[0].children[0].style.strokeWidth = '4px'
        } else if (language == 'Bpmn') {
          /// use a method already impelented in bpmn-js
          generalModelsRegistry[fileId].commandStack.execute(
            'element.setColor',
            {
              elements: [elementInGeneralModelsRegistry],
              colors: { fill: color },
            }
          )
        } else if (
          language == 'Odm' &&
          elementInGeneralModelsRegistry.type == 'od:OdBoard'
        ) {
          generalModelsRegistry[fileId].elementRegistry._elements[
            element
          ].secondaryGfx.style.backgroundColor = color
        } else if (
          language == 'Odm' &&
          elementInGeneralModelsRegistry.type == 'od:Link'
        ) {
          generalModelsRegistry[fileId].elementRegistry._elements[
            element
          ].gfx.children[0].children[0].style.stroke = color
        } else if (
          language == 'Odm' &&
          elementInGeneralModelsRegistry.type == 'od:Object'
        ) {
          generalModelsRegistry[fileId].elementRegistry._elements[
            element
          ].gfx.children[0].children[0].style.fill = color
          generalModelsRegistry[fileId].elementRegistry._elements[
            element
          ].gfx.children[0].children[0].style.fillOpacity = '0.95' // same fill opacitiy as the default one for BPMN models
        }
        /// construct heatMapElementMetrics
        var heatMapElementMeasures = {
          measure: measure + ' (' + aggregation + ')',
          value:
            value.toFixed(2) +
            ' ' +
            (aggregationType == 'time' ? timestampUnit : ''),
        }

        // generate heatmap overlay for that element
        generalModelsRegistry[fileId].overlays.add(
          elementInGeneralModelsRegistry,
          'heatmap-info',
          overlay(
            buildTooltipOverlay(
              fileId,
              elementInGeneralModelsRegistry,
              elementInGeneralModelsRegistry.id,
              heatMapElementMeasures
            )
          )
        )

        // add listner to show and hide the overlay
        addOverlayListener(
          fileId,
          elementInGeneralModelsRegistry,
          elementInGeneralModelsRegistry.id
        )
      }
    }
    // skip if heatMapColorValueInScale is Nan
    else {
      console.error('Cannot construct heatmap with one element only')
    }
  })
}

async function clearHeatmap() {
  console.log('clearHeatmap function', arguments)

  // clear heatmap

  setheatmapActive(false)

  // get generalModelsRegistry
  const generalModelsRegistry = getGeneralModelsRegistry()
  console.log('generalModelsRegistry', generalModelsRegistry)

  console.log('start')
  clearHeatmapContent(generalModelsRegistry)
  console.log('end')
  document.getElementById('feature-text').innerText = ''
}

function heatmapAggregationsInteraction() {
  console.log('heatmapAggregationsInteraction function', arguments)

  /// showing the aggregation select menu depending on the chosen measure

  const measureSelect = document.getElementById('measure')
  const aggregationSelect = document.getElementById('aggregation')
  const aggegationsType =
    measureSelect.options[measureSelect.selectedIndex].getAttribute(
      'aggregations'
    )

  Array.prototype.forEach.call(
    document.getElementsByClassName('aggr'),
    function (element) {
      element.style.display = 'none'
    }
  )

  if (aggegationsType != '')
    aggegationsType.split('-').forEach(function (item) {
      displayElement(item + '-aggr', 'block')
    })

  aggregationSelect.options[0].selected = true
}

function closeHeatmapSettingsInteraction() {
  console.log('closeHeatmapSettingsInteraction function', arguments)

  hideElement('heatmap-settings-modal')
}

/*
Code to generate overlays adapted from https://github.com/viadee/camunda-modeler-tooltip-plugin/blob/main/client/TooltipInfoService.js
*/

/**
 * add listeners to an element, that are responsible for showing/hinding the
 * tooltip if the cursor hovers the element
 */
function addOverlayListener(fileId, element, tooltipId) {
  const el = document.querySelector(
    '[id=model' + fileId + '-container] [data-element-id="' + element.id + '"]'
  )

  el.addEventListener('mouseenter', function () {
    const tooltip = document.getElementById(
      'model' + fileId + '_' + tooltipId + '_tooptip_overlay'
    )
    if (tooltip != null) {
      tooltip.style.display = 'block'
    }
  })
  el.addEventListener('mouseleave', function () {
    const tooltip = document.getElementById(
      'model' + fileId + '_' + tooltipId + '_tooptip_overlay'
    )
    if (tooltip != null) {
      tooltip.style.display = 'none'
    }
  })
}

/**
 * build a complete tooltip-overlay-html, consisting of header, and
 * detail-containers, if any information is, otherwise show resp. hint.
 *
 * some containers are disabled currently, bc. the information is not really needed
 * to show in tooltip, or can be visualized by other plugins already.
 */

function buildTooltipOverlay(
  fileId,
  element,
  tooltipId,
  heatMapElementMeasures
) {
  return (
    '<div id="model' +
    fileId +
    '_' +
    tooltipId +
    '_tooptip_overlay" class="tooltip"> \
              <div class="tooltip-content">' +
    tooltipHeader(element) +
    emptyPropertiesIfNoLines([
      tooltipGeneral(element),
      tooltipHeatMap(heatMapElementMeasures),
    ]) +
    '</div> \
            </div>'
  )
}

/**
 * add tooltip header
 */
function tooltipHeader(element) {
  return (
    '<div class="tooltip-header"> \
              <div class="tooltip-container">' +
    element.type.split(':')[1] +
    '</div>\
            </div>'
  )
}

/**
 * show some hint in tooltip, if no relevant property was found,
 * otherwise join all lines that include some information
 */
function emptyPropertiesIfNoLines(lines) {
  var final = _.without(lines, '')
  if (final.length == 0) {
    return `<div class="tooltip-no-properties ">No properties found</div>`
  }
  return final.join('')
}

/**
 * container for external task configuration:
 *  - name, id
 *
 * properties not really needed in popup
 */
function tooltipGeneral(element) {
  return (
    '<div class="tooltip-container"> \
              <div class="tooltip-subheader">General</div>' +
    tooltipLineText('Id', element.id) +
    tooltipLineText('Name', element.businessObject.name) +
    '</div>'
  )
}

/*
   Stats info from the heatmap
  */

function tooltipHeatMap(heatMapElementMeasures) {
  return (
    '<div class="tooltip-container"> \
              <div class="tooltip-subheader">Heatmap</div>' +
    tooltipLineText(
      heatMapElementMeasures.measure,
      heatMapElementMeasures.value
    ) +
    '</div>'
  )
}

/**
 * add a single tooltip line as 'text'
 */
function tooltipLineText(key, value) {
  return tooltipLineWithCss(key, value, 'tooltip-value-text')
}

/**
 * add a single tooltip line as <div> with 2 <span>,
 * like: <div><span>key: </span><span class="css">value</span></div>
 */
function tooltipLineWithCss(key, value, css) {
  if (value == undefined) return ''
  return `<div class="tooltip-line"><span class="tooltip-key">${key}:&nbsp;</span><span class="tooltip-value ${css}">${value}</span></div>`
}

/**
 * create tooltip-overlay with options and content
 */
function overlay(html) {
  return {
    position: { top: -30, left: 0 },
    scale: false,
    show: { maxZoom: 2 },
    html: html,
  }
}

/*
End of Code to generate overlays
*/

export {
  enableHeatmapOption,
  disableHeatmapOption,
  clearHeatmap,
  addOverlayListener,
  buildTooltipOverlay,
  overlay,
}
