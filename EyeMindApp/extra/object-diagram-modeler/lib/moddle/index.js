import { assign } from 'min-dash'
import Moddle from './Moddle'
import DcDescriptors from './resources/dc.json'
import ODDescriptors from './resources/od.json'
import DiDescriptors from './resources/odDi.json'

var packages = {
  od: ODDescriptors,
  odDi: DiDescriptors,
  dc: DcDescriptors,
}

export default function (additionalPackages, options) {
  var pks = assign({}, packages, additionalPackages)

  return new Moddle(pks, options)
}
