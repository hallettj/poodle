/* @flow */

import * as Sunshine   from 'sunshine-framework/react'
import React           from 'react'
import stringHash      from 'string-hash'
import { displayName } from 'arfe/models/address'
import { Avatar
       , Styles
       } from 'material-ui'

import type { Address }        from 'arfe/models/address'
import type { ActivityObject } from 'arfe/activity'

export {
  actorAvatar,
  addressAvatar,
}

var { Colors } = Styles

function actorAvatar(p: ?ActivityObject): React.Element {
  p = p || {}
  var str = (p.displayName || '?')[0].toUpperCase()
  var addr = (p.uri || 'mailto:?').slice(7)
  var [color, backgroundColor] = getColors(addr)
  return <Avatar color={color} backgroundColor={backgroundColor}>{str}</Avatar>
}

function addressAvatar(p: Address): React.Element {
  var str = (displayName(p) || '?')[0].toUpperCase()
  var addr = p.address
  var [color, backgroundColor] = getColors(addr)
  return <Avatar color={color} backgroundColor={backgroundColor}>{str}</Avatar>
}

var primaryColors = Object.keys(Colors).filter(k => k.match(/500$/))
var accentColors = Object.keys(Colors).filter(k => k.match(/A100+$/))
var primaryCount = primaryColors.length
var accentCount = accentColors.length

function getColors(address: string): [string, string] {
  var f = stringHash('fg'+address)
  var b = stringHash('bg'+address)
  return [
    Colors[accentColors[f & accentCount]],
    Colors[primaryColors[b % primaryCount]],
  ]
}
