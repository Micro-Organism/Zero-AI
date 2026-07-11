<template>
  <div class="dify-test-container">
    <a-card title="Dify 集成测试" :bordered="false">
      <a-tabs v-model:activeKey="activeTab" @change="handleTabChange">
        <!-- 工具列表 -->
        <a-tab-pane key="tools" tab="工具列表">
          <a-space direction="vertical" style="width: 100%" size="large">
            <a-card title="获取工具列表">
              <a-form layout="inline" :model="toolListForm" @finish="loadTools">
                <a-form-item label="应用ID">
                  <a-input 
                    v-model:value="toolListForm.appId" 
                    placeholder="请输入应用ID，例如: c46e6278-529e-4baf-9689-82e36f71ccfd"
                    style="width: 400px"
                  />
                </a-form-item>
                <a-form-item>
                  <a-button type="primary" html-type="submit" :loading="toolsLoading">
                    获取工具列表
                  </a-button>
                </a-form-item>
              </a-form>
              <a-alert
                v-if="!toolListForm.appId"
                message="提示"
                description="建议提供应用ID以获取该应用的工具列表。应用ID可以从Dify应用详情页面获取。"
                type="info"
                show-icon
                style="margin-top: 16px"
              />
              
              <a-divider />
              
              <a-table 
                v-if="toolsList.length > 0"
                :columns="toolColumns" 
                :data-source="toolsList" 
                :pagination="false"
                :row-key="(record) => record.id || record.name || Math.random()"
                style="margin-top: 16px"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'action'">
                    <a-button type="link" @click="selectTool(record)">
                      使用此工具
                    </a-button>
                  </template>
                  <template v-else-if="column.key === 'description'">
                    <span>{{ record.description || '-' }}</span>
                  </template>
                </template>
              </a-table>
              <a-empty 
                v-else 
                :description="toolsLoading ? '加载中...' : '暂无工具，请先获取工具列表'"
                style="margin-top: 16px"
              />
            </a-card>
          </a-space>
        </a-tab-pane>

        <!-- 工具调用 -->
        <a-tab-pane key="invoke" tab="工具调用">
          <a-space direction="vertical" style="width: 100%" size="large">
            <a-card title="调用 Dify 工具">
              <a-form :model="toolInvokeForm" layout="vertical">
                <a-form-item label="工具名称" required>
                  <a-input 
                    v-model:value="toolInvokeForm.toolName" 
                    placeholder="输入工具名称，例如: python_script_tool"
                  />
                </a-form-item>
                
                <a-form-item label="工具参数（JSON格式）">
                  <a-textarea 
                    v-model:value="toolInvokeForm.parametersJson"
                    :rows="6"
                    placeholder='{"param1": "value1", "param2": "value2"}'
                  />
                </a-form-item>
                
                <a-form-item>
                  <a-space>
                    <a-button 
                      type="primary" 
                      @click="invokeTool(false)"
                      :loading="invokeLoading"
                    >
                      同步调用
                    </a-button>
                    <a-button 
                      type="primary" 
                      @click="invokeTool(true)"
                      :loading="invokeStreamLoading"
                    >
                      流式调用
                    </a-button>
                    <a-button @click="clearResult">清空结果</a-button>
                  </a-space>
                </a-form-item>
              </a-form>
            </a-card>

            <a-card title="调用结果">
              <a-spin :spinning="invokeLoading || invokeStreamLoading">
                <div class="result-container">
                  <pre v-if="invokeResult" class="result-content">{{ formatResult(invokeResult) }}</pre>
                  <a-empty v-else description="暂无结果，请先调用工具" />
                </div>
              </a-spin>
            </a-card>
          </a-space>
        </a-tab-pane>

        <!-- Dify对话 -->
        <a-tab-pane key="chat" tab="Dify对话">
          <a-space direction="vertical" style="width: 100%" size="large">
            <a-card title="Dify 对话">
              <a-form :model="chatForm" layout="vertical">
                <a-form-item label="应用ID（可选）">
                  <a-input 
                    v-model:value="chatForm.appId" 
                    placeholder="留空使用默认应用"
                  />
                </a-form-item>
                
                <a-form-item label="对话消息">
                  <a-textarea 
                    v-model:value="chatForm.message"
                    :rows="4"
                    placeholder="输入您的消息"
                  />
                </a-form-item>
                
                <a-form-item>
                  <a-space>
                    <a-button 
                      type="primary" 
                      @click="chat(false)"
                      :loading="chatLoading"
                    >
                      同步对话
                    </a-button>
                    <a-button 
                      type="primary" 
                      @click="chat(true)"
                      :loading="chatStreamLoading"
                    >
                      流式对话
                    </a-button>
                    <a-button @click="clearChatResult">清空结果</a-button>
                  </a-space>
                </a-form-item>
              </a-form>
            </a-card>

            <a-card title="对话结果">
              <a-spin :spinning="chatLoading || chatStreamLoading">
                <div class="result-container">
                  <pre v-if="chatResult" class="result-content">{{ formatResult(chatResult) }}</pre>
                  <a-empty v-else description="暂无结果，请先发送消息" />
                </div>
              </a-spin>
            </a-card>
          </a-space>
        </a-tab-pane>

        <!-- Completion Messages -->
        <a-tab-pane key="completion" tab="Completion Messages">
          <a-space direction="vertical" style="width: 100%" size="large">
            <a-card title="Dify Completion Messages（V1 API）">
              <a-alert
                message="说明"
                description="这是直接调用 V1 API 的接口。您可以选择：1) 使用表单字段填写参数；2) 在'完整请求体'中直接输入完整的 JSON 请求体（推荐，不做任何转换）。"
                type="info"
                show-icon
                style="margin-bottom: 16px"
              />
              <a-form :model="completionForm" layout="vertical">
                <a-form-item label="选择应用">
                  <a-select
                    v-model:value="completionForm.selectedAppId"
                    placeholder="请选择应用"
                    style="width: 100%"
                    @change="onAppSelected"
                    :options="appConfigList.filter(app => app.enabled).map(app => ({
                      label: `${app.name} (${app.appType || 'completion'}) - ${app.appId}`,
                      value: app.appId
                    }))"
                  />
                  <div style="margin-top: 8px; color: #999; font-size: 12px;" v-if="completionForm.selectedAppId">
                    当前选择的应用ID: <code>{{ completionForm.selectedAppId }}</code>
                  </div>
                </a-form-item>
                
                <a-form-item label="完整请求体（推荐，JSON格式，直接传递给 Dify API，不做任何转换）">
                  <a-textarea 
                    v-model:value="completionForm.customInputsJson"
                    :rows="14"
                    :placeholder="getRequestBodyPlaceholder()"
                  />
                  <div style="margin-top: 8px; color: #666; font-size: 12px; line-height: 1.6;">
                    <div style="margin-bottom: 4px;"><strong>💡 使用说明：</strong></div>
                    <div style="margin-left: 16px; margin-bottom: 4px;" v-html="getUsageInstructions()"></div>
                    <div style="margin-left: 16px; margin-top: 8px; padding: 8px; background: #f0f0f0; border-radius: 4px;" v-if="getSuccessExample()">
                      <strong>✅ 成功示例：</strong><br/>
                      <code style="font-size: 11px; white-space: pre-wrap;">{{ getSuccessExample() }}</code>
                    </div>
                  </div>
                </a-form-item>
                
                <a-form-item>
                  <a-space>
                    <a-button 
                      type="primary" 
                      @click="callCompletion(false)"
                      :loading="completionLoading"
                    >
                      同步调用
                    </a-button>
                    <a-button 
                      type="primary" 
                      @click="callCompletion(true)"
                      :loading="completionStreamLoading"
                    >
                      流式调用
                    </a-button>
                    <a-button @click="clearCompletionResult">清空结果</a-button>
                  </a-space>
                </a-form-item>
              </a-form>
            </a-card>

            <a-row :gutter="16">
              <a-col :span="12">
                <a-card title="完整结果（JSON）">
                  <a-spin :spinning="completionLoading || completionStreamLoading">
                    <div class="result-container">
                      <pre v-if="completionResult" class="result-content">{{ formatResult(completionResult) }}</pre>
                      <a-empty v-else description="暂无结果，请先调用接口" />
                    </div>
                  </a-spin>
                </a-card>
              </a-col>
              <a-col :span="12">
                <a-card title="流式文本输出（实时）">
                  <a-spin :spinning="completionLoading || completionStreamLoading">
                    <div class="stream-text-container">
                      <div v-if="completionStreamText || completionStreamLoading" class="stream-text-content">
                        {{ completionStreamText || '正在接收数据...' }}
                        <span v-if="completionStreamLoading" class="stream-cursor">▋</span>
                      </div>
                      <a-empty v-else description="暂无流式输出，请先调用接口" />
                    </div>
                  </a-spin>
                </a-card>
              </a-col>
            </a-row>
          </a-space>
        </a-tab-pane>

        <!-- 应用配置管理 -->
        <a-tab-pane key="app-config" tab="应用配置管理">
          <a-space direction="vertical" style="width: 100%" size="large">
            <a-card title="应用配置列表">
              <template #extra>
                <a-button type="primary" @click="showAppConfigModal">添加应用</a-button>
              </template>
              <a-table 
                :columns="appConfigColumns" 
                :data-source="appConfigList" 
                :loading="appConfigLoading"
                :pagination="{ pageSize: 10 }"
                :row-key="(record) => record.id"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'enabled'">
                    <a-tag :color="record.enabled ? 'green' : 'red'">
                      {{ record.enabled ? '启用' : '禁用' }}
                    </a-tag>
                  </template>
                  <template v-else-if="column.key === 'action'">
                    <a-space>
                      <a-button type="link" size="small" @click="editAppConfig(record)">编辑</a-button>
                      <a-button type="link" size="small" danger @click="deleteAppConfig(record.id)">删除</a-button>
                    </a-space>
                  </template>
                </template>
              </a-table>
            </a-card>
          </a-space>
        </a-tab-pane>

        <!-- 批量测试 -->
        <a-tab-pane key="batch-test" tab="批量测试">
          <a-space direction="vertical" style="width: 100%" size="large">
            <a-card title="批量调用多个应用">
              <a-alert
                message="说明"
                description="选择多个应用进行批量调用测试，所有应用将并行调用，使用相同的输入参数。"
                type="info"
                show-icon
                style="margin-bottom: 16px"
              />
              <a-form :model="batchTestForm" layout="vertical">
                <a-form-item label="选择应用（可多选）">
                  <a-select
                    v-model:value="batchTestForm.appIds"
                    mode="multiple"
                    placeholder="请选择要测试的应用"
                    style="width: 100%"
                    :options="appConfigList.filter(app => app.enabled).map(app => ({
                      label: `${app.name} (${app.appId})`,
                      value: app.appId
                    }))"
                  />
                </a-form-item>
                
                <a-form-item label="输入参数（JSON格式）">
                  <a-textarea 
                    v-model:value="batchTestForm.inputsJson"
                    :rows="6"
                    placeholder='{"meeting_content": "Hello, world!"}'
                  />
                </a-form-item>
                
                <a-form-item>
                  <a-space>
                    <a-button 
                      type="primary" 
                      @click="batchTest"
                      :loading="batchTestLoading"
                    >
                      批量测试
                    </a-button>
                    <a-button @click="clearBatchTestResult">清空结果</a-button>
                  </a-space>
                </a-form-item>
              </a-form>
            </a-card>

            <a-card title="批量测试结果">
              <a-spin :spinning="batchTestLoading">
                <div class="result-container">
                  <div v-if="batchTestResult && batchTestResult.length > 0">
                    <div v-for="(result, index) in batchTestResult" :key="index" style="margin-bottom: 16px; padding: 12px; border: 1px solid #e8e8e8; border-radius: 4px;">
                      <div style="font-weight: bold; margin-bottom: 8px;">
                        {{ result.appName }} ({{ result.appId }})
                        <a-tag :color="result.success ? 'green' : 'red'" style="margin-left: 8px;">
                          {{ result.success ? '成功' : '失败' }}
                        </a-tag>
                      </div>
                      <pre class="result-content" style="max-height: 200px; overflow-y: auto;">{{ formatResult(result.data || result) }}</pre>
                    </div>
                  </div>
                  <a-empty v-else description="暂无结果，请先执行批量测试" />
                </div>
              </a-spin>
            </a-card>
          </a-space>
        </a-tab-pane>

        <!-- 工作流执行 -->
        <a-tab-pane key="workflow" tab="工作流执行">
          <a-space direction="vertical" style="width: 100%" size="large">
            <a-card title="执行 Dify 工作流">
              <a-form :model="workflowForm" layout="vertical">
                <a-form-item label="工作流ID" required>
                  <a-input 
                    v-model:value="workflowForm.workflowId" 
                    placeholder="输入工作流ID"
                  />
                </a-form-item>
                
                <a-form-item label="输入参数（JSON格式）">
                  <a-textarea 
                    v-model:value="workflowForm.inputsJson"
                    :rows="6"
                    placeholder='{"input1": "value1", "input2": "value2"}'
                  />
                </a-form-item>
                
                <a-form-item>
                  <a-space>
                    <a-button 
                      type="primary" 
                      @click="executeWorkflow(false)"
                      :loading="workflowLoading"
                    >
                      同步执行
                    </a-button>
                    <a-button 
                      type="primary" 
                      @click="executeWorkflow(true)"
                      :loading="workflowStreamLoading"
                    >
                      流式执行
                    </a-button>
                    <a-button @click="clearWorkflowResult">清空结果</a-button>
                  </a-space>
                </a-form-item>
              </a-form>
            </a-card>

            <a-card title="执行结果">
              <a-spin :spinning="workflowLoading || workflowStreamLoading">
                <div class="result-container">
                  <pre v-if="workflowResult" class="result-content">{{ formatResult(workflowResult) }}</pre>
                  <a-empty v-else description="暂无结果，请先执行工作流" />
                </div>
              </a-spin>
            </a-card>
          </a-space>
        </a-tab-pane>
      </a-tabs>
    </a-card>

    <!-- 应用配置编辑模态框 -->
    <a-modal
      v-model:open="appConfigModalVisible"
      :title="editingAppConfigId ? '编辑应用配置' : '添加应用配置'"
      @ok="saveAppConfig"
      width="600px"
    >
      <a-form :model="appConfigForm" layout="vertical">
        <a-form-item label="应用名称" required>
          <a-input v-model:value="appConfigForm.name" placeholder="请输入应用名称" />
        </a-form-item>
        <a-form-item label="应用ID" required>
          <a-input v-model:value="appConfigForm.appId" placeholder="请输入Dify应用ID" />
        </a-form-item>
        <a-form-item label="应用类型">
          <a-select v-model:value="appConfigForm.appType" placeholder="请选择应用类型">
            <a-select-option value="completion">Completion</a-select-option>
            <a-select-option value="chat">Chat</a-select-option>
            <a-select-option value="workflow">Workflow</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="输入参数模板（JSON格式）">
          <a-textarea 
            v-model:value="appConfigForm.inputTemplate" 
            :rows="4"
            placeholder='{"meeting_content": ""}'
          />
        </a-form-item>
        <a-form-item label="API Key（可选）">
          <a-input v-model:value="appConfigForm.apiKey" placeholder="留空使用全局配置" />
        </a-form-item>
        <a-form-item label="描述">
          <a-textarea v-model:value="appConfigForm.description" :rows="2" />
        </a-form-item>
        <a-form-item label="排序号">
          <a-input-number v-model:value="appConfigForm.sortOrder" :min="0" />
        </a-form-item>
        <a-form-item>
          <a-checkbox v-model:checked="appConfigForm.enabled">启用</a-checkbox>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { difyApi, difyAppConfigApi, type DifyAppConfig } from '@/api/dify'

