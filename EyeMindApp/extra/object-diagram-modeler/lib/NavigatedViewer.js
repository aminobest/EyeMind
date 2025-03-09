import KeyboardMoveModule from 'diagram-js/lib/navigation/keyboard-move'
import MoveCanvasModule from 'diagram-js/lib/navigation/movecanvas'
import ZoomScrollModule from 'diagram-js/lib/navigation/zoomscroll'
import inherits from 'inherits'
import Viewer from './Viewer'

/**
 * A viewer that includes mouse navigation facilities
 *
 * @param {Object} options
 */
export default function NavigatedViewer(options) {
  Viewer.call(this, options)
}

inherits(NavigatedViewer, Viewer)

NavigatedViewer.prototype._navigationModules = [
  KeyboardMoveModule,
  MoveCanvasModule,
  ZoomScrollModule,
]

NavigatedViewer.prototype._modules = [].concat(
  Viewer.prototype._modules,
  NavigatedViewer.prototype._navigationModules,
)
