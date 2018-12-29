

const openLinkUtil = {
    openLink(link) {
        const tempWindow = window.open("_blank");
        tempWindow.location = link;
    }
}
export default openLinkUtil;