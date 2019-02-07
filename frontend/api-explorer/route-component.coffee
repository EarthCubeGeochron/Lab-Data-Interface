import {Component} from 'react'
import h from 'react-hyperscript'
import {get} from 'axios'
import {Link, Route} from 'react-router-dom'
import ReactJson from 'react-json-view'
import ReactMarkdown from 'react-markdown'
import {StatefulComponent} from '@macrostrat/ui-components'
import {Button, AnchorButton, Intent, Icon} from '@blueprintjs/core'
import {join} from 'path'
import {nullIfError, Argument} from './utils'
import {APIUsageComponent} from './usage-component'
import {APIDataComponent} from './data-component'

RouteName = ({api_route, route, parent})->
  text = api_route
  backLink = h 'span.home-icon', [
    h Icon, {icon: 'home'}
  ]
  if parent?
    text = route
    # Have to assemble the button ourselves to make it a react-router link
    backLink = h Link, {
      to: parent
      className: 'bp3-button bp3-minimal bp3-intent-primary route-parent'
      role: 'button'
    }, [
      h Icon, {icon: 'arrow-left'}
      h 'span.bp3-button-text', api_route.replace(route, '')
    ]
  return h 'h2.route-name', [
    backLink
    h 'span.current-route', text
    h AnchorButton, {minimal: true, icon: 'link', href: api_route}
  ]

ChildRoutesList = ({base, routes})->
  return null unless routes?
  h 'div.child-routes', [
    h 'h3', 'Routes'
    h 'ul.routes', routes.map (d)->
      to = join(base, d.route)
      h 'li.route', [
        h Link, {to}, (
          h 'div.bp3-card.bp3-interactive', [
            h 'h4', d.route
            h 'p', d.description
          ]
        )
      ]
  ]

class RouteComponent extends StatefulComponent
  @defaultProps: {
    parent: null
  }
  constructor: (props)->
    super props
    @state = {
      response: null
      expandedParameter: null
    }
    @getData()

  routeData: ->
    {parent} = @props
    response = @state.response or {}
    api_route = @apiPath()
    {parent, api_route, response...}

  expandParameter: (id)=>
    @setState {expandedParameter: id}

  hasSubRoutes: ->
    {routes} = @state.response or {}
    (routes or []).length > 0

  renderMatch: =>
    {response, showJSON} = @state
    {match, parent} = @props
    console.log match
    {path, isExact} = match
    exact = @hasSubRoutes()
    return null unless response?
    return null unless isExact
    data = @routeData()
    {api_route, route} = data

    h Route, {path, exact}, [
      h 'div.route-ui', [
        h 'div.panel-header', [
          h RouteName, {api_route, route, parent}
        ]
        h 'div.route-body', [
          @renderBody()
        ]
      ]
    ]

  renderBody: ->
    data = @routeData()
    {routes} = @state.response
    {path: base} = @props.match
    {expandedParameter} = @props
    {expandParameter} = @
    api_route = @apiPath()
    if not data.arguments?
      # Basically, tell the data component not to render
      api_route = null

    return h 'div', [
      h ReactMarkdown, {source: data.description}
      h ChildRoutesList, {base, routes}
      h APIUsageComponent, {data, expandedParameter, expandParameter}
      h APIDataComponent, {
        route: api_route
        params: {offset: 0, limit: 10}
        title: "Data"
        storageID: 'data'
      }
    ]

  renderSubRoutes: nullIfError ->
    {response} = @state
    {routes} = response
    {path: parent} = @props.match
    # Use a render function instead of a component match
    render = (props)->
      h RouteComponent, {props..., parent}

    routes.map (r)->
      path = join parent, r.route
      h Route, {path, key: r.route, render}


  render: ->
    h 'div', [
      @renderMatch()
      @renderSubRoutes()
    ]

  apiPath: ->
    {path} = @props.match
    join '/api', path.replace("/api-explorer","")

  getData: ->
    {path} = @props.match
    {data, status} = await get(@apiPath())
    @setState {response: data}

export {RouteComponent}
