

import { connect } from 'dva';
import React, { PureComponent } from "react";

// @connect(({ global }) => ({ rainbondInfo: global.rainbondInfo }))



// class GlobalHeader extends PureComponent {
//   constructor(props) {
//     super(props);
// console.log('state',props)
//   }
// }
const configureGlobal = {
  documentAddress2048: "http://code.goodrain.com/demo/2048.git",
  rainbondDocumentAddress: "https://www.rainbond.com/",
  documentAddress: "https://github.com/",
  newbieGuideShow: true,
  rainbondTextShow: true,
};
export default configureGlobal;
