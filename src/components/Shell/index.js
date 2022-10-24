import { Button, Icon, Tooltip } from 'antd';
import { connect } from 'dva';
import { Link, routerRedux } from 'dva/router';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import React, { Component } from 'react';
import { Resizable } from "re-resizable";
import WebConsole from './WebConsole';
import globalUtil from '../../utils/global';
import styles from './index.less'


@connect(null, null, null, { withRef: true })
class Shell extends Component {
    constructor(props) {
        super(props)
        this.state = {
            bool: false,
            height: 400
        };
    }
    onResizeStart = (e) => {
    };
    onResize = (e) => {
    };
    // 收起隐藏
    packUpOrDown = (e) => {
        const { bool } = this.state
        if (bool) {
            this.setState({
                height: 450
            })
        } else {
            this.setState({
                height: 40
            })
        }
        this.setState({
            bool: !this.state.bool,
        })
    }
    // 退出shell终端
    terminalRepeal = () => {
        const { dispatch } = this.props
        dispatch({
            type: 'region/terminalRepeal',
            payload: true,
        });
    }
    // 新开页
    newPage = () =>{
       const { dispatch } = this.props
        dispatch({
            type: 'region/terminalRepeal',
            payload: true,
        });
    }
    render() {
        const { bool, height } = this.state
        const eid = globalUtil.getCurrEnterpriseId();
        return (
            <Resizable
                ref="big"
                style={{ position: 'absolute', bottom: 0, zIndex: 9999 }}
                defaultSize={{ height: 400 }}
                size={{ height: height }}
                onResize={(e) => this.onResize(e)}
                onResizeStart={(e) => this.onResizeStart(e)}
                onResizeStop={(e, direction, ref, d) => {
                    this.setState({
                        height: this.state.height + d.height,
                    });
                }}
                minWidth={'100%'}
                minHeight={40}
                maxHeight={'60vh'}
            >
                <div className={styles.shell_head}>
                    <Tooltip placement="top" title={bool ? formatMessage({ id: 'otherEnterprise.shell.show' }) : formatMessage({ id: 'otherEnterprise.shell.Pack_up' })} >
                        <Button type="primary" icon={bool ? "vertical-align-top" : "vertical-align-bottom"} onClick={this.packUpOrDown} style={{ margin: '0 20px 0 0' }} />
                    </Tooltip>
                    <Link
                        to={`/enterprise/${eid}/shell`}
                        target="_blank"
                    >
                        <Tooltip placement="top" title={formatMessage({ id: 'otherEnterprise.shell.new' })} >
                            <Button type="primary" style={{ margin: '0 20px 0 0' }} icon="arrows-alt" onClick={this.newPage}>
                            </Button>
                        </Tooltip>
                    </Link>

                    <Tooltip placement="top" title={formatMessage({ id: 'otherEnterprise.shell.down' })}>
                        <Button type="primary" icon={"close"} onClick={this.terminalRepeal} style={{ margin: '0 20px 0 0' }} />
                    </Tooltip>
                </div>
                <div style={{ padding: "24px 24px 0 24px", height: "100%" }}>
                    <WebConsole height={height} />
                </div>
            </Resizable>

        );
    }
}

export default Shell;

