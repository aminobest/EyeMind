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

/* Questions */

import DataFrame from 'dataframe-js'
import { takesnapshot, stopETInteraction } from './data-collection'
import { infoAlert, errorAlert } from '../utils/utils'
import { getState } from '../dataModels/state'
import { resetNavTabsAndTabs } from './canvas'
import { sendClickEvent } from './click-stream'
import { showModelsGroup } from './canvas'

const request = require('request-promise')

/**
 * Title: load questions
 *
 * Description: load questions and store them in state object
 *
 * @param {object} file file
 *
 * Returns {void}
 *
 *
 * Additional notes: none
 *
 */
async function loadQuestions(file) {
  console.log('loadQuestions', arguments)

  var state = getState()

  try {
    const contentAsDataFrame = await DataFrame.fromCSV(file) // this statement should not fail if the file is a valid csv
    contentAsDataFrame.show()
    state.questions = contentAsDataFrame.toCollection() //should be stored as Collection to faciliate the transfer to the server and the export

    const requiredColumns =
      window.globalParameters.RQUIRED_COLUMNS_IN_QUESTION_FILE
    const questionsTypeSupported =
      window.globalParameters.QUESTION_TYPES_SUPPORTED

    if (
      !checkNeccesaryColumnsInQuestionsFile(
        contentAsDataFrame,
        requiredColumns,
        questionsTypeSupported
      )
    )
      throw 'required columns or question types not suported'

    return true
  } catch (error) {
    const msg = 'An error occured, check the validity of the file'
    console.error(msg)
    errorAlert(msg)
    return false
  }
}

/**
 * Title: check that the neccesary columns are in the questions file
 *
 * Description: check that the neccesary columns are in the questions file
 *
 * @param {object} df dataframe object
 * @param {array} requiredColumns array of required columns
 * @param {array} questionsTypeSupported array of question types supported
 *
 * Returns {void}
 *
 *
 * Additional notes: none
 *
 */
function checkNeccesaryColumnsInQuestionsFile(
  df,
  requiredColumns,
  questionsTypeSupported
) {
  console.log('checkNeccesaryColumnsInQuestionsFile', arguments)

  let checker = (arr, target) => target.every((v) => arr.includes(v))

  const allRequiredColumnsThere = checker(df.listColumns(), requiredColumns)
  const containsOnlySupportedQuestionTypes = checker(
    questionsTypeSupported,
    df.unique('type').toArray().flat()
  )

  return allRequiredColumnsThere && containsOnlySupportedQuestionTypes
}

/**
 * Title: generate questions sequence
 *
 * Description: generate questions sequence
 *
 * @param {void} . .
 *
 * Returns {void}
 *
 *
 * Additional notes: none
 *
 */
