import React, { PureComponent } from "react";
import { connect } from "dva";
import { Row, Col, Button, Icon, Drawer, Alert, Tooltip } from "antd";
import styles from "./Index.less";
import Custom from "../Create/code-custom";
import Github from "../Create/code-github";
import Goodrain from "../Create/code-goodrain";
import Check from "../Create/create-check";
import ImageName from "../Create/image-name";
import ImageCmd from "../Create/image-cmd";
import Market from "../Create/market";
import rainbondUtil from "../../utils/rainbond";
import { languageObj } from "../../utils/utils";
import configureGlobal from "../../utils/configureGlobal";

const appStatusMap = {
  running: {
    iconUrl: "/static/www/img/appOutline/code.svg",
    className: "roundloading"
  },
  starting: {
    iconUrl: "/static/www/img/appOutline/docker.svg",
    className: ""
  },
  unKnow: {
    iconUrl: "/static/www/img/appOutline/github.svg",
    className: ""
  }
};

@connect(({ user, groupControl, global }) => ({
  currUser: user.currentUser,
  apps: groupControl.apps,
  groupDetail: groupControl.groupDetail || {},
  groups: global.groups || [],
  rainbondInfo: global.rainbondInfo
}))
export default class AddServiceComponent extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      CustomButton: false,
      toAddService: false,
      ServiceComponentOnePage: true,
      ServiceComponentTwoPage: null,
      ServiceComponentThreePage: null,
      ServiceGetData: null,
      ButtonGroup: false,
      ButtonGroupState: true,
      handleType: null,
      moreState: true,
      BackType: null,
      errState: true
    };
  }
  cancelDelete = () => {
    this.setState({ toDelete: false });
  };
  toAdd = () => {
    this.setState({ toAdd: true });
  };
  cancelAdd = () => {
    this.setState({ toAdd: false });
  };

  toAddService = () => {
    this.setState({ toAddService: true });
  };

  cancelAddService = () => {
    this.setState({ toAddService: false }, () => {
      this.setState({
        ServiceComponentTwoPage: null,
        ServiceComponentOnePage: true,
        moreState: true,
        ButtonGroup: false,
        ServiceComponentThreePage: false
      });
    });
  };

  //服务组件展示
  handleServiceComponent = (
    ServiceComponentOnePage,
    ServiceComponentTwoPage,
    ServiceComponentThreePage,
    dataName,
    data
  ) => {
    // ServiceComponentOnePage 显示第一页
    // ServiceComponentTwoPage 显示第二页组件模块
    // ServiceComponentThreePage 显示第三页组件模块
    // dataName 显示数据流程
    ServiceComponentOnePage = ServiceComponentOnePage || false;
    ServiceComponentTwoPage = ServiceComponentTwoPage || null;
    ServiceComponentThreePage = ServiceComponentThreePage || null;

    data = data || null;
    this.setState({
      ServiceComponentOnePage,
      ServiceComponentTwoPage,
      ServiceComponentThreePage,
      [dataName]: data
    });
    if (
      ServiceComponentOnePage === false ||
      ServiceComponentTwoPage === null ||
      ServiceComponentThreePage === null
    ) {
      this.setState({ ButtonGroup: null, ButtonGroupState: true });
    }
    if (ServiceComponentTwoPage) {
      this.setState({ BackType: ServiceComponentTwoPage });
    }
    if (ServiceComponentTwoPage !== "market") {
      this.setState({ moreState: true });
    }
  };

  //上一步
  handleBackEvents = () => {
    const {
      ServiceComponentOnePage,
      ServiceComponentTwoPage,
      ServiceComponentThreePage,
      BackType
    } = this.state;
    if (ServiceComponentTwoPage) {
      this.setState({
        ServiceComponentTwoPage: null,
        ServiceComponentOnePage: true,
        ButtonGroup: null,
        ButtonGroupState: true
      });
    } else if (ServiceComponentThreePage) {
      this.setState({
        ServiceComponentThreePage: null,
        ServiceComponentTwoPage: BackType,
        ButtonGroup: null,
        ButtonGroupState: true
      });
    }
    if (ServiceComponentTwoPage == "market") {
      this.setState({ moreState: true });
    }
  };
  //底部按钮组
  handleServiceBotton = (ButtonGroup, ButtonGroupState, errState) => {
    this.setState({ ButtonGroup, ButtonGroupState, errState });
  };
  //刷新
  refreshCurrent = () => {
    this.setState(
      {
        CustomButton: false,
        toAddService: false,
        ServiceComponentOnePage: true,
        ServiceComponentTwoPage: null,
        ServiceComponentThreePage: null,
        ServiceGetData: null,
        ButtonGroup: false,
        ButtonGroupState: true,
        handleType: null,
        moreState: true
      },
      () => {
        this.props.refreshCurrent();
      }
    );
  };

  render() {
    const { rainbondInfo } = this.props;
    const {
      ButtonGroup,
      moreState,
      ServiceComponentOnePage,
      ServiceComponentTwoPage,
      ServiceComponentThreePage,
      ServiceGetData,
      ButtonGroupState,
      handleType
    } = this.state;
    const codeSvg = () => (
      <svg width="60px" height="60px" viewBox="0 0 50 50" version="1.1">
        <path
          d="M31.157459,0.325985833 C30.9361049,0.1167225 30.6431362,0 30.3385417,0 L10.5952381,0 C7.30933786,0.0037202381 4.64657738,2.66648071 4.64285714,5.95238095 L4.64285714,44.047619 C4.64657738,47.3335193 7.30933786,49.9962798 10.5952381,50 L39.4140625,50 C42.6999629,49.9962798 45.3627232,47.3335193 45.3664435,44.047619 L45.3664435,14.297805 C45.3664435,13.9708892 45.2320499,13.6583892 44.9944196,13.4333148 L31.157459,0.325985833 Z M31.7145648,4.13364952 L41.109561,13.0333892 L32.905041,13.0333892 C32.2479538,13.032459 31.7150298,12.5 31.7145648,11.842913 L31.7145648,4.13364952 Z M39.4140625,47.6190476 L10.5952381,47.6190476 C8.6235119,47.6167225 7.02613464,46.0193452 7.02380952,44.047619 L7.02380952,5.95238095 C7.02613464,3.98065476 8.6235119,2.3832775 10.5952381,2.38095238 L29.3331474,2.38095238 L29.3331474,11.842913 C29.3354725,13.814174 30.9333148,15.4120164 32.904576,15.4143415 L42.9850261,15.4143415 L42.9850261,44.047619 C42.983166,46.0188802 41.3853237,47.6167225 39.4140625,47.6190476 Z"
          id="Shape"
          fill="#006DF0"
          fill-rule="nonzero"
        />
        <path
          d="M31.8708148,26.7089844 C31.5987724,26.3778832 31.1700149,26.218378 30.7477679,26.2913876 C30.3259858,26.3643974 29.9753535,26.6582962 29.8302642,27.0614769 C29.6851749,27.4646577 29.7679501,27.9143415 30.046968,28.2393974 L33.1180245,31.9001117 L30.046968,35.560826 C29.7679501,35.8858817 29.6851749,36.3360305 29.8302642,36.7392113 C29.9753535,37.1419271 30.3259858,37.436291 30.7477679,37.5088356 C31.1700149,37.5818452 31.5987724,37.42234 31.8708148,37.0912388 L35.5850074,32.6655506 C35.9561012,32.2228423 35.9561012,31.577381 35.5850074,31.1351376 L31.8708148,26.7089844 Z"
          id="Shape"
          fill="#006DF0"
          fill-rule="nonzero"
        />
        <path
          d="M16.890811,31.9001117 L19.9623326,28.2393974 C20.2413505,27.9143415 20.3241257,27.4646577 20.1790364,27.0614769 C20.0339471,26.6582962 19.6833148,26.3643974 19.2610677,26.2913876 C18.8392857,26.218378 18.4105283,26.3778832 18.1384858,26.7089844 L14.4247582,31.1351376 C14.0536644,31.577381 14.0536644,32.2228423 14.4247582,32.6655506 L18.1384858,37.0912388 C18.4105283,37.42234 18.8392857,37.5818452 19.2610677,37.5088356 C19.6833148,37.436291 20.0339471,37.1419271 20.1790364,36.7392113 C20.3241257,36.3360305 20.2413505,35.8858817 19.9623326,35.560826 L16.890811,31.9001117 Z"
          id="Shape"
          fill="#006DF0"
          fill-rule="nonzero"
        />
        <path
          d="M26.3020833,23.3468192 C25.6524368,23.2482329 25.0451079,23.6951264 24.9465215,24.3452381 L22.7087983,39.0978423 C22.609747,39.7479538 23.0571057,40.3548177 23.7072173,40.453404 C23.7667411,40.4627046 23.8267299,40.4673549 23.8871838,40.4673549 C24.4749814,40.4664249 24.9744233,40.0367374 25.062779,39.4554501 L27.3005023,24.702381 C27.3995536,24.0522693 26.952195,23.4454055 26.3020833,23.3468192 Z"
          id="Shape"
          fill="#006DF0"
          fill-rule="nonzero"
        />
      </svg>
    );
    const dockerSvg = () => (
      <svg viewBox="0 0 50 50" version="1.1" width="60px" height="60px">
        <path
          style={{ fill: "#03A9F4" }}
          d="M 40 20 C 40.390625 18.265625 39.90625 16.21875 37.5 14 C 33.585938 17.542969 34.703125 21.226563 36 23 C 36 23 35.835938 24 32 24 C 28.164063 24 2 24 2 24 C 2 24 0.167969 40 18 40 C 33.59375 40 37.972656 27.996094 38.828125 24.925781 C 39.183594 24.972656 39.578125 25.003906 40 25 C 42.148438 24.984375 44.929688 23.828125 46 19.515625 C 43.160156 18.53125 41.339844 18.976563 40 20 Z "
        />
        <path
          style={{ fill: "#0288D1" }}
          d="M 2.164063 28 C 2.898438 32.738281 5.984375 40 18 40 C 30.183594 40 35.523438 32.671875 37.683594 28 Z "
        />
        <path
          style={{ fill: "#81D4FA" }}
          d="M 19.8125 39.9375 C 18.890625 39.617188 14.738281 38.847656 14 33 C 9.789063 34.863281 6.0625 34.375 4.421875 34.007813 C 6.582031 37.238281 10.589844 40 18 40 C 18.621094 40 19.222656 39.976563 19.8125 39.9375 Z "
        />
        <path
          style={{ fill: "#FFFFFF" }}
          d="M 20 32 C 20 33.105469 19.105469 34 18 34 C 16.894531 34 16 33.105469 16 32 C 16 30.894531 16.894531 30 18 30 C 19.105469 30 20 30.894531 20 32 Z "
        />
        <path
          style={{ fill: "#37474F" }}
          d="M 14.914063 33.597656 C 15.136719 34.101563 14.933594 34.757813 14.402344 34.914063 C 11.101563 35.886719 8.257813 36.015625 6.105469 36.015625 C 5.464844 35.398438 4.914063 34.738281 4.449219 34.054688 C 7.035156 34.054688 11.160156 33.933594 13.59375 33.089844 C 14.117188 32.90625 14.691406 33.089844 14.914063 33.597656 Z M 2 27 C 2 27 3.875 27.125 5 26 C 6.875 27.6875 10.941406 27.089844 12 26 C 13.0625 27.6875 18.9375 27.375 20 26 C 21.25 27.4375 26.625 27.75 28 26 C 28.480469 27.460938 34.820313 27.875 36 26 C 37.0625 27.089844 41.0625 27.9375 43.3125 26 C 43.875 27.1875 46 27 46 27 L 46 28 L 2 28 M 17 32 C 17 32.550781 17.449219 33 18 33 C 18.550781 33 19 32.550781 19 32 C 19 31.449219 18.550781 31 18 31 C 17.449219 31 17 31.449219 17 32 Z "
        />
        <path
          style={{ fill: "#01579B" }}
          d="M 11 24 L 6 24 L 6 19 L 11 19 Z M 21 19 L 16 19 L 16 24 L 21 24 Z M 31 19 L 26 19 L 26 24 L 31 24 Z M 16 14 L 11 14 L 11 19 L 16 19 Z M 26 14 L 21 14 L 21 19 L 26 19 Z "
        />
        <path
          style={{ fill: "#0288D1" }}
          d="M 16 24 L 11 24 L 11 19 L 16 19 Z M 26 19 L 21 19 L 21 24 L 26 24 Z M 26 9 L 21 9 L 21 14 L 26 14 Z M 21 14 L 16 14 L 16 19 L 21 19 Z "
        />
      </svg>
    );
    const apiSvg = () => (
      <svg width="60px" height="60px" viewBox="0 0 41 27" version="1.1">
        <g
          id="Page-1"
          stroke="none"
          stroke-width="1"
          fill="none"
          fill-rule="evenodd"
        >
          <g id="Group-2" transform="translate(-9.000000, -17.000000)">
            <rect id="Rectangle-Copy-2" x="0" y="0" width="60" height="60" />
            <rect
              id="Rectangle"
              fill="#326DE6"
              x="9"
              y="17"
              width="41"
              height="27"
              rx="3"
            />
            <text
              id="API"
              font-family="Helvetica-Bold, Helvetica"
              font-size="16"
              font-weight="bold"
              fill="#FFFFFF"
            >
              <tspan x="16" y="36">
                API
              </tspan>
            </text>
          </g>
        </g>
      </svg>
    );

    const staticSvg = () => (
      <svg width="60px" height="60px" viewBox="0 0 36 47" version="1.1">
        <g
          id="Page-1"
          stroke="none"
          stroke-width="1"
          fill="none"
          fill-rule="evenodd"
        >
          <g id="Group" transform="translate(-12.000000, -7.000000)">
            <rect id="Rectangle" x="0" y="0" width="60" height="60" />
            <polygon
              id="Path"
              fill="#326DE6"
              fill-rule="nonzero"
              points="35.7884651 7 12 7 12 54 48 54 48 19.4644"
            />
            <path
              d="M18.8333333,17 L27.1666667,17 C27.6266667,17 28,17.447 28,18 C28,18.553 27.6266667,19 27.1666667,19 L18.8333333,19 C18.3733333,19 18,18.553 18,18 C18,17.447 18.3733333,17 18.8333333,17 Z"
              id="Path"
              fill="#FFFFFF"
              fill-rule="nonzero"
            />
            <path
              d="M40.1481481,46 L18.8518519,46 C18.3816296,46 18,45.553 18,45 C18,44.447 18.3816296,44 18.8518519,44 L40.1481481,44 C40.6183704,44 41,44.447 41,45 C41,45.553 40.6183704,46 40.1481481,46 Z"
              id="Path"
              fill="#FFFFFF"
              fill-rule="nonzero"
            />
            <path
              d="M40.1481481,40 L18.8518519,40 C18.3816296,40 18,39.553 18,39 C18,38.447 18.3816296,38 18.8518519,38 L40.1481481,38 C40.6183704,38 41,38.447 41,39 C41,39.553 40.6183704,40 40.1481481,40 Z"
              id="Path"
              fill="#FFFFFF"
              fill-rule="nonzero"
            />
            <path
              d="M40.1481481,33 L18.8518519,33 C18.3816296,33 18,32.553 18,32 C18,31.447 18.3816296,31 18.8518519,31 L40.1481481,31 C40.6183704,31 41,31.447 41,32 C41,32.553 40.6183704,33 40.1481481,33 Z"
              id="Path"
              fill="#FFFFFF"
              fill-rule="nonzero"
            />
            <polygon
              id="Path"
              fill="#FFFFFF"
              fill-rule="nonzero"
              points="35 21 35 9 47 21"
            />
          </g>
        </g>
      </svg>
    );

    const kuberSvg = () => (
      <svg width="60px" height="60px" viewBox="0 0 48 46" version="1.1">
        <g
          id="Page-1"
          stroke="none"
          stroke-width="1"
          fill="none"
          fill-rule="evenodd"
        >
          <g id="Kubernetes_logo" transform="translate(-6.000000, -7.000000)">
            <rect id="Rectangle-Copy" x="0" y="0" width="60" height="60" />
            <path
              d="M49.800906,17.2306502 C49.5264555,16.3599565 48.8677741,15.652518 48.0444223,15.2171712 L31.3029366,7.27209176 C30.8638157,7.05441835 30.3698046,7 29.9306837,7 C29.4915627,7 28.9975517,7 28.5584307,7.1088367 L11.816945,15.1083345 C10.9935932,15.4892629 10.3898019,16.1967015 10.1702414,17.1218135 L6.05348265,35.0254513 C5.8888123,35.9505633 6.10837277,36.8756753 6.65727392,37.6375322 L18.2390887,51.8407221 C18.8977701,52.4937423 19.8309021,52.9290891 20.7640341,52.9835075 L39.2071134,52.9835075 C40.1951356,53.0923442 41.1282675,52.6569973 41.7320588,51.8407221 L53.3138735,37.6375322 C53.8627747,36.8756753 54.0823352,35.9505633 53.9725549,35.0254513 L49.800906,17.2306502 Z"
              id="path10349"
              fill="#326DE6"
              fill-rule="nonzero"
            />
            <path
              d="M47.0245966,34.3718874 L47.0245966,34.3718874 C46.9704075,34.3718874 46.9162185,34.3718874 46.9162185,34.3178076 C46.9162185,34.2637278 46.8078403,34.2637278 46.6994622,34.2637278 C46.4827059,34.209648 46.2659495,34.209648 46.0491932,34.209648 C45.9408151,34.209648 45.8324369,34.209648 45.7240588,34.1555682 L45.6698697,34.1555682 C45.0737899,34.1014884 44.4235209,33.9933288 43.8274411,33.8310893 C43.6648739,33.7770095 43.5023066,33.6147701 43.4481176,33.4525306 C43.5023066,33.4525306 43.4481176,33.4525306 43.4481176,33.4525306 L43.4481176,33.4525306 L43.0146049,33.344371 C43.2313612,31.7760565 43.1229831,30.1536621 42.7978486,28.5853476 C42.4185251,27.017033 41.7682562,25.5027983 40.9012309,24.150803 L41.2263654,23.8263241 L41.2263654,23.8263241 L41.2263654,23.7722443 C41.2263654,23.6100049 41.2805545,23.3936856 41.3889326,23.285526 C41.8766343,22.8528875 42.364336,22.5284087 42.9062268,22.2039298 L42.9062268,22.2039298 C43.0146049,22.14985 43.1229831,22.0957702 43.2313612,22.0416904 C43.4481176,21.9335307 43.6106848,21.8253711 43.8274411,21.7172115 C43.8816302,21.6631317 43.9358192,21.6631317 43.9900083,21.6090519 C44.0441974,21.554972 43.9900083,21.554972 43.9900083,21.5008922 L43.9900083,21.5008922 C44.47771,21.1223335 44.5860882,20.4733758 44.2067646,19.9866575 C44.0441974,19.7703383 43.7190629,19.6080988 43.4481176,19.6080988 C43.1771722,19.6080988 42.9062268,19.7162584 42.6894705,19.8784979 L42.6894705,19.8784979 L42.6352814,19.9325777 C42.5810923,19.9866575 42.5269032,20.0407373 42.4727142,20.0407373 C42.3101469,20.2029767 42.1475797,20.3652162 42.0392016,20.5274556 C41.9850125,20.6356152 41.8766343,20.6896951 41.8224453,20.7437749 L41.8224453,20.7437749 C41.4431217,21.1764134 40.95542,21.6090519 40.4677183,21.9335307 C40.3593402,21.9876105 40.250962,22.0416904 40.1425839,22.0416904 C40.0883948,22.0416904 39.9800166,22.0416904 39.9258276,21.9876105 L39.8716385,21.9876105 L39.4381259,22.2580096 C39.0046133,21.8253711 38.5169116,21.3927326 38.083399,20.9600941 C36.0784031,19.3917796 33.5857056,18.418343 31.038819,18.1479439 L30.9846299,17.7153054 L30.9846299,17.7153054 L30.9846299,17.7693852 C30.8220627,17.6612256 30.7678736,17.4989862 30.7136845,17.3367467 C30.7136845,16.7418688 30.7136845,16.1469909 30.8220627,15.4980331 L30.8220627,15.4439533 C30.8220627,15.3357937 30.8762518,15.2276341 30.8762518,15.1194744 C30.9304408,14.9031552 30.9304408,14.6868359 30.9846299,14.4705167 L30.9846299,14.1460378 L30.9846299,14.1460378 C31.038819,13.6052397 30.6053064,13.0644416 30.0634156,13.0103618 C29.7382811,12.956282 29.4131467,13.1185214 29.1422013,13.3889205 C28.925445,13.6052397 28.8170668,13.8756388 28.8170668,14.1460378 L28.8170668,14.1460378 L28.8170668,14.4164369 C28.8170668,14.6327561 28.8712559,14.8490754 28.925445,15.0653946 C28.9796341,15.1735543 28.9796341,15.2817139 28.9796341,15.3898735 L28.9796341,15.4439533 C29.0880122,16.0388312 29.0880122,16.6337092 29.0880122,17.2826669 C29.0338231,17.4449063 28.9796341,17.6071458 28.8170668,17.7153054 L28.8170668,17.823465 L28.8170668,17.823465 L28.7628778,18.2561035 C28.1667979,18.3101833 27.5707181,18.418343 26.9204491,18.5265026 C24.3735625,19.0673007 22.0434322,20.419296 20.2551927,22.3120894 L19.9300582,22.0957702 L19.8758692,22.0957702 C19.8216801,22.0957702 19.767491,22.14985 19.6591129,22.14985 C19.5507347,22.14985 19.4423566,22.0957702 19.3339784,22.0416904 C18.8462767,21.6631317 18.358575,21.2304932 17.9792515,20.7978547 L17.9792515,20.7978547 C17.9250624,20.6896951 17.8166843,20.6356152 17.7624952,20.5815354 C17.5999279,20.419296 17.4915498,20.2570566 17.3289826,20.0948171 C17.2747935,20.0407373 17.2206044,20.0407373 17.1664153,19.9866575 C17.1122263,19.9325777 17.1122263,19.9325777 17.1122263,19.9325777 L17.1122263,19.9325777 C16.89547,19.7703383 16.6245246,19.6621786 16.3535792,19.6621786 C16.0284447,19.6621786 15.7574993,19.7703383 15.5949321,20.0407373 C15.2697976,20.5274556 15.3781758,21.1764134 15.8116884,21.554972 L15.8116884,21.554972 C15.8658775,21.554972 15.8658775,21.6090519 15.8658775,21.6090519 C15.8658775,21.6090519 15.9742556,21.7172115 16.0284447,21.7172115 C16.191012,21.8253711 16.4077683,21.9335307 16.6245246,22.0416904 C16.7329027,22.0957702 16.8412809,22.14985 16.949659,22.2039298 L16.949659,22.2039298 C17.4915498,22.5284087 18.0334406,22.8528875 18.4669532,23.285526 C18.5753313,23.3936856 18.6837095,23.6100049 18.6295204,23.7722443 L18.6295204,23.7181645 L18.6295204,23.7181645 L18.9546549,24.0426434 C18.9004658,24.150803 18.8462767,24.2048828 18.7920876,24.3130424 C17.1122263,26.9629532 16.4077683,30.0995823 16.89547,33.1821316 L16.4619573,33.2902912 L16.4619573,33.2902912 C16.4619573,33.344371 16.4077683,33.344371 16.4077683,33.344371 C16.3535792,33.5066104 16.191012,33.6147701 16.0284447,33.7229297 C15.4323649,33.8851691 14.836285,33.9933288 14.1860161,34.0474086 L14.1860161,34.0474086 C14.077638,34.0474086 13.9692598,34.0474086 13.8608817,34.1014884 C13.6441253,34.1014884 13.427369,34.1555682 13.2106127,34.1555682 C13.1564237,34.1555682 13.1022346,34.209648 12.9938564,34.209648 C12.9396673,34.209648 12.9396673,34.209648 12.8854783,34.2637278 L12.8854783,34.2637278 C12.2893984,34.3718874 11.9100749,34.9126856 12.018453,35.5075635 C12.018453,35.5075635 12.018453,35.5075635 12.018453,35.5075635 C12.1268312,35.9942818 12.6145329,36.3187607 13.1022346,36.2646808 C13.2106127,36.2646808 13.2648018,36.2646808 13.37318,36.210601 L13.37318,36.210601 C13.427369,36.210601 13.427369,36.210601 13.427369,36.1565212 C13.427369,36.1024414 13.5899363,36.1565212 13.6441253,36.1565212 C13.8608817,36.1024414 14.077638,35.9942818 14.2402052,35.940202 C14.3485833,35.8861222 14.4569615,35.8320424 14.5653397,35.8320424 L14.6195287,35.8320424 C15.2156086,35.6157231 15.7574993,35.4534837 16.4077683,35.345324 L16.4619573,35.345324 C16.6245246,35.345324 16.7870918,35.3994039 16.89547,35.5075635 C16.949659,35.5075635 16.949659,35.5616433 16.949659,35.5616433 L16.949659,35.5616433 L17.4373607,35.5075635 C18.2501969,37.9952348 19.767491,40.2125071 21.880865,41.8349015 C22.3685667,42.2134601 22.8020793,42.537939 23.3439701,42.8083381 L23.0730247,43.1868968 L23.0730247,43.1868968 C23.0730247,43.2409766 23.1272138,43.2409766 23.1272138,43.2409766 C23.2355919,43.403216 23.2355919,43.6195352 23.1814029,43.7817747 C22.9646465,44.3225728 22.6395121,44.8633709 22.3143776,45.3500892 L22.3143776,45.404169 C22.2601885,45.5123287 22.2059995,45.5664085 22.0976213,45.6745681 C21.9892432,45.7827277 21.880865,45.999047 21.7182978,46.2153662 C21.6641087,46.269446 21.6641087,46.3235258 21.6099196,46.3776056 C21.6099196,46.3776056 21.6099196,46.4316855 21.5557306,46.4316855 L21.5557306,46.4316855 C21.2847852,46.9724836 21.5015415,47.6214413 21.9892432,47.8918404 C22.0976213,47.9459202 22.2601885,48 22.3685667,48 C22.8020793,48 23.1814029,47.7296009 23.3981592,47.3510423 L23.3981592,47.3510423 C23.3981592,47.3510423 23.3981592,47.2969624 23.4523482,47.2969624 C23.4523482,47.2428826 23.5065373,47.1888028 23.5607264,47.134723 C23.6149155,46.9184038 23.7232936,46.7561643 23.7774827,46.5398451 L23.8858609,46.2153662 L23.8858609,46.2153662 C24.0484281,45.6204883 24.3193735,45.0796902 24.5903188,44.538892 C24.698697,44.3766526 24.8612642,44.268493 25.0238315,44.2144132 C25.0780205,44.2144132 25.0780205,44.2144132 25.0780205,44.1603334 L25.0780205,44.1603334 L25.2947768,43.7276949 C26.812071,44.3225728 28.3835542,44.5929719 30.0092265,44.5929719 C30.9846299,44.5929719 31.9600333,44.4848122 32.9354367,44.2144132 C33.5315165,44.1062536 34.1275964,43.8899343 34.6694871,43.7276949 L34.8862434,44.1062536 L34.8862434,44.1062536 C34.9404325,44.1062536 34.9404325,44.1062536 34.9404325,44.1603334 C35.1029997,44.2144132 35.265567,44.3225728 35.3739451,44.4848122 C35.6448905,45.0256104 35.9158359,45.5664085 36.0784031,46.1612864 L36.0784031,46.2153662 L36.1867813,46.5398451 C36.2409703,46.7561643 36.2951594,46.9724836 36.4035376,47.134723 C36.4577267,47.1888028 36.4577267,47.2428826 36.5119157,47.2969624 C36.5119157,47.2969624 36.5119157,47.3510423 36.5661048,47.3510423 L36.5661048,47.3510423 C36.7828611,47.7296009 37.1621847,48 37.5956973,48 C37.7582645,48 37.8666426,47.9459202 38.0292099,47.8918404 C38.2459662,47.7836808 38.4627225,47.5673615 38.5169116,47.2969624 C38.5711006,47.0265634 38.5711006,46.7561643 38.4627225,46.4857653 L38.4627225,46.4857653 C38.4627225,46.4316855 38.4085334,46.4316855 38.4085334,46.4316855 C38.4085334,46.3776056 38.3543443,46.3235258 38.3001553,46.269446 C38.1917771,46.0531268 38.083399,45.8908873 37.9208317,45.7286479 C37.8666426,45.6204883 37.8124536,45.5664085 37.7040754,45.4582488 L37.7040754,45.3500892 C37.3247519,44.8633709 37.0538065,44.3225728 36.8370502,43.7817747 C36.7828611,43.6195352 36.7828611,43.403216 36.8912393,43.2409766 C36.8912393,43.1868968 36.9454283,43.1868968 36.9454283,43.1868968 L36.9454283,43.1868968 L36.7828611,42.7542583 C39.546504,41.0777841 41.659878,38.4819531 42.6352814,35.3994039 L43.068794,35.4534837 L43.068794,35.4534837 C43.1229831,35.4534837 43.1229831,35.3994039 43.1229831,35.3994039 C43.2313612,35.2912442 43.3939285,35.2371644 43.5564957,35.2371644 L43.6106848,35.2371644 C44.2067646,35.345324 44.8028445,35.5075635 45.3447352,35.7238827 L45.3989243,35.7238827 C45.5073025,35.7779625 45.6156806,35.8320424 45.7240588,35.8320424 C45.9408151,35.940202 46.1033823,36.0483616 46.3201386,36.1024414 C46.3743277,36.1024414 46.4285168,36.1565212 46.5368949,36.1565212 C46.591084,36.1565212 46.591084,36.1565212 46.6452731,36.210601 L46.6452731,36.210601 C46.7536512,36.2646808 46.8078403,36.2646808 46.9162185,36.2646808 C47.4039202,36.2646808 47.8374328,35.940202 48,35.5075635 C47.9458109,34.9126856 47.5122983,34.4800471 47.0245966,34.3718874 L47.0245966,34.3718874 Z M31.3639534,32.6954133 L29.9008484,33.3984508 L28.4377433,32.6954133 L28.0584198,31.1270987 L29.0880122,29.8291832 L30.7136845,29.8291832 L31.743277,31.1270987 L31.3639534,32.6954133 L31.3639534,32.6954133 Z M40.1967729,29.1802255 C40.4677183,30.3159016 40.5219074,31.4515776 40.4135293,32.5872536 L35.265567,31.1270987 L35.265567,31.1270987 C34.7778653,31.0189391 34.5069199,30.5322208 34.615298,30.0455025 C34.6694871,29.8832631 34.7236762,29.7751034 34.8320544,29.6669438 L38.8962351,25.9895166 C39.492315,26.9629532 39.9258276,28.0445495 40.1967729,29.1802255 L40.1967729,29.1802255 Z M37.2705628,23.9885636 L32.8270585,27.1251927 C32.447735,27.3415119 31.9058442,27.2874321 31.6348988,26.9088734 C31.5265207,26.8007138 31.4723316,26.6925542 31.4723316,26.5303147 L31.1471971,21.0682537 C33.5315165,21.3386528 35.6448905,22.3661692 37.2705628,23.9885636 L37.2705628,23.9885636 L37.2705628,23.9885636 Z M27.4623399,21.2304932 L28.5461215,21.0141739 L28.2751761,26.4221551 L28.2751761,26.4221551 C28.2751761,26.9088734 27.8416635,27.2874321 27.3539618,27.2874321 C27.1913945,27.2874321 27.0830164,27.2333523 26.9204491,27.1792725 L22.4227558,23.9885636 C23.8316718,22.6365683 25.5657222,21.6631317 27.4623399,21.2304932 Z M20.8512726,25.9895166 L24.8612642,29.5587842 L24.8612642,29.5587842 C25.2405878,29.8832631 25.2947768,30.4240612 24.9696424,30.8026199 C24.8612642,30.9648593 24.7528861,31.0189391 24.5361298,31.0730189 L19.2797893,32.5872536 C19.1172221,30.3159016 19.6591129,27.9904696 20.8512726,25.9895166 L20.8512726,25.9895166 Z M19.9300582,35.1290048 L25.2947768,34.209648 C25.7282895,34.209648 26.1618021,34.4800471 26.2159912,34.9126856 C26.2701802,35.074925 26.2701802,35.2912442 26.1618021,35.4534837 L26.1618021,35.4534837 L24.1026172,40.4288264 C22.2059995,39.1849907 20.6887053,37.2921973 19.9300582,35.1290048 L19.9300582,35.1290048 Z M32.2309787,41.8349015 C31.4723316,41.9971409 30.7136845,42.1053005 29.9008484,42.1053005 C28.7628778,42.1053005 27.5707181,41.8889813 26.4869365,41.5645024 L29.1422013,36.7513992 C29.4131467,36.4269203 29.8466593,36.3187607 30.2259828,36.5350799 C30.3885501,36.6432395 30.4969282,36.7513992 30.6594954,36.9136386 L30.6594954,36.9136386 L33.2605711,41.6185822 C32.9354367,41.672662 32.6103022,41.7267418 32.2309787,41.8349015 L32.2309787,41.8349015 Z M38.842046,37.1299578 C38.0292099,38.4278733 36.8912393,39.5635494 35.5907014,40.3747465 L33.4773274,35.2912442 C33.3689493,34.8586057 33.5857056,34.4259672 33.9650291,34.2637278 C34.1275964,34.209648 34.2901636,34.1555682 34.4527308,34.1555682 L39.8716385,35.074925 C39.6006931,35.8320424 39.2755586,36.5350799 38.842046,37.1299578 Z"
              id="path10351"
              fill="#FFFFFF"
              fill-rule="nonzero"
            />
          </g>
        </g>
      </svg>
    );
    const githubrSvg = () => (
      <svg viewBox="0 0 16 16" version="1.1" width="60px" height="60px">
        <path d="M 7.5 1 C 3.910156 1 1 3.90625 1 7.488281 C 1 10.355469 2.863281 12.789063 5.445313 13.648438 C 5.769531 13.707031 6 13.375 6 13.125 C 6 12.972656 6.003906 12.789063 6 12.25 C 4.191406 12.640625 3.625 11.375 3.625 11.375 C 3.328125 10.625 2.96875 10.410156 2.96875 10.410156 C 2.378906 10.007813 3.011719 10.019531 3.011719 10.019531 C 3.664063 10.0625 4 10.625 4 10.625 C 4.5 11.5 5.628906 11.414063 6 11.25 C 6 10.851563 6.042969 10.5625 6.152344 10.378906 C 4.109375 10.019531 2.996094 8.839844 3 7.207031 C 3.003906 6.242188 3.335938 5.492188 3.875 4.9375 C 3.640625 4.640625 3.480469 3.625 3.960938 3 C 5.167969 3 5.886719 3.871094 5.886719 3.871094 C 5.886719 3.871094 6.453125 3.625 7.496094 3.625 C 8.542969 3.625 9.105469 3.859375 9.105469 3.859375 C 9.105469 3.859375 9.828125 3 11.035156 3 C 11.515625 3.625 11.355469 4.640625 11.167969 4.917969 C 11.683594 5.460938 12 6.210938 12 7.207031 C 12 8.839844 10.890625 10.019531 8.851563 10.375 C 8.980469 10.570313 9 10.84375 9 11.25 C 9 12.117188 9 12.910156 9 13.125 C 9 13.375 9.226563 13.710938 9.558594 13.648438 C 12.140625 12.785156 14 10.355469 14 7.488281 C 14 3.90625 11.089844 1 7.5 1 Z " />
      </svg>
    );
    const gitlabSvg = () => (
      <svg viewBox="0 0 50 50" version="1.1" width="60px" height="60px">
        <path style={{ fill: "#E53935" }} d="M 24 43 L 16 20 L 32 20 Z " />
        <path style={{ fill: "#FF7043" }} d="M 24 43 L 42 20 L 32 20 Z " />
        <path style={{ fill: "#E53935" }} d="M 37 5 L 42 20 L 32 20 Z " />
        <path style={{ fill: "#FFA726" }} d="M 24 43 L 42 20 L 45 28 Z " />
        <path style={{ fill: "#FF7043" }} d="M 24 43 L 6 20 L 16 20 Z " />
        <path style={{ fill: "#E53935" }} d="M 11 5 L 6 20 L 16 20 Z " />
        <path style={{ fill: "#FFA726" }} d="M 24 43 L 6 20 L 3 28 Z " />
      </svg>
    );
    return (
      <div>
        <Button
          type="primary"
          onClick={this.toAddService}
          style={{ marginLeft: "12px" }}
        >
          <Icon type="plus" />
          添加服务组件
        </Button>
        <Drawer
          title="添加服务组件"
          placement="right"
          onClose={this.cancelAddService}
          visible={this.state.toAddService}
          maskClosable={false}
          width={550}
        >
          {ServiceComponentOnePage && (
            <div style={{ marginTop: "-12px" }}>
              <div className={styles.ServiceBox}>
                <Row>
                  <p className={styles.ServiceTitle}>从源代码开始</p>
                </Row>
                <Row>
                  <Col
                    span={8}
                    className={styles.ServiceDiv}
                    onClick={() => {
                      this.handleServiceComponent(false, "custom");
                    }}
                  >
                    <Icon component={codeSvg} />
                    <p className={styles.ServiceSmallTitle}>自定义仓库</p>
                  </Col>
                  <Tooltip
                    placement="top"
                    title={
                      !rainbondUtil.gitlabEnable(rainbondInfo) && "仅企业版可用"
                    }
                  >
                    <Col
                      span={8}
                      className={styles.ServiceDiv}
                      onClick={() => {
                        rainbondUtil.gitlabEnable(rainbondInfo) &&
                          this.handleServiceComponent(false, "goodrain");
                      }}
                    >
                      <Icon component={gitlabSvg} />
                      <p
                        className={styles.ServiceSmallTitle}
                        style={{
                          color: rainbondUtil.gitlabEnable(rainbondInfo)
                            ? "rgba(16, 16, 16, 1)"
                            : "rgba(0, 0, 0, 0.25)"
                        }}
                      >
                        Gitlab项目
                      </p>
                    </Col>
                  </Tooltip>
                  <Tooltip
                    placement="top"
                    title={
                      !rainbondUtil.gitlabEnable(rainbondInfo) && "仅企业版可用"
                    }
                  >
                    <Col
                      span={8}
                      className={styles.ServiceDiv}
                      onClick={() => {
                        rainbondUtil.githubEnable(rainbondInfo) &&
                          this.handleServiceComponent(false, "github");
                      }}
                    >
                      <Icon component={githubrSvg} />
                      <p
                        className={styles.ServiceSmallTitle}
                        style={{
                          color: rainbondUtil.gitlabEnable(rainbondInfo)
                            ? "rgba(16, 16, 16, 1)"
                            : "rgba(0, 0, 0, 0.25)"
                        }}
                      >
                        Github项目
                      </p>
                    </Col>
                  </Tooltip>
                </Row>
                <Row style={{ marginBottom: "2px" }}>
                  <Alert
                    message={
                      configureGlobal.documentShow && (
                        <p className={styles.prompt}>
                          注:支持
                          {Object.keys(languageObj).map(key => {
                            return (
                              <a href={languageObj[key]} target="_blank">
                                {key}
                              </a>
                            );
                          })}
                          等语言规范
                        </p>
                      )
                    }
                    type="info"
                    style={{ height: "50px" }}
                    showIcon
                  />
                </Row>
              </div>

              <div className={styles.ServiceBox}>
                <Row>
                  <p className={styles.ServiceTitle}>从源镜像开始</p>
                </Row>
                <Row style={{ marginTop: "-8px" }}>
                  <Col
                    span={8}
                    className={styles.ServiceDiv}
                    onClick={() => {
                      this.handleServiceComponent(false, "imageName");
                    }}
                  >
                    <Icon component={dockerSvg} />
                    <p className={styles.ServiceSmallTitle}>指定镜像</p>
                  </Col>
                  <Col
                    span={8}
                    className={styles.ServiceDiv}
                    onClick={() => {
                      this.handleServiceComponent(false, "imageCmd");
                    }}
                  >
                    <Icon component={dockerSvg} />
                    <p className={styles.ServiceSmallTitle}>
                      指定DockerRun命令
                    </p>
                  </Col>
                </Row>
              </div>
              <div className={styles.ServiceBox}>
                <Row>
                  <p className={styles.ServiceTitle}>从应用市场开始</p>
                </Row>
                <Row>
                  <Market
                    handleType="Service"
                    scopeMax="localApplication"
                    refreshCurrent={() => {
                      this.refreshCurrent();
                    }}
                    groupId={this.props.groupId}
                    ButtonGroupState={ButtonGroupState}
                    moreState={moreState}
                    handleServiceBotton={(ButtonGroup, ButtonGroupState) => {
                      this.handleServiceBotton(ButtonGroup, ButtonGroupState);
                    }}
                    handleServiceGetData={data => {
                      this.handleServiceComponent(
                        false,
                        null,
                        "check",
                        "ServiceGetData",
                        data
                      );
                    }}
                    handleServiceComponent={() => {
                      this.handleServiceComponent(
                        false,
                        "market",
                        null,
                        "moreState",
                        false
                      );
                    }}
                  />
                </Row>
              </div>
            </div>
          )}
          {ServiceComponentTwoPage === "custom" && (
            <Custom
              handleType="Service"
              groupId={this.props.groupId}
              ButtonGroupState={ButtonGroupState}
              handleServiceBotton={(ButtonGroup, ButtonGroupState) => {
                this.handleServiceBotton(ButtonGroup, ButtonGroupState);
              }}
              handleServiceGetData={data => {
                this.handleServiceComponent(
                  false,
                  null,
                  "check",
                  "ServiceGetData",
                  data
                );
              }}
            />
          )}
          {ServiceComponentTwoPage === "goodrain" && (
            <Goodrain
              groupId={this.props.groupId}
              handleType="Service"
              ButtonGroupState={ButtonGroupState}
              handleServiceBotton={(ButtonGroup, ButtonGroupState) => {
                this.handleServiceBotton(ButtonGroup, ButtonGroupState);
              }}
              ButtonGroupState={this.state.ButtonGroupState}
              handleServiceBotton={(ButtonGroup, ButtonGroupState) => {
                this.handleServiceBotton(ButtonGroup, ButtonGroupState);
              }}
            />
          )}

          {ServiceComponentTwoPage === "github" && (
            <Github
              groupId={this.props.groupId}
              handleType="Service"
              ButtonGroupState={ButtonGroupState}
              handleServiceBotton={(ButtonGroup, ButtonGroupState) => {
                this.handleServiceBotton(ButtonGroup, ButtonGroupState);
              }}
              handleServiceGetData={data => {
                this.handleServiceComponent(
                  false,
                  null,
                  "check",
                  "ServiceGetData",
                  data
                );
              }}
            />
          )}
          {ServiceComponentThreePage === "check" && ServiceGetData && (
            <Check
              ServiceGetData={ServiceGetData}
              handleType="Service"
              ButtonGroupState={ButtonGroupState}
              ErrState={this.state.errState}
              refreshCurrent={() => {
                this.refreshCurrent();
              }}
              handleServiceBotton={(
                ButtonGroup,
                ButtonGroupState,
                errState
              ) => {
                this.handleServiceBotton(
                  ButtonGroup,
                  ButtonGroupState,
                  errState
                );
              }}
              handleServiceDataState={(
                ServiceComponentOnePage,
                ServiceComponentTwoPage,
                ServiceComponentThreePage,
                data
              ) => {
                this.handleServiceComponent(
                  ServiceComponentOnePage,
                  ServiceComponentTwoPage,
                  ServiceComponentThreePage,
                  "ServiceGetData",
                  data
                );
                this.props.onload && this.props.onload();
              }}
            />
          )}

          {ServiceComponentTwoPage === "imageName" && (
            <ImageName
              groupId={this.props.groupId}
              handleType="Service"
              ButtonGroupState={ButtonGroupState}
              handleServiceBotton={(ButtonGroup, ButtonGroupState) => {
                this.handleServiceBotton(ButtonGroup, ButtonGroupState);
              }}
              handleServiceGetData={data => {
                this.handleServiceComponent(
                  false,
                  null,
                  "check",
                  "ServiceGetData",
                  data
                );
              }}
            />
          )}

          {ServiceComponentTwoPage === "imageCmd" && (
            <ImageCmd
              groupId={this.props.groupId}
              handleType="Service"
              ButtonGroupState={ButtonGroupState}
              handleServiceBotton={(ButtonGroup, ButtonGroupState) => {
                this.handleServiceBotton(ButtonGroup, ButtonGroupState);
              }}
              handleServiceGetData={data => {
                this.handleServiceComponent(
                  false,
                  null,
                  "check",
                  "ServiceGetData",
                  data
                );
              }}
            />
          )}
          {ServiceComponentTwoPage === "market" && (
            <Market
              scopeMax="localApplication"
              groupId={this.props.groupId}
              refreshCurrent={() => {
                this.refreshCurrent();
              }}
              handleType="Service"
              moreState={moreState}
              ButtonGroupState={ButtonGroupState}
              handleServiceBotton={(ButtonGroup, ButtonGroupState) => {
                this.handleServiceBotton(ButtonGroup, ButtonGroupState);
              }}
              handleServiceGetData={data => {
                this.handleServiceComponent(
                  false,
                  null,
                  "check",
                  "ServiceGetData",
                  data
                );
              }}
              handleServiceComponent={() => {
                this.handleServiceComponent(false, "market", null);
              }}
            />
          )}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              width: "100%",
              borderTop: "1px solid #e8e8e8",
              padding: "10px 16px",
              left: 0,
              background: "#fff",
              borderRadius: "0 0 4px 4px",
              display: "flex",
              justifyContent: "flex-end",
              zIndex: 99999
            }}
          >
            {!ServiceComponentOnePage && ServiceComponentThreePage !== "check" && (
              <Button
                style={{
                  marginRight: 8
                }}
                onClick={() => {
                  this.handleBackEvents(true, null);
                }}
              >
                上一步
              </Button>
            )}
            {ButtonGroup && (
              <span style={{ marginRight: 8 }}>{ButtonGroup}</span>
            )}
            <Button
              style={{
                marginRight: 8
              }}
              onClick={this.cancelAddService}
            >
              取消
            </Button>
          </div>
        </Drawer>
      </div>
    );
  }
}
