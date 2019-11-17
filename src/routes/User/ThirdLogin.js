import React, { Component } from "react";
import { connect } from "dva";
import { Link, routerRedux } from "dva/router";
import rainbondUtil from "../../utils/rainbond";
import globalUtil from "../../utils/global";

@connect(({ loading, global }) => ({
  rainbondInfo: global.rainbondInfo
}))
export default class ThirdLogin extends Component {
  constructor(props) {
    super(props);
  }
  componentDidMount() {
    let id = rainbondUtil.OauthParameter("id");
    let service_id = rainbondUtil.OauthParameter("service_id");
    if (id && service_id) {
      this.props.dispatch({
        type: "user/fetchThirdInfo",
        payload: {
          id,
          service_id
        },
        callback: res => {
          if (res) {
            const { rainbondInfo } = this.props;
            //未认证 is_authenticated
            let teamName = globalUtil.getCurrTeamName();
            let regionName = globalUtil.getCurrRegionName();
            if (teamName && regionName) {
              this.props.dispatch(
                routerRedux.push(
                  `/team/${teamName}/region/${regionName}/create/code`
                )
              );
            }
            if (!res.is_authenticated && !is_link) {
              this.props.dispatch(
                routerRedux.push(
                  `/user/register?id=${id}&service_id=${service_id}`
                )
              );
            }
            //认证过期
            else if (!is_expired) {
              this.props.dispatch({
                type: "user/fetchCertificationThird",
                payload: {
                  id,
                  service_id
                },
                callback: res => {
                  if (res) {
                    this.props.dispatch(
                      routerRedux.push(
                        `/user/login?id=${id}&service_id=${service_id}`
                      )
                    );
                  }
                }
              });
            } else {
              this.props.dispatch(
                routerRedux.push(
                  `/user/login?id=${id}&service_id=${service_id}`
                )
              );
            }
          }
          console.log("resa", res);
        }
      });
    }

    // if (id && service_id) {

    // }
  }

  GetUrlParam = paraName => {
    var url = document.location.toString();
    var arrObj = url.split("?");

    if (arrObj.length > 1) {
      var arrPara = arrObj[1].split("&");
      var arr;

      for (var i = 0; i < arrPara.length; i++) {
        arr = arrPara[i].split("=");

        if (arr != null && arr[0] == paraName) {
          return arr[1];
        }
      }
      return "";
    } else {
      return "";
    }
  };

  render() {
    return <div>1thirdLogin</div>;
  }
}
