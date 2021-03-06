/*
 * Provides an interface that translates redux-crud-store actions into IMAP
 * queries and cache lookups.
 *
 * @flow
 */

import * as Kefir               from 'kefir'
import * as m                   from 'mori'
import { threadToConversation } from 'arfe/conversation'
import { midPartUri }           from 'arfe/models/message'
import * as T                   from 'arfe/models/thread'
import * as gmail               from '../stores/gmail/gmail'
import { tokenGenerator }       from '../stores/gmail/tokenGenerator'

import type { PouchDB }          from 'pouchdb'
import type { Message }          from 'arfe/models/message'
import type { ThreadResult }     from './actions'
import type { XOAuth2Generator } from '../stores/gmail/tokenGenerator'

export default class ApiClient {
  db: PouchDB;
  tokenGenerator: XOAuth2Generator;

  constructor(tokGen: XOAuth2Generator, db: PouchDB) {
    this.db = db
    this.tokenGenerator = tokGen

    // TODO: see https://github.com/uniqueway/redux-crud-store/issues/4
    this.get    = this.get   .bind(this)
    this.post   = this.post  .bind(this)
    this.put    = this.put   .bind(this)
    this.patch  = this.patch .bind(this)
    this.delete = this.delete.bind(this)
  }

  get(path, { params, fetchConfig }: Object): Promise<{ data: any }> {
    if (path === '/threads') {
      const query = params.query
      return getThreads(this.db, this.tokenGenerator, query)
    }
    else {
      return Promise.reject(new Error(`path not recognized: ${path}`))
    }
  }
  post() {}
  put() {}
  patch() {}
  delete() {}

}

function getThreads(
  db:     PouchDB,
  tokGen: XOAuth2Generator,
  query:  string
): Promise<{ data: ThreadResult[] }> {
  return gmail.search(query, tokGen, (attachment, msg) => storeAttachment(db, attachment, msg))
  .scan(
    (threads, thread) => m.conj(threads, thread), m.vector()
  )
  .toPromise()
  .then(threads => {
    const threadObjs = m.map(thread => ({ id: T.getId(thread), thread }), threads)
    return {
      data: m.toJs(threadObjs)
    }
  })
}

function storeAttachment(db: PouchDB, attachment: Object, message: Message): Promise<void> {
  const doc: AttachmentDoc = {
    _id:        midPartUri(attachment, message),
    type:       'attachment',
    attachment: { ...attachment, stream: null },
    created:    new Date().toISOString(),
  }
  return db.put(doc)
}
