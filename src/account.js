/* @flow */

import { List } from 'immutable'
import keytar from 'keytar'
import google from 'googleapis'
import { set } from 'safety-lens'
import { prop } from 'safety-lens/es2015'
import { getAccessToken, oauthClient } from './stores/gmail/google-oauth'
import * as Config from './config'

import type { OauthCredentials } from './stores/gmail/google-oauth'

export {
  setupGoogle,
  getGoogleCredentials,
}

export type Profile = {
  kind: 'plus#person',
  etag: string,
  occupation: string,
  emails: { value: Email, type: 'account' }[],
  urls: { value: URL, type: string, label: string }[],
  objectType: 'person',
  id: string,
  displayName: string,
  name: { familyName: string, givenName: string },
  tagline: string,
  url: URL,
  image: { url: URL, isDefault: boolean },
  organizations: { name: string, title: string, type: string, startDate: string, endDate: string, primary: boolean }[],
  placesLived: { value: string, primary?: boolean }[],
  isPlusUser: boolean,
  circledByCount: number,
  verified: boolean,
  cover: {
    layout: string,
    coverPhoto: { url: URL, height: number, width: number },
    coverInfo: { topImageOffset: number, leftImageOffset: number },
  },
}

type Email = string
type URL   = string

const scopes = [
  'email',  // get user's email address
  'https://mail.google.com/',  // IMAP and SMTP access
  'https://www.googleapis.com/auth/contacts.readonly',  // contacts, read-only
]
const client_id = '550977579314-ot07bt4ljs7pqenefen7c26nr80e492p.apps.googleusercontent.com'
const client_secret = 'ltQpgi6ce3VbWgxCXzCgKEEG'

function setupGoogle(email: string): Promise<Config.Account> {
  return getAccessToken({
    client_id, client_secret, scopes, login_hint: email
  }).then(creds => {
    const plus = google.plus('v1')
    const oauth = oauthClient(client_id, client_secret)
    oauth.setCredentials(creds)
    return new Promise((resolve, reject) => {
      plus.people.get({ userId: 'me', auth: oauth }, (err, resp) => {
        if (err) { reject(err) } else { resolve(resp) }
      })
    })
    .then(profile => {
      const json = JSON.stringify(creds)
      const addedPassword = accountEmails(profile.emails).reduce((success, e) => {
        return success && keytar.addPassword('Poodle', e, json)
      }, true)
      if (addedPassword) {
        return profile
      }
      else {
        return Promise.reject(new Error('Could not add your OAuth credentials to the system keychain.'))
      }
    })
  })
  .then(({ displayName, emails }) => {
    const email = accountEmails(emails)[0]
    return Config.loadConfig().then(config => {
      const account = Config.newAccount({ displayName, email })
      const config_ = set(prop('accounts'), List.of(account), config)
      return Config.saveConfig(config_).then(() => account)
    })
  })
}

function getGoogleCredentials(email: Email): ?OauthCredentials {
  const json = keytar.getPassword('Poodle', email)
  if (json) { return JSON.parse(json) }
}

function accountEmails(emails) {
  return emails.filter(e => e.type === 'account').map(e => e.value)
}
