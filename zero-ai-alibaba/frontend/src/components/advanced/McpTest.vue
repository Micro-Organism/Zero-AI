<template>
  <div class="mcp-test">
    <a-space direction="vertical" style="width: 100%" :size="16">
      <a-card title="MCP 工具列表">
        <a-button @click="loadTools" :loading="loading">刷新工具列表</a-button>
        <a-list
          v-if="tools.length > 0"
          :data-source="tools"
          :loading="loading"
          style="margin-top: 16px"
        >
          <template #renderItem="{ item }">
            <a-list-item>
              <a-list-item-meta>
                <template #title>{{ item.name }}</template>
                <template #description>{{ item.description }}</template>
              </a-list-item-meta>
              <template #actions>
                <a-button size="small" @click="callTool(item.name)">调用</a-button>
              </template>
            </a-list-item>
          </template>
        </a-list>
      </a-card>

      <a-card title="工具调用">
        <a-space direction="vertical" style="width: 100%" :size="12">
          <a-select
            v-model:value="selectedTool"
            placeholder="选择工具"
            :style="{ width: '100%' }"
            @change="onToolChange"
          >
            <a-select-option v-for="tool in tools" :key="tool.name" :value="tool.name">
              {{ tool.name }} - {{ tool.description }}
            </a-select-option>
          </a-select>

          <a-input
            v-if="selectedTool === 'get_weather'"
            v-model:value="toolParams.location"
            placeholder="输入城市名称"
          />

          <a-space>
            <a-button type="primary" @click="callSelectedTool" :loading="loading">
              调用工具
            </a-button>
            <a-button @click="streamCall" :loading="streaming">
              流式调用
            </a-button>
          </a-space>

          <a-card v-if="callResult" title="调用结果" size="small">
            <pre>{{ JSON.stringify(callResult, null, 2) }}</pre>
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
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { mcpApi } from '@/api/mcp'

const loading = ref(false)
const streaming = ref(false)
const tools = ref<any[]>([])
const selectedTool = ref('')
const toolParams = ref<any>({})
const callResult = ref<any>(null)
const streamResult = ref('')

const loadTools = async () => {
  loading.value = true
  try {
    const res = await mcpApi.getTools()
    tools.value = res.data.tools || []
    message.success('获取工具列表成功')
  } catch (error: any) {
    message.error('获取工具列表失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const onToolChange = () => {
  toolParams.value = {}
  callResult.value = null
  streamResult.value = ''
}

const callSelectedTool = async () => {
  if (!selectedTool.value) {
    message.warning('请选择工具')
    return
  }
  loading.value = true
  try {
    const res = await mcpApi.callTool({
      toolName: selectedTool.value,
      params: toolParams.value
    })
    callResult.value = res.data
    message.success('调用成功')
  } catch (error: any) {
    message.error('调用失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const streamCall = () => {
  if (!selectedTool.value) {
    message.warning('请选择工具')
    return
  }
  streaming.value = true
  streamResult.value = ''
  
  mcpApi.streamCall(
    {
      toolName: selectedTool.value,
      params: toolParams.value
    },
    (chunk: string) => {
      streamResult.value += chunk
    },
    () => {
      streaming.value = false
      message.success('流式调用完成')
    },
    (error: string) => {
      streaming.value = false
      message.error('流式调用失败: ' + error)
    }
  )
}

onMounted(() => {
  loadTools()
})
</script>

<style scoped>
.mcp-test {
  padding: 16px;
}

.stream-content {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>

