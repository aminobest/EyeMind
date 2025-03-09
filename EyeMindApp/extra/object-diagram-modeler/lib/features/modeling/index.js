import CommandModule from 'diagram-js/lib/command'
import AttachSupportModule from 'diagram-js/lib/features/attach-support'
import ChangeSupportModule from 'diagram-js/lib/features/change-support'
import LabelSupportModule from 'diagram-js/lib/features/label-support'
import SelectionModule from 'diagram-js/lib/features/selection'
import SpaceToolModule from 'diagram-js/lib/features/space-tool'
import TooltipsModule from 'diagram-js/lib/features/tooltips'
import CroppingConnectionDocking from 'diagram-js/lib/layout/CroppingConnectionDocking'
import DiOrderingModule from '../di-ordering'
import OrderingModule from '../ordering'
import RulesModule from '../rules'
import ElementFactory from './ElementFactory'
import Modeling from './Modeling'
import ODFactory from './ODFactory'
import ODLayouter from './ODLayouter'
import ODUpdater from './ODUpdater'
import BehaviorModule from './behavior'

export default {
  __init__: ['modeling', 'odUpdater'],
  __depends__: [
    BehaviorModule,
    RulesModule,
    DiOrderingModule,
    OrderingModule,
    CommandModule,
    TooltipsModule,
    LabelSupportModule,
    AttachSupportModule,
    SelectionModule,
    ChangeSupportModule,
    SpaceToolModule,
  ],
  odFactory: ['type', ODFactory],
  odUpdater: ['type', ODUpdater],
  elementFactory: ['type', ElementFactory],
  modeling: ['type', Modeling],
  layouter: ['type', ODLayouter],
  connectionDocking: ['type', CroppingConnectionDocking],
}
