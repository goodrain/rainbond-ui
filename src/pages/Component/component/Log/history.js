import { Button, Icon, Modal } from 'antd';
import React, { PureComponent } from 'react';
import { getHistoryLog } from '../../../../services/app';
import globalUtil from '../../../../utils/global';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';

export default class HistoryLog extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      list: [],
      loading: true,
    };
  }
  componentDidMount() {
    this.loadData();
  }
  loadData() {
    getHistoryLog({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.props.appAlias,
    }).then(data => {
      if (data) {
        this.setState({ loading: false, list: data.list || [] });
      }
    });
  }
  render() {
    const { loading, list } = this.state;

    return (
      <Modal
        title={<FormattedMessage id='componentOverview.body.tab.log.HistoryLog.title'/>}
        visible
        width={700}
        onCancel={this.props.onCancel}
        footer={[<Button onClick={this.props.onCancel}><FormattedMessage id='componentOverview.body.tab.log.HistoryLog.close'/></Button>]}
      >
        {loading ? (
          <div style={{ textAlign: 'center' }}>
            <Icon
              type="loading"
              style={{ marginTop: 100, marginBottom: 100 }}
            />
          </div>
        ) : (
          ''
        )}

        {!loading ? (
          <div style={{ textAlign: 'left' }}>
            {list.length > 0 ? (
              <div>
                {list.map(item => {
                  return (
                    <p key={item.file_name}>
                      <a
                        rel="noopener noreferrer"
                        target="_blank"
                        href={item.file_url}
                      >
                        {item.file_name}
                      </a>
                    </p>
                  );
                })}
              </div>
            ) : (
              <p style={{ textAlign: 'center' }}>
                {/* 暂无历史日志 */}
                <FormattedMessage id='componentOverview.body.tab.log.HistoryLog.null'/>
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
