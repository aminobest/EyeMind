import GridSnappingModule from 'diagram-js/lib/features/grid-snapping'
import BpmnGridSnapping from './BpmnGridSnapping'
import GridSnappingBehaviorModule from './behavior'

export default {
  __depends__: [GridSnappingModule, GridSnappingBehaviorModule],
  __init__: ['bpmnGridSnapping'],
  bpmnGridSnapping: ['type', BpmnGridSnapping],
}
