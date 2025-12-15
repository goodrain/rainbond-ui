//查看连接信息
import {
    Button,


    Input,


    Modal, Table,

    Tooltip
} from "antd";
import { connect } from "dva";
import React, { PureComponent } from "react";
import { formatMessage } from '@/utils/intl';
import styles from '../../pages/Component/Index.less';
import globalUtil from "../../utils/global";

@connect(({ user, appControl }) => ({
  relationOuterEnvs: appControl.relationOuterEnvs
}))
export default class ViewRelationInfo extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      list: [],
      page: 1,
      page_size: 8,
      total: 0,
      isAttrNameList: [],
    };
  }
  componentDidMount() {
    this.getEnvs();
  }

  componentWillUnmount() {
    this.props.dispatch({
      type: "appControl/clearRelationOuterEnvs"
    });
  }
  shouldComponentUpdate(){
    return true;
  }

  onPageChange = page => {
    this.setState(
      {
        page
      },
      () => {
        this.getEnvs();
      }
    );
  };

  getEnvs = () => {
    const { page, page_size } = this.state;
    this.props.dispatch({
      type: "appControl/fetchRelationOuterEnvs",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        page,
        page_size
      },
      callback: res => {
        if (res && res.status_code === 200) {
          const arr = [];
          if (res.list && res.list.length > 0) {
            res.list.map(item => {
              const isHidden = globalUtil.confirmEnding(
                `${item.attr_name}`,
                'PASS'
              );
              if (isHidden) {
                arr.push(item.ID);
              }
            });
          }
          this.setState({ isAttrNameList: arr, total: res.bean.total });
        }
      }
    });
  };
  handleOver = v => {
    return (
      <Tooltip title={v}>
        <div
          style={{
            width: 150,
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            overflow: "hidden"
          }}
        >
          {v}
        </div>
      </Tooltip>
    );
  };

  rowKey = (record, index) => (record ? record.attr_name : index);
  AfterPassword = (isHidden, ID) => {
    const passwordShow = globalUtil.fetchSvg('passwordShow');
    const passwordHidden = globalUtil.fetchSvg('passwordHidden');
    return (
      <span
        onClick={() => {
          this.handlePassword(isHidden, ID);
        }}
      >
        {isHidden ? passwordHidden : passwordShow}
      </span>
    );
  };
  handlePassword = (isHidden, ID) => {
    const { isAttrNameList } = this.state;
    const arr = isAttrNameList;
    if (isHidden) {
      const index = arr.indexOf(ID);
      arr.splice(index, 1);
    } else {
      arr.push(ID);
    }
    this.setState({
      isAttrNameList: arr,
    });
  };

  render() {
    const { relationOuterEnvs } = this.props;
    const { page, page_size, total, isAttrNameList } = this.state;
    const wraps = {
      wordBreak: 'break-all',
      wordWrap: 'break-word',
    };
    return (
      <Modal
        title={formatMessage({id:'componentCheck.advanced.setup.depend_msg.title'})}
        width={600}
        visible={true}
        onCancel={this.props.onCancel}
        footer={[<Button onClick={this.props.onCancel}>
          {formatMessage({id:'button.close'})}
        </Button>]}
      >
        <Table
          rowKey={this.rowKey}
          pagination={{
            current: page,
            pageSize: page_size,
            total,
            onChange: this.onPageChange
          }}
          columns={[
            {
              title: formatMessage({id:'componentCheck.advanced.setup.depend_msg.table.attr_name'}),
              dataIndex: "attr_name",
              render: v => this.handleOver(v)
            },
            {
              title: formatMessage({id:'componentCheck.advanced.setup.depend_msg.table.attr_value'}),
              dataIndex: "attr_value",
              render: (v, item) => {
                const isHidden = isAttrNameList.includes(item.ID);
                const isInput = globalUtil.confirmEnding(
                  `${item.attr_name}`,
                  'PASS'
                );
                return (
                  <div style={wraps} key={v}>
                    <Tooltip title={!isInput ? v : !isHidden && v}>
                      {isInput ? (
                        <Input
                          addonAfter={this.AfterPassword(
                            isHidden,
                            item.ID
                          )}
                          type={isHidden ? 'password' : 'text'}
                          className={styles.hiddeninput}
                          value={v}
                        />
                      ) : (
                        this.handleOver(v)
                      )}
                    </Tooltip>
                  </div>
                );
              },
            },
            {
              title: formatMessage({id:'componentCheck.advanced.setup.depend_msg.table.name'}),
              dataIndex: "name",
              render: v => this.handleOver(v)
            }
          ]}
          dataSource={relationOuterEnvs || []}
        />
      </Modal>
    );
  }
}
