/* @flow */

import * as Sunshine from 'sunshine/react'
import React         from 'react'
import moment        from 'moment'
import repa          from 'repa'
import { mailtoUri } from '../../../lib/activity'
import * as Ev       from '../event'
import * as State    from '../state'
import { activityId
       , actor
       , likes
       , likeCount
       , objectContent
       , objectType
       , published
       } from '../../../lib/derivedActivity'
import { AppBar
       , AppCanvas
       , Avatar
       , Card
       , CardHeader
       , FlatButton
       , LeftNav
       , Paper
       , RefreshIndicator
       , Styles
       , TextField
       , Toolbar
       , ToolbarGroup
       , ToolbarTitle
       } from 'material-ui'

import type { DerivedActivity } from '../../../lib/derivedActivity'
import type { Conversation }    from '../../../lib/conversation'

type ActivityProps = {
  activity:     DerivedActivity,
  conversation: Conversation,
  loading:      boolean,
  username:     string,
  useremail:    string,
}

var styles = {
  body: {
    padding: '16px',
    paddingTop: 0,
    whiteSpace: 'pre-wrap',
  }
}

export class ActivityView extends Sunshine.Component<{},ActivityProps,{}> {
  render(): React.Element {
    var activity = this.props.activity
    if (objectType(activity) === 'note') {
      return (
        <NoteView {...this.props} />
      )
    }
    else {
      return (
        <UnknownView {...this.props} />
      )
    }
  }

  unknown(): React.Element {
    return (
      <Paper>
        {displayUnknown()}
      </Paper>
    )
  }
}

class NoteView extends Sunshine.Component<{},ActivityProps,{}> {
  render(): React.Element {
    var activity = this.props.activity
    var fromStr  = actor(activity).displayName || '[unknown sender]'
    var dateStr  = published(activity).fromNow()
    return (
      <Paper>
        <CardHeader
          title={fromStr}
          subtitle={dateStr}
          avatar={<Avatar>{fromStr[0]}</Avatar>}
          >
          <LikeButton style={{ float:'right' }} {...this.props} />
        </CardHeader>
        {displayContent(activity)}
      </Paper>
    )
  }
}

class UnknownView extends Sunshine.Component<{},ActivityProps,{}> {
  render(): React.Element {
    var activity = this.props.activity
    var fromStr  = actor(activity).displayName || '[unknown sender]'
    var dateStr  = published(activity).fromNow()
    return (
      <Paper>
        <CardHeader
          title={fromStr}
          subtitle={dateStr}
          avatar={<Avatar>{fromStr[0]}</Avatar>}
          />
        {displayContent(activity)}
      </Paper>
    )
  }
}

type LikeButtonProps = ActivityProps & {
  style?: Object
}

class LikeButton extends Sunshine.Component<{},LikeButtonProps,{}> {
  render(): React.Element {
    var activity     = this.props.activity
    var me           = mailtoUri(this.props.useremail)
    var alreadyLiked = likes(activity).some(l => l.uri === me)
    var myContent    = actor(activity).uri === me
    return (
      <FlatButton
        style={this.props.style || {}}
        label={`+${likeCount(activity)+1}`}
        onTouchTap={this.like.bind(this)}
        disabled={myContent || alreadyLiked || this.props.loading}
        />
    )
  }

  like() {
    this.emit(new Ev.Like(this.props.activity, this.props.conversation))
  }
}

function displayContent(activity: DerivedActivity): React.Element {
  var content = objectContent(activity)
  .sort((a,b) => {
    // prefer text/plain
    if (a.contentType === 'text/plain' && b.contentType !== 'text/plain') {
      return -1
    }
    else if (a.contentType !== 'text/plain' && b.contentType === 'text/plain') {
      return 1
    }
    else {
      return 0
    }
  })
  .filter(({ contentType }) => contentType === 'text/plain' || contentType === 'text/html')  // TODO: support other content types
  [0]
  if (content && content.contentType === 'text/plain') {
    return displayText(content.content)
  }
  else if (content && content.contentType === 'text/html') {
    return displayHtml(content.content)
  }
  else {
    return displayUnknown()
  }
}

function displayText(content: Buffer): React.Element {
  return <p style={styles.body}>{repa(content.toString('utf8'))}</p>
}

function displayHtml(content: Buffer): React.Element {
  return <p style={styles.body}>TODO: display HTML</p>
}

function displayUnknown(): React.Element {
  return <p style={styles.body}><em>unknown activity type</em></p>
}
