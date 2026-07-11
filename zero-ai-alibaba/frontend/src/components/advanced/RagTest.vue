<template>
  <div class="rag-test">
    <a-space direction="vertical" style="width: 100%" :size="16">
      <a-card title="文档上传">
        <a-upload
          :before-upload="handleUpload"
          :show-upload-list="false"
        >
          <a-button>
            <template #icon>
              <UploadOutlined />
            </template>
            上传文档
          </a-button>
        </a-upload>
      </a-card>

      <a-card title="RAG 查询">
        <a-space direction="vertical" style="width: 100%" :size="12">
          <a-input
            v-model:value="query"
            placeholder="输入查询问题"
            :style="{ width: '100%' }"
          />
          <a-input-number
            v-model:value="topK"
            :min="1"
            :max="10"
            placeholder="Top K"
          />
          <a-space>
            <a-button type="primary" @click="search" :loading="loading">
              查询
            </a-button>
            <a-button @click="streamSearch" :loading="streaming">
              流式查询
            </a-button>
          </a-space>

          <a-card v-if="searchResult" title="查询结果" size="small">
            <div v-html="renderMarkdown(searchResult.answer || '')"></div>
            <a-divider />
            <div v-for="(doc, index) in searchResult.documents" :key="index">
              <a-card size="small" style="margin-bottom: 8px">
                <p><strong>文档 {{ index + 1 }}:</strong></p>
                <p>{{ doc.content }}</p>
              </a-card>
            </div>
          </a-card>

          <a-card v-if="streamResult" title="流式结果" size="small">
            <div class="stream-content" v-html="renderMarkdown(streamResult)"></div>
          </a-card>
        </a-space>
      </a-card>

      <a-card title="文档列表">
        <a-button @click="loadDocuments" :loading="loading">刷新列表</a-button>
        <a-list
          v-if="documents.length > 0"
          :data-source="documents"
          :loading="loading"
          style="margin-top: 16px"
        >
          <template #renderItem="{ item }">
            <a-list-item>
              <a-list-item-meta>
                <template #title>{{ item.id }}</template>
                <template #description>{{ item.content }}</template>
              </a-list-item-meta>
              <template #actions>
                <a-button danger size="small" @click="deleteDoc(item.id)">删除</a-button>
              </template>
            </a-list-item>
          </template>
        </a-list>
      </a-card>
    </a-space>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { UploadOutlined } from '@ant-design/icons-vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { ragApi } from '@/api/rag'

const loading = ref(false)
const streaming = ref(false)
const query = ref('')
const topK = ref(5)
const searchResult = ref<any>(null)
const streamResult = ref('')
const documents = ref<any[]>([])

const renderMarkdown = (text: string) => {
  return DOMPurify.sanitize(marked(text))
}

const handleUpload = async (file: File) => {
  try {
    const res = await ragApi.uploadDocument(file)
    message.success('上传成功: ' + res.data.documentId)
    loadDocuments()
    return false
  } catch (error: any) {
    message.error('上传失败: ' + error.message)
    return false
  }
}

const search = async () => {
  if (!query.value) {
    message.warning('请输入查询问题')
    return
  }
  loading.value = true
  try {
    const res = await ragApi.query({ query: query.value, topK: topK.value })
    searchResult.value = res.data
    message.success('查询成功')
  } catch (error: any) {
    message.error('查询失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const streamSearch = () => {
  if (!query.value) {
    message.warning('请输入查询问题')
    return
  }
  streaming.value = true
  streamResult.value = ''
  
  ragApi.streamQuery(
    { query: query.value, topK: topK.value },
    (chunk: string) => {
      streamResult.value += chunk
    },
    () => {
      streaming.value = false
      message.success('流式查询完成')
    },
    (error: string) => {
      streaming.value = false
      message.error('流式查询失败: ' + error)
    }
  )
}

const loadDocuments = async () => {
  loading.value = true
  try {
    const res = await ragApi.getDocuments()
    documents.value = res.data.documents || []
  } catch (error: any) {
    message.error('获取文档列表失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const deleteDoc = async (docId: string) => {
  try {
    await ragApi.deleteDocument(docId)
    message.success('删除成功')
    loadDocuments()
  } catch (error: any) {
    message.error('删除失败: ' + error.message)
  }
}

onMounted(() => {
  loadDocuments()
})
</script>

<style scoped>
.rag-test {
  padding: 16px;
}

.stream-content {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>

