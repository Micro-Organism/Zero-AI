<template>
  <div class="memory-test">
    <a-space direction="vertical" style="width: 100%" :size="16">
      <a-card title="记忆状态">
        <a-descriptions :column="2">
          <a-descriptions-item label="CheckPointer">可用</a-descriptions-item>
          <a-descriptions-item label="Redis">可用</a-descriptions-item>
          <a-descriptions-item label="线程数量">{{ status.threadCount || 0 }}</a-descriptions-item>
        </a-descriptions>
        <a-button @click="checkStatus" style="margin-top: 16px">刷新状态</a-button>
      </a-card>

      <a-card title="对话历史查询">
        <a-space direction="vertical" style="width: 100%" :size="12">
          <a-input
            v-model:value="threadId"
            placeholder="输入 Thread ID"
            :style="{ width: '100%' }"
          >
            <template #addonAfter>
              <a-button @click="loadHistory" :loading="loading">查询</a-button>
            </template>
          </a-input>

          <a-list
            v-if="history.length > 0"
            :data-source="history"
            :loading="loading"
          >
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta>
                  <template #title>Thread: {{ item.threadId }}</template>
                  <template #description>
                    <pre>{{ JSON.stringify(item, null, 2) }}</pre>
                  </template>
                </a-list-item-meta>
              </a-list-item>
            </template>
          </a-list>

          <a-empty v-else description="暂无历史记录" />
        </a-space>
      </a-card>

      <a-card title="线程管理">
        <a-space direction="vertical" style="width: 100%" :size="12">
          <a-button @click="loadThreads" :loading="loading">获取所有线程</a-button>
          <a-list
            v-if="threads.length > 0"
            :data-source="threads"
            :loading="loading"
          >
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta>
                  <template #title>{{ item }}</template>
                </a-list-item-meta>
                <template #actions>
                  <a-button danger size="small" @click="clearThread(item)">删除</a-button>
                </template>
              </a-list-item>
            </template>
          </a-list>
        </a-space>
      </a-card>
    </a-space>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { memoryApi } from '@/api/memory'

const loading = ref(false)
const status = ref<any>({})
const threadId = ref('')
const history = ref<any[]>([])
const threads = ref<string[]>([])

const checkStatus = async () => {
  try {
    const res = await memoryApi.getStatus()
    status.value = res.data
    message.success('状态更新成功')
  } catch (error: any) {
    message.error('获取状态失败: ' + error.message)
  }
}

const loadHistory = async () => {
  if (!threadId.value) {
    message.warning('请输入 Thread ID')
    return
  }
  loading.value = true
  try {
    const res = await memoryApi.getHistory(threadId.value)
    history.value = res.data
    message.success('查询成功')
  } catch (error: any) {
    message.error('查询失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const loadThreads = async () => {
  loading.value = true
  try {
    const res = await memoryApi.getThreads()
    threads.value = res.data
    message.success('获取线程列表成功')
  } catch (error: any) {
    message.error('获取线程列表失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const clearThread = async (tid: string) => {
  try {
    await memoryApi.clearHistory(tid)
    message.success('删除成功')
    loadThreads()
  } catch (error: any) {
    message.error('删除失败: ' + error.message)
  }
}

onMounted(() => {
  checkStatus()
})
</script>

<style scoped>
.memory-test {
  padding: 16px;
}
</style>

