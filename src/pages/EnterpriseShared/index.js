/* eslint-disable no-nested-ternary */
/* eslint-disable jsx-a11y/alt-text */
import {
  Button,
  Checkbox,
  Col,
  Divider,
  Empty,
  Icon,
  Input,
  Menu,
  notification,
  Pagination,
  Radio,
  Row,
  Spin,
  Tabs,
  Tooltip
} from "antd";
import { connect } from "dva";
import { Link } from "dva/router";
import React, { PureComponent } from "react";
import NoComponent from "../../../public/images/noComponent.png";
import ConfirmModal from "../../components/ConfirmModal";
import CreateAppMarket from "../../components/CreateAppMarket";
import CreateAppModels from "../../components/CreateAppModels";
import DeleteApp from "../../components/DeleteApp";
import Lists from "../../components/Lists";
import MarketAppDetailShow from "../../components/MarketAppDetailShow";
import PageHeaderLayout from "../../layouts/PageHeaderLayout";
import { fetchMarketMap } from "../../utils/authority";
import globalUtil from "../../utils/global";
import userUtil from "../../utils/user";
import ExportOperation from "./ExportOperation";
import styles from "./index.less";
import TagList from "./TagList";

const { TabPane } = Tabs;
const { Search } = Input;

@connect(({ user, global, loading }) => ({
  user: user.currentUser,
  enterprise: global.enterprise,
  upAppMarketLoading: loading.effects["market/upAppMarket"],
  createAppMarketLoading: loading.effects["market/createAppMarket"]
}))
export default class EnterpriseShared extends PureComponent {
  constructor(props) {
    super(props);
    const { user } = this.props;
    const enterpriseAdmin = userUtil.isCompanyAdmin(user);
    this.state = {
      marketPag: {
        pageSize: 10,
        total: 0,
        page: 1,
        query: ""
      },
      pageSize: 10,
      total: 0,
      page: 1,
      componentList: [],
      localLoading: true,
      marketLoading: true,
      marketTabLoading: true,
      enterpriseAdmin,
      tagList: [],
      tags: [],
      scope: "enterprise",
      appInfo: false,
      visibles: null,
      bouncedText: "",
      bouncedType: "",
      group_version: null,
      chooseVersion: null,
      deleteApp: false,
      deleteAppMarket: false,
      deleteAppMarketLoading: false,
      createAppModel: false,
      upDataAppModel: false,
      createAppMarket: false,
      moreTags: false,
      editorTags: false,
      seeTag: false,
      marketList: [],
      marketTab: [],
      activeTabKey: "local",
      marketInfo: false,
      upAppMarket: false,
      showApp: {},
      showMarketAppDetail: false
    };
  }
  componentDidMount() {
    const { user } = this.props;
    if (user) {
      this.load();
    }
  }
  onChangeRadio = e => {
    this.setState(
      {
        scope: e.target.value
      },
      () => {
        this.getApps();
      }
    );
  };
  onChangeCheckbox = checkedValues => {
    this.setState(
      {
        tags: checkedValues
      },
      () => {
        this.getApps();
      }
    );
  };

  onChangeBounced = checkedValues => {
    this.setState({
      chooseVersion: checkedValues
    });
  };

  onPageChangeApp = (page, pageSize) => {
    this.setState({ page, pageSize }, () => {
      this.getApps();
    });
  };
  onPageChangeAppMarket = (page, pageSize) => {
    const { marketInfo, marketPag } = this.state;
    const setMarketPag = Object.assign({}, marketPag, {
      page,
      pageSize
    });
    this.setState({ marketPag: setMarketPag }, () => {
      this.getMarkets(marketInfo && marketInfo.name);
    });
  };
  onTabChange = tabID => {
    if (tabID === "add") {
      return null;
    }
    const { marketTab } = this.state;
    let arr = [];
    arr = marketTab.filter(item => {
      return item.ID == tabID;
    });
    const isArr = arr && arr.length > 0;
    this.setState(
      {
        marketInfo: isArr ? arr[0] : false,
        activeTabKey: `${tabID}`,
        name: "",
        marketList: [],
        marketLoading: false,
        marketPag: {
          pageSize: 10,
          total: 0,
          page: 1,
          query: ""
        }
      },
      () => {
        if (tabID !== "local" && isArr && arr[0].status == 1) {
          this.getMarkets(arr[0].name);
        }
      }
    );
  };

  getApps = () => {
    const {
      dispatch,
      user,
      match: {
        params: { eid }
      }
    } = this.props;
    const { page, pageSize, name, scope, tags } = this.state;
    this.setState({ localLoading: true }, () => {
      dispatch({
        type: "market/fetchAppModels",
        payload: {
          enterprise_id: eid,
          user_id: user.user_id,
          app_name: name,
          scope,
          page,
          page_size: pageSize,
          tags
        },
        callback: res => {
          if (res && res._code === 200) {
            this.setState({
              total: res.total,
              componentList: res.list,
              localLoading: false
            });
          }
        }
      });
    });
  };