const activeTab = ref('tools')

// 工具列表
const toolsLoading = ref(false)
const toolsList = ref<any[]>([])
const toolListForm = reactive({
  appId: ''
})

const toolColumns = [
  { 
    title: '工具ID', 
    dataIndex: 'id', 
    key: 'id',
    ellipsis: true,
    width: 200
  },
  { 
    title: '工具名称', 
    dataIndex: 'name', 
    key: 'name',
    ellipsis: true,
    width: 200
  },
  { 
    title: '描述', 
    dataIndex: 'description', 
    key: 'description',
    ellipsis: true
  },
  { 
    title: '操作', 
    key: 'action',
    width: 120
  }
]

// 工具调用
const invokeLoading = ref(false)
const invokeStreamLoading = ref(false)
const invokeResult = ref<any>(null)
const toolInvokeForm = reactive({
  toolName: '',
  parametersJson: '{}'
})

// 对话
const chatLoading = ref(false)
const chatStreamLoading = ref(false)
const chatResult = ref<any>(null)
const chatForm = reactive({
  appId: '',
  message: ''
})

// Completion Messages
const completionLoading = ref(false)
const completionStreamLoading = ref(false)
const completionResult = ref<any>(null)
const completionStreamText = ref<string>('') // 实时流式文本内容
const completionForm = reactive({
  selectedAppId: '',
  appId: 'c46e6278-529e-4baf-9689-82e36f71ccfd',
  appType: 'completion',
  meetingContent: 'Hello, world!',
  query: '你好，请介绍一下自己',
  conversationId: '',
  user: '',
  filesJson: '',
  customInputsJson: ''
})

