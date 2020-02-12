import React, { PureComponent, Fragment } from "react";
import moment from "moment";
import { connect } from "dva";
import { Table, AutoComplete } from "antd";
import {
  Row,
  Col,
  Card,
  Form,
} from "antd";
import PageHeaderLayout from "../../layouts/PageHeaderLayout";
import cookie from "../../utils/cookie";

import styles from "./Index.less";
import globalUtil from "../../utils/global";


const token = cookie.get("token");
const myheaders = {};
if (token) {
  myheaders.Authorization = `GRJWT ${token}`;
}

@connect(({ user, groupControl, loading }) => ({
  currUser: user.currentUser,
  apps: groupControl.apps,
  groupDetail: groupControl.groupDetail || {},
  loading
}))
@Form.create()
export default class Main extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      previewVisible: false,
      previewImage: "",
      toDelete: false,
      recordShare: false,
      checkShare: true,
      ShareStep: 0,
      ID: 0,
      info: null,
      selectedApp: "",
      service: null,
      key: "",
      fileList: [],
      shareList: [],
      sharearrs: [],
      shareModal: null,
      isShare: "false",
      service_cname: "",
      dep_service_name: [],
      share_service_list: [],
      ShareTypeShow: false,
      scopeValue: "goodrain:private",
      Initialize: true,
      appList: [],
      ShareAppTypeShow: false,
      ShareAppVersion: [],
      page: 1,
      total: 0,
      page_size: 6,
      query: "",
      ShareAppRecordList: []
    };
    this.com = [];
    this.share_group_info = null;
    this.share_service_list = null;
  }
  getParams() {
    return {
      groupId: this.props.match.params.groupId,
      shareId: this.props.match.params.shareId
    };
  }
  componentDidMount() {
    this.loadShareAppRecord();
  }

  handleShareAppSubmit = () => {
    const { dispatch, form } = this.props;
    const { validateFields } = form;
    validateFields((err, values) => {
      if (!err) {
        this.getShareInfo(values);
        this.setState({ Initialize: false });
      }
    });
  };

  handleSearch = query => {
    this.setState(
      {
        current: 1,
        query
      },
      () => {
        this.loadShareAppRecord();
      }
    );
  };
  loadShareAppRecord = () => {
    const { page, page_size } = this.state;
    this.props.dispatch({
      type: "groupControl/fetchShareAppRecord",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        page,
        page_size
      },
      callback: res => {
        if (res) {
          this.setState({
            ShareAppRecordList: [],
            total: res.bean.total
          });
        }
      }
    });
  };
  render() {
    const info = this.state.info;
    if (!info) {
      return null;
    }
    const { ShareAppRecordList, page, total } = this.state;
    const pageHeaderContent = (
      <div className={styles.pageHeaderContent}>
        <div className={styles.content}>
          <div className={styles.contentTitle}>
            {info.share_group_info.group_name || "-"}
          </div>
        </div>
      </div>
    );
    const dataSource = [
      {
        key: "1",
        name: "胡彦斌",
        age: 32,
        address: "西湖区湖底公园1号"
      },
      {
        key: "2",
        name: "胡彦祖",
        age: 42,
        address: "西湖区湖底公园1号"
      }
    ];
    const columns = [
      {
        title: "发布时间",
        dataIndex: "time",
        key: "time",
        render: val => {
          return moment(val).format("YYYY-MM-DD hh:mm");
        }
      },
      {
        title: "应用名称",
        dataIndex: "name",
        key: "name"
      },
      {
        title: "发布地址",
        dataIndex: "address",
        key: "address"
      }
    ];
    const pagination = {
      current: page,
      total,
      onChange: pages => {
        this.setState(
          {
            page: pages
          },
          () => {
            // this.loadShareAppRecord();
          }
        );
      }
    };
    return (
      <PageHeaderLayout content={pageHeaderContent}>
        <Card
          style={{
            marginBottom: 24
          }}
          title="发布记录"
          bordered={false}
        >
          <Search
            style={{ width: "350px", marginBottom: "20px" }}
            placeholder="请输入名称进行搜索"
            onSearch={this.handleSearch}
          />
          <Table
            style={{ background: "#fff" }}
            pagination={pagination}
            dataSource={dataSource ? dataSource : ShareAppRecordList}
            columns={columns}
          />
        </Card>
      </PageHeaderLayout>
    );
  }
}
