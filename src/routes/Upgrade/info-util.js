const statusMap = {
    '1': '未升级',
    '2': '升级中',
    '3': '已升级',
    '4': '回滚中',
    '5': '已回滚',
    '6': '部分升级',
    '7': '部分回滚',
    '8': '升级失败',
    '9': '回滚失败',
}

const util = {
    getStatusCN: (status) => {
        return statusMap[status] || '-'
    },
}
export default util