function generateQuestionsSequence() {
  console.log('generateQuestionsSequence', arguments)

  var state = getState()
  const questions = new DataFrame(state.questions)

  document.getElementById('start-questions-btn').onclick = () =>
    startQuestions()

  document.getElementById('questions-ready').style.display = 'block'

  questions.map((row, rowNum, rows) => {
    const question = document.createElement('div')
    question.setAttribute('id', 'question' + rowNum)
    question.setAttribute('class', 'question gaze-element')
    question.setAttribute(
      'data-element-id',
      'question-area-for-questionID_' + row.get('id')
    )
    document.getElementById('questions').append(question)

    const title = document.createElement('div')
    title.setAttribute('class', 'title gaze-element')
    title.setAttribute(
      'data-element-id',
      'title-for-questionID_' + row.get('id')
    )
    title.innerHTML = row.get('question')
    question.append(title)

    const answerAndNext = document.createElement('div')
    answerAndNext.setAttribute('class', 'answer-and-next')
    question.append(answerAndNext)

    const answer = document.createElement('div')
    answer.setAttribute('class', 'answer gaze-element')
    answer.setAttribute(
      'data-element-id',
      'answer_area_for_questionID_' + row.get('id')
    )
    answerAndNext.append(answer)

    if (row.get('type') == 'open-question') {
      console.log('open-question')

      const longAnswer = document.createElement('div')
      longAnswer.setAttribute('id', 'long-answer-question' + rowNum)
      longAnswer.innerHTML =
        '<input type="text" id="long-answer-question' +
        rowNum +
        '-answer" class="form-input gaze-element" data-element-id="long-answer-for-questionID_' +
        row.get('id') +
        '" />'
      answer.append(longAnswer)

      // record click
      const elementOfInterest = document.getElementById(
        'long-answer-question' + rowNum + '-answer'
      )
      elementOfInterest.addEventListener('click', () =>
        sendClickEvent(
          Date.now(),
          elementOfInterest.getAttribute('data-element-id')
        )
      )
    } else if (row.get('type') == 'multiple-choice') {
      console.log('multiple-choice')

      const multipleChoice = document.createElement('div')
      multipleChoice.setAttribute('id', 'multiple-choice-question' + rowNum)
      answer.append(multipleChoice)

      const options = document.createElement('div')
      options.setAttribute('class', 'choices')
      multipleChoice.append(options)

      var optionsText = row.get('options').split(';')

      for (let i = 0; i < optionsText.length; i++) {
        const option = document.createElement('div')
        option.setAttribute('class', 'choice')
        option.innerHTML =
          '<div class="radio-and-text gaze-element" data-element-id="option-answer-for-questionID_' +
          row.get('id') +
          '_option_' +
          optionsText[i] +
          '"><input class="radio" id="option-answer-for-questionID_' +
          row.get('id') +
          '_option_' +
          i +
          '" data-element-id="option-answer-radio-for-questionID_' +
          row.get('id') +
          '_option_' +
          optionsText[i] +
          '" type="radio" value="' +
          optionsText[i] +
          '" name="multiple-choice-question' +
          rowNum +
          '-answer"/><span class="text">' +
          optionsText[i] +
          '</span></div>'
        options.append(option)

        // record click
        const elementOfInterest = document.getElementById(
          'option-answer-for-questionID_' + row.get('id') + '_option_' + i
        )
        elementOfInterest.addEventListener('click', () =>
          sendClickEvent(
            Date.now(),
            elementOfInterest.getAttribute('data-element-id')
          )
        )
      }
    } else {
      console.error(row.get('type') + 'is an unkown question type')
    }

    const next = document.createElement('div')
    next.setAttribute('class', 'next gaze-element')
    next.setAttribute(
      'data-element-id',
      'next-button-area-in-questionID_' + row.get('id')
    )

    next.innerHTML =
      '<button class="next-btn" data-element-id="next-button-inner-in-questionID_' +
      row.get('id') +
      '" id="next-question' +
      rowNum +
      '-btn">Next</button>'
    answerAndNext.append(next)

    document.getElementById('next-question' + rowNum + '-btn').onclick =
      async () => {
        // record click
        const elementOfInterest = document.getElementById(
          'next-question' + rowNum + '-btn'
        )
        sendClickEvent(
          Date.now(),
          elementOfInterest.getAttribute('data-element-id')
        )

        const answerText =
          row.get('type') == 'open-question'
            ? document.getElementById(
                'long-answer-question' + rowNum + '-answer'
              ).value
            : row.get('type') == 'multiple-choice' &&
                document.querySelector(
                  'input[name="multiple-choice-question' +
                    rowNum +
                    '-answer"]:checked'
                ) != null
              ? document.querySelector(
                  'input[name="multiple-choice-question' +
                    rowNum +
                    '-answer"]:checked'
                ).value
              : ''

        const nextRow =
          rowNum + 1 < questions.count() ? questions.getRow(rowNum + 1) : null
        await nextQuestion(
          rowNum,
          rowNum + 1,
          questions.count(),
          row,
          answerText,
          nextRow
        )
        /// nextQuestion(currentQuestionId, nextQuestionId, questionsArrSize , currentQuestion, givenAnswer, nextQuestion)
      }
  })
}

/**
 * Title: start questions
 *
 * Description: show first question
 *
 * @param {void} . .
 *
 * Returns {void}
 *
 *
 * Additional notes: none
 *
 */
function startQuestions() {
  console.log('startQuestions', arguments)

  var state = getState()
  const questions = new DataFrame(state.questions)

  nextQuestion(null, 0, questions.count(), null, null, questions.getRow(0))
}

/**
 * Title: move to next question
 *
 * Description: move to next question
 *
 * @param {string} currentQuestionId id of the current question
 * @param {int} nextQuestionId id of the next question
 * @param {string} questionsArrSize size of the questions array
 * @param {string} currentQuestion current question text
 * @param {string} givenAnswer given answer text
 * @param {object} nextQuestion row object
 *
 * Returns {void}
 *
 *
 * Additional notes: none
 *
 */
async function nextQuestion(
  currentQuestionId,
  nextQuestionId,
  questionsArrSize,
  currentQuestion,
  givenAnswer,
  nextQuestion
) {
  console.log('nextQuestion', arguments)

  var state = getState()

  if (!state.isEtOn) {
    const msg = 'Eye-tracking has not started yet'
    errorAlert(msg)
    console.error(msg)
    return null
  }

  if (nextQuestionId == 0) {
    document.getElementById('questions-ready').style.display = 'none'
    await questionOnset(nextQuestion, nextQuestionId)
    document.getElementById('question' + nextQuestionId).style.display = 'block'

    // show appropriate models group
    showModelsGroup(nextQuestion.get('model-group'))

    // reset nav tabs and tabs
    resetNavTabsAndTabs(nextQuestion.get('model-group'))
  } else if (nextQuestionId < questionsArrSize) {
    document.getElementById('question' + currentQuestionId).style.display =
      'none'
    await questionOffset(currentQuestion, currentQuestionId, givenAnswer)
    await questionOnset(nextQuestion, nextQuestionId)
    document.getElementById('question' + nextQuestionId).style.display = 'block'

    // show appropriate models group
    showModelsGroup(nextQuestion.get('model-group'))

    // reset nav tabs and tabs
    resetNavTabsAndTabs(nextQuestion.get('model-group'))
  } else if (nextQuestionId >= questionsArrSize) {
    document.getElementById('question' + currentQuestionId).style.display =
      'none'
    await questionOffset(currentQuestion, currentQuestionId, givenAnswer)
    document.getElementById('questions-over').style.display = 'block'

    // show appropriate models group
    //showModelsGroup(null)

    // reset nav tabs and tabs
    resetNavTabsAndTabs()

    // stop eye-tracking
    stopETInteraction()
  }
}

