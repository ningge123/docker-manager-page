<template>
  <div class="app-container">
    <el-cascader
      v-model="form.containerId"
      :disabled="isConnected"
      filterable
      :placeholder="$t('目标容器')"
      clearable
      :options="res.containerInfos"
      :props="{ expandTrigger: 'hover', emitPath: false }"
      style="width: 500px; margin-right: 10px"
    />

    <el-checkbox
      v-model="showSystemTime"
      style="margin-right: 10px"
    >{{ $t('显示日志系统时间') }}
    </el-checkbox>
    <el-button
      :loading="loading"
      class="filter-item"
      type="primary"
      :icon="ElIconSearch"
      :disabled="isConnected"
      @click="fetchLogData()"
    >
      {{ $t('连接日志') }}
    </el-button>
    <el-button
      :loading="loading"
      class="filter-item"
      type="primary"
      :disabled="!isConnected"
      @click="disconnectLog()"
    >
      {{ $t('断开日志') }}
    </el-button>
    <el-link :underline="false" />
    <div class="console">
      <div
        v-for="item in listLogs"
        id="log"
        :ref="getRefSetter('log')"
        :key="item"
      >
        <div>
          <span v-if="showSystemTime">{{ formatDate(item.ts) }} </span>
          {{ item.line }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Search as ElIconSearch } from '@element-plus/icons-vue'
import { getContainerInfos } from '@/api/container'
import { getLogStart, getLogClose } from '@/api/logs'
import { formatDate, WsHost } from '@/utils/index'

export default {
  data() {
    return {
      websock: null,
      listLogs: [],
      loading: true,
      showSystemTime: false,
      isConnected: false,
      res: {
        containerInfos: []
      },
      form: {
        containerId: ''
      },
      ElIconSearch
    }
  },
  created() {
    this.fetchData()
  },
  destroyed: function() {
    this.disconnectLog()
  },
  beforeUpdate() {
    this.$arrRefs && (this.$arrRefs = {})
  },
  methods: {
    statusFilter_filter(status) {
      const statusMap = {
        published: 'success',
        draft: 'gray',
        deleted: 'danger'
      }
      return statusMap[status]
    },
    fetchData() {
      this.loading = true
      getContainerInfos().then((response) => {
        this.res.containerInfos = response.data
        for (const i in this.res.containerInfos) {
          const tmp_server = this.res.containerInfos[i]
          tmp_server.children = tmp_server.containers
          tmp_server.label = tmp_server.serverName
          tmp_server.value = tmp_server.serverName

          for (const j in tmp_server.children) {
            const tmp_container = tmp_server.children[j]
            tmp_container.label =
              tmp_container.Name + ' - ' + tmp_container.State
            tmp_container.value = tmp_container.Id
            tmp_server.children[j] = tmp_container
          }
          this.res.containerInfos[i] = tmp_server
        }
        this.loading = false
      })
    },
    disconnectLog() {
      if (this.websock) {
        this.websock.close()
        getLogClose(this.form)
      }
    },
    fetchLogData() {
      if (!this.form.containerId) {
        this.$message(this.$t('必须选择容器'))
        return
      }

      this.loading = true
      this.listLogs = [{ ts: '', line: this.$t('正在连接...') }]
      console.log('fetchLogData', this.form)
      getLogStart(this.form)
        .then((resp) => {
          this.loading = false
          if (resp.code === '100200') {
            this.list = resp.data
            this.initWebSocket(this.form.containerId)
          } else {
            this.$message(resp.msg)
            this.listLogs.push({ ts: '', line: resp.msg })
          }
        })
        .catch((resp) => {
          this.loading = false
          console.log('logstart.error:', resp)
          this.$message(resp.msg)
          this.listLogs.push({ ts: '', line: resp.msg })
        })
    },
    initWebSocket() {
      // 初始化weosocket
      console.log('location.protocol:', location)
      const wsUri =
        WsHost() + '/dockerMgrApi/ws/log?containerId=' + this.form.containerId // ws地址
      this.websock = new WebSocket(wsUri)
      this.websock.onopen = this.websocketOnopen
      this.websock.onerror = this.websocketOnerror
      this.websock.onmessage = this.websocketOnmessage
      this.websock.onclose = this.websocketOnclose
    },
    websocketOnopen() {
      this.isConnected = true
      console.log('WebSocket连接成功')
      this.listLogs.push({ ts: '', line: this.$t('连接成功.') })
      const d = {
        ch: 'base.ht.ping'
      }
      this.websocketSend(JSON.stringify(d))
    },
    websocketOnerror(e) {
      // 错误
      this.isConnected = false
      console.log('WebSocket连接发生错误', e)
      this.listLogs.push({ ts: '', line: this.$t('连接发生错误.') })
    },
    websocketOnmessage(e) {
      // 数据接收
      const msg = JSON.parse(e.data)
      if (msg.ch === 'docker.container.log.line') {
        this.listLogs.push(msg.d)
        const div = this.$arrRefs.log
        div.scrollTop = div.scrollHeight
      }
    },
    websocketSend(agentData) {
      // 数据发送
      this.websock.send(agentData)
    },
    websocketOnclose(e) {
      // 关闭
      this.isConnected = false
      console.log('connection closed ', e)
      const d = { ts: '', line: this.$t('连接已关闭.') }
      this.listLogs.push(d)
    },
    formatDate(d) {
      return formatDate(d)
    },
    getRefSetter(refKey) {
      return (ref) => {
        !this.$arrRefs && (this.$arrRefs = {})
        !this.$arrRefs[refKey] && (this.$arrRefs[refKey] = [])
        ref && this.$arrRefs[refKey].push(ref)
      }
    }
  }
}
</script>

<style scoped>
.console {
  margin-top: 10px;
  min-height: 800px;
  height: 90%;
  padding: 10px;
  background: #2b2b2b;
  color: white;
}
</style>
