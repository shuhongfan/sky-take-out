import request from '@/utils/request'
  // 获取列表数据
  export const getInformData = (params: any) => {
    return request({
      url: '/messages/page',
      method: 'get',
      params,
    },)
  }
  // 获取未读
  export const getCountUnread = () => {
    return request({
      url: '/messages/countUnread',
      method: 'get'
    },)
  }
  // 全部已读
  export const batchMsg = (data: any) => {
    return request({
      url: '/messages/batch',
      method: 'put',
      data
    })
  }
    // 标记已读
    export const setStatus = (params: any) => {
      return request({
        url: `/messages/${params}`,
        method: 'PUT'
      })
    }