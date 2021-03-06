/* @flow */

import * as m    from 'mori'
import { List }  from 'immutable'
import { lens }  from 'safety-lens'
import { index } from 'safety-lens/immutable'

import type { Lens_ }        from 'safety-lens'
import type { Conversation } from 'arfe/conversation'


/* state types */

export type View = RootView
                 | ConversationView
                 | ComposeView
                 | SettingsView
                 | AddAccountView

class RootView {
  searchQuery: ?string;
  conversations: ?m.Vector<Conversation>;
  constructor(searchQuery: ?string = null, conversations: ?m.Vector<Conversation> = null) {
    this.searchQuery = searchQuery
    this.conversations = conversations
  }
}

class ConversationView {
  id: ?string;
  uri: ?string;
  conversation: ?Conversation;
  constructor(id: ?string, uri: ?string, conversation: ?Conversation = null) {
    this.id = id
    this.uri = uri
    this.conversation = conversation
  }
}

class ComposeView {}
class SettingsView {}
class AddAccountView {}


/* state */

export type ViewState = List<View>

const initialState: List<View> = List.of(new RootView(null, m.vector()))


/* lenses & helpers */

const view: Lens_<ViewState,View> = lens(
  vs => vs.first(),
  (vs, v) => replaceView(v, vs)
)

function pushView(v: View, vs: ViewState): ViewState {
  // Under certain conditions, replace the view instead of pushing
  const prevView = vs.first()
  if (prevView instanceof RootView && v instanceof RootView &&
      prevView.searchQuery === v.searchQuery) {
    return replaceView(v, vs)
  }
  else {
    return vs.unshift(v)
  }
}

function popView(vs: ViewState): [?View, ViewState] {
  const v = vs.first()
  const vs_ = vs.count() > 1 ? vs.shift() : vs
  return [v, vs_]
}

function replaceView(v: View, vs: ViewState): ViewState {
  return vs.shift().unshift(v)
}

export {
  RootView,
  ConversationView,
  ComposeView,
  SettingsView,
  AddAccountView,
  initialState,
  popView,
  pushView,
  replaceView,
  view,
}
