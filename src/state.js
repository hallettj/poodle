/* @flow */

import { compose, filtering, getter, lookup, over, set } from 'safety-lens'
import * as m                from 'mori'
import { List, Map}          from 'immutable'
import { key }               from 'safety-lens/es2015'
import { prop }              from 'safety-lens/es2015'
import { index }             from 'safety-lens/immutable'
import * as CS               from './composer/state'
import * as AS               from './add_account/state'
import * as AuthState        from './auth/state'
import * as ViewState        from './state/ViewState'
import { published }         from 'arfe/activity'
import { parseMidUri }       from 'arfe/models/message'
import * as Act              from 'arfe/derivedActivity'
import { constructor }       from './util/record'

import type { Fold, Getter, Lens_, Traversal_ } from 'safety-lens'
import type { URI }                             from 'arfe/activity'
import type { DerivedActivity }                 from 'arfe/derivedActivity'
import type { Conversation }                    from 'arfe/conversation'
import type { Config, Account }                 from './config'
import type { Constructor }                     from './util/record'

export type AppState = {
  loading:          number,
  view:             ViewState.ViewState,
  routeParams:      Map<string,string>,
  genericError?:    string,
  config?:          Config,
  notification?:    string,
  composerState:    CS.ComposerState,
  addAccountState   : AS.AddAccountState,
  authState:        AuthState.AuthState,
  showLink?:        DerivedActivity,
  leftNavOpen:      boolean,
}

const newAppState: Constructor<*,AppState> = constructor({
  loading:         0,
  view:            ViewState.initialState,
  routeParams:     Map(),
  composerState:   CS.initialState,
  addAccountState: AS.initialState,
  authState:       AuthState.initialState,
  leftNavOpen:     false,
})

const initialState: AppState = newAppState()


/* ViewState lenses */

const views: Lens_<AppState,ViewState.ViewState> = prop('view')
const view:  Lens_<AppState,ViewState.View> = compose(views, ViewState.view)


/* lenses & helpers */

const addAccountState: Lens_<AppState,AS.AddAccountState> = prop('addAccountState')
const authState: Lens_<AppState,AuthState.AuthState> = prop('authState')
const composerState: Lens_<AppState,CS.ComposerState> = prop('composerState')

const conversations: Fold<any,AppState,List<Conversation>> = compose(view, key('conversations'))
const conversation: Fold<any,AppState,Conversation> = compose(view, key('conversation'))
const loading: Lens_<AppState,number> = prop('loading')
const isLoading: Getter<AppState,boolean> = getter(state => state.loading > 0)
const routeParams: Lens_<AppState,Map<string,string>> = prop('routeParams')
const genericError: Lens_<AppState,?string> = prop('genericError')
const notification = prop('notification')
const showLink = prop('showLink')
const searchQuery: Fold<any,AppState,string> = compose(view, key('searchQuery'))

const config: Lens_<AppState,?Config> = prop('config')
const config_: Traversal_<AppState,Config> = compose(prop('config'), filtering(c => !!c))

const useraccount: Traversal_<AppState,Account> =
  compose(compose(config_, prop('accounts')), index(0))
const username: Traversal_<AppState,string> =
  compose(useraccount, prop('displayName'))
const useremail: Traversal_<AppState,string> =
  compose(useraccount, prop('email'))

const likeMessage: Traversal_<AppState,string> = compose(config_, prop('likeMessage'))

const leftNavOpen: Lens_<AppState,boolean> = prop('leftNavOpen')

function routeParam(key: string): Traversal_<AppState,string> {
  return compose(routeParams, index(key))
}

function conversationById(id: string, state: AppState): ?Conversation {
  const convs = lookup(conversations, state)
  return convs && convs.find(c => c.id === id)
}

function currentConversation(state: AppState): ?Conversation {
  const id = state.routeParams.get('conversationId')
  const conv = lookup(conversation, state)
  if (conv && conv.id === id) {
    return conv
  }
}

function currentActivity(state: AppState): ?Conversation {
  const conv = currentConversation(state)
  const uri = state.routeParams.get('activityUri')
  if (conv && uri) {
    return m.first(m.filter(a => Act.activityId(a) === uri, conv.activities))
  }
}


export {
  addAccountState,
  authState,
  composerState,
  config,
  config_,
  conversation,
  conversations,
  conversationById,
  currentConversation,
  genericError,
  initialState,
  isLoading,
  likeMessage,
  loading,
  // lookupUri,
  leftNavOpen,
  notification,
  routeParam,
  routeParams,
  searchQuery,
  showLink,
  useraccount,
  username,
  useremail,
  view,
  views,
}
