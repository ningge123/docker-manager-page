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
      <el-table-column align="center" label="ID" width="95">
        <template v-slot="scope">
          {{ scope.row.Id }}
        </template>
      </el-table-column>
      <el-table-column :label="$t('命令')" width="230">
        <template v-slot="scope">
          {{ scope.row.Ch }}
        </template>
      </el-table-column>
      <el-table-column label="serverName" width="170" align="center">
        <template v-slot="scope">
          <span>{{ scope.row.ServerName }}</span>
        </template>
      </el-table-column>
      <el-table-column label="TaskId" width="300" align="center">
        <template v-slot="scope">
          {{ scope.row.TaskId }}
        </template>
      </el-table-column>
      <el-table-column :label="$t('信息')" align="center">
        <template v-slot="scope">
          {{ scope.row.Msg }}
        </template>
      </el-table-column>
      <el-table-column
        align="center"
        prop="created_at"
        :label="$t('发布时间')"
        width="200"
      >
        <template v-slot="scope">
          <span> {{ formatDate(scope.row.Ts) }}</span>
        </template>
      </el-table-column>

      <el-table-column :label="$t('状态')" width="100" align="center">
        <template v-slot="scope">
          <span v-if="scope.row.Code === '000000'" style="color: #4573fa">{{
            $t('正在进行')
          }}</span>
          <span v-if="scope.row.Code === '100100'" style="color: #d70404">{{
            $t('失败')
          }}</span>
          <span v-if="scope.row.Code === '100200'" style="color: #03c961">{{
            $t('成功')
          }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('操作')" align="center" width="170">
        <template v-slot="scope">
          <el-button
            :loading="listLoading"
            size="small"
            type="danger"
            link
            @click="del(scope.row)"
          >{{ $t('删除') }}</el-button>
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
  </div>
</template>

<script>
import { getTasks, delTask } from '@/api/task'
import { formatDate } from '@/utils/index'

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
      listLoading: true
    }
  },
  created() {
    this.fetchData()
  },
  methods: {
    fetchData() {
      this.listLoading = true
      this.listQuery = {}
      this.listQuery.currentPage = this.page.currentPage
      this.listQuery.pageSize = this.page.pageSize
      getTasks(this.listQuery).then((r) => {
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
    formatDate(d) {
      return formatDate(d)
    },
    del(row) {
      this.listLoading = true
      delTask({ id: row.Id }).then((r) => {
        this.listLoading = false
        this.$message(this.$t('成功'))
        this.fetchData()
      })
    }
  }
}
</script>
