import rainbondUtil from '@/utils/rainbond';
import {
  Avatar,
  Dropdown,
  Icon,
  Layout,
  notification,
  Spin
} from 'antd';
import { connect } from 'dva';
import { setLocale, FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import ScrollerX from '../ScrollerX';
import userIcon from '../../../public/images/default_Avatar.png';
import defaultLogo from '../../../public/logo-icon.png';
import ChangePassword from '../ChangePassword';
import ProductServiceDrawer from '../ProductServiceDrawer';
import styles from './index.less';
import cookie from '../../utils/cookie';
import globalUtil from '../../utils/global';

const { Header } = Layout;

// SVG 图标常量
const SVG_ICONS = {
  // 视图切换器图标 - 平台管理
  platformActive: () => (
    <svg viewBox="0 0 1024 1024" width="16" height="16">
      <path d="M940 596l-76-57.6c0.8-8 1.6-16.8 1.6-26.4s-0.8-18.4-1.6-26.4l76-57.6c20.8-16 26.4-44 12.8-68l-84.8-143.2c-9.6-16.8-28-27.2-47.2-27.2-6.4 0-12 0.8-18.4 3.2L712 228c-15.2-10.4-31.2-19.2-47.2-26.4l-13.6-92c-4-26.4-26.4-45.6-53.6-45.6H426.4c-27.2 0-49.6 19.2-53.6 44.8L360 201.6c-16 7.2-31.2 16-47.2 26.4l-90.4-35.2c-6.4-2.4-12.8-3.2-19.2-3.2-19.2 0-37.6 9.6-46.4 26.4L71.2 360c-13.6 22.4-8 52 12.8 68l76 57.6c-0.8 9.6-1.6 18.4-1.6 26.4s0 16.8 1.6 26.4l-76 57.6c-20.8 16-26.4 44-12.8 68l84.8 143.2c9.6 16.8 28 27.2 47.2 27.2 6.4 0 12-0.8 18.4-3.2L312 796c15.2 10.4 31.2 19.2 47.2 26.4l13.6 92c3.2 25.6 26.4 45.6 53.6 45.6h171.2c27.2 0 49.6-19.2 53.6-44.8l13.6-92.8c16-7.2 31.2-16 47.2-26.4l90.4 35.2c6.4 2.4 12.8 3.2 19.2 3.2 19.2 0 37.6-9.6 46.4-26.4l85.6-144.8c12.8-23.2 7.2-51.2-13.6-67.2zM704 512c0 105.6-86.4 192-192 192S320 617.6 320 512s86.4-192 192-192 192 86.4 192 192z" fill="currentColor" />
    </svg>
  ),
  platformInactive: () => (
    <svg viewBox="0 0 1024 1024" width="16" height="16">
      <path d="M588.8 128l12 83.2 4.8 34.4 31.2 14.4c12.8 6.4 26.4 13.6 38.4 21.6l28 18.4 31.2-12 81.6-32 76 127.2-67.2 51.2-28 21.6 3.2 35.2c0.8 7.2 0.8 14.4 0.8 20.8s0 13.6-0.8 20.8l-3.2 35.2 28 21.6 67.2 51.2-75.2 127.2-82.4-32-31.2-12-28 18.4c-12.8 8.8-25.6 16-38.4 21.6l-31.2 14.4-4.8 33.6-12 84H435.2l-12-83.2-4.8-34.4-31.2-14.4c-12.8-6.4-26.4-13.6-38.4-21.6l-28-18.4-31.2 12L208 768l-76-127.2 67.2-51.2 28-21.6-3.2-35.2c-0.8-7.2-0.8-14.4-0.8-20.8s0-13.6 0.8-20.8l3.2-35.2-28-21.6-67.2-51.2L207.2 256l82.4 32 31.2 12 28-18.4c12.8-8.8 25.6-16 38.4-21.6l31.2-14.4 4.8-33.6L435.2 128h153.6m8.8-64H426.4c-27.2 0-49.6 19.2-53.6 44.8L360 201.6c-16 7.2-31.2 16-47.2 26.4l-90.4-35.2c-6.4-2.4-12.8-3.2-19.2-3.2-19.2 0-37.6 9.6-46.4 26.4L71.2 360c-13.6 22.4-8 52 12.8 68l76 57.6c-0.8 9.6-1.6 18.4-1.6 26.4s0 16.8 1.6 26.4l-76 57.6c-20.8 16-26.4 44-12.8 68l84.8 143.2c9.6 16.8 28 27.2 47.2 27.2 6.4 0 12-0.8 18.4-3.2L312 796c15.2 10.4 31.2 19.2 47.2 26.4l13.6 92c3.2 25.6 26.4 45.6 53.6 45.6h171.2c27.2 0 49.6-19.2 53.6-44.8l13.6-92.8c16-7.2 31.2-16 47.2-26.4l90.4 35.2c6.4 2.4 12.8 3.2 19.2 3.2 19.2 0 37.6-9.6 46.4-26.4l85.6-144.8c12.8-23.2 7.2-51.2-13.6-67.2l-76-57.6c0.8-8 1.6-16.8 1.6-26.4 0-9.6-0.8-18.4-1.6-26.4l76-57.6c20.8-16 26.4-44 12.8-68l-84.8-143.2c-9.6-16.8-28-27.2-47.2-27.2-6.4 0-12 0.8-18.4 3.2L712 228c-15.2-10.4-31.2-19.2-47.2-26.4l-13.6-92c-4-26.4-26.4-45.6-53.6-45.6zM512 384c70.4 0 128 57.6 128 128s-57.6 128-128 128-128-57.6-128-128 57.6-128 128-128m0-64c-105.6 0-192 86.4-192 192s86.4 192 192 192 192-86.4 192-192-86.4-192-192-192z" fill="currentColor" />
    </svg>
  ),
  // 视图切换器图标 - 工作空间
  workspaceActive: () => (
    <svg viewBox="0 0 1024 1024" width="16" height="16">
      <path d="M896 256v32L512 416 128 288v-32l384-128 384 128zM512 480L224 384l-96 32v32l384 128 384-128v-32l-96-32-288 96z m0 160L224 544l-96 32v32l384 128 384-128v-32l-96-32-288 96z m0 160L224 704l-96 32v32l384 128 384-128v-32l-96-32-288 96z" fill="currentColor" />
    </svg>
  ),
  workspaceInactive: () => (
    <svg viewBox="0 0 1024 1024" width="16" height="16">
      <path d="M512 195.2L741.6 272 512 348.8 282.4 272 512 195.2m0-67.2L128 256v32l384 128 384-128v-32L512 128z m0 389.6l-320-104h-64v32l384 128 384-128v-32h-64l-320 104zM512 680L192 576h-64v32l384 128 384-128v-32h-64L512 680z m0 160L192 736h-64v32l384 128 384-128v-32h-64l-320 104z" fill="currentColor" />
    </svg>
  ),
  // 视图切换器图标 - 探索
  exploreActive: () => (
    <svg viewBox="0 0 1024 1024" width="16" height="16">
      <path d="M464 480H144c-8.8 0-16-7.2-16-16V144c0-8.8 7.2-16 16-16h320c8.8 0 16 7.2 16 16v320c0 8.8-7.2 16-16 16z m16 400V560c0-8.8-7.2-16-16-16H144c-8.8 0-16 7.2-16 16v320c0 8.8 7.2 16 16 16h320c8.8 0 16-7.2 16-16z m352-688H608v224h224V192m48-64c8.8 0 16 7.2 16 16v320c0 8.8-7.2 16-16 16H560c-8.8 0-16-7.2-16-16V144c0-8.8 7.2-16 16-16h320z m16 752V560c0-8.8-7.2-16-16-16H560c-8.8 0-16 7.2-16 16v320c0 8.8 7.2 16 16 16h320c8.8 0 16-7.2 16-16z" fill="currentColor" />
    </svg>
  ),
  exploreInactive: () => (
    <svg viewBox="0 0 1024 1024" width="16" height="16">
      <path d="M416 192v224H192V192h224m48-64H144c-8.8 0-16 7.2-16 16v320c0 8.8 7.2 16 16 16h320c8.8 0 16-7.2 16-16V144c0-8.8-7.2-16-16-16z m-48 480v224H192V608h224m48-64H144c-8.8 0-16 7.2-16 16v320c0 8.8 7.2 16 16 16h320c8.8 0 16-7.2 16-16V560c0-8.8-7.2-16-16-16z m368-352v224H608V192h224m48-64H560c-8.8 0-16 7.2-16 16v320c0 8.8 7.2 16 16 16h320c8.8 0 16-7.2 16-16V144c0-8.8-7.2-16-16-16z m-48 480v224H608V608h224m48-64H560c-8.8 0-16 7.2-16 16v320c0 8.8 7.2 16 16 16h320c8.8 0 16-7.2 16-16V560c0-8.8-7.2-16-16-16z" fill="currentColor" />
    </svg>
  ),
  user: () => (
    <svg viewBox="0 0 1024 1024" width="16" height="16">
      <path d="M515.8912 547.2256c-89.088 0-161.5872-72.4992-161.5872-161.5872s72.4992-161.5872 161.5872-161.5872 161.5872 72.4992 161.5872 161.5872-72.448 161.5872-161.5872 161.5872z m0-261.7856c-55.2448 0-100.1472 44.9536-100.1472 100.1472s44.9536 100.1472 100.1472 100.1472 100.1472-44.9536 100.1472-100.1472-44.9024-100.1472-100.1472-100.1472z" fill="#666666" />
      <path d="M756.224 788.1216H271.7696c-16.9472 0-30.72-13.7728-30.72-30.72 0-150.528 122.4704-272.9472 272.9472-272.9472s272.9472 122.4704 272.9472 272.9472c0 16.9472-13.7216 30.72-30.72 30.72z m-451.4816-61.44h418.56c-14.8992-102.144-103.0656-180.7872-209.3056-180.7872s-194.3552 78.6432-209.2544 180.7872z" fill="#666666" />
      <path d="M820.48 956.16h-614.4c-73.4208 0-133.12-59.6992-133.12-133.12v-614.4c0-73.4208 59.6992-133.12 133.12-133.12h614.4c73.4208 0 133.12 59.6992 133.12 133.12v614.4c0 73.4208-59.7504 133.12-133.12 133.12z m-614.4-819.2c-39.5264 0-71.68 32.1536-71.68 71.68v614.4c0 39.5264 32.1536 71.68 71.68 71.68h614.4c39.5264 0 71.68-32.1536 71.68-71.68v-614.4c0-39.5264-32.1536-71.68-71.68-71.68h-614.4z" fill="#666666" />
    </svg>
  ),
  logout: () => (
    <svg width="15px" height="15px" viewBox="0 0 1024 1024">
      <path d="M1024 445.44 828.414771 625.665331l0-116.73472L506.88 508.930611l0-126.98112 321.53472 0 0-116.73472L1024 445.44zM690.174771 41.985331 100.34944 41.985331l314.37056 133.12 0 630.78528 275.45472 0L690.17472 551.93472l46.08 0 0 296.96L414.72 848.89472 414.72 1024 0 848.894771 0 0l736.25472 0 0 339.97056-46.08 0L690.17472 41.98528 690.174771 41.985331zM690.174771 41.985331" />
    </svg>
  ),
  bill: () => (
    <svg viewBox="0 0 1303 1024" width="16" height="16">
      <path d="M1164.939636 72.704H138.146909A116.363636 116.363636 0 0 0 21.876364 188.974545v711.58691c0 64.046545 52.130909 116.177455 116.084363 116.177454h1026.792728a116.363636 116.363636 0 0 0 116.177454-116.177454V188.974545A116.363636 116.363636 0 0 0 1164.939636 72.610909z m-1026.792727 84.712727h1026.792727c17.314909 0 31.464727 14.056727 31.464728 31.464728v101.748363H106.589091V188.881455c0-17.408 14.149818-31.557818 31.464727-31.557819z m1026.792727 774.516364H138.146909a31.557818 31.557818 0 0 1-31.557818-31.464727V362.868364h1089.815273v537.6a31.557818 31.557818 0 0 1-31.464728 31.557818z m-81.268363-399.080727H851.968a42.542545 42.542545 0 0 1-42.356364-42.356364c0-23.272727 19.083636-42.449455 42.356364-42.449455h231.796364a42.542545 42.542545 0 0 1 0 84.712728z" fill="#333333" />
    </svg>
  ),
  language: () => (
    <svg viewBox="0 0 1024 1024" width="20" height="20">
      <path
        d="M364.16 259.776a361.408 361.408 0 0 1-73.024 124.16 385.664 385.664 0 0 1-80.64-124.16H364.16z m128.576 0v-51.968H297.856l38.528-12.16c-5.376-18.368-18.816-47.104-30.464-67.84l-56.896 16.64c10.304 19.84 20.16 44.928 25.088 63.36H85.056v51.968h70.336c24.192 63.232 55.104 116.992 95.424 161.408-46.592 36.288-104.384 61.888-174.272 79.36 10.752 12.096 26.432 37.184 32.256 49.728 72.128-20.608 132.16-50.176 181.44-90.56 47.04 39.488 104.832 69.12 175.168 87.872 8.064-14.72 23.744-38.08 35.84-49.728-66.752-15.68-123.2-41.728-169.344-77.568 38.976-43.52 69.44-96 92.288-160.512h68.544zM693.76 739.84l11.264-41.472a2728.96 2728.96 0 0 0 32.256-123.904h2.048c11.264 40.96 21.504 84.48 33.28 123.904l11.264 41.472H693.76zM826.88 896h79.36l-121.856-378.88h-89.088L573.952 896h76.8l26.624-97.28h122.88L826.88 896zM768 160H576a32 32 0 0 0 0 64h192q13.248 0 22.656 9.344 9.344 9.408 9.344 22.656v192a32 32 0 0 0 64 0V256q0-39.744-28.16-67.84-28.096-28.16-67.84-28.16zM192 928q-39.744 0-67.84-28.16-28.16-28.096-28.16-67.84v-192a32 32 0 0 1 64 0v192q0 13.248 9.344 22.656 9.408 9.344 22.656 9.344h192a32 32 0 0 1 0 64H192z"
        fill="#333"
      />
    </svg>
  ),
  help: () => (
    <svg viewBox="0 0 1024 1024" width="16" height="16">
      <path d="M659.6 64c-61.2 0-117 37.7-147.7 99.2C481.1 101.7 425.4 64 364.1 64H64v717.8l1.5 26.8h299.9c121.3 0 123.2 139.5 123.2 145.6v5.5H535v-5.6c0-6 1.9-145.5 124.4-145.5h300.3V64H659.6z m-549.1 54.3h253.8c69.8 0 124.4 63.8 124.4 145.3v548c-30.1-38.1-71.5-57.4-123.2-57.4h-255V118.3z m549.1 0h253.8v636H659.6c-52.3 0-94.1 19.4-124.4 57.8V263.7c0-81.6 54.7-145.4 124.4-145.4z m0 0" fill="#666666" />
      <path d="M574.9 931.6l-2.1 5.1 42 23.3 2.1-5.1c14.7-36.4 46.5-59.9 81-59.9H960v-54.3H697.9c-52.4-0.1-100.6 35.6-123 90.9z m-248.1-91H64v54.3h262.8c34.4 0 66.2 23.5 81 59.9l2 5 42-23.3-2-5.1c-22.4-55.1-70.7-90.8-123-90.8z m0 0M148.5 281.2h280v55h-280zM148.5 427.7h280v55h-280zM148.5 574.2h280v55h-280zM595.5 281.2h280v55h-280zM595.5 427.7h280v55h-280zM595.5 574.2h280v55h-280z" fill="#666666" />
    </svg>
  ),
  customerService: () => (
    <svg viewBox="0 0 1024 1024" width="16" height="16">
      <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z" fill="#333" />
      <path d="M464 336a48 48 0 1 0 96 0 48 48 0 1 0-96 0zm72 112h-48c-4.4 0-8 3.6-8 8v272c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V456c0-4.4-3.6-8-8-8z" fill="#333" />
    </svg>
  ),
  menu: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M2 4h16M2 10h16M2 16h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
};

class GlobalHeader extends PureComponent {
  constructor(props) {
    super(props);
    const { enterprise, currentUser } = this.props;
    const teamName = globalUtil.getCurrTeamName();
    const regionName = globalUtil.getCurrRegionName();
    const eid = enterprise?.enterprise_id;
    this.state = {
      showChangePassword: false,
      language: cookie.get('language') === 'zh-CN',
      showBill: false,
      isTeamView: this.checkIsTeamView(),
      balance: null,
      balanceStatus: '',
      showProductDrawer: false,
      // 视图切换器状态
      isTeamViewForSwitcher: !!(teamName && regionName),
      isAdmin: !!(currentUser?.is_enterprise_admin && eid),
      // 滑块位置
      sliderStyle: { left: 3, width: 0 }
    };
    // 选项 refs
    this.switcherRefs = [
      React.createRef(),
      React.createRef(),
      React.createRef()
    ];
    // 防抖定时器
    this.sliderDebounceTimer = null;
    // 记录上次激活的索引
    this.lastActiveIndex = null;
  }

  componentDidMount() {
    this.initializeComponent();
    this.initializeLanguage();
    this.updateSliderPosition();
  }

  componentWillUnmount() {
    // 清除防抖定时器
    if (this.sliderDebounceTimer) {
      clearTimeout(this.sliderDebounceTimer);
    }
  }

  componentDidUpdate(prevProps) {
    const newIsTeamView = this.checkIsTeamView();
    if (this.state.isTeamView !== newIsTeamView) {
      this.setState({ isTeamView: newIsTeamView });
    }

    // 更新视图切换器状态
    const { currentUser, enterprise } = this.props;
    const { isAdmin } = this.state;
    const eid = enterprise?.enterprise_id;
    const newIsAdmin = !!(currentUser?.is_enterprise_admin && eid);

    // 只在从 false 变为 true 时更新一次，避免后续闪烁
    if (!isAdmin && newIsAdmin) {
      this.setState({ isAdmin: newIsAdmin });
    }

    // 更新 isTeamViewForSwitcher
    const teamName = globalUtil.getCurrTeamName();
    const regionName = globalUtil.getCurrRegionName();
    const newIsTeamViewForSwitcher = !!(teamName && regionName);
    if (this.state.isTeamViewForSwitcher !== newIsTeamViewForSwitcher) {
      this.setState({ isTeamViewForSwitcher: newIsTeamViewForSwitcher });
    }

    // 更新滑块位置
    this.updateSliderPosition();
  }

  /**
   * 检查是否在团队视图
   */
  checkIsTeamView = () => {
    const currentTeam = globalUtil.getCurrTeamName();
    const currentRegion = globalUtil.getCurrRegionName();
    return currentTeam !== '' && currentRegion !== '';
  };

  /**
   * 获取当前激活的视图索引
   */
  getActiveViewIndex = () => {
    const currentPath = window.location.hash || window.location.pathname;
    if (currentPath.includes('/team/')) return 0;
    if (currentPath.includes('/explore/')) return 1;
    if (currentPath.includes('/enterprise/')) return 2;
    return 0; // 默认工作空间
  };

  /**
   * 更新滑块位置（带防抖）
   */
  updateSliderPosition = () => {
    // 清除之前的定时器
    if (this.sliderDebounceTimer) {
      clearTimeout(this.sliderDebounceTimer);
    }

    this.sliderDebounceTimer = setTimeout(() => {
      const activeIndex = this.getActiveViewIndex();

      // 如果激活索引没变，不更新
      if (this.lastActiveIndex === activeIndex) {
        return;
      }

      const activeRef = this.switcherRefs[activeIndex];

      if (activeRef?.current) {
        const { offsetLeft, offsetWidth } = activeRef.current;
        this.lastActiveIndex = activeIndex;
        this.setState({
          sliderStyle: {
            left: offsetLeft,
            width: offsetWidth
          }
        });
      }
    }, 100);
  };

  /**
   * 获取当前团队和区域信息
   */
  getCurrentTeamAndRegion = () => {
    const { currentUser } = this.props;
    const regionName = globalUtil.getCurrRegionName() || currentUser?.teams?.[0]?.region?.[0]?.team_region_name;
    const teamName = globalUtil.getCurrTeamName() || currentUser?.teams?.[0]?.team_name;
    return { regionName, teamName };
  };

  /**
   * 初始化组件数据
   */
  initializeComponent = () => {
    const { currentUser } = this.props;
    const eid = globalUtil.getCurrEnterpriseId() || currentUser?.enterprise_id;
    const { regionName } = this.getCurrentTeamAndRegion();

    if (regionName) {
      this.fetchPipePipeline(eid, regionName);
    }
  };

  /**
   * 初始化语言设置
   */
  initializeLanguage = () => {
    if (!cookie.get('language')) {
      const browserLang = navigator.systemLanguage || navigator.language;
      const isZh = browserLang.toLowerCase().includes('zh') || !browserLang.toLowerCase().includes('en');
      const language = isZh ? 'zh-CN' : 'en-US';
      cookie.set('language', language);
      setLocale(language);
      this.setState({ language: isZh });
    }
  };

  /**
   * 获取插件 URL 列表
   */
  fetchPipePipeline = (eid, regionName) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'teamControl/fetchPluginUrl',
      payload: {
        enterprise_id: eid,
        region_name: regionName
      },
      callback: (res) => {
        if (res?.list?.some(item => item.name === 'rainbond-bill')) {
          this.setState({ showBill: true }, () => {
            this.fetchBalance();
          });
        }
      }
    });
  };

  /**
   * 获取账户余额
   */
  fetchBalance = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/getUserBalance',
      payload: {},
      callback: (res) => {
        this.setState({
          balance: res?.response_data?.balance / 1000000,
          balanceStatus: res?.response_data?.status
        });
      }
    });
  };

  /**
   * 获取用户默认导航路径
   */
  getLoginRole = (currUser) => {
    const { teams } = currUser || {};
    if (teams && teams.length > 0) {
      const { team_name, region } = teams[0];
      const { team_region_name } = region?.[0] || {};
      if (team_name && team_region_name) {
        return `/team/${globalUtil.getCurrTeamName() || team_name}/region/${globalUtil.getCurrRegionName() || team_region_name}/index`;
      }
    }
    if (currUser?.is_enterprise_admin) {
      return `/enterprise/${currUser?.enterprise_id}/index`;
    }
    return '/';
  };

  /**
   * Logo 点击跳转
   */
  onLogoClick = () => {
    const { dispatch, currentUser } = this.props;
    const link = this.getLoginRole(currentUser);
    dispatch(routerRedux.replace(link));
  };

  /**
   * 菜单点击处理
   */
  handleMenuClick = ({ key }) => {
    const { dispatch, rainbondInfo } = this.props;
    const { language } = this.state;

    switch (key) {
      case 'userCenter':
        dispatch(routerRedux.push('/account/center/personal'));
        break;
      case 'bill':
        this.handleBalanceBill();
        break;
      case 'helpDocs':
        this.handleHelpDocs();
        break;
      case 'customerService':
        this.handleCustomerService();
        break;
      case 'language':
        this.handleMenuCN(language ? 'en-US' : 'zh-CN');
        break;
      case 'logout':
        window.sessionStorage.removeItem('Pipeline');
        dispatch({ type: 'user/logout' });
        break;
      default:
        break;
    }
  };

  /**
   * 门户导航处理
   */
  handlePortalNavigation = (key) => {
    const { rainbondInfo } = this.props;
    const portalSite = rainbondInfo?.portal_site;
    const token = cookie.get('token');

    if (portalSite && token) {
      const url = `${portalSite}?token=${token}&redirect=${key}`;
      window.location.href = url;
    }
  };

  /**
   * 语言切换
   */
  handleMenuCN = (val) => {
    cookie.set('language', val);
    setLocale(val, true);
    this.setState({ language: val === 'zh-CN' });
  };

  /**
   * 显示修改密码弹窗
   */
  showChangePass = () => {
    this.setState({ showChangePassword: true });
  };

  /**
   * 取消修改密码
   */
  cancelChangePass = () => {
    this.setState({ showChangePassword: false });
  };

  /**
   * 修改密码
   */
  handleChangePass = (vals) => {
    this.props.dispatch({
      type: 'user/changePass',
      payload: vals,
      callback: () => {
        notification.success({
          message: formatMessage({ id: 'GlobalHeader.success' })
        });
      }
    });
  };

  /**
   * 跳转到账单页面
   */
  handleBalanceBill = () => {
    const { dispatch, rainbondInfo } = this.props;
    const { regionName, teamName } = this.getCurrentTeamAndRegion();
    const portalSite = rainbondInfo?.portal_site;

    if (portalSite) {
      this.handlePortalNavigation('account-center');
    } else {
      dispatch(routerRedux.push(`/team/${teamName}/region/${regionName}/plugins/rainbond-bill`));
    }
  };

  /**
   * 打开帮助文档
   */
  handleHelpDocs = () => {
    const { rainbondInfo } = this.props;
    const { language } = this.state;
    const docsUrl = (rainbondInfo?.document?.enable &&
      `${rainbondInfo?.document?.value?.platform_url}${language ? 'docs/tutorial/via-rainbond-deploy-sourceandmiddleware' : 'en/docs/tutorial/via-rainbond-deploy-sourceandmiddleware'}`) ||
      (language ? 'https://www.rainbond.com/docs/' : 'https://www.rainbond.com/en/docs/');
    window.open(docsUrl, '_blank');
  };

  /**
   * 显示客服信息
   */
  handleCustomerService = () => {
    const { rainbondInfo } = this.props;
    const customerServiceQrcode = rainbondInfo?.customer_service_qrcode?.value || '';

    notification.info({
      message: formatMessage({ id: 'CustomerFloat.wechat', defaultMessage: '联系客服' }),
      description: (
        <div style={{ textAlign: 'center' }}>
          {customerServiceQrcode ? (
            <img
              style={{ width: '120px', height: '120px' }}
              src={customerServiceQrcode}
              alt="客服"
            />
          ) : (
            <div style={{
              width: '120px',
              height: '120px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f5f5f5',
              borderRadius: '4px'
            }}>
              <Icon type="qrcode" style={{ fontSize: 36, color: '#ccc' }} />
            </div>
          )}
          <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#666' }}>
            {formatMessage({ id: 'CustomerFloat.wechat_desc', defaultMessage: '扫码联系客服' })}
          </p>
        </div>
      ),
      duration: 0
    });
  };

  /**
   * 切换产品抽屉
   */
  toggleProductDrawer = () => {
    this.setState({ showProductDrawer: !this.state.showProductDrawer });
  };

  /**
   * 关闭产品抽屉
   */
  closeProductDrawer = () => {
    this.setState({ showProductDrawer: false });
  };

  /**
   * 切换到工作空间
   */
  handleSwitchToWorkspace = () => {
    const { dispatch, currentUser } = this.props;
    const teamName = globalUtil.getCurrTeamName() || currentUser?.teams?.[0]?.team_name;
    const regionName = globalUtil.getCurrRegionName() || currentUser?.teams?.[0]?.region?.[0]?.team_region_name;

    console.log('切换到工作空间:', { teamName, regionName, currentUser });

    if (teamName && regionName) {
      const path = `/team/${teamName}/region/${regionName}/index`;
      console.log('导航到:', path);
      dispatch(routerRedux.push(path));
    } else {
      console.error('无法切换到工作空间: 缺少 teamName 或 regionName');
    }
  };

  /**
   * 切换到平台管理
   */
  handleSwitchToPlatform = () => {
    const { dispatch, currentUser } = this.props;
    const eid = currentUser?.enterprise_id;

    console.log('切换到平台管理:', { eid, currentUser });

    if (eid) {
      const path = `/enterprise/${eid}/index`;
      console.log('导航到:', path);
      dispatch(routerRedux.push(path));
    } else {
      console.error('无法切换到平台管理: 缺少 enterprise_id');
    }
  };

  /**
   * 切换到探索视图
   */
  handleSwitchToExplore = () => {
    const { dispatch, currentUser } = this.props;
    const eid = currentUser?.enterprise_id;

    if (eid) {
      const path = `/explore/${eid}/index`;
      dispatch(routerRedux.push(path));
    }
  };

  /**
   * 渲染视图切换器
   */
  renderViewSwitcher = () => {
    const { sliderStyle } = this.state;
    // 直接基于 URL 判断当前视图（支持 hash 路由）
    const currentPath = window.location.hash || window.location.pathname;
    const isExplore = currentPath.includes('/explore/');
    const isTeam = currentPath.includes('/team/');
    const isPlatform = currentPath.includes('/enterprise/');

    return (
      <div className={styles.viewSwitcher}>
        <div className={styles.switcherInner}>
          <div
            ref={this.switcherRefs[0]}
            className={`${styles.switcherItem} ${isTeam ? styles.active : ''}`}
            onClick={this.handleSwitchToWorkspace}
          >
            <Icon
              component={isTeam ? SVG_ICONS.workspaceActive : SVG_ICONS.workspaceInactive}
              className={styles.switcherIcon}
            />
            <span className={styles.switcherText}>
              {formatMessage({ id: 'menu.switcher.workspace', defaultMessage: '工作空间' })}
            </span>
          </div>
          <div
            ref={this.switcherRefs[1]}
            className={`${styles.switcherItem} ${isExplore ? styles.active : ''}`}
            onClick={this.handleSwitchToExplore}
          >
            <Icon
              component={isExplore ? SVG_ICONS.exploreActive : SVG_ICONS.exploreInactive}
              className={styles.switcherIcon}
            />
            <span className={styles.switcherText}>
              {formatMessage({ id: 'menu.switcher.appmarket', defaultMessage: '应用市场' })}
            </span>
          </div>
          <div
            ref={this.switcherRefs[2]}
            className={`${styles.switcherItem} ${isPlatform ? styles.active : ''}`}
            onClick={this.handleSwitchToPlatform}
          >
            <Icon
              component={isPlatform ? SVG_ICONS.platformActive : SVG_ICONS.platformInactive}
              className={styles.switcherIcon}
            />
            <span className={styles.switcherText}>
              {formatMessage({ id: 'menu.switcher.platform', defaultMessage: '平台管理' })}
            </span>
          </div>
          <div
            className={styles.switcherSlider}
            style={{
              left: sliderStyle.left,
              width: sliderStyle.width
            }}
          />
        </div>
      </div>
    );
  };

  /**
   * 渲染用户菜单
   */
  renderUserMenu = () => {
    const { rainbondInfo, currentUser } = this.props;
    const { language, showBill } = this.state;
    const platformUrl = rainbondUtil.documentPlatform_url(rainbondInfo);

    return (
      <div className={styles.userDropdown}>
        {/* 用户信息头部 */}
        <div className={styles.userHeader}>
          <Avatar
            size={40}
            className={styles.userAvatar}
            src={currentUser?.logo || userIcon}
          >
            {currentUser?.nick_name?.charAt(0) || currentUser?.user_name?.charAt(0)}
          </Avatar>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{currentUser?.nick_name || currentUser?.user_name}</div>
            <div className={styles.userEmail}>{currentUser?.email || ''}</div>
          </div>
        </div>

        {/* 菜单项 */}
        <div className={styles.menuList}>
          <div className={styles.menuItem} onClick={() => this.handleMenuClick({ key: 'userCenter' })}>
            <Icon component={SVG_ICONS.user} className={styles.menuIcon} />
            <span className={styles.menuText}>
              <FormattedMessage id="GlobalHeader.core" />
            </span>
          </div>

          {showBill && (
            <div className={styles.menuItem} onClick={() => this.handleMenuClick({ key: 'bill' })}>
              <Icon component={SVG_ICONS.bill} className={styles.menuIcon} />
              <span className={styles.menuText}>
                <FormattedMessage id="GlobalHeader.account" />
              </span>
            </div>
          )}

          {platformUrl && (
            <div className={styles.menuItem} onClick={() => this.handleMenuClick({ key: 'helpDocs' })}>
              <Icon component={SVG_ICONS.help} className={styles.menuIcon} />
              <span className={styles.menuText}>
                <FormattedMessage id="GlobalHeader.help" />
              </span>
            </div>
          )}

          {showBill && (
            <div className={styles.menuItem} onClick={() => this.handleMenuClick({ key: 'customerService' })}>
              <Icon component={SVG_ICONS.customerService} className={styles.menuIcon} />
              <span className={styles.menuText}>
                <FormattedMessage id="CustomerFloat.wechat" defaultMessage="联系客服" />
              </span>
            </div>
          )}

          <div className={styles.menuItemLanguage} onClick={() => this.handleMenuClick({ key: 'language' })}>
            <Icon component={SVG_ICONS.language} className={styles.menuIcon} />
            <span className={styles.menuText}>
              <FormattedMessage id="GlobalHeader.language" defaultMessage="语言" />
            </span>
            <span className={styles.languageValue}>{language ? '中文' : 'English'}</span>
            <Icon type="right" className={styles.menuArrow} />
          </div>
        </div>

        {/* 退出登录 - 独立区域 */}
        {!rainbondUtil.logoutEnable(rainbondInfo) && (
          <div className={styles.menuFooter}>
            <div className={styles.menuItemLogout} onClick={() => this.handleMenuClick({ key: 'logout' })}>
              <Icon component={SVG_ICONS.logout} className={styles.menuIcon} />
              <span className={styles.menuText}>
                <FormattedMessage id="GlobalHeader.exit" />
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  render() {
    const {
      currentUser,
      customHeader,
      rainbondInfo,
      collapsed,
      logo,
      enterprise
    } = this.props;
    const {
      language,
      isTeamView,
      showBill,
      balance,
      balanceStatus,
      showChangePassword,
      showProductDrawer
    } = this.state;

    // 获取 Logo
    const fetchLogo = logo || rainbondUtil.fetchLogo(rainbondInfo, enterprise) || defaultLogo;

    if (!currentUser) {
      return null;
    }

    const portalSite = rainbondInfo?.portal_site;
    const showFullLogo = !isTeamView || !collapsed;
    const showAppMarket = rainbondUtil.isShowAppMarket(rainbondInfo);

    return (
      <ScrollerX sm={900}>
        <Header className={styles.header}>
          <div className={styles.left}>
            {showBill && portalSite && (
              <div
                className={styles.productIcon}
                onClick={this.toggleProductDrawer}
              >
                <Icon component={SVG_ICONS.menu} />
              </div>
            )}
            <div
              className={`${styles.logoWrapper} ${isTeamView && collapsed ? styles.logoCollapsed : ''} ${!isTeamView ? styles.logoEnterprise : ''}`}
              onClick={this.onLogoClick}
            >
              <img src={fetchLogo} alt="logo" />
              {showFullLogo && (
                <span className={styles.enterpriseName}>
                  {(rainbondInfo?.title?.enable && rainbondInfo?.title?.value) || 'Rainbond'}
                </span>
              )}
            </div>
            {customHeader && customHeader()}
          </div>

          {/* 中间：视图切换器 */}
          <div className={styles.center}>
            {this.renderViewSwitcher()}
          </div>

          <div className={styles.right}>
            {showAppMarket && showBill && (
              <a
                className={styles.platform}
                style={{ color: '#333', fontSize: '14px', fontWeight: '600' }}
                href="https://hub.grapps.cn/marketplace"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon type="shop" style={{ fontSize: 16, marginRight: 6 }} />
                <FormattedMessage id="GlobalHeader.market" />
              </a>
            )}

            <div className={styles.iconContainer}>
              {showBill && balance != null && (
                <div
                  onClick={this.handleBalanceBill}
                  className={styles.balance}
                  style={{ color: balanceStatus !== 'NORMAL' ? '#f50' : '#333' }}
                >
                  <div className={styles.balanceTitle}>
                    {formatMessage({ id: 'GlobalHeader.balance' })}
                  </div>
                  <div className={styles.balanceNum}>¥{balance.toFixed(2)}</div>
                </div>
              )}

              {currentUser ? (
                <Dropdown overlay={this.renderUserMenu()} placement="bottomRight">
                  <span className={`${styles.action} ${styles.account}`}>
                    <Avatar
                      size="default"
                      className={styles.avatar}
                      src={currentUser?.logo || userIcon}
                    />
                  </span>
                </Dropdown>
              ) : (
                <Spin size="small" style={{ marginLeft: 8 }} />
              )}
            </div>
          </div>

          {showChangePassword && (
            <ChangePassword
              onOk={this.handleChangePass}
              onCancel={this.cancelChangePass}
            />
          )}

          <ProductServiceDrawer
            visible={showProductDrawer}
            onClose={this.closeProductDrawer}
          />
        </Header>
      </ScrollerX>
    );
  }
}

export default connect(({ user, global }) => ({
  rainbondInfo: global.rainbondInfo,
  currentUser: user.currentUser,
  enterprise: global.enterprise,
  collapsed: global.collapsed
}))(GlobalHeader);
