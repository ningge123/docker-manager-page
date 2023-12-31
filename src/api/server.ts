import request from '@/utils/system/request'

export function getServerList(params:any) {
  return request({
    url: '/mgr/server/list',
    method: 'get',
    params
  })
}

export function getServerNames(params:any) {
  return request({
    url: '/mgr/server/names',
    method: 'get',
    params
  })
}

export function getServer(params:any) {
  return request({
    url: '/mgr/server/detail',
    method: 'get',
    params
  })
}

export function deleteServer(data) {
  return request({
    url: '/mgr/server/delete',
    method: 'post',
    data
  })
}