// 应用选择变化
const onAppSelected = (appId: string) => {
  const app = appConfigList.value.find(a => a.appId === appId)
  if (app) {
    completionForm.appId = app.appId
    completionForm.appType = app.appType || 'completion'
    
    // 根据应用类型和输入模板填充默认请求体
    if (app.inputTemplate) {
      try {
        const template = JSON.parse(app.inputTemplate)
        // 根据应用ID设置不同的默认请求体
        if (app.appId === 'c46e6278-529e-4baf-9689-82e36f71ccfd') {
          // 文本生成应用测试 - completion
          completionForm.customInputsJson = JSON.stringify({
            inputs: { meeting_content: 'Hello, world!' },
            response_mode: 'blocking',
            user: 'user-123'
          }, null, 2)
        } else if (app.appId === 'c41834f1-e70c-4c96-8722-eabbbffa1969') {
          // 面试官助手 - chat with jobname
          completionForm.customInputsJson = JSON.stringify({
            inputs: { jobname: 'Java开发工程师' },
            query: '请介绍一下你自己',
            response_mode: 'blocking',
            user: 'user-123'
          }, null, 2)
        } else if (app.appId === '99a1cba2-8c35-472a-b98b-58f2ad261f3f') {
          // 调研分析报告编写助手 - chat with user_request and knowledge_base
          completionForm.customInputsJson = JSON.stringify({
            inputs: {
              user_request: '官网',
              knowledge_base: '官网'
            },
            query: '介绍下平果13promax',
            response_mode: 'streaming',
            user: 'user-123'
          }, null, 2)
        } else if (app.appId === '59cdfbd2-7826-4f34-83a6-cec16224bc57') {
          // 分析报告生成助手 - chat
          completionForm.customInputsJson = JSON.stringify({
            inputs: {},
            query: '请介绍一下你自己',
            response_mode: 'blocking',
            user: 'user-123'
          }, null, 2)
        } else if (app.appId === '38f38794-bc62-49ab-b054-4669732e8ed0') {
          // 测试知识库问答 - workflow
          completionForm.customInputsJson = JSON.stringify({
            inputs: { query: '什么是人工智能？' },
            response_mode: 'streaming',
            user: 'abc-123'
          }, null, 2)
        } else {
          // 其他应用使用模板
          if (completionForm.appType === 'chat') {
            completionForm.customInputsJson = JSON.stringify({
              inputs: {},
              query: '你好，请介绍一下自己',
              response_mode: 'blocking',
              user: 'user-123'
            }, null, 2)
          } else {
            completionForm.customInputsJson = JSON.stringify({
              inputs: template,
              response_mode: 'blocking',
              user: 'user-123'
            }, null, 2)
          }
        }
      } catch (e) {
        console.error('解析输入模板失败:', e)
      }
    }
  }
}

