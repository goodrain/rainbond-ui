import React, { Component } from 'react'
import RbdPlugins from '../RbdPlugins'


export default class componentPlugin extends Component {
  render() {    
    return (
      <div>
        <RbdPlugins {...this.props} isCom={true} viewPosition="Component" />
      </div>
    )
  }
}
