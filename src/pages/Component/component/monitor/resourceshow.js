/* eslint-disable prettier/prettier */
/* eslint-disable array-callback-return */
/* eslint-disable prettier/prettier */
/* eslint-disable import/extensions */
/* eslint-disable react/sort-comp */
import RangeChart from "@/components/CustomChart/rangeChart";
import { Col, Row } from "antd";
import { connect } from "dva";
import React, { Fragment, PureComponent } from "react";
// eslint-disable-next-line react/no-multi-comp
@connect(({ user, appControl }) => ({
  currUser: user.currentUser,
  appDetail: appControl.appDetail
}))
export default class ResourceShow extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
    };
  }
  componentDidMount() {
  }
  componentWillUnmount() {}

  render() {
    const {appDetail, dispatch} = this.props
    return (
      <Fragment>
        <Row style={{padding: "-8px"}}>
          <Col span={12} style={{padding:'8px'}}>
            <RangeChart dispatch={dispatch} appDetail={appDetail} type="containerMem" />
          </Col>
          <Col span={12} style={{padding:'8px'}}>
            <RangeChart dispatch={dispatch} appDetail={appDetail} type="containerCpu" />
          </Col>
          <Col span={12} style={{padding:'8px'}}>
            <RangeChart dispatch={dispatch} appDetail={appDetail} type="containerNetR" />
          </Col>
          <Col span={12} style={{padding:'8px'}}>
            <RangeChart dispatch={dispatch} appDetail={appDetail} type="containerNetT" />
          </Col>
        </Row>
      </Fragment>
    );
  }
}