  getTags = () => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    dispatch({
      type: "market/fetchAppModelsTags",
      payload: {
        enterprise_id: eid
      },
      callback: res => {
        if (res && res._code === 200) {
          this.setState({
            tagList: res.list
          });
        }
      }
    });
  };

  getMarketsTab = ID => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    this.setState({ marketTabLoading: true });
    dispatch({
      type: "market/fetchMarketsTab",
      payload: {
        enterprise_id: eid
      },
      callback: res => {
        if (res && res._code === 200) {
          this.setState(
            {
              marketTabLoading: false,
              marketTab: res.list
            },
            () => {
              if (ID) {
                this.onTabChange(ID);
              }
            }
          );
        }
      }
    });
  };

  getMarkets = name => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    const { marketPag } = this.state;
    const payload = Object.assign(
      {},
      {
        name,
        enterprise_id: eid
      },
      marketPag
    );
    this.setState({ marketLoading: true });

    dispatch({
      type: "market/fetchMarkets",
      payload,
      callback: res => {
        if (res && res._code === 200) {
          const setMarketPag = Object.assign({}, this.state.marketPag, {
            total: res.total
          });
          this.setState({
            marketLoading: false,
            marketList: res.list,
            marketPag: setMarketPag
          });
        }
      }
    });
  };

  load = () => {
    this.getApps();
    this.getTags();
    this.getMarketsTab();
  };

  handleSearchLocal = name => {
    this.setState(
      {
        page: 1,
        name
      },
      () => {
        this.getApps();
      }
    );
  };
  handleSearchMarket = query => {
    const { marketPag, marketInfo } = this.state;

    const setMarketPag = Object.assign({}, marketPag, {
      page: 1,
      query
    });
    this.setState(
      {
        marketPag: setMarketPag
      },
      () => {
        this.getMarkets(marketInfo && marketInfo.name);
      }
    );
  };
  handleOpenEditorMoreTags = () => {
    this.setState({ moreTags: true, editorTags: true });
  };
  handleOpenMoreTags = seeTag => {
    this.setState({ moreTags: true, seeTag });
  };
  handleCloseMoreTags = () => {
    this.setState({ moreTags: false, editorTags: false, seeTag: false });
  };

  showOfflineApp = appInfo => {
    this.setState({
      appInfo,
      deleteApp: true,
      bouncedText: "删除应用模版",
      bouncedType: "delete"
    });
  };
  handleOpenDeleteAppMarket = () => {
    this.setState({ deleteAppMarket: true });
  };
  handleCloseDeleteAppMarket = () => {
    this.setState({ deleteAppMarket: false });
  };
  handleOkBounced = values => {
    const { bouncedType } = this.state;
    this.setState(
      {
        chooseVersion: values.chooseVersion
      },
      () => {
        if (bouncedType == "delete") {
          this.setState({
            deleteApp: true
          });
        } else {
          this.handleCloudsUpdate(values.chooseVersion);
        }
      }
    );
  };
  handleDeleteApp = () => {
    const { appInfo } = this.state;
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    dispatch({
      type: "global/deleteAppModel",
      payload: {
        enterprise_id: eid,
        app_id: appInfo.app_id
      },
      callback: res => {
        if (res && res._code === 200) {
          notification.success({
            message: "删除成功"
          });
          this.handleCancelDelete();
          this.getApps();
        }
      }
    });
  };
  handleDeleteAppMarket = () => {
    const { marketInfo } = this.state;
    this.setState({ deleteAppMarketLoading: true });
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    dispatch({
      type: "market/deleteAppMarket",
      payload: {
        enterprise_id: eid,
        marketName: marketInfo.name
      },
      callback: res => {
        if (res && res._code === 200) {
          this.handleCloseDeleteAppMarket();
          this.getMarketsTab();
          this.setState({
            activeTabKey: "local",
            marketInfo: false,
            deleteAppMarketLoading: false
          });
          notification.success({
            message: "删除成功"
          });
        }
      }
    });
  };
  handleCancelDelete = () => {
    this.setState({
      deleteApp: null,
      visibles: null,
      group_version: null,
      bouncedText: "",
      bouncedType: "",
      appInfo: false
    });
  };

  handlePageChange = page => {
    this.state.page = page;
    this.getApps();
  };

  handleLoadAppDetail = (item, text) => {
    const versions_info =
      item.versions_info && item.versions_info.length > 0 && item.versions_info;
    if (versions_info) {
      this.setState({
        visibles: true,
        group_version: versions_info,
        appInfo: item,
        bouncedText: text
      });
    } else {
      this.setState({ group_version: versions_info, appInfo: item }, () => {
        if (versions_info) {
          this.handleCloudsUpdate(versions_info[0].version);
        }
      });
    }
  };

  // 云更新
  handleCloudsUpdate = chooseVersion => {
    const { appInfo } = this.state;
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    dispatch({
      type: "global/syncMarketAppDetail",
      payload: {
        enterprise_id: eid,
        body: {
          app_id: appInfo.app_id,
          app_versions: chooseVersion
        }
      },
      callback: res => {
        if (res && res._code === 200) {
          this.handleCancelDelete();
          notification.success({ message: "更新成功" });
          this.getApps();
        }
      }
    });
  };

  handleCreateAppModel = () => {
    notification.success({ message: "创建成功" });
    this.getApps();
    this.handleCancelAppModel();
  };

  handleCreateAppMarket = ID => {
    const { upAppMarket } = this.state;
    notification.success({ message: upAppMarket ? "编辑成功" : "创建成功" });
    this.getMarketsTab(ID);
    this.handleCancelAppMarket();
  };

  handleCancelAppModel = () => {
    this.setState({
      createAppModel: false,
      appInfo: null
    });
  };
  handleOpenCreateAppModel = () => {
    this.setState({
      createAppModel: true
    });
  };

  handleOpenUpAppMarket = () => {
    this.setState({
      upAppMarket: true
    });
  };

  handleOpencreateAppMarket = () => {
    this.setState({
      createAppMarket: true
    });
  };
  handleCancelAppMarket = () => {
    this.setState({
      createAppMarket: false,
      upAppMarket: false
    });
  };
  handleupDataAppModel = () => {
    notification.success({ message: "编辑成功" });
    this.getApps();
    this.handleCancelupDataAppModel();
  };

  handleOpenUpDataAppModel = appInfo => {
    this.setState({
      appInfo,
      upDataAppModel: true
    });
  };

  handleCancelupDataAppModel = () => {
    this.setState({
      appInfo: null,
      upDataAppModel: false
    });
  };
  showMarketAppDetail = app => {
    // cloud app
    if (app && app.app_detail_url) {
      window.open(app.app_detail_url, "_blank");
      return;
    }
    this.setState({
      showApp: app,
      showMarketAppDetail: true
    });
  };
  hideMarketAppDetail = () => {
    this.setState({
      showApp: {},
      showMarketAppDetail: false
    });
  };
  render() {
    const {
      match: {
        params: { eid }
      },
      createAppMarketLoading,
      upAppMarketLoading
    } = this.props;

    const {
      componentList,
      marketList,
      marketTab,
      marketTabLoading,
      localLoading,
      marketLoading,
      tagList,
      appInfo,
      visibles,
      bouncedText,
      enterpriseAdmin,
      activeTabKey,
      marketInfo,
      marketPag
    } = this.state;
    const tagLists = tagList && tagList.length > 0 && tagList;
    const accessActions =
      marketInfo &&
      marketInfo.access_actions &&
      marketInfo.access_actions.length > 0 &&
      marketInfo.access_actions;

    const isMarket = marketInfo && marketInfo.status == 1;
    const defaultSvg = () => (
      <svg width="50px" height="50px" viewBox="0 0 50 50">
        <g
          id="企业视图-应用市场"
          stroke="none"
          strokeWidth="1"
          fill="none"
          fillRule="evenodd"
        >
          <g
            id="组件库"
            transform="translate(-195.000000, -313.000000)"
            fillRule="nonzero"
          >
            <g id="编组" transform="translate(195.000000, 313.000000)">
              <path
                d="M45.3191208,0.0441384181 L4.50211864,0.0441384181 C2.02484993,0.0441384181 0,2.06898835 0,4.54625706 L0,45.3632592 C0,47.8405279 2.02484993,49.8653778 4.50211864,49.8653778 L45.3191208,49.8653778 C47.7963895,49.8653778 49.8212394,47.8405279 49.8212394,45.3632592 L49.8212394,4.54625706 C49.8212394,2.06898835 47.7908722,0.0441384181 45.3191208,0.0441384181 Z"
                id="路径"
                fill="#60A44E"
              />
              <path
                d="M24.9106197,44.9660134 C22.2071416,44.9660134 19.586423,44.4363524 17.1201889,43.3935823 C14.7367143,42.383916 12.5960011,40.9439001 10.7587394,39.1066384 C8.92147775,37.2693768 7.47594456,35.1286635 6.47179555,32.7451889 C5.42902542,30.2789548 4.89936441,27.6582362 4.89936441,24.9547581 C4.89936441,22.25128 5.42902542,19.6305614 6.47179555,17.1643273 C7.48146186,14.7808528 8.92147775,12.6401395 10.7587394,10.8028778 C12.5960011,8.96561617 14.7367143,7.52008298 17.1201889,6.51593397 C19.586423,5.47316384 22.2071416,4.94350282 24.9106197,4.94350282 C27.6140978,4.94350282 30.2348164,5.47316384 32.7010505,6.51593397 C35.0845251,7.52560028 37.2252383,8.96561617 39.0625,10.8028778 C40.8997617,12.6401395 42.3452948,14.7808528 43.3494439,17.1643273 C44.392214,19.6305614 44.921875,22.25128 44.921875,24.9547581 C44.921875,27.6582362 44.392214,30.2789548 43.3494439,32.7451889 C42.3397775,35.1286635 40.8997617,37.2693768 39.0625,39.1066384 C37.2252383,40.9439001 35.0845251,42.3894333 32.7010505,43.3935823 C30.2292991,44.4363524 27.6085805,44.9660134 24.9106197,44.9660134 Z M24.9106197,6.03041137 C14.4774011,6.03041137 5.98627295,14.5160222 5.98627295,24.9547581 C5.98627295,35.393494 14.4718838,43.8791049 24.9106197,43.8791049 C35.3493556,43.8791049 43.8349665,35.393494 43.8349665,24.9547581 C43.8349665,14.5160222 35.3438383,6.03041137 24.9106197,6.03041137 Z"
                id="形状"
                fill="#FFFFFF"
              />
              <path
                d="M22.7202507,23.1395657 L16.5960452,23.1395657 C15.9670727,23.1395657 15.4539636,22.6264566 15.4539636,21.9974841 L15.4539636,17.1753619 C15.4539636,16.5463895 15.9670727,16.0332804 16.5960452,16.0332804 L22.7202507,16.0332804 C23.3492232,16.0332804 23.8623323,16.5463895 23.8623323,17.1753619 L23.8623323,21.9974841 C23.8623323,22.6264566 23.3492232,23.1395657 22.7202507,23.1395657 L22.7202507,23.1395657 Z M16.5960452,16.756047 C16.3643185,16.756047 16.1822475,16.9436352 16.1822475,17.1698446 L16.1822475,21.9919668 C16.1822475,22.2236935 16.3698358,22.4057645 16.5960452,22.4057645 L22.7202507,22.4057645 C22.9519774,22.4057645 23.1340484,22.2181762 23.1340484,21.9919668 L23.1340484,17.1698446 C23.1340484,16.9381179 22.9464601,16.756047 22.7202507,16.756047 L16.5960452,16.756047 L16.5960452,16.756047 Z"
                id="形状"
                fill="#FFFFFF"
              />
              <path
                d="M17.0981197,30.2568856 C16.8057027,30.2568856 16.5132857,30.1465395 16.2925936,29.9258475 L12.8829008,26.5161547 C12.667726,26.3009799 12.5518626,26.0140802 12.5518626,25.7106285 C12.5518626,25.4071769 12.667726,25.1202772 12.8829008,24.9051024 L17.2139831,20.5740201 C17.4291578,20.3588453 17.7160576,20.242982 18.0195092,20.242982 C18.3229608,20.242982 18.6098605,20.3588453 18.8250353,20.5740201 L22.2347281,23.9837129 C22.4499029,24.1988877 22.5657662,24.4857874 22.5657662,24.7892391 C22.5657662,25.0926907 22.4499029,25.3795904 22.2347281,25.5947652 L17.9036458,29.9258475 C17.6829537,30.1465395 17.3905367,30.2568856 17.0981197,30.2568856 L17.0981197,30.2568856 Z M18.0139919,20.9602313 C17.9091631,20.9602313 17.7988171,20.9988524 17.7215749,21.0816119 L13.3904926,25.4126942 C13.2304908,25.572696 13.2304908,25.8375265 13.3904926,26.0030456 L16.8001854,29.4127383 C16.9601871,29.5727401 17.2250177,29.5727401 17.3905367,29.4127383 L21.721619,25.0816561 C21.8816208,24.9216543 21.8816208,24.6568238 21.721619,24.4913047 L18.3119262,21.0816119 C18.2291667,20.9988524 18.1243379,20.9602313 18.0139919,20.9602313 L18.0139919,20.9602313 Z"
                id="形状"
                fill="#FFFFFF"
              />
              <path
                d="M22.4830067,34.9355579 L17.6608845,34.9355579 C17.0319121,34.9355579 16.518803,34.4224488 16.518803,33.7934763 L16.518803,27.6692708 C16.518803,27.0402984 17.0319121,26.5271893 17.6608845,26.5271893 L22.4830067,26.5271893 C23.1119792,26.5271893 23.6250883,27.0402984 23.6250883,27.6692708 L23.6250883,33.7934763 C23.6250883,34.4279661 23.1119792,34.9355579 22.4830067,34.9355579 Z M17.6608845,27.2554732 C17.4291578,27.2554732 17.2470869,27.4430614 17.2470869,27.6692708 L17.2470869,33.7934763 C17.2470869,34.025203 17.4346751,34.207274 17.6608845,34.207274 L22.4830067,34.207274 C22.7147334,34.207274 22.8968044,34.0196857 22.8968044,33.7934763 L22.8968044,27.6692708 C22.8968044,27.4375441 22.7092161,27.2554732 22.4830067,27.2554732 L17.6608845,27.2554732 Z"
                id="形状"
                fill="#FFFFFF"
              />
              <path
                d="M26.1906338,37.8486935 C25.8871822,37.8486935 25.6002825,37.7328302 25.3851077,37.5176554 L21.0540254,33.1865731 C20.6071239,32.7396716 20.6071239,32.016905 21.0540254,31.5755208 L24.4637182,28.165828 C24.678893,27.9506532 24.9657927,27.8347899 25.2692444,27.8347899 C25.572696,27.8347899 25.8595957,27.9506532 26.0747705,28.165828 L30.4058528,32.4969103 C30.6210275,32.7120851 30.7368909,32.9989848 30.7368909,33.3024364 C30.7368909,33.6058881 30.6210275,33.8927878 30.4058528,34.1079626 L26.99616,37.5176554 C26.7809852,37.7328302 26.4940855,37.8486935 26.1906338,37.8486935 L26.1906338,37.8486935 Z M25.2692444,28.5520392 C25.1644156,28.5520392 25.0540696,28.5906603 24.9768273,28.6734198 L21.5671345,32.0831126 C21.4071328,32.2431144 21.4071328,32.5079449 21.5671345,32.673464 L25.8982168,37.0045463 C25.975459,37.0817885 26.0802878,37.1259269 26.1906338,37.1259269 C26.3009799,37.1259269 26.4058086,37.0817885 26.4830508,37.0045463 L29.8927436,33.5948535 C29.9699859,33.5176112 30.0141243,33.4127825 30.0141243,33.3024364 C30.0141243,33.1920904 29.9699859,33.0872617 29.8927436,33.0100194 L25.5616614,28.6789371 C25.4844191,28.5906603 25.3795904,28.5520392 25.2692444,28.5520392 L25.2692444,28.5520392 Z"
                id="形状"
                fill="#FFFFFF"
              />
              <path
                d="M34.2789989,33.8762359 L28.1547934,33.8762359 C27.525821,33.8762359 27.0127119,33.3631268 27.0127119,32.7341543 L27.0127119,27.9120321 C27.0127119,27.2830597 27.525821,26.7699506 28.1547934,26.7699506 L34.2789989,26.7699506 C34.9079714,26.7699506 35.4210805,27.2830597 35.4210805,27.9120321 L35.4210805,32.7341543 C35.4210805,33.3631268 34.9079714,33.8762359 34.2789989,33.8762359 Z M28.1603107,27.4927172 C27.928584,27.4927172 27.7465131,27.6803054 27.7465131,27.9065148 L27.7465131,32.728637 C27.7465131,32.9603637 27.9341013,33.1424347 28.1603107,33.1424347 L34.2845162,33.1424347 C34.5162429,33.1424347 34.6983139,32.9548464 34.6983139,32.728637 L34.6983139,27.9065148 C34.6983139,27.6747881 34.5107256,27.4927172 34.2845162,27.4927172 L28.1603107,27.4927172 Z"
                id="形状"
                fill="#FFFFFF"
              />
              <path
                d="M32.8610523,29.6720516 C32.5686352,29.6720516 32.2762182,29.5617055 32.0555261,29.3410134 L28.6458333,25.9313206 C28.4306585,25.7161458 28.3147952,25.4292461 28.3147952,25.1257945 C28.3147952,24.8223429 28.4306585,24.5354431 28.6458333,24.3202684 L32.9769156,19.9891861 C33.1920904,19.7740113 33.4789901,19.658148 33.7824417,19.658148 C34.0858934,19.658148 34.3727931,19.7740113 34.5879679,19.9891861 L37.9976607,23.3988789 C38.4445621,23.8457804 38.4445621,24.568547 37.9976607,25.0099311 L33.6665784,29.3410134 C33.4458863,29.5617055 33.1534693,29.6720516 32.8610523,29.6720516 Z M33.7824417,20.3753972 C33.677613,20.3753972 33.5672669,20.4140184 33.4900247,20.4967779 L29.1589424,24.8278602 C28.9989407,24.9878619 28.9989407,25.2526924 29.1589424,25.4182115 L32.5686352,28.8279043 C32.728637,28.9879061 32.9934675,28.9879061 33.1589866,28.8279043 L37.4900689,24.496822 C37.6500706,24.3368203 37.6500706,24.0719898 37.4900689,23.9064707 L34.0803761,20.4967779 C33.9976165,20.4195357 33.8872705,20.3753972 33.7824417,20.3753972 L33.7824417,20.3753972 Z"
                id="形状"
                fill="#FFFFFF"
              />
              <path
                d="M33.2196769,23.3768097 L28.3975547,23.3768097 C27.7685823,23.3768097 27.2554732,22.8637006 27.2554732,22.2347281 L27.2554732,16.1105226 C27.2554732,15.4815501 27.7685823,14.968441 28.3975547,14.968441 L33.2196769,14.968441 C33.8486494,14.968441 34.3617585,15.4815501 34.3617585,16.1105226 L34.3617585,22.2347281 C34.3617585,22.8637006 33.8486494,23.3768097 33.2196769,23.3768097 Z M28.3975547,15.6967249 C28.165828,15.6967249 27.9837571,15.8843132 27.9837571,16.1105226 L27.9837571,22.2347281 C27.9837571,22.4664548 28.1713453,22.6485258 28.3975547,22.6485258 L33.2196769,22.6485258 C33.4514036,22.6485258 33.6334746,22.4609375 33.6334746,22.2347281 L33.6334746,16.1105226 C33.6334746,15.8787959 33.4458863,15.6967249 33.2196769,15.6967249 L28.3975547,15.6967249 Z"
                id="形状"
                fill="#FFFFFF"
              />
              <path
                d="M25.6057998,22.0802436 C25.3023482,22.0802436 25.0154484,21.9643803 24.8002737,21.7492055 L20.4691914,17.4181232 C20.2540166,17.2029484 20.1381532,16.9160487 20.1381532,16.6125971 C20.1381532,16.3091455 20.2540166,16.0222458 20.4691914,15.807071 L23.8788842,12.3973782 C24.094059,12.1822034 24.3809587,12.06634 24.6844103,12.06634 C24.9878619,12.06634 25.2747617,12.1822034 25.4899364,12.3973782 L29.8210187,16.7284605 C30.0361935,16.9436352 30.1520569,17.230535 30.1520569,17.5339866 C30.1520569,17.8374382 30.0361935,18.1243379 29.8210187,18.3395127 L26.4113259,21.7492055 C26.2016684,21.9643803 25.9147687,22.0802436 25.6057998,22.0802436 Z M24.6899276,12.7835893 C24.5850989,12.7835893 24.4747528,12.8222105 24.3975106,12.90497 L20.9878178,16.3146628 C20.827816,16.4746645 20.827816,16.7394951 20.9878178,16.9050141 L25.3189001,21.2360964 C25.3961423,21.3133386 25.500971,21.357477 25.6113171,21.357477 C25.7216631,21.357477 25.8264919,21.3133386 25.9037341,21.2360964 L29.3134269,17.8264036 C29.4734287,17.6664018 29.4734287,17.4015713 29.3134269,17.2360523 L24.9823446,12.90497 C24.9051024,12.8277278 24.7947564,12.7835893 24.6899276,12.7835893 L24.6899276,12.7835893 Z M25.4402807,27.2554732 C24.1713012,27.2554732 23.1395657,26.2237376 23.1395657,24.9547581 C23.1395657,23.6857786 24.1713012,22.6540431 25.4402807,22.6540431 C26.7092602,22.6540431 27.7409958,23.6857786 27.7409958,24.9547581 C27.7409958,26.2237376 26.7092602,27.2554732 25.4402807,27.2554732 Z M25.4402807,23.3768097 C24.568547,23.3768097 23.8623323,24.0830244 23.8623323,24.9547581 C23.8623323,25.8264919 24.568547,26.5327066 25.4402807,26.5327066 C26.3120145,26.5327066 27.0182292,25.8264919 27.0182292,24.9547581 C27.0182292,24.0830244 26.3120145,23.3768097 25.4402807,23.3768097 L25.4402807,23.3768097 Z"
                id="形状"
                fill="#FFFFFF"
              />
            </g>
          </g>
        </g>
      </svg>
    );

    const managementMenu = appInfo => {
      const delApp = enterpriseAdmin && (
        <Menu.Item>
          <a
            onClick={() => {
              this.showOfflineApp(appInfo);
            }}
          >
            删除应用模版
          </a>
        </Menu.Item>
      );

      const editorApp = enterpriseAdmin && (
        <Menu.Item>
          <a
            onClick={() => {
              this.handleOpenUpDataAppModel(appInfo);
            }}
          >
            编辑应用模版
          </a>
        </Menu.Item>
      );
      const exportOperation = appInfo &&
        appInfo.versions_info &&
        appInfo.versions_info.length > 0 && (
          <Menu.Item>
            <ExportOperation app={appInfo} eid={eid} />
          </Menu.Item>
        );

      if (exportOperation || editorApp || delApp) {
        return (
          <Menu>
            {exportOperation}
            {editorApp}
            {delApp}
          </Menu>
        );
      }
      return null;
    };

    const operation = (
      <Col span={5} style={{ textAlign: "right" }} className={styles.btns}>
        <Button style={{ margin: "0 14px 0 10px" }}>
          <Link to={`/enterprise/${eid}/shared/import`}>离线导入</Link>
        </Button>
        {enterpriseAdmin && (
          <Button type="primary" onClick={this.handleOpenCreateAppModel}>
            创建应用模版
          </Button>
        )}
      </Col>
    );

    const marketOperation = (
      <div>
        <Button
          onClick={this.handleOpenDeleteAppMarket}
          style={{ marginRight: "22px" }}
        >
          删除
        </Button>
        <Button type="primary" onClick={this.handleOpenUpAppMarket}>
          编辑
        </Button>
      </div>
    );

    const noLocalMarket = (
      <div className={styles.noShared}>
        <img src={NoComponent} />
        <p>当前无应用模版，请选择方式添加</p>
        <div className={styles.btns}>
          {enterpriseAdmin && (
            <Button type="primary" onClick={this.handleOpenCreateAppModel}>
              创建应用模版
            </Button>
          )}
          <Button type="primary">
            <Link to={`/enterprise/${eid}/shared/import`}>导入应用模版</Link>
          </Button>
        </div>
      </div>
    );

    const noCloudMarket = (
      <Empty
        style={{ marginTop: "120px" }}
        image="https://gw.alipayobjects.com/mdn/miniapp_social/afts/img/A*pevERLJC9v0AAAAAAAAAAABjAQAAAQ/original"
        imageStyle={{
          height: 60
        }}
        description={
          <span>{!isMarket ? "市场未连接、暂无数据" : "暂无数据"}</span>
        }
      >
        {!isMarket && marketOperation}
      </Empty>
    );
    const localsContent = (
      <div>
        <Row
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "20px",
            marginTop: "4px"
          }}
        >
          <Col span={19} style={{ textAlign: "left", display: "flex" }}>
            <Search
              style={{ width: "250px" }}
              placeholder="请输入名称进行搜索"
              onSearch={this.handleSearchLocal}
            />
            <div className={styles.serBox}>
              <Radio.Group
                className={styles.setRadioGroup}
                value={this.state.scope}
                onChange={this.onChangeRadio}
              >
                <Radio.Button value="enterprise">企业</Radio.Button>
                <Radio.Button value="team">团队</Radio.Button>
              </Radio.Group>
              {tagLists && <Divider type="vertical" />}
              {tagLists && (
                <Checkbox.Group
                  className={styles.setCheckboxGroup}
                  onChange={this.onChangeCheckbox}
                  value={this.state.tags}
                >
                  {tagLists.map((item, index) => {
                    const { name, tag_id: id } = item;
                    if (index > 4) {
                      return null;
                    }
                    return (
                      <Checkbox key={id} value={name}>
                        {name}
                      </Checkbox>
                    );
                  })}
                  <a
                    onClick={this.handleOpenEditorMoreTags}
                    style={{ float: "right" }}
                  >
                    更多标签
                  </a>
                </Checkbox.Group>
              )}
            </div>
          </Col>
          {operation}
        </Row>
        {localLoading ? (
          <div className={styles.example}>
            <Spin />
          </div>
        ) : componentList && componentList.length > 0 ? (
          componentList.map(item => {
            const {
              app_id: appId,
              pic,
              describe,
              app_name: appName,
              tags,
              versions_info: versionsInfo,
              dev_status: devStatus,
              install_number: installNumber
            } = item;
            return (
              <Lists
                key={appId}
                stylePro={{ marginBottom: "10px" }}
                Cols={
                  <div className={styles.h70}>
                    <Col span={3} style={{ display: "flex" }}>
                      <div className={styles.lt}>
                        <p>
                          <Icon type="arrow-down" />
                          {installNumber}
                        </p>
                      </div>
                      <div className={styles.imgs}>
                        {pic ? (
                          <img src={pic} alt="" />
                        ) : (
                          <Icon component={defaultSvg} />
                        )}
                      </div>
                    </Col>
                    <Col span={13} className={styles.tits}>
                      <div>
                        <p>
                          <a
                            onClick={() => {
                              this.showMarketAppDetail(item);
                            }}
                          >
                            {appName}
                          </a>
                        </p>
                        <p>
                          <Tooltip placement="topLeft" title={describe}>
                            {describe}
                          </Tooltip>
                        </p>
                      </div>
                    </Col>
                    <Col span={4} className={styles.status}>
                      <div>
                        {devStatus && (
                          <p className={styles.dev_status}>{devStatus}</p>
                        )}

                        {versionsInfo && versionsInfo.length > 0 ? (
                          <p className={styles.dev_version}>
                            {versionsInfo[versionsInfo.length-1].version}
                          </p>
                        ) : (
                          <p className={styles.dev_version}>无版本</p>
                        )}
                      </div>
                    </Col>

                    <Col span={4} className={styles.tags}>
                      {tags &&
                        tags.length > 0 &&
                        tags.map((item, index) => {
                          const { tag_id: tagId, name } = item;
                          if (index > 2) {
                            return null;
                          }
                          return (
                            <div key={tagId} style={{ marginRight: "5px" }}>
                              {name}
                            </div>
                          );
                        })}
                      {tags && tags.length > 3 && (
                        <a
                          style={{ marginLeft: "5px" }}
                          onClick={() => {
                            this.handleOpenMoreTags(tags);
                          }}
                        >
                          更多
                        </a>
                      )}
                    </Col>
                  </div>
                }
                overlay={managementMenu(item)}
              />
            );
          })
        ) : (
          noLocalMarket
        )}

        <div style={{ textAlign: "right" }}>
          <Pagination
            showQuickJumper
            current={this.state.page}
            pageSize={this.state.pageSize}
            total={Number(this.state.total)}
            onChange={this.onPageChangeApp}
          />
        </div>
      </div>
    );
    const marketContent = (
      <div>
        {isMarket && (
          <Row
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "20px",
              marginTop: "4px"
            }}
          >
            <Col
              span={19}
              style={{
                textAlign: "left",
                display: "flex",
                alignItems: "center"
              }}
            >
              <div>
                市场已经正常连接，该平台具有&nbsp;
                {accessActions &&
                  accessActions.map((item, index) => {
                    return (
                      <a>
                        {fetchMarketMap(item)}
                        {index < accessActions.length - 1 && (
                          <Divider
                            type="vertical"
                            style={{ background: "#1890ff" }}
                          />
                        )}
                      </a>
                    );
                  })}
                &nbsp;应用权限
              </div>
              <Search
                style={{ width: "400px", marginLeft: "100px" }}
                placeholder="请输入名称进行搜索"
                onSearch={this.handleSearchMarket}
              />
            </Col>
            <Col
              span={5}
              style={{ textAlign: "right" }}
              className={styles.btns}
            >
              {marketOperation}
            </Col>
          </Row>
        )}
        {marketLoading ? (
          <div className={styles.example}>
            <Spin />
          </div>
        ) : marketList && marketList.length > 0 ? (
          marketList.map(item => {
            const {
              app_id: appId,
              logo,
              describe,
              app_name: appName,
              tags,
              versions,
              dev_status: devStatus,
              install_number: installNumber
            } = item;
            return (
              <Lists
                key={appId}
                stylePro={{ marginBottom: "10px" }}
                Cols={
                  <div className={styles.h70}>
                    <Col span={3} style={{ display: "flex" }}>
                      <div className={styles.lt}>
                        <p>
                          <Icon type="arrow-down" />
                          {installNumber}
                        </p>
                      </div>
                      <div className={styles.imgs}>
                        {logo ? (
                          <img src={logo} alt="" />
                        ) : (
                          <Icon component={defaultSvg} />
                        )}
                      </div>
                    </Col>
                    <Col span={13} className={styles.tits}>
                      <div>
                        <p>
                          <a
                            onClick={() => {
                              this.showMarketAppDetail(item);
                            }}
                          >
                            {appName}
                          </a>
                        </p>
                        <p>
                          <Tooltip placement="topLeft" title={describe}>
                            {describe}
                          </Tooltip>
                        </p>
                      </div>
                    </Col>
                    <Col span={4} className={styles.status}>
                      <div>
                        {devStatus && (
                          <p className={styles.dev_status}>{devStatus}</p>
                        )}

                        {versions && versions.length > 0 ? (
                          <p className={styles.dev_version}>
                            {versions[versions.length-1].app_version}
                          </p>
                        ) : (
                          <p className={styles.dev_version}>无版本</p>
                        )}
                      </div>
                    </Col>

                    <Col span={4} className={styles.tags}>
                      {tags &&
                        tags.length > 0 &&
                        tags.map((item, index) => {
                          const { tag_id: tagId, name } = item;
                          if (index > 2) {
                            return null;
                          }
                          return (
                            <div key={tagId} style={{ marginRight: "5px" }}>
                              {name}
                            </div>
                          );
                        })}
                      {tags && tags.length > 3 && (
                        <a
                          style={{ marginLeft: "5px" }}
                          onClick={() => {
                            this.handleOpenMoreTags(tags);
                          }}
                        >
                          更多
                        </a>
                      )}
                    </Col>
                  </div>
                }
              />
            );
          })
        ) : (
          noCloudMarket
        )}

        <div style={{ textAlign: "right" }}>
          <Pagination
            showQuickJumper
            current={marketPag.page}
            pageSize={marketPag.pageSize}
            total={Number(marketPag.total)}
            onChange={this.onPageChangeAppMarket}
          />
        </div>
      </div>
    );
    return (
      <PageHeaderLayout
        title="应用市场管理"
        content="应用模型是指模型化、标准化的应用制品包，是企业数字资产的应用化产物，可以通过标准的方式安装到任何Rainbond平台或其他支持的云原生平台"
      >
        {this.state.showMarketAppDetail && (
          <MarketAppDetailShow
            onOk={this.hideMarketAppDetail}
            onCancel={this.hideMarketAppDetail}
            app={this.state.showApp}
          />
        )}
        {this.state.moreTags && (
          <TagList
            title="查看标签"
            onOk={this.handleCloseMoreTags}
            onChangeCheckbox={this.onChangeCheckbox}
            onCancel={this.handleCloseMoreTags}
            tagLists={tagLists}
            seeTag={this.state.seeTag}
            checkedValues={this.state.tags}
            componentList={this.state.componentList}
            editorTags={this.state.editorTags}
          />
        )}
        {this.state.deleteApp && (
          <ConfirmModal
            onOk={this.handleDeleteApp}
            desc="确定要删除此应用模型吗?"
            subDesc="删除后其他人将无法安装此应用模型"
            title="删除应用模版"
            onCancel={this.handleCancelDelete}
          />
        )}
        {this.state.deleteAppMarket && (
          <ConfirmModal
            onOk={this.handleDeleteAppMarket}
            loading={this.state.deleteAppMarketLoading}
            subDesc="此操作不可恢复"
            desc={`确定要删除此${marketInfo.name}吗?`}
            title={`删除${marketInfo.name}`}
            onCancel={this.handleCloseDeleteAppMarket}
          />
        )}

        {this.state.createAppModel && (
          <CreateAppModels
            title="创建应用模版"
            eid={eid}
            onOk={this.handleCreateAppModel}
            onCancel={this.handleCancelAppModel}
          />
        )}

        {this.state.createAppMarket && (
          <CreateAppMarket
            title="添加应用市场"
            eid={eid}
            loading={createAppMarketLoading}
            onOk={this.handleCreateAppMarket}
            onCancel={this.handleCancelAppMarket}
          />
        )}
        {this.state.upAppMarket && (
          <CreateAppMarket
            title="编辑应用市场"
            eid={eid}
            loading={upAppMarketLoading}
            marketInfo={marketInfo}
            onOk={this.handleCreateAppMarket}
            onCancel={this.handleCancelAppMarket}
          />
        )}
        {this.state.upDataAppModel && (
          <CreateAppModels
            title="编辑应用模版"
            eid={eid}
            appInfo={appInfo}
            onOk={this.handleupDataAppModel}
            onCancel={this.handleCancelupDataAppModel}
          />
        )}
        {visibles && (
          <DeleteApp
            appInfo={appInfo}
            bouncedText={bouncedText}
            onOk={this.handleOkBounced}
            onCancel={this.handleCancelDelete}
            onCheckedValues={this.onChangeBounced}
          />
        )}
        <Tabs
          activeKey={activeTabKey}
          className={styles.setTabs}
          onChange={this.onTabChange}
        >
          <TabPane
            tab={
              <span className={styles.verticalCen}>
                {globalUtil.fetchSvg("localMarket")}
                本地组件库
              </span>
            }
            key="local"
          >
            <div
              style={{
                display: "block",
                position: "relative",
                overflow: "hidden"
              }}
            >
              {localsContent}
            </div>
          </TabPane>
          {marketTab.map(item => {
            const { ID, alias, name } = item;
            return (
              <TabPane
                tab={
                  <span className={styles.verticalCen}>
                    {globalUtil.fetchSvg("cloudMarket")}
                    {alias || name}
                  </span>
                }
                key={ID}
              >
                {marketContent}
              </TabPane>
            );
          })}
          <TabPane
            tab={
              <Tooltip placement="top" title="添加应用市场">
                <Icon
                  type="plus"
                  className={styles.addSvg}
                  onClick={this.handleOpencreateAppMarket}
                />
              </Tooltip>
            }
            key="add"
          />
        </Tabs>
      </PageHeaderLayout>
    );
  }
}