// 获取请求体占位符
const getRequestBodyPlaceholder = () => {
  const app = appConfigList.value.find(a => a.appId === completionForm.selectedAppId)
  if (!app) {
    return '请先选择应用'
  }
  
  if (app.appId === 'c46e6278-529e-4baf-9689-82e36f71ccfd') {
    return '{\n  "inputs": {\n    "meeting_content": "Hello, world!"\n  },\n  "response_mode": "blocking",\n  "user": "user-123"\n}'
  } else if (app.appId === 'c41834f1-e70c-4c96-8722-eabbbffa1969') {
    return '{\n  "inputs": {\n    "jobname": "Java开发工程师"\n  },\n  "query": "请介绍一下你自己",\n  "response_mode": "blocking",\n  "user": "user-123"\n}'
  } else if (app.appId === '99a1cba2-8c35-472a-b98b-58f2ad261f3f') {
    return '{\n  "inputs": {\n    "user_request": "官网",\n    "knowledge_base": "官网"\n  },\n  "query": "介绍下平果13promax",\n  "response_mode": "streaming",\n  "user": "user-123"\n}'
  } else if (app.appId === '59cdfbd2-7826-4f34-83a6-cec16224bc57') {
    return '{\n  "inputs": {},\n  "query": "请介绍一下你自己",\n  "response_mode": "blocking",\n  "user": "user-123"\n}'
  } else if (app.appId === '38f38794-bc62-49ab-b054-4669732e8ed0') {
    return '{\n  "inputs": {\n    "query": "什么是人工智能？"\n  },\n  "response_mode": "streaming",\n  "user": "abc-123"\n}'
  } else {
    return '{\n  "inputs": {},\n  "query": "你的问题",\n  "response_mode": "blocking",\n  "user": "user-123"\n}'
  }
}

