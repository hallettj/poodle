/* @flow */

import { List, Map, Record, Stack } from 'immutable'
import * as Act                     from './activity'

import type { Moment }                              from 'moment'
import type { Activity, ActivityObject, URI, Zack } from './activity'
import type { Message }                             from './notmuch'

export type DerivedActivity = Record & {
  activity:  Activity,  // original, unmutated activity
  message:   Message,   // message containing original activity, for context
  likes:     Map<URI, ActivityObject>,
  revisions: Stack<DerivedActivity>,
  verb:      ?DerivedVerb
}

var ActivityRecord = Record({
  activity:  undefined,
  message:   undefined,
  likes:     Map(),
  revisions: Stack(),
  verb:      null,
})

// Some derived activities are synthetic, and use verbs that are not available
// to real activities.
export type DerivedVerb = 'post' | 'reply' | 'share' | 'edit' | 'like' | 'unknown' |  'delete' | 'join' | 'aside' | 'conflict'

// function derive(activities: Zack[]): DerivedZack[] {
//   return activities.reduce(deriveAct(activities), [])
// }

function collapseLikes(
  context: List<DerivedActivity>,
  activity: DerivedActivity
): List<DerivedActivity> {
  if (verb(activity) === 'like') {
    return List()  // likes are not directly visible
  }

  var thisId = activityId(activity)
  var likes  = context.reduce((ppl, otherAct) => {
    if (verb(otherAct) === 'like' && targetUri(otherAct) === thisId) {
      var p = actor(otherAct)
      return ppl.set(p.uri, p)
    }
    return ppl
  }, Map())

  return List.of(
    activity.set('likes', likes)
  )
}

function collapseEdits(
  context: List<DerivedActivity>,
  activity: DerivedActivity
): List<DerivedActivity> {
  if (verb(activity) === 'edit') {
    return List()
  }

  var [revisions, conflicts] = context.reduce((accum, other) => {
    var [rs, cs] = accum
    var uri      = targetUri(other)
    if (verb(other) === 'edit' && uri && sameActor(activity, other)) {
      var i = rs.findIndex(a => activityId(a) === uri)
      if (i === 0) {
        return [rs.unshift(other), cs]
      }
      else if (i >= 1) {
        return [rs, cs.push(conflict(other))]
      }
      else {
        return accum
      }
    }
  }, [Stack(), List()])

  return conflicts.unshift(
    activity.set('revisions', revisions)
  )
}

function sameActor(x: DerivedActivity, y: DerivedActivity): boolean {
  // TODO: more robust URI comparisons
  return actor(x).uri === actor(y).uri
}

function conflict(activity: DerivedActivity): DerivedActivity {
  return new ActivityRecord({
    activity: activity.activity,
    message:  activity.message,
    verb:     'conflict',
  })
}

function deriveAct([act, msg]: Zack): DerivedActivity {
  return new ActivityRecord({
    activity: act,
    message:  msg,
  })
}

function derive(activities: List<Zack>): DerivedActivity[] {
  var ds = activities.map(deriveAct)
  return ds
    .flatMap(collapseLikes.bind(null, ds))
    .flatMap(collapseEdits.bind(null, ds))
}

function activityId({ activity, message }: DerivedActivity): URI {
  return Act.activityId([activity, message])
}

function actor({ activity, message }: DerivedActivity): ActivityObject {
  return Act.actor([activity, message])
}

function likes({ likes }: DerivedActivity): Map<URI, ActivityObject> {
  return likes || Map()
}

function likeCount(activity: DerivedActivity): number {
  return likes(activity).size
}

function message(activity: DerivedActivity): Message {
  return activity.message
}

function object({ activity }: DerivedActivity): ?ActivityObject {
  return activity.object
}

function objectContent(activity: DerivedActivity): { contentType: string, content: Buffer }[] {
  return Act.objectContent([activity.activity, activity.message])
}

function objectType({ activity }: DerivedActivity): ?DerivedVerb {
  if (activity.object) {
    return activity.object.objectType
  }
}

function published(activity: DerivedActivity): Moment {
  return Act.published(activity)
}

function target({ activity }: DerivedActivity): ?ActivityObject {
  return activity.target
}

function targetUri(activity: DerivedActivity): ?URI {
  var t = target(activity)
  var uri = t ? t.uri : undefined
  if (uri) {
    return Act.resolveUri(message(activity), uri)
  }
}

function verb(activity: DerivedActivity): DerivedVerb {
  return activity.verb || activity.activity.verb
}

export {
  activityId,
  actor,
  derive,
  likes,
  likeCount,
  message,
  object,
  objectContent,
  objectType,
  published,
  target,
  verb,
}