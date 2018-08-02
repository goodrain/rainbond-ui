import React from "react";

export default class PublicLogin extends React.Component {
  componentWillMount() {
    const href = `https://sso.goodrain.com/#/login/${encodeURIComponent(location.href)}`;
    location.href = href;
  }
  componentDidMount() {}
  render() {
    return null;
  }
}
