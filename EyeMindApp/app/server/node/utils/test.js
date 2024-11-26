const { getState } = require('../dataModels/state')

async function getServerState() {
  return getState()
}

exports.getServerState = getServerState
