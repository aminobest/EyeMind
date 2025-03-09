/* global parameters */
const globalParameters = {
  R_PORT: 5548,
  COMMUNICATION_HOST_TO_R_SERVER: 'http://127.0.0.1',
  COMMUNICATION_METHOD_TO_R_SERVER: 'POST',

  COMMUNICATION_METHOD_TO_ET_SERVER: 'POST',
  COMMUNICATION_URI_TO_ET_SERVER: 'http://127.0.0.1:5000/BPMeyeMind',

  MODELS_ID_REGEX: '[\W_,.]',
  EXPORT_FILES_PREFIX: 'EyeMind_',
  DELAY_FOR_RENDRING: 50,
  REPORT_FREQUENCY: 1000,

  DATA_FRAGMENT_SIZE: 5000,
  SNAPSHOTS_FRAGMENT_SIZE: 20,

  SAVING_PATH: 'outputData',

  QUESTION_TEXT_PREVIEW_LENGTH: 200,

  AREA_OFFSET: 30, // offset due to the difference between inner and outer window sizes

  RQUIRED_COLUMNS_IN_QUESTION_FILE: ['id', 'question', 'type', 'options', 'model-group'],
  QUESTION_TYPES_SUPPORTED: ['open-question', 'multiple-choice'],

  LAST_CONFIG_FILE_PATH: 'temp/pastConfig.json',

  R_SERVER_PID_PRINT_PATTERN: /^RServerPid=([0-9]{1,})$/,

  PATTERNS_FOR_ELEMENTS_OUTSIDE_MODEL_AREA: [
    '^file-explorer-folder_',
    '^file-explorer-file_',
    '^file-explorer-area',
    '^process-hierarchy-sub-process-link-to_',
    '^tab-header-tab-link-to_',
    '^tab-link-to_',
    '^close-button-tab-link-to_',
    '^question-area-for-questionID_',
    '^title-for-questionID_',
    '^answer_area_for_questionID_',
    '^long-answer-for-questionID_',
    '^option-answer-for-questionID_',
    '^next-button-area-in-questionID_',
  ],
}

export { globalParameters }
