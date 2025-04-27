import React, { Component } from 'react'
import RbdPlugins from '../RbdPlugins'
import Global from '@/utils/global';


export default class componentPlugin extends Component {
  render() {    
    return (
      <div>
        <RbdPlugins isCom={true} key={Global.getComponentPluginType()}/>
      </div>
    )
  }
}