// 获取使用说明
const getUsageInstructions = () => {
  const app = appConfigList.value.find(a => a.appId === completionForm.selectedAppId)
  if (!app) {
    return '• 请先选择应用'
  }
  
  let instructions = '• 如果填写完整请求体，将直接使用，不做任何转换<br/>'
  
  if (app.appId === 'c46e6278-529e-4baf-9689-82e36f71ccfd') {
    instructions += '• <strong>completion-messages API</strong>：使用 <code>inputs.meeting_content</code> 参数<br/>'
  } else if (app.appId === 'c41834f1-e70c-4c96-8722-eabbbffa1969') {
    instructions += '• <strong>chat-messages API</strong>：需要 <code>inputs.jobname</code> 和 <code>query</code> 参数<br/>'
  } else if (app.appId === '99a1cba2-8c35-472a-b98b-58f2ad261f3f') {
    instructions += '• <strong>chat-messages API</strong>：需要 <code>inputs.user_request</code>、<code>inputs.knowledge_base</code> 和 <code>query</code> 参数<br/>'
  } else if (app.appId === '59cdfbd2-7826-4f34-83a6-cec16224bc57') {
    instructions += '• <strong>chat-messages API</strong>：需要 <code>query</code> 参数，<code>inputs</code> 可以为空对象<br/>'
  } else if (app.appId === '38f38794-bc62-49ab-b054-4669732e8ed0') {
    instructions += '• <strong>workflow API</strong>：使用 <code>inputs.query</code> 参数，调用 <code>/v1/workflows/run</code> 接口<br/>'
  } else {
    if (app.appType === 'workflow') {
      instructions += '• <strong>workflow API</strong>：使用 <code>inputs</code> 对象，调用 <code>/v1/workflows/run</code> 接口<br/>'
    } else if (app.appType === 'chat') {
      instructions += '• <strong>chat-messages API</strong>：需要 <code>query</code> 参数（顶级参数），<code>inputs</code> 可以为空对象<br/>'
    } else {
      instructions += '• <strong>completion-messages API</strong>：使用 <code>inputs</code> 对象，包含应用所需的参数<br/>'
    }
  }
  
  return instructions
}

// 获取成功示例
const getSuccessExample = () => {
  const app = appConfigList.value.find(a => a.appId === completionForm.selectedAppId)
  if (!app) {
    return ''
  }
  
  if (app.appId === 'c46e6278-529e-4baf-9689-82e36f71ccfd') {
    return JSON.stringify({
      inputs: { meeting_content: 'Hello, world!' },
      response_mode: 'blocking',
      user: 'user-123'
    }, null, 2)
  } else if (app.appId === 'c41834f1-e70c-4c96-8722-eabbbffa1969') {
    return JSON.stringify({
      inputs: { jobname: 'Java开发工程师' },
      query: '请介绍一下你自己',
      response_mode: 'blocking',
      user: 'user-123'
    }, null, 2)
  } else if (app.appId === '99a1cba2-8c35-472a-b98b-58f2ad261f3f') {
    return JSON.stringify({
      inputs: {
        user_request: '官网',
        knowledge_base: '官网'
      },
      query: '介绍下平果13promax',
      response_mode: 'streaming',
      user: 'user-123'
    }, null, 2)
  } else if (app.appId === '59cdfbd2-7826-4f34-83a6-cec16224bc57') {
    return JSON.stringify({
      inputs: {},
      query: '请介绍一下你自己',
      response_mode: 'blocking',
      user: 'user-123'
    }, null, 2)
  } else if (app.appId === '38f38794-bc62-49ab-b054-4669732e8ed0') {
    return JSON.stringify({
      inputs: { query: '什么是人工智能？' },
      response_mode: 'streaming',
      user: 'abc-123'
    }, null, 2)
  }
  
  return ''
}

// 应用配置管理
const appConfigLoading = ref(false)
const appConfigList = ref<DifyAppConfig[]>([])
const appConfigModalVisible = ref(false)
const appConfigForm = reactive<DifyAppConfig>({
  name: '',
  appId: '',
  appType: 'completion',
  inputTemplate: '{"meeting_content": ""}',
  description: '',
  enabled: true,
  sortOrder: 0
})
const editingAppConfigId = ref<number | null>(null)

const appConfigColumns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '应用名称', dataIndex: 'name', key: 'name', width: 200 },
  { title: '应用ID', dataIndex: 'appId', key: 'appId', ellipsis: true },
  { title: '应用类型', dataIndex: 'appType', key: 'appType', width: 120 },
  { title: '状态', key: 'enabled', width: 80 },
  { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
  { title: '操作', key: 'action', width: 150 }
]

// 批量测试
const batchTestLoading = ref(false)
const batchTestResult = ref<any[]>([])
const batchTestForm = reactive({
  appIds: [] as string[],
  inputsJson: '{"meeting_content": "Hello, world!"}'
})

// 工作流
const workflowLoading = ref(false)
const workflowStreamLoading = ref(false)
const workflowResult = ref<any>(null)
const workflowForm = reactive({
  workflowId: '',
  inputsJson: '{}'
})

