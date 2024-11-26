var localRpid = -1

function setLocalRpid(val) {
  localRpid = val
}

function getLocalRpid() {
  return localRpid
}

exports.setLocalRpid = setLocalRpid
exports.getLocalRpid = getLocalRpid
