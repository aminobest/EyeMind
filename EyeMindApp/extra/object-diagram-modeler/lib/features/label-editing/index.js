import DirectEditingModule from 'diagram-js-direct-editing'
import ChangeSupportModule from 'diagram-js/lib/features/change-support'
import ResizeModule from 'diagram-js/lib/features/resize'
import LabelEditingPreview from './LabelEditingPreview'
import LabelEditingProvider from './LabelEditingProvider'

export default {
  __depends__: [ChangeSupportModule, ResizeModule, DirectEditingModule],
  __init__: ['labelEditingProvider', 'labelEditingPreview'],
  labelEditingProvider: ['type', LabelEditingProvider],
  labelEditingPreview: ['type', LabelEditingPreview],
}