// 加载工具列表
const loadTools = async () => {
  toolsLoading.value = true
  try {
    const response = await difyApi.getTools(toolListForm.appId || undefined)
    if (response.code === 200) {
      const tools = response.data || []
      toolsList.value = tools
      if (tools.length === 0) {
        if (toolListForm.appId) {
          message.warning('该应用暂无工具配置，请检查应用ID是否正确')
        } else {
          message.warning('未找到工具列表，请提供应用ID')
        }
      } else {
        message.success(`成功获取 ${tools.length} 个工具`)
      }
    } else {
      message.error(response.message || '获取工具列表失败')
      toolsList.value = []
    }
  } catch (error: any) {
    console.error('获取工具列表失败:', error)
    message.error('获取工具列表失败: ' + (error.message || '未知错误'))
    toolsList.value = []
  } finally {
    toolsLoading.value = false
  }
}

// 选择工具
const selectTool = (tool: any) => {
  activeTab.value = 'invoke'
  toolInvokeForm.toolName = tool.name || tool.id
  message.info(`已选择工具: ${toolInvokeForm.toolName}`)
}

// 调用工具
const invokeTool = async (stream: boolean) => {
  if (!toolInvokeForm.toolName) {
    message.warning('请输入工具名称')
    return
  }

  let parameters = {}
  try {
    if (toolInvokeForm.parametersJson.trim()) {
      parameters = JSON.parse(toolInvokeForm.parametersJson)
    }
  } catch (e) {
    message.error('参数JSON格式错误')
    return
  }

  if (stream) {
    invokeStreamLoading.value = true
    invokeResult.value = ''
    
    try {
      await difyApi.invokeToolStream(
        {
          tool_name: toolInvokeForm.toolName,
          parameters
        },
        {
          onMessage: (chunk: string) => {
            try {
              const data = JSON.parse(chunk)
              invokeResult.value = data
            } catch {
              invokeResult.value = (invokeResult.value || '') + chunk
            }
          },
          onDone: () => {
            invokeStreamLoading.value = false
            message.success('工具调用完成')
          },
          onError: (error: string) => {
            invokeStreamLoading.value = false
            message.error('工具调用失败: ' + error)
          }
        }
      )
    } catch (error: any) {
      invokeStreamLoading.value = false
      message.error('工具调用失败: ' + error.message)
    }
  } else {
    invokeLoading.value = true
    try {
      const response = await difyApi.invokeTool({
        tool_name: toolInvokeForm.toolName,
        parameters
      })
      invokeResult.value = response
      if (response.code === 200) {
        message.success('工具调用成功')
      } else {
        message.error(response.message || '工具调用失败')
      }
    } catch (error: any) {
      message.error('工具调用失败: ' + error.message)
    } finally {
      invokeLoading.value = false
    }
  }
}

// Dify对话
const chat = async (stream: boolean) => {
  if (!chatForm.message) {
    message.warning('请输入消息')
    return
  }

  const messages = [
    {
      role: 'user',
      content: chatForm.message
    }
  ]

  if (stream) {
    chatStreamLoading.value = true
    chatResult.value = ''
    
    try {
      await difyApi.chatStream(
        {
          messages,
          app_id: chatForm.appId || undefined
        },
        {
          onMessage: (chunk: string) => {
            try {
              const data = JSON.parse(chunk)
              chatResult.value = data
            } catch {
              chatResult.value = (chatResult.value || '') + chunk
            }
          },
          onDone: () => {
            chatStreamLoading.value = false
            message.success('对话完成')
          },
          onError: (error: string) => {
            chatStreamLoading.value = false
            message.error('对话失败: ' + error)
          }
        }
      )
    } catch (error: any) {
      chatStreamLoading.value = false
      message.error('对话失败: ' + error.message)
    }
  } else {
    chatLoading.value = true
    try {
      const response = await difyApi.chat({
        messages,
        app_id: chatForm.appId || undefined
      })
      chatResult.value = response
      if (response.code === 200) {
        message.success('对话成功')
      } else {
        message.error(response.message || '对话失败')
      }
    } catch (error: any) {
      message.error('对话失败: ' + error.message)
    } finally {
      chatLoading.value = false
    }
  }
}

// 执行工作流
const executeWorkflow = async (stream: boolean) => {
  if (!workflowForm.workflowId) {
    message.warning('请输入工作流ID')
    return
  }

  let inputs = {}
  try {
    if (workflowForm.inputsJson.trim()) {
      inputs = JSON.parse(workflowForm.inputsJson)
    }
  } catch (e) {
    message.error('输入参数JSON格式错误')
    return
  }

  if (stream) {
    workflowStreamLoading.value = true
    workflowResult.value = ''
    
    try {
      await difyApi.executeWorkflowStream(
        {
          workflow_id: workflowForm.workflowId,
          inputs
        },
        {
          onMessage: (chunk: string) => {
            try {
              const data = JSON.parse(chunk)
              workflowResult.value = data
            } catch {
              workflowResult.value = (workflowResult.value || '') + chunk
            }
          },
          onDone: () => {
            workflowStreamLoading.value = false
            message.success('工作流执行完成')
          },
          onError: (error: string) => {
            workflowStreamLoading.value = false
            message.error('工作流执行失败: ' + error)
          }
        }
      )
    } catch (error: any) {
      workflowStreamLoading.value = false
      message.error('工作流执行失败: ' + error.message)
    }
  } else {
    workflowLoading.value = true
    try {
      const response = await difyApi.executeWorkflow({
        workflow_id: workflowForm.workflowId,
        inputs
      })
      workflowResult.value = response
      if (response.code === 200) {
        message.success('工作流执行成功')
      } else {
        message.error(response.message || '工作流执行失败')
      }
    } catch (error: any) {
      message.error('工作流执行失败: ' + error.message)
    } finally {
      workflowLoading.value = false
    }
  }
}

