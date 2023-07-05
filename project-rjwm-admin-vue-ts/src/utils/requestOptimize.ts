import md5 from 'md5';

//根据请求的地址，方式，参数，统一计算出当前请求的md5值作为key
const getRequestKey = (config) => {
    if (!config) {
        // 如果没有获取到请求的相关配置信息，根据时间戳生成
        return md5(+new Date());
    }

    const data = typeof config.data === 'string' ? config.data : JSON.stringify(config.data);
    // console.log(config,pending,config.url,md5(config.url + '&' + config.method + '&' + data),'config')
    return md5(config.url + '&' + config.method + '&' + data);
}

// 存储key值
const pending = {};
// 检查key值
const checkPending = (key) => !!pending[key];
// 删除key值
const removePending = (key) => {
    // console.log(key,'key')
    delete pending[key];
};

export {
    getRequestKey,
    pending,
    checkPending,
    removePending
}
