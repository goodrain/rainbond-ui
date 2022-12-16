import { Tabs, Card, Col } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import styles from './index.less'
const { TabPane } = Tabs;
@connect(null, null, null, { withRef: true })
class Index extends PureComponent {
    constructor(props) {
        super(props)
        this.state = {
            
        }
    }

    render() {

        return (
            <div style={{ marginTop: '24px' }}>
                <div className={styles.boxs}>
                    <Col span={2}>
                        图标
                    </Col>
                    <Col span={12}>
                        <p className={styles.pluginName}>大屏监控</p>
                        <p className={styles.pluginDesc}>监控类插件，可以通过大屏展示整个平台的数据信息。</p>
                    </Col>
                    <Col span={3}>
                        <div className={styles.statusBox}>
                            <div className={styles.status}></div>
                            <div className={styles.statusText}>运行中</div>
                        </div>
                        
                    </Col>
                    <Col span={2} className={styles.versions}>
                        8.2.6
                    </Col>
                    <Col span={3} className={styles.author}>
                        @goodrain
                    </Col>
                    <Col span={2} className={styles.btnBox}>
                        <div>管理</div>
                        <div>访问</div>
                    </Col>
                </div>
                <div className={styles.boxs}>
                    <Col span={2}>
                        图标
                    </Col>
                    <Col span={12}>
                        <p className={styles.pluginName}>大屏监控</p>
                        <p className={styles.pluginDesc}>监控类插件，可以通过大屏展示整个平台的数据信息。</p>
                    </Col>
                    <Col span={3}>
                        <div className={styles.statusBox}>
                            <div className={styles.status}></div>
                            <div className={styles.statusText}>运行中</div>
                        </div>
                        
                    </Col>
                    <Col span={2} className={styles.versions}>
                        8.2.6
                    </Col>
                    <Col span={3} className={styles.author}>
                        @goodrain
                    </Col>
                    <Col span={2} className={styles.btnBox}>
                        <div>管理</div>
                        <div>访问</div>
                    </Col>
                </div>
                <div className={styles.boxs}>
                    <Col span={2}>
                        图标
                    </Col>
                    <Col span={12}>
                        <p className={styles.pluginName}>大屏监控</p>
                        <p className={styles.pluginDesc}>监控类插件，可以通过大屏展示整个平台的数据信息。</p>
                    </Col>
                    <Col span={3}>
                        <div className={styles.statusBox}>
                            <div className={styles.error}></div>
                            <div className={styles.status_error}>运行异常</div>
                        </div>
                        
                    </Col>
                    <Col span={2} className={styles.versions}>
                        8.2.6
                    </Col>
                    <Col span={3} className={styles.author}>
                        @goodrain
                    </Col>
                    <Col span={2} className={styles.btnBox}>
                        <div>管理</div>
                        <div>访问</div>
                    </Col>
                </div>
                <div className={styles.boxs}>
                    <Col span={2}>
                        图标
                    </Col>
                    <Col span={12}>
                        <p className={styles.pluginName}>大屏监控</p>
                        <p className={styles.pluginDesc}>监控类插件，可以通过大屏展示整个平台的数据信息。</p>
                    </Col>
                    <Col span={3}>
                        <div className={styles.statusBox}>
                            <div className={styles.status}></div>
                            <div className={styles.statusText}>运行中</div>
                        </div>
                        
                    </Col>
                    <Col span={2} className={styles.versions}>
                        8.2.6
                    </Col>
                    <Col span={3} className={styles.author}>
                        @goodrain
                    </Col>
                    <Col span={2} className={styles.btnBox}>
                        <div>管理</div>
                        <div>访问</div>
                    </Col>
                </div>
                <div className={styles.boxs}>
                    <Col span={2}>
                        图标
                    </Col>
                    <Col span={12}>
                        <p className={styles.pluginName}>大屏监控</p>
                        <p className={styles.pluginDesc}>监控类插件，可以通过大屏展示整个平台的数据信息。</p>
                    </Col>
                    <Col span={3}>
                        <div className={styles.statusBox}>
                            <div className={styles.status}></div>
                            <div className={styles.statusText}>运行中</div>
                        </div>
                        
                    </Col>
                    <Col span={2} className={styles.versions}>
                        8.2.6
                    </Col>
                    <Col span={3} className={styles.author}>
                        @goodrain
                    </Col>
                    <Col span={2} className={styles.btnBox}>
                        <div>管理</div>
                        <div>访问</div>
                    </Col>
                </div>
                <div className={styles.boxs}>
                    <Col span={2}>
                        图标
                    </Col>
                    <Col span={12}>
                        <p className={styles.pluginName}>大屏监控</p>
                        <p className={styles.pluginDesc}>监控类插件，可以通过大屏展示整个平台的数据信息。</p>
                    </Col>
                    <Col span={3}>
                        <div className={styles.statusBox}>
                            <div className={styles.status}></div>
                            <div className={styles.statusText}>运行中</div>
                        </div>
                        
                    </Col>
                    <Col span={2} className={styles.versions}>
                        8.2.6
                    </Col>
                    <Col span={3} className={styles.author}>
                        @goodrain
                    </Col>
                    <Col span={2} className={styles.btnBox}>
                        <div>管理</div>
                        <div>访问</div>
                    </Col>
                </div>
            </div>
        );
    }
}

export default Index;
