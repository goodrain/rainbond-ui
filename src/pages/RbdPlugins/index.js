import React, { Component } from 'react'
import { importAppPagePlugin } from '../../rbdplugins/index'
import { AppPagePlugin  } from 'xu-demo-data'
import {getRainbondInfo} from '../../services/api'
import Global from '@/utils/global'
import styles from './index.less'

export default class index extends Component {
  constructor(props) {
    super(props);
    this.state = {
      app: {}
    };
  }
  componentDidMount() {
    importAppPagePlugin({ module: 'rbd-plugins/dist/main.js' }).then(res => {
      console.log(res,"res");
      this.setState({app: res})
      this.setState
    })
  }
  render() {
    const AppPlugin = this.state.app.root
    return (
      <div style={{height:'100%',width:'100%'}} className={styles.Plugin}>
        {AppPlugin && <AppPlugin colorPrimary={Global.getPublicColor('primary-color')} api={getRainbondInfo} id={1555555}/>}
      </div>
    )
  }
}
