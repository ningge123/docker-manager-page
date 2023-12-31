<template>
  <div class="app-container">
    <div class="filter-container">
      <el-select
        v-model="listQuery.ServerNames"
        multiple
        filterable
        :placeholder="$t('主机')"
        clearable
        collapse-tags
        class="filter-item"
        style="width: 300px"
      >
        <el-option
          v-for="item in res.serverNames"
          :key="item"
          :label="item"
          :value="item"
        />
      </el-select>
      <el-select
        v-model="listQuery.ContainerNames"
        multiple
        filterable
        :placeholder="$t('容器名称')"
        clearable
        collapse-tags
        class="filter-item"
        style="width: 300px; margin-left: 10px"
      >
        <el-option
          v-for="item in res.ContainerNames"
          :key="item"
          :label="item"
          :value="item"
        />
      </el-select>
      <el-select
        v-model="listQuery.state"
        placeholder="state"
        clearable
        filterable
        style="width: 140px; margin-left: 10px; margin-right: 10px"
        class="filter-item"
      >
        <el-option key="running" label="running" value="running" />
        <el-option key="exited" label="exited" value="exited" />
      </el-select>
      <el-button
        class="filter-item"
        type="primary"
        :icon="ElIconSearch"
        @click="fetchData"
      >
        Search
      </el-button>
    </div>

    <el-table
      v-loading="listLoading"
      :data="list.filter((r) => filterMatch(r))"
      :span-method="spanMethod"
      element-loading-text="Loading"
      border
      fit
      highlight-current-row
      style="margin-top: 20px"
    >
      <el-table-column align="center" label="ID" width="65">
        <template v-slot="scope">
          {{ scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column label="ServerName" width="170">
        <template v-slot="scope">
          {{ scope.row.ServerName }}
        </template>
      </el-table-column>
      <el-table-column label="Name">
        <template v-slot="scope">
          <el-button
            :title="scope.row.Name"
            type="primary"
            link
            @click="openDetail(scope.row)"
          >{{ scope.row.Name }}</el-button>
        </template>
        <template v-slot:header>
          Name
          <el-input
            v-model="filterSearch.Name"
            size="small"
            :placeholder="$t('输入关键字过滤')"
            style="width: 140px"
          />
        </template>
      </el-table-column>
      <el-table-column label="IMAGE" align="center">
        <template v-slot="scope">
          <span>{{ scope.row.Image }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Status" width="200" align="center">
        <template v-slot="scope">
          {{ scope.row.Status }}
        </template>
      </el-table-column>
      <el-table-column label="State" width="80" align="center">
        <template v-slot="scope">
          <span
            :style="{
              color: scope.row.State === 'running' ? '#03c961' : '#d70404',
            }"
          >{{ scope.row.State }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Ports" width="270" align="center">
        <template v-slot="scope">
          <div v-for="item in scope.row.Ports" :key="item.key">
            {{ PortToStr(item) }}
          </div>
        </template>
      </el-table-column>
      <el-table-column
        align="center"
        prop="created_at"
        label="Created"
        width="200"
      >
        <template v-slot="scope">
          <span>{{ formatDate(scope.row.Created) }}</span>
        </template>
      </el-table-column>
      <el-table-column
        class-name="status-col"
        :label="$t('操作')"
        width="170"
        align="center"
      >
        <template v-slot="scope">
          <el-button
              type="primary"
              link
            :loading="listLoading"
            :disabled="scope.row.State !== 'running'"
            @click="ContainerOperator('stop', scope.row)"
          >{{ $t('停止') }}</el-button>
          <el-button
              type="danger"
              link
            :loading="listLoading"
            @click="ContainerOperator('remove', scope.row)"
          >{{ $t('删除') }}</el-button>
          <el-button
              type="primary"
              link
            :loading="listLoading"
            @click="ContainerOperator('restart', scope.row)"
          >{{ $t('重启') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      :hide-on-single-page="true"
      :current-page="page.currentPage"
      :page-sizes="[10, 30, 50, 100, 200, 300, 400]"
      :page-size="page.pageSize"
      layout="prev, pager, next, jumper, sizes, total"
      :total="page.total"
      style="width: 500px; margin: 10px auto 0"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />

    <el-dialog v-model="dialogDetailVisible" :title="$t('详情')">
      <pre style="text-indent: -2em;">
    {{ JSON.stringify(selectRow, null, 2) }}
          </pre>
    </el-dialog>
  </div>
</template>

<script>
import { Search as ElIconSearch } from '@element-plus/icons-vue'
import {
  getContainer,
  getContainers,
  ContainerOperator,
  getContainerInfos
} from '@/api/container'
import { getServerNames } from '@/api/server'
import { formatDate } from '@/utils/index'
import { PortsToStr, FormatName } from '@/utils/docker'

export default {
  components: {
  },
  data() {
    return {
      list: [],
      page: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      },
      groupList: [],
      groups: {},
      listLoading: false,
      dialogDetailVisible: false,
      selectRow: {},
      filterSearch: {
        Name: ''
      },
      res: {
        serverNames: [],
        ContainerNames: [],
        containerInfos: []
      },
      listQuery: {
        ServerNames: [],
        ContainerNames: [],
        state: undefined
      },
      ElIconSearch
    }
  },
  computed: {},
  created() {
    this.fetchData()
    this.fetchContainerInfoData()
    this.fetchServerNames()
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
    ContainerOperator(operator, row) {
      this.listLoading = true
      const data = {
        ContainerId: row.ContainerId,
        ServerNames: [row.ServerName]
      }
      ContainerOperator(operator, data).then((resp) => {
        if (resp.code === '100200') {
          this.$message({
            message: this.$t('命令下发成功'),
            type: 'success'
          })
          // this.fetchData()
        } else {
          this.$message({
            message: resp.msg,
            type: 'warning'
          })
        }
        this.listLoading = false
      })
    },
    fetchServerNames() {
      this.listLoading = true
      getServerNames().then((resp) => {
        this.res.serverNames = resp.data
        this.listLoading = false
      })
    },
    fetchContainerInfoData() {
      this.loading = true
      getContainerInfos().then((resp) => {
        const d = resp.data
        this.res.ContainerNames = []
        for (const i in d) {
          for (const j in d[i].containers) {
            const name = d[i].containers[j].Name

            if (this.res.ContainerNames.indexOf(name) === -1) {
              this.res.ContainerNames.push(name)
            }
          }
        }
        this.loading = false
      })
    },
    fetchData() {
      this.listLoading = true
      this.listQuery.currentPage = this.page.currentPage
      this.listQuery.pageSize = this.page.pageSize
      getContainers(this.listQuery).then((r) => {
        this.list = r.data.list
        this.page = r.data.page
        if (!this.list) {
          this.list = []
        }
        this.list.sort(function(a, b) {
          return a.ServerName.localeCompare(b.ServerName)
        })
        this.groupList = new Set(this.list.map((o) => o.ServerName))
        this.groups = {}
        for (let i = 0; i < this.list.length; i++) {
          const item = this.list[i]
          let group = this.groups[item.ServerName]
          if (!group) {
            group = {
              ServerName: item.ServerName,
              Members: 0,
              StartIdx: i
            }
          }
          group.Members = group.Members + 1
          this.groups[item.ServerName] = group
        }
        this.listLoading = false
      })
    },
    spanMethod(data) {
      // 对于表格数据进行分组合并操作，UI组件回调函数
      const { row, rowIndex, columnIndex } = data
      if (columnIndex === 1) {
        // ServerName合并展示区
        const group = this.groups[row.ServerName]
        if (rowIndex === group.StartIdx) {
          // ServerName首位学生行
          return {
            rowspan: group.Members,
            colspan: 1
          }
        } else {
          return {
            rowspan: 0,
            colspan: 0
          }
        }
      } else {
        return {
          rowspan: 1,
          colspan: 1
        }
      }
    },
    handleSizeChange(val) {
      this.page.pageSize = val
      this.fetchData()
    },
    handleCurrentChange(val) {
      this.page.currentPage = val
      this.fetchData()
    },
    formatDate(d) {
      return formatDate(d)
    },
    PortsToStr(Ports) {
      return PortsToStr(Ports)
    },
    PortToStr(p) {
      const pub = (p.IP ? p.IP : '') + (p.PublicPort ? ':' + p.PublicPort : '')
      return (pub ? pub + ' -> ' : '') + p.PrivatePort + '/' + p.Type
    },
    FormatName(names) {
      return FormatName(names)
    },
    openDetail(row) {
      this.selectRow = row
      this.dialogDetailVisible = true
      const params = { ContainerId: row.ContainerId }
      getContainer(params).then((r) => {
        this.selectRow = r.data
      })
    },
    filterMatch(r) {
      return (
        !this.filterSearch.Name ||
        r.Name.toLowerCase().includes(this.filterSearch.Name.toLowerCase())
      )
    }
  }
}
</script>
