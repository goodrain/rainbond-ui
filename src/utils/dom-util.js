const domUtil = {
  prependChild(parent, child) {
    
    if (parent.hasChildNodes()) {
      parent.appendChild(child, parent.firstChild);
    } else {
      parent.appendChild(child);
    }
  },
};
export default domUtil;
