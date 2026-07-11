<template>
  <div class="advanced-features-container">
    <a-card title="高级功能测试" class="test-card">
      <a-tabs v-model:activeKey="activeTab" type="card">
        <!-- 对话记忆 -->
        <a-tab-pane key="memory" tab="对话记忆">
          <MemoryTest />
        </a-tab-pane>

        <!-- Graph 工作流 -->
        <a-tab-pane key="graph" tab="Graph 工作流">
          <GraphTest />
        </a-tab-pane>

        <!-- RAG -->
        <a-tab-pane key="rag" tab="RAG 检索">
          <RagTest />
        </a-tab-pane>

        <!-- MCP -->
        <a-tab-pane key="mcp" tab="MCP 工具">
          <McpTest />
        </a-tab-pane>

        <!-- 多模态 -->
        <a-tab-pane key="multimodal" tab="多模态">
          <MultimodalTest />
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MemoryTest from '@/components/advanced/MemoryTest.vue'
import GraphTest from '@/components/advanced/GraphTest.vue'
import RagTest from '@/components/advanced/RagTest.vue'
import McpTest from '@/components/advanced/McpTest.vue'
import MultimodalTest from '@/components/advanced/MultimodalTest.vue'

const activeTab = ref('memory')
</script>

<style scoped>
.advanced-features-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.test-card {
  min-height: 600px;
}
</style>