/**
 * Title: question onset
 *
 * Description: question onset
 *
 * @param {object} question row object
 * @param {int} questionPosition question position (i.e., nextQuestionId)
 *
 * Returns {void}
 *
 *
 * Additional notes: none
 *
 */
async function questionOnset(question, questionPosition) {
  console.log('QuestionOnset', arguments)

  const questionText = question.get('question')
  const questionLogId = question.get('id')
  const questionTimestamp = Date.now()
  const questionEventType = 'questionOnset'

  console.log('questionText ', questionText)
  console.log('questionTimestamp ', questionTimestamp)
  console.log('questionEventType ', questionEventType)
  console.log('questionPosition', questionPosition)
  console.log('questionLogId', questionLogId)

  await sendQuestionEvent(
    questionTimestamp,
    questionEventType,
    questionPosition,
    questionText,
    '',
    questionLogId
  )
}

/**
 * Title: question offset
 *
 * Description:question offset
 *
 * @param {object} question row object
 * @param {int} questionPosition question position (i.e., nextQuestionId)
 * @param {string} questionAnswer question answer text
 *
 * Returns {void}
 *
 *
 * Additional notes: none
 *
 */
async function questionOffset(question, questionPosition, questionAnswer) {
  console.log('QuestionOffset', arguments)

  const questionText = question.get('question')
  const questionLogId = question.get('id')
  const questionTimestamp = Date.now()
  const questionEventType = 'questionOffset'

  console.log('questionText ', questionText)
  console.log('questionAnswer', questionAnswer)
  console.log('questionTimestamp ', questionTimestamp)
  console.log('questionEventType ', questionEventType)
  console.log('questionPosition', questionPosition)
  console.log('questionLogId', questionLogId)

  await sendQuestionEvent(
    questionTimestamp,
    questionEventType,
    questionPosition,
    questionText,
    questionAnswer,
    questionLogId
  )
}

/**
 * Title: send question event to the eye-tracking server
 *
 * Description: send question event to the eye-tracking server
 *
 * @param {string} questionTimestamp timestamp of the event
 * @param {string} questionEventType type of question event (i.e., questionOnset, questionOffset)
 * @param {int} questionPosition question position (i.e., nextQuestionId)
 * @param {string} questionText  question text
 * @param {string} questionAnswer answer text
 * @param {string} questionID id of the question
 *
 * Returns {void}
 *
 *
 * Additional notes:  arguments are exposed in window.clientTests for testing purpose
 *
 */
async function sendQuestionEvent(
  questionTimestamp,
  questionEventType,
  questionPosition,
  questionText,
  questionAnswer,
  questionID
) {
  console.log('sendQuestionEvent', arguments)

  // for testing purpose
  if (
    window.hasOwnProperty('clientTests') &&
    questionEventType == 'questionOnset'
  ) {
    window.clientTests.lastOnSetQuestionEvent = {
      questionTimestamp: questionTimestamp,
      questionEventType: questionEventType,
      questionPosition: questionPosition,
      questionText: questionText,
      questionAnswer: questionAnswer,
      questionID: questionID,
    }
  }
  if (
    window.hasOwnProperty('clientTests') &&
    questionEventType == 'questionOffset'
  ) {
    window.clientTests.lastOffSetQuestionEvent = {
      questionTimestamp: questionTimestamp,
      questionEventType: questionEventType,
      questionPosition: questionPosition,
      questionText: questionText,
      questionAnswer: questionAnswer,
      questionID: questionID,
    }
  }

  const res = await window.eyeTracker.sendQuestionEvent(
    questionTimestamp,
    questionEventType,
    questionPosition,
    questionText,
    questionAnswer,
    questionID
  )
  if (!res.sucess) {
    console.error(res.msg)
  }
}

/**
 * Title: are model groups valid
 *
 * Description:  are model groups valid
 *
 * @param {object} questions questions
 *
 * Returns {boolean} whether or not  model groups are valid
 *
 *
 * Additional notes: none
 *
 */
function areModelGroupsValid(questions) {
  console.log('areModelGroupsValid', arguments)

  const state = getState()

  const df = new DataFrame(questions)

  // get model groups
  var modelGroups = []
  for (const model of Object.values(state.models)) {
    console.log('model', model)
    if (!modelGroups.includes(model.groupId)) {
      console.log('push')
      modelGroups.push(model.groupId)
    }
  }

  console.log('modelGroups', modelGroups)

  // check
  let checker = (arr, target) => target.every((v) => arr.includes(v))
  console.log(
    "df.unique('model-group').toArray().flat()",
    df.unique('model-group').toArray().flat()
  )
  return checker(modelGroups, df.unique('model-group').toArray().flat())
}

export {
  loadQuestions,
  generateQuestionsSequence,
  startQuestions,
  areModelGroupsValid,
}