// 清空结果
const clearResult = () => {
  invokeResult.value = null
}

const clearChatResult = () => {
  chatResult.value = null
}

const clearWorkflowResult = () => {
  workflowResult.value = null
}

// Completion Messages 调用
const callCompletion = async (stream: boolean) => {
  let requestBody: Record<string, any> = {}
  
  // 如果提供了完整请求体，直接使用（不做任何转换）
  if (completionForm.customInputsJson.trim()) {
    try {
      requestBody = JSON.parse(completionForm.customInputsJson)
      // 确保 response_mode 正确（如果是流式调用）
      if (stream) {
        requestBody.response_mode = 'streaming'
      } else if (!requestBody.response_mode) {
        requestBody.response_mode = 'blocking'
      }
    } catch (e) {
      message.error('完整请求体JSON格式错误')
      return
    }
  } else {
    // 根据应用类型构建请求体
    if (completionForm.appType === 'chat') {
      if (!completionForm.query) {
        message.warning('请输入查询内容')
        return
      }
      requestBody = {
        inputs: {},
        query: completionForm.query,
        response_mode: stream ? 'streaming' : 'blocking',
        user: completionForm.user || `user-${Date.now()}`
      }
      if (completionForm.conversationId) {
        requestBody.conversation_id = completionForm.conversationId
      }
      if (completionForm.filesJson.trim()) {
        try {
          const files = JSON.parse(completionForm.filesJson)
          if (Array.isArray(files) && files.length > 0) {
            requestBody.files = files
          }
        } catch (e) {
          message.error('文件列表JSON格式错误')
          return
        }
      }
    } else {
      // completion 类型
      if (!completionForm.meetingContent) {
        message.warning('请输入会议内容')
        return
      }
      requestBody = {
        inputs: {
          meeting_content: completionForm.meetingContent
        },
        response_mode: stream ? 'streaming' : 'blocking',
        user: completionForm.user || `user-${Date.now()}`
      }
    }
  }

  const request: any = {
    app_id: completionForm.selectedAppId || completionForm.appId || undefined,
    ...requestBody
  }

  if (stream) {
    completionStreamLoading.value = true
    completionResult.value = ''
    completionStreamText.value = '' // 清空流式文本
    
    try {
      await difyApi.completionStream(
        request,
        {
          onMessage: (chunk: string) => {
            try {
              // 尝试解析 JSON
              const data = JSON.parse(chunk)
              
              // 处理 workflow 的 text_chunk 事件
              if (data.event === 'text_chunk' && data.data && data.data.text) {
                // 实时累积文本内容
                completionStreamText.value = (completionStreamText.value || '') + data.data.text
                // 同时保存完整数据
                if (!completionResult.value || typeof completionResult.value === 'string') {
                  completionResult.value = data
                } else if (Array.isArray(completionResult.value)) {
                  completionResult.value.push(data)
                } else {
                  completionResult.value = [completionResult.value, data]
                }
                return
              }
              
              // 处理 workflow_finished 事件
              if (data.event === 'workflow_finished' && data.data && data.data.outputs) {
                // 最终结果，保存完整数据
                completionResult.value = data
                // 如果 outputs 中有 text，也更新流式文本（确保完整）
                if (data.data.outputs.text) {
                  completionStreamText.value = data.data.outputs.text
                }
                return
              }
              
              // 处理其他类型的响应
              if (data.answer) {
                // 流式响应中的 answer 字段
                completionStreamText.value = (completionStreamText.value || '') + data.answer
                if (typeof completionResult.value === 'string') {
                  completionResult.value = completionResult.value + data.answer
                } else {
                  completionResult.value = data.answer
                }
              } else if (data.data && data.data.answer) {
                // 某些响应格式中数据在 data.answer 字段
                const answer = data.data.answer
                completionStreamText.value = (completionStreamText.value || '') + answer
                if (typeof completionResult.value === 'string') {
                  completionResult.value = completionResult.value + answer
                } else {
                  completionResult.value = answer
                }
              } else if (data.event === 'message' && data.answer) {
                // SSE 事件格式
                completionStreamText.value = (completionStreamText.value || '') + data.answer
                if (typeof completionResult.value === 'string') {
                  completionResult.value = completionResult.value + data.answer
                } else {
                  completionResult.value = data.answer
                }
              } else {
                // 其他格式，直接显示完整数据
                completionResult.value = data
              }
            } catch {
              // 如果不是 JSON，直接作为文本累积
              completionStreamText.value = (completionStreamText.value || '') + chunk
              if (typeof completionResult.value === 'string') {
                completionResult.value = completionResult.value + chunk
              } else {
                completionResult.value = chunk
              }
            }
          },
          onDone: () => {
            completionStreamLoading.value = false
            message.success('调用完成')
          },
          onError: (error: string) => {
            completionStreamLoading.value = false
            message.error('调用失败: ' + error)
          }
        }
      )
    } catch (error: any) {
      completionStreamLoading.value = false
      message.error('调用失败: ' + error.message)
    }
  } else {
    completionLoading.value = true
    try {
      const response = await difyApi.completion(request)
      completionResult.value = response
      if (response.code === 200) {
        message.success('调用成功')
        // 提取答案显示
        if (response.data && response.data.answer) {
          console.log('答案:', response.data.answer)
        }
      } else {
        message.error(response.message || '调用失败')
      }
    } catch (error: any) {
      message.error('调用失败: ' + error.message)
    } finally {
      completionLoading.value = false
    }
  }
}

