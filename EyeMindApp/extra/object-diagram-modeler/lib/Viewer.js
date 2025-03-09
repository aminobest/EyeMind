import OverlaysModule from 'diagram-js/lib/features/overlays'
import SelectionModule from 'diagram-js/lib/features/selection'
import TranslateModule from 'diagram-js/lib/i18n/translate'
import inherits from 'inherits'
import BaseViewer from './BaseViewer'
import CoreModule from './core'

export default function Viewer(options) {
  BaseViewer.call(this, options)
}

inherits(Viewer, BaseViewer)

// modules the viewer is composed of
Viewer.prototype._modules = [CoreModule, TranslateModule, SelectionModule, OverlaysModule]

// default moddle extensions the viewer is composed of
Viewer.prototype._moddleExtensions = {}
