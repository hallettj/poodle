/* @flow */

import { takeLatest } from 'redux-saga'
import imapStoreSaga from '../imap-store/sagas'

import type { Effect } from 'redux-saga'

// Generator type parameters are of the form: `Generator<+Yield,+Return,-Next>`

export default function* root(): Generator<Effect,void,any> {
  yield* imapStoreSaga
}