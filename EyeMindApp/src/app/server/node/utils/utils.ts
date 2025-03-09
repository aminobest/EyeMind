export function getMostCommon(table) {
  const occurances = new Map()

  table.forEach((row) => {
    occurances.set(JSON.stringify(row), (occurances.get(JSON.stringify(row)) || 0) + 1)
  })

  return table.reduce((a, b) =>
    occurances.get(JSON.stringify(a)) > occurances.get(JSON.stringify(b)) ? a : b,
  )
}

export function hasOneElement(arr) {
  const set = new ObjectSet(arr)
  // console.log("set" ,set, set.size)
  return set.size == 1 ? true : false
}

export class ObjectSet extends Set {
  add(elem) {
    return super.add(typeof elem === 'object' ? JSON.stringify(elem) : elem)
  }
  has(elem) {
    return super.has(typeof elem === 'object' ? JSON.stringify(elem) : elem)
  }
}

export function calculateProgress(i, max) {
  const progress = (i / max) * 100
  return Math.round(progress * 100) / 100
}

export function randomNumberInRange(min, max) {
  const diff = max - min
  let rand = Math.random()
  rand = Math.floor(rand * diff)
  rand = rand + min

  return rand
}

export function parseOriginalFileName(path) {
  return path.substring(path.lastIndexOf('\\') + 1, path.lastIndexOf('.'))
}
