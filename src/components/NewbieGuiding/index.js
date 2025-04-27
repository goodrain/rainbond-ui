/* eslint-disable no-nested-ternary */
import { Icon } from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import globalUtil from '../../utils/global';
import rainbondUtil from '../../utils/rainbond';
import styles from './index.less';

@connect(({ global }) => ({
  enterprise: global.enterprise,
  novices: global.novices
}))
class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      isEffect: true,
      isEnableNewbieGuide: rainbondUtil.isEnableNewbieGuide(
        this.props.enterprise
      )
    };
  }
  componentDidMount() {
    this.handleIsEffect();
  }

  putNewbieGuideConfig = configName => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/putNewbieGuideConfig',
      payload: {
        arr: [{ key: configName, value: true }]
      }
    });
  };
  handleIsEffect = () => {
    setTimeout(() => {
      this.setState({
        isEffect: false
      });
    }, 2000);
  };

  render() {
    const {
      tit,
      desc,
      configName = '',
      isCoverScreen = true,
      showSvg = true,
      showArrow = false,
      isSkip = false,
      isSuccess = false,
      prevStep = false,
      handleNext,
      handlePrev,
      handleClose,
      nextStep = 2,
      current,
      totals = 1,
      btnText,
      send = true,
      progress = false,
      svgPosition = {},
      conPosition = {},
      novices
    } = this.props;
    const ClickSvg = globalUtil.fetchSvg('ClickSvg');
    const interval = 42 / totals;
    const setCurrent = current || (nextStep && nextStep - 1) || 1;
    const setWidth =
      setCurrent === 1 ? 0 : setCurrent === totals ? 42 : setCurrent * interval;
    const { isEffect, isEnableNewbieGuide } = this.state;

    const isNext = rainbondUtil.handleNewbie(novices, configName);
    return isNext ? (
      <Fragment>
        {isCoverScreen && <div className={styles.coverScreen} />}
        {showSvg && (
          <div className={styles.clickSvg} style={svgPosition}>
            <div className={isEffect && styles.clickEffect}>{ClickSvg}</div>
          </div>
        )}
        <div id={styles.driverPopoverItem} style={conPosition}>
          {showArrow && <Icon type="caret-up" className={styles.caretUp} />}
          <Icon
            type="close"
            className={styles.closeSvg}
            onClick={() => {
              if (handleClose) {
                handleClose();
                if (configName) {
                  this.putNewbieGuideConfig(configName);
                }
              }
            }}
          />
          <div className={styles.driverPopoverTitle}>{tit}</div>
          <div className={styles.driverPopoverDescription}>{desc}</div>
          <div className={styles.driverPopoverFooter}>
            {progress && (
              <div className={styles.step}>
                <p className={styles.stepco} />
                <p
                  className={styles.stepdo}
                  style={{
                    width: setWidth
                  }}
                />
                <p>
                  {setCurrent}/{totals}
                </p>
              </div>
            )}
            {isSkip && <button className={styles.driverCloseBtn}><FormattedMessage id='applicationMarket.NewbieGuiding.skip'/></button>}
            <span className={styles.driverBtnGroup}>
              {prevStep && (
                <button
                  onClick={() => {
                    if (handlePrev) {
                      handlePrev();
                    }
                  }}
                  className={styles.driverPrevBtn}
                >
                  <FormattedMessage id='applicationMarket.NewbieGuiding.previous_step'/>
                </button>
              )}
              <button
                onClick={() => {
                  if (handleNext) {
                    handleNext();
                    if (configName && send) {
                      this.putNewbieGuideConfig(configName);
                    }
                  }
                }}
                className={styles.driverNextBtn}
              >
                {btnText || (isSuccess ? <FormattedMessage id='applicationMarket.NewbieGuiding.complete'/> : <FormattedMessage id='applicationMarket.NewbieGuiding.next_step'/>)}
              </button>
            </span>
          </div>
        </div>
      </Fragment>
    ) : (
      <Fragment />
    );
  }
}

export default Index;
