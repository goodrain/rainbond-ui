/* eslint-disable react/no-string-refs */
/* eslint-disable no-nested-ternary */
/* eslint-disable import/extensions */

import Ansi from '@/components/Ansi';
import { Icon, Modal } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { getServiceLog } from '../../services/app';
import globalUtil from '../../utils/global';
import styles from './Log.less';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';

@connect(null, null, null, { withRef: true })
export default class History1000Log extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      list: [],
      loading: true,
      showHighlighted: '',
    };
  }
  componentDidMount() {
    this.fetchClusterLogInfoSingle();
  }

  fetchClusterLogInfoSingle = () => {
    const { dispatch, region, RbdName } = this.props;
    dispatch({
      type: 'region/fetchClusterLogInfoSingle',
      payload: {
        region_name: region,
        rbd_name: RbdName,
        lines: 2000
      },
      callback: res => {
        if (res) {
          this.setState({ loading: false, list: res.bean || [] });
        }
      }
    });
  }

  render() {
    const { loading, list, showHighlighted } = this.state;
    return (
      <Modal
        title={<FormattedMessage id='componentOverview.body.tab.log.History1000Log.title' />}
        visible
        width={1024}
        bodyStyle={{ background: '#222222', color: '#fff' }}
        className={styles.logModal}
        onCancel={this.props.onCancel}
        footer={null}
      >
        {loading ? (
          <div style={{ textAlign: 'center' }}>
            <Icon type="loading" style={{ marginTop: 20, marginBottom: 20 }} />
          </div>
        ) : (
          ''
        )}
        {!loading ? (
          <div
            style={{
              padding: '20px 0',
              maxHeight: 500,
              overflowY: 'auto',
              background: '#212121',
            }}
          >
            {list.length > 0 ? (
              <div className={styles.History1000Log}>
                {list.map((log, index) => {
                  return (
                    <div key={index}>
                      <span
                        style={{
                          color:
                            showHighlighted ===
                              log.substring(0, log.indexOf(':'))
                              ? '#FFFF91'
                              : '#666666',
                        }}
                      >
                        <b>{/* <Icon type="caret-right" /> */}</b>
                        <span>{log === '' ? '' : `${index + 1}`}</span>
                      </span>
                      <span
                        ref="texts"
                        style={{
                          color:
                            showHighlighted ==
                              log.substring(0, log.indexOf(':'))
                              ? '#FFFF91'
                              : '#FFF',
                        }}
                      >
                        <Ansi>
                          {log.substring(log.indexOf(':') + 1, log.length)}
                        </Ansi>
                      </span>

                      {list.length === 1 ? (
                        <span
                          style={{
                            color:
                              showHighlighted ===
                                log.substring(0, log.indexOf(':'))
                                ? '#FFFF91'
                                : '#bbb',
                            cursor: 'pointer',
                            backgroundColor: log.substring(0, log.indexOf(':'))
                              ? '#666'
                              : '',
                          }}
                          onClick={() => {
                            this.setState({
                              showHighlighted:
                                showHighlighted ==
                                  log.substring(0, log.indexOf(':'))
                                  ? ''
                                  : log.substring(0, log.indexOf(':')),
                            });
                          }}
                        >
                          <Ansi>{log.substring(0, log.indexOf(':'))}</Ansi>{' '}
                        </span>
                      ) : list.length > 1 &&
                        index >= 1 &&
                        log.substring(0, log.indexOf(':')) ==
                        list[index <= 0 ? index + 1 : index - 1].substring(
                          0,
                          list[index <= 0 ? index + 1 : index - 1].indexOf(
                            ':'
                          )
                        ) ? (
                        ''
                      ) : (
                        <span
                          style={{
                            color:
                              showHighlighted ==
                                log.substring(0, log.indexOf(':'))
                                ? '#FFFF91'
                                : '#bbb',
                            cursor: 'pointer',
                            backgroundColor:
                              index == 0 && log.substring(0, log.indexOf(':'))
                                ? '#666'
                                : log.substring(0, log.indexOf(':')) ==
                                  list[
                                    index <= 0 ? index + 1 : index - 1
                                  ].substring(
                                    0,
                                    list[
                                      index <= 0 ? index + 1 : index - 1
                                    ].indexOf(':')
                                  )
                                  ? ''
                                  : '#666',
                          }}
                          onClick={() => {
                            this.setState({
                              showHighlighted:
                                showHighlighted ==
                                  log.substring(0, log.indexOf(':'))
                                  ? ''
                                  : log.substring(0, log.indexOf(':')),
                            });
                          }}
                        >
                          <Ansi>{log.substring(0, log.indexOf(':'))}</Ansi>{' '}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p
                style={{ textAlign: 'center', marginBottom: 0, color: '#999' }}
              >
                {/* 暂无日志 */}
                <FormattedMessage id='componentOverview.body.tab.log.History1000Log.null' />
              </p>
            )}
          </div>
        ) : (
          ''
        )}
      </Modal>
    );
  }
}