const clearCompletionResult = () => {
  completionResult.value = null
  completionStreamText.value = ''
}

// 获取自定义输入参数的占位符
const getCustomInputsPlaceholder = () => {
  if (completionForm.appType === 'chat') {
    return '{"query": ""} - 如果填写，将覆盖默认的 query 参数'
  } else {
    return '{"meeting_content": ""} - 如果填写，将覆盖默认的 meeting_content 参数'
  }
}

// 格式化结果
const formatResult = (result: any) => {
  if (typeof result === 'string') {
    return result
  }
  return JSON.stringify(result, null, 2)
}

// Tab切换
const handleTabChange = (key: string) => {
  activeTab.value = key
  if (key === 'app-config' || key === 'batch-test') {
    loadAppConfigs()
  }
}

// 加载应用配置列表
const loadAppConfigs = async () => {
  appConfigLoading.value = true
  try {
    const response = await difyAppConfigApi.getAll(false)
    if (response.code === 200) {
      appConfigList.value = response.data || []
    } else {
      message.error(response.message || '获取应用配置列表失败')
    }
  } catch (error: any) {
    console.error('获取应用配置列表失败:', error)
    message.error('获取应用配置列表失败: ' + (error.message || '未知错误'))
  } finally {
    appConfigLoading.value = false
  }
}

// 显示应用配置模态框
const showAppConfigModal = () => {
  editingAppConfigId.value = null
  Object.assign(appConfigForm, {
    name: '',
    appId: '',
    appType: 'completion',
    inputTemplate: '{"meeting_content": ""}',
    description: '',
    enabled: true,
    sortOrder: 0
  })
  appConfigModalVisible.value = true
}

// 编辑应用配置
const editAppConfig = (config: DifyAppConfig) => {
  editingAppConfigId.value = config.id!
  Object.assign(appConfigForm, config)
  appConfigModalVisible.value = true
}

// 保存应用配置
const saveAppConfig = async () => {
  try {
    if (editingAppConfigId.value) {
      const response = await difyAppConfigApi.update(editingAppConfigId.value, appConfigForm)
      if (response.code === 200) {
        message.success('更新应用配置成功')
        appConfigModalVisible.value = false
        loadAppConfigs()
      } else {
        message.error(response.message || '更新应用配置失败')
      }
    } else {
      const response = await difyAppConfigApi.create(appConfigForm)
      if (response.code === 200) {
        message.success('创建应用配置成功')
        appConfigModalVisible.value = false
        loadAppConfigs()
      } else {
        message.error(response.message || '创建应用配置失败')
      }
    }
  } catch (error: any) {
    message.error('保存应用配置失败: ' + (error.message || '未知错误'))
  }
}

// 删除应用配置
const deleteAppConfig = (id: number) => {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除这个应用配置吗？',
    onOk: async () => {
      try {
        const response = await difyAppConfigApi.delete(id)
        if (response.code === 200) {
          message.success('删除应用配置成功')
          loadAppConfigs()
        } else {
          message.error(response.message || '删除应用配置失败')
        }
      } catch (error: any) {
        message.error('删除应用配置失败: ' + (error.message || '未知错误'))
      }
    }
  })
}

// 批量测试
const batchTest = async () => {
  if (!batchTestForm.appIds || batchTestForm.appIds.length === 0) {
    message.warning('请至少选择一个应用')
    return
  }

  let inputs = {}
  try {
    if (batchTestForm.inputsJson.trim()) {
      inputs = JSON.parse(batchTestForm.inputsJson)
    }
  } catch (e) {
    message.error('输入参数JSON格式错误')
    return
  }

  batchTestLoading.value = true
  batchTestResult.value = []
  
  try {
    const response = await difyAppConfigApi.batchCall({
      app_ids: batchTestForm.appIds,
      inputs: inputs,
      stream: false
    })
    
    if (response.code === 200) {
      batchTestResult.value = response.data || []
      message.success(`批量测试完成，成功 ${response.successCount || 0}/${response.total || 0} 个`)
    } else {
      message.error(response.message || '批量测试失败')
    }
  } catch (error: any) {
    message.error('批量测试失败: ' + (error.message || '未知错误'))
  } finally {
    batchTestLoading.value = false
  }
}

const clearBatchTestResult = () => {
  batchTestResult.value = []
}

// 初始化
onMounted(() => {
  loadAppConfigs()
})
</script>

<style scoped>
.dify-test-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.result-container {
  min-height: 200px;
  max-height: 600px;
  overflow-y: auto;
  background: #f5f5f5;
  padding: 16px;
  border-radius: 4px;
}

.result-content {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.6;
}

.stream-text-container {
  min-height: 200px;
  max-height: 600px;
  overflow-y: auto;
  background: #f5f5f5;
  padding: 16px;
  border-radius: 4px;
}

.stream-text-content {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.8;
  color: #333;
}

.stream-cursor {
  display: inline-block;
  animation: blink 1s infinite;
  color: #1890ff;
  margin-left: 2px;
}

@keyframes blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}
</style>

