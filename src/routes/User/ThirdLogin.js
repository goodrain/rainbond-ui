import React, { Component } from "react";
import { connect } from "dva";
import { Link, routerRedux } from "dva/router";

@connect(({ loading, global }) => ({}))
export default class ThirdLogin extends Component {
  constructor(props) {
    super(props);
  }
  componentDidMount() {
    let id = this.GetUrlParam("id");
    let service_id = this.GetUrlParam("service_id");
    // this.props.dispatch({
    //   type: "user/fetchThirdInfo",
    //   payload: {
    //     id,
    //     service_id
    //   },
    //   callback: res => {
    //     console.log("resa", res);
    //   }
    // });
    // if (id && service_id) {
      this.props.dispatch(
        routerRedux.push(`/user/login?id=${id}&service_id=${service_id}`)
      );
      // this.props.dispatch(
      //   routerRedux.push(`/user/login?id=${id}&service_id=${service_id}`)
      // );
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
