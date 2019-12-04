import React, { Component } from "react";
import { connect } from "dva";
import { Link, routerRedux } from "dva/router";
import rainbondUtil from "../../utils/rainbond";
import globalUtil from "../../utils/global";
import { notification, message } from "antd";
import cookie from "../../utils/cookie";
import Result from "../../components/Result";
@connect(({ loading, global }) => ({
  rainbondInfo: global.rainbondInfo
}))
export default class ThirdLogin extends Component {
  constructor(props) {
    super(props);
    this.state = {
      resultState: "ing",
      title: "第三方认证中...",
      desc: "此过程可能比较耗时，请耐心等待"
    };
  }
  componentWillMount() {
    let code = rainbondUtil.OauthParameter("code");
    let service_id = rainbondUtil.OauthParameter("service_id");

    const { dispatch } = this.props;
    if (code && service_id) {
      //有账号 未认证 is_authenticated
      let teamName = cookie.get("region_name");
      let regionName = cookie.get("team");
      let token = cookie.get("token");

      if (teamName && regionName && token) {
        dispatch({
          type: "user/fetchThirdLoginBinding",
          payload: {
            code,
            service_id
          },
          callback: resdata => {
            if (resdata && resdata.status && resdata.status === 400) {
              this.setState(
                {
                  resultState: "error",
                  title: "第三方认证未通过",
                  desc: "认证失败,请重新认证"
                },
                () => {
                  dispatch(
                    routerRedux.push(
                      `/team/${teamName}/region/${regionName}/create/code/${service_id}`
                    )
                  );
                }
              );
            } else if (resdata && resdata._code === 200) {
              this.setState(
                {
                  resultState: "success",
                  title: "第三方认证通过",
                  desc: ""
                },
                () => {
                  dispatch(
                    routerRedux.push(
                      `/team/${teamName}/region/${regionName}/create/code/${service_id}`
                    )
                  );
                }
              );
            }
          }
        });
        return null;
      }

      //获取第三方用户信息
      dispatch({
        type: "user/fetchThirdCertification",
        payload: {
          code,
          service_id
        },
        callback: res => {
          if (res && res.status && res.status === 400) {
            this.setState(
              {
                resultState: "error",
                title: "第三方认证未通过",
                desc: "未成功获取access_token,请重新认证。"
              },
              () => {

                // notification.warning({ message: "未成功获取access_token" });
                dispatch(routerRedux.push(`/user/login`));
              }
            );
          } else if (res && res._code === 200) {
            const { rainbondInfo } = this.props;
            const data = res.data.bean;

            if (data && data.token) {
              cookie.set("token", data.token);
              dispatch(routerRedux.push(`/`));
              window.location.reload();
              return null;
            }

            if (data && data.result) {
              //未绑定
              if (!data.result.is_authenticated) {
                dispatch(
                  routerRedux.push(
                    `/user/third/register?code=${data.result.code}&service_id=${
                      data.result.service_id
                    }&oauth_user_id=${data.result.oauth_user_id}&oauth_type=${
                      data.result.oauth_type
                    }`
                  )
                );
              } else {
                dispatch(
                  routerRedux.push(
                    `/user/third/login?code=${data.result.code}&service_id=${
                      data.result.service_id
                    }&oauth_user_id=${data.result.oauth_user_id}&oauth_type=${
                      data.result.oauth_type
                    }`
                  )
                );
              }
            }

            // if (!res.is_authenticated && !is_link) {
            //   this.props.dispatch(
            //     routerRedux.push(
            //       `/user/third/register?code=${code}&service_id=${service_id}`
            //     )
            //   );
            // }
            // //认证过期
            // else if (!is_expired) {
            //   this.props.dispatch({
            //     type: "user/fetchCertificationThird",
            //     payload: {
            //       code,
            //       service_id
            //     },
            //     callback: res => {
            //       if (res) {
            //         this.props.dispatch(
            //           routerRedux.push(
            //             `/user/third/login?code=${code}&service_id=${service_id}`
            //           )
            //         );
            //       }
            //     }
            //   });
            // } else {
            //   this.props.dispatch(
            //     routerRedux.push(
            //       `/user/third/login?code=${code}&service_id=${service_id}`
            //     )
            //   );
            // }
          }
        }
      });
    }
  }

  render() {
    const { resultState, title, desc } = this.state;
    return (
      <Result
        type={resultState}
        title={title}
        description={desc}
        style={{
          marginTop: "20%",
          marginBottom: 16
        }}
      />
    );
  }
}
