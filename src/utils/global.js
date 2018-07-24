const global = {
  getCurrTeamName() {
    const reg = /team\/([^\/]+)/;
    const hash = location.hash || '';
    const match = hash.match(reg);
    if (match) {
      return match[1];
    }
    return '';
  },
  getCurrRegionName() {
    const reg = /region\/([^\/]+)/;
    const hash = location.hash || '';
    const match = hash.match(reg);
    if (match) {
      return match[1];
    }
    return '';
  },
  replaceUrlTeam(team) {
    let href = location.href;
    const reg = /team\/([^/]+)/;
    href = href.replace(reg, (string, g1) => string.replace(new RegExp(g1), team));
    return href;
  },
  replaceUrlRegion(region) {
    let href = location.href;
    const reg = /region\/([^/]+)/;
    href = href.replace(reg, (string, g1) => string.replace(new RegExp(g1), region));
    return href;
  },
  replaceUrlTeamAndTegion(team, region) {
    let href = location.href;
    const reg = /team\/([^/]+)\/region\/([^/]+)/;
    href = href.replace(reg, (string, g1, g2) =>
      string.replace(new RegExp(g1), team).replace(new RegExp(g2), region));
    return href;
  },
};

export default global;
