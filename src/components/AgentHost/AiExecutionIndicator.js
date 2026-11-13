import React, { PureComponent } from 'react';
import { Icon } from 'antd';
import styles from './index.less';

// Shape adapted from the user-supplied Uiverse example by andrew-manzyk.
const SPARK_PATH = 'M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z';
let nextIndicatorId = 0;

/** One persistent AI symbol: compositor motion while working, a quiet settled end state. */
export default class AiExecutionIndicator extends PureComponent {
  shapeId = `rainagent-spark-${++nextIndicatorId}`;
  state = { visible: true, pageVisible: true };
  animations = [];
  disposed = false;

  componentDidMount() {
    if (typeof window === 'undefined') return;
    if (typeof window.IntersectionObserver === 'function') {
      this.observer = new window.IntersectionObserver(entries => {
        if (this.disposed) return;
        const visible = entries.some(entry => entry.isIntersecting);
        if (!visible) this.cancelSettling();
        if (visible !== this.state.visible) this.setState({ visible });
      });
      this.observer.observe(this.element);
    }
    if (window.matchMedia) {
      this.motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (this.motionPreference.addEventListener) this.motionPreference.addEventListener('change', this.handleMotionPreference);
      else if (this.motionPreference.addListener) this.motionPreference.addListener(this.handleMotionPreference);
    }
    document.addEventListener('visibilitychange', this.handleVisibility);
    this.handleVisibility();
  }

  getSnapshotBeforeUpdate(previousProps) {
    if (previousProps.mode !== 'working' || this.props.mode === 'working' ||
      typeof window === 'undefined' || !this.element || !this.state.visible || !this.state.pageVisible ||
      (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return null;
    return Array.from(this.element.querySelectorAll('[data-ai-motion]')).map(element => {
      const style = window.getComputedStyle(element);
      return { element, transform: style.transform, opacity: style.opacity };
    });
  }

  componentDidUpdate(previousProps, previousState, snapshot) {
    if (previousProps.mode === this.props.mode) return;
    this.cancelSettling();
    if (!snapshot) return;
    // Start from the last rendered pose, rather than snapping to a loop boundary.
    const targets = snapshot.map(pose => {
      const style = window.getComputedStyle(pose.element);
      return { ...pose, targetTransform: style.transform, targetOpacity: style.opacity };
    });
    targets.forEach(pose => {
      if (typeof pose.element.animate !== 'function') return;
      this.animations.push(pose.element.animate([
        { transform: pose.transform, opacity: pose.opacity },
        { transform: pose.targetTransform, opacity: pose.targetOpacity },
      ], { duration: 280, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }));
    });
  }

  componentWillUnmount() {
    this.disposed = true;
    if (this.observer) this.observer.disconnect();
    if (this.motionPreference) {
      if (this.motionPreference.removeEventListener) this.motionPreference.removeEventListener('change', this.handleMotionPreference);
      else if (this.motionPreference.removeListener) this.motionPreference.removeListener(this.handleMotionPreference);
    }
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', this.handleVisibility);
    this.cancelSettling();
  }

  handleVisibility = () => {
    if (this.disposed) return;
    const pageVisible = !document.hidden;
    if (!pageVisible) this.cancelSettling();
    if (pageVisible !== this.state.pageVisible) this.setState({ pageVisible });
  };

  handleMotionPreference = event => {
    if (event.matches) this.cancelSettling();
  };

  cancelSettling = () => {
    this.animations.forEach(animation => animation.cancel());
    this.animations = [];
  };

  renderParticle = (name, className) => (
    <span key={name} className={`${styles.aiSparkParticle} ${className}`}>
      <span className={styles.aiSparkDriftX} data-ai-motion="x">
        <span className={styles.aiSparkDriftY} data-ai-motion="y">
          <span className={styles.aiSparkBreathe} data-ai-motion="breathe">
            <svg viewBox="0 0 100 100" focusable="false"><use href={`#${this.shapeId}`} xlinkHref={`#${this.shapeId}`} /></svg>
          </span>
        </span>
      </span>
    </span>
  );

  render() {
    const { mode, showCompleted } = this.props;
    const paused = !this.state.visible || !this.state.pageVisible;
    const className = [styles.aiExecutionIndicator,
      mode === 'working' ? styles.aiExecutionWorking : styles.aiExecutionSettled,
      showCompleted ? styles.aiExecutionDone : '', paused ? styles.aiExecutionPaused : '',
    ].filter(Boolean).join(' ');
    return <span className={className} aria-hidden="true" ref={element => { this.element = element; }}>
      <svg className={styles.aiSparkDefinitions} width="0" height="0" focusable="false">
        <defs>
          <linearGradient id={`${this.shapeId}-light`} x1="0" y1="0" x2="1" y2="1">
            <stop className={styles.aiSparkHighlight} offset="0" stopOpacity="0.32" />
            <stop className={styles.aiSparkHighlight} offset="0.55" stopOpacity="0" />
            <stop className={styles.aiSparkShade} offset="1" stopOpacity="0.06" />
          </linearGradient>
          <symbol id={this.shapeId} viewBox="0 0 100 100">
            <path d={SPARK_PATH} fill="currentColor" />
            <path d={SPARK_PATH} fill={`url(#${this.shapeId}-light)`} />
          </symbol>
        </defs>
      </svg>
      {this.renderParticle('main', styles.aiSparkMain)}
      {this.renderParticle('side', styles.aiSparkSide)}
      {this.renderParticle('small', styles.aiSparkSmall)}
      <span className={styles.aiExecutionCheck}><Icon type="check" /></span>
    </span>;
  }
}
