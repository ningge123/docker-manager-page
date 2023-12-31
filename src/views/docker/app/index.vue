<template>
  <div class="app-container">
    <el-table
      v-loading="listLoading"
      :data="list"
      element-loading-text="Loading"
      border
      fit
      highlight-current-row
    >
      <el-table-column align="center" label="ID" width="65">
        <template v-slot="scope">
          {{ scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column label="AppName" width="170">
        <template v-slot="scope">
          <el-button type="primary" link @click="openDetail(scope.row)">{{
            scope.row.Name
          }}</el-button>
        </template>
      </el-table-column>
      <el-table-column label="Image" width="270">
        <template v-slot="scope">
          {{ scope.row.Image }}
        </template>
      </el-table-column>
      <el-table-column label="MaxMemory" width="110">
        <template v-slot="scope">
          {{ formatSize(scope.row.Memory) }}
        </template>
      </el-table-column>
      <el-table-column label="Ports" width="270">
        <template v-slot="scope">
          <div v-for="item in scope.row.Ports" :key="item.key">
            {{ PortToStr(item) }}
          </div>
        </template>
      </el-table-column>
      <el-table-column label="Volumes" style="min-width: 150px">
        <template v-slot="scope">
          <div v-for="item in scope.row.Volumes" :key="item.key">
            {{ item }}
          </div>
        </template>
      </el-table-column>
      <el-table-column label="Env" align="center" width="170">
        <template v-slot="scope">
          <div v-for="item in scope.row.scope" :key="item.key">{{ item }}</div>
        </template>
      </el-table-column>
      <el-table-column :label="$t('操作')" align="center" width="170">
        <template v-slot="scope">
          <el-button
            :loading="listLoading"
            size="small"
            type="danger"
            link
            @click="delApp(scope.row)"
          >{{ $t('删除') }}</el-button>
          <el-button
            :loading="listLoading"
            size="small"
            type="primary"
            link
            @click="updateApp(scope.row)"
          >{{ $t('更新') }}</el-button>
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
      style="width: 500px; margin: 0 auto; margin-top: 10px"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
    <el-dialog v-model="dialogDetailVisible" title="详情">
      <pre style="text-indent: -2em;">
    {{ JSON.stringify(selectRow, null, 2) }}
          </pre>
    </el-dialog>
  </div>
</template>

<script>
import { getAppList, delApp, updateApp } from '@/api/app'
import { PortsToStr, FormatVolumes, formatSize } from '@/utils/docker'
import dockerStr from '@/locale/modules/en/docker'

export default {
  data() {
    return {
      list: [],
      page: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      },
      selectRow: {},
      dialogDetailVisible: false,
      listLoading: true
    }
  },
  created() {
    this.fetchData()
  },
  methods: {
    trans() {
      let zh = {}
      for (const k in dockerStr) {
        if (zh[k]) {
          console.log("trans.k:", k)
        }
        zh[k]=k
      }
      console.log("trans.zh:", zh)
    },
    fetchData() {
      this.trans()
      this.listLoading = true
      this.listQuery = {}
      this.listQuery.currentPage = this.page.currentPage
      this.listQuery.pageSize = this.page.pageSize
      getAppList(this.listQuery).then((r) => {
        this.list = r.data.list
        this.page = r.data.page
        this.listLoading = false
      })
    },
    handleSizeChange(val) {
      this.page.pageSize = val
      this.fetchData()
    },
    handleCurrentChange(val) {
      this.page.currentPage = val
      this.fetchData()
    },
    delApp(row) {
      const data = {
        Name: row.Name
      }
      this.listLoading = true
      delApp(data).then((r) => {
        this.$message(r.msg)
        this.listLoading = false
      })
    },
    updateApp(row) {
      const data = {
        Name: row.Name
      }
      this.listLoading = true
      updateApp(data).then((r) => {
        this.$message(r.msg)
        this.listLoading = false
      })
    },
    openDetail(row) {
      this.selectRow = row
      this.dialogDetailVisible = true
    },
    PortsToStr(ports) {
      return PortsToStr(ports)
    },
    PortToStr(p) {
      const pub = (p.IP ? p.IP : '') + (p.PublicPort ? ':' + p.PublicPort : '')
      return (pub ? pub + ' -> ' : '') + p.PrivatePort + '/' + p.Type
    },
    FormatVolumes(values) {
      return FormatVolumes(values)
    },
    formatSize(values) {
      return formatSize(values)
    }
  }
}
</script>
<style>

</style>
