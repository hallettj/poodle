/* @flow */

import { List } from 'immutable'
import keytar from 'keytar'
import google from 'googleapis'
import { getAccessToken, oauthClient } from './auth/google'
import * as Config from './config'

import type { OauthCredentials } from './auth/google'

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

function setupGoogle(): Promise<Config.Account> {
  return getAccessToken().then(creds => {
    var plus = google.plus('v1')
    var oauth = oauthClient(creds)
    return new Promise((resolve, reject) => {
      plus.people.get({ userId: 'me', auth: oauth }, (err, resp) => {
        if (err) { reject(err) } else { resolve(resp) }
      })
    })
    .then(profile => {
      var json = JSON.stringify(creds)
      accountEmails(profile.emails).forEach(e => {
        keytar.addPassword('Poodle', e.value, json)
      })
      return profile
    })
  })
  .then(({ displayName, emails }) => {
    var email = accountEmails(emails)[0]
    return Config.loadConfig().then(config => {
      var account = new Config.AccountRecord({ displayName, email })
      var config_ = config.set('accounts', List.of())
      return Config.saveConfig(config_).then(() => account)
    })
  })
}

function getGoogleCredentials(email: Email): ?OauthCredentials {
  var json = keytar.getPassword('Poodle', email)
  if (json) { return JSON.parse(json) }
}

function accountEmails(emails) {
  return emails.filter(e => e.type === 'account')
}