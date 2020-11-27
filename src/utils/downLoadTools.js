const openDownloadDialog = (url, fileName) => {
  if (typeof url === 'object' && url instanceof Blob) {
    url = URL.createObjectURL(url); // 创建blob地址
  }
  const aLink = document.createElement('a');
  aLink.href = url;
  aLink.download = fileName;
  aLink.click();
};
export default {
  /**
   * 保存CSV文件
   * @params content csv文件内容
   * @params fileName 保存的文件名
   */
  saveTXT: (content, fileName) => {
    const blob = new Blob(['\ufeff' + content], {
      type: 'text/tet,charset=UTF-8'
    });
    openDownloadDialog(blob, `${fileName}.txt`);
  }
};
