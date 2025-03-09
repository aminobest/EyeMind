import SnappingModule from 'diagram-js/lib/features/snapping'
import ODCreateMoveSnapping from './ODCreateMoveSnapping'
import ObjectConnectSnapping from './ObjectConnectSnapping'

export default {
  __depends__: [SnappingModule],
  __init__: ['connectSnapping', 'createMoveSnapping'],
  connectSnapping: ['type', ObjectConnectSnapping],
  createMoveSnapping: ['type', ODCreateMoveSnapping],
}
