<template>
  <div class="graph-test">
    <a-space direction="vertical" style="width: 100%" :size="16">
      <a-card title="Graph 工作流测试">
        <a-space direction="vertical" style="width: 100%" :size="12">
          <a-input
            v-model:value="inputMessage"
            placeholder="输入消息"
            :style="{ width: '100%' }"
          />
          <a-space>
            <a-button type="primary" @click="executeGraph" :loading="loading">
              执行简单 Graph
            </a-button>
            <a-button @click="executeParallel" :loading="loading">
              执行并行 Graph
            </a-button>
            <a-button @click="streamGraph" :loading="streaming">
              流式执行
            </a-button>
          </a-space>

          <a-card v-if="result" title="执行结果" size="small">
            <pre>{{ JSON.stringify(result, null, 2) }}</pre>
          </a-card>

          <a-card v-if="streamResult" title="流式结果" size="small">
            <div class="stream-content">{{ streamResult }}</div>
          </a-card>
        </a-space>
      </a-card>
    </a-space>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { graphApi } from '@/api/graph'

const loading = ref(false)
const streaming = ref(false)
const inputMessage = ref('')
const result = ref<any>(null)
const streamResult = ref('')

const executeGraph = async () => {
  if (!inputMessage.value) {
    message.warning('请输入消息')
    return
  }
  loading.value = true
  try {
    const res = await graphApi.execute({ message: inputMessage.value })
    result.value = res.data
    message.success('执行成功')
  } catch (error: any) {
    message.error('执行失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const executeParallel = async () => {
  if (!inputMessage.value) {
    message.warning('请输入消息')
    return
  }
  loading.value = true
  try {
    const res = await graphApi.executeParallel({ message: inputMessage.value })
    result.value = res.data
    message.success('执行成功')
  } catch (error: any) {
    message.error('执行失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const streamGraph = () => {
  if (!inputMessage.value) {
    message.warning('请输入消息')
    return
  }
  streaming.value = true
  streamResult.value = ''
  
  graphApi.stream(
    { message: inputMessage.value },
    (chunk: string) => {
      streamResult.value += chunk
    },
    () => {
      streaming.value = false
      message.success('流式执行完成')
    },
    (error: string) => {
      streaming.value = false
      message.error('流式执行失败: ' + error)
    }
  )
}
</script>

<style scoped>
.graph-test {
  padding: 16px;
}

.stream-content {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>

