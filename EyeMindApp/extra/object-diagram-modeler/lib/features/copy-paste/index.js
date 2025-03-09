import CopyPasteModule from 'diagram-js/lib/features/copy-paste'
import ModdleCopy from './ModdleCopy'
import ODCopyPaste from './ODCopyPaste'

export default {
  __depends__: [CopyPasteModule],
  __init__: ['odCopyPaste', 'moddleCopy'],
  odCopyPaste: ['type', ODCopyPaste],
  moddleCopy: ['type', ModdleCopy],
}
