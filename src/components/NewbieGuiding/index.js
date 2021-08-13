/* eslint-disable no-nested-ternary */
import React, { PureComponent } from 'react';
import globalUtil from '../../utils/global';
import styles from './index.less';

class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      isEffect: true
    };
  }
  componentDidMount() {
    this.handleIsEffect();
  }
  handleIsEffect = () => {
    setTimeout(() => {
      this.setState({
        isEffect: false
      });
    }, 2000);
  };

  render() {
    const {
      title,
      desc,
      isCoverScreen = true,
      isSkip = false,
      isSuccess = false,
      isPrevBtn = true,
      handleNext,
      handlePrev,
      current = 1,
      totals = 1,
      svgPosition = {},
      conPosition = {}
    } = this.props;
    const ClickSvg = globalUtil.fetchSvg('ClickSvg');
    const interval = 42 / totals;
    const setWidth =
      current === 1 ? 0 : current === totals ? 42 : current * interval;
    const { isEffect } = this.state;

    return (
      <div>
        {isCoverScreen && <div className={styles.coverScreen} />}
        <div className={styles.clickSvg} style={svgPosition}>
          <div className={isEffect && styles.clickEffect}>{ClickSvg}</div>
        </div>
        <div id={styles.driverPopoverItem} style={conPosition}>
          <div className={styles.driverPopoverTitle}>{title}</div>
          <div className={styles.driverPopoverDescription}>{desc}</div>
          <div className={styles.driverPopoverFooter}>
            <div className={styles.step}>
              <p className={styles.stepco} />
              <p
                className={styles.stepdo}
                style={{
                  width: setWidth
                }}
              />
              <p>
                {current}/{totals}
              </p>
            </div>
            {isSkip && <button className={styles.driverCloseBtn}>跳过</button>}
            <span className={styles.driverBtnGroup}>
              {isPrevBtn && (
                <button
                  onClick={() => {
                    if (handlePrev) {
                      handlePrev();
                    }
                  }}
                  className={styles.driverPrevBtn}
                >
                  上一步
                </button>
              )}
              <button
                onClick={() => {
                  if (handleNext) {
                    handleNext();
                  }
                }}
                className={styles.driverNextBtn}
              >
                {isSuccess ? '完成' : '下一步'}
              </button>
            </span>
          </div>
        </div>
      </div>
    );
  }
}

export default Index;
