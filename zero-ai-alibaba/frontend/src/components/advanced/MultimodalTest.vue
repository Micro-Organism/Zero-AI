<template>
  <div class="multimodal-test">
    <a-space direction="vertical" style="width: 100%" :size="16">
      <a-tabs v-model:activeKey="activeTab">
        <a-tab-pane key="image" tab="图像">
          <a-card title="图像生成">
            <a-space direction="vertical" style="width: 100%" :size="12">
              <a-input
                v-model:value="imagePrompt"
                placeholder="输入图像生成提示词"
              />
              <a-space>
                <a-input-number v-model:value="imageWidth" :min="256" :max="2048" placeholder="宽度" />
                <a-input-number v-model:value="imageHeight" :min="256" :max="2048" placeholder="高度" />
              </a-space>
              <a-button type="primary" @click="generateImage" :loading="loading">
                生成图像
              </a-button>
              <a-card v-if="imageResult" title="生成结果" size="small">
                <img v-if="imageResult.imageUrl" :src="imageResult.imageUrl" style="max-width: 100%" />
                <pre>{{ JSON.stringify(imageResult, null, 2) }}</pre>
              </a-card>
            </a-space>
          </a-card>

          <a-card title="图像理解" style="margin-top: 16px">
            <a-space direction="vertical" style="width: 100%" :size="12">
              <a-upload
                :before-upload="handleImageUpload"
                :show-upload-list="false"
                accept="image/*"
              >
                <a-button>
                  <template #icon>
                    <UploadOutlined />
                  </template>
                  上传图像
                </a-button>
              </a-upload>
              <a-input
                v-model:value="understandPrompt"
                placeholder="输入理解提示词（可选）"
              />
              <a-button @click="understandImage" :loading="loading" :disabled="!uploadedImage">
                理解图像
              </a-button>
              <a-card v-if="understandResult" title="理解结果" size="small">
                <pre>{{ JSON.stringify(understandResult, null, 2) }}</pre>
              </a-card>
            </a-space>
          </a-card>
        </a-tab-pane>

        <a-tab-pane key="audio" tab="音频">
          <a-card title="文本转语音（TTS）">
            <a-space direction="vertical" style="width: 100%" :size="12">
              <a-input
                v-model:value="ttsText"
                placeholder="输入要转换的文本"
              />
              <a-input
                v-model:value="ttsVoice"
                placeholder="语音类型（可选）"
              />
              <a-button type="primary" @click="textToSpeech" :loading="loading">
                转换为语音
              </a-button>
              <a-card v-if="ttsResult" title="转换结果" size="small">
                <audio v-if="ttsResult.audioUrl" :src="ttsResult.audioUrl" controls />
                <pre>{{ JSON.stringify(ttsResult, null, 2) }}</pre>
              </a-card>
            </a-space>
          </a-card>

          <a-card title="语音转文本（STT）" style="margin-top: 16px">
            <a-space direction="vertical" style="width: 100%" :size="12">
              <a-upload
                :before-upload="handleAudioUpload"
                :show-upload-list="false"
                accept="audio/*"
              >
                <a-button>
                  <template #icon>
                    <UploadOutlined />
                  </template>
                  上传音频
                </a-button>
              </a-upload>
              <a-button @click="speechToText" :loading="loading" :disabled="!uploadedAudio">
                转换为文本
              </a-button>
              <a-card v-if="sttResult" title="转换结果" size="small">
                <pre>{{ JSON.stringify(sttResult, null, 2) }}</pre>
              </a-card>
            </a-space>
          </a-card>
        </a-tab-pane>

        <a-tab-pane key="chat" tab="多模态对话">
          <a-card title="多模态对话">
            <a-space direction="vertical" style="width: 100%" :size="12">
              <a-input
                v-model:value="chatText"
                placeholder="输入文本"
              />
              <a-textarea
                v-model:value="imageUrlsText"
                placeholder="输入图像URL列表（每行一个）"
                :rows="4"
              />
              <a-button type="primary" @click="multimodalChat" :loading="loading">
                发送
              </a-button>
              <a-card v-if="chatResult" title="对话结果" size="small">
                <pre>{{ JSON.stringify(chatResult, null, 2) }}</pre>
              </a-card>
            </a-space>
          </a-card>
        </a-tab-pane>
      </a-tabs>
    </a-space>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { UploadOutlined } from '@ant-design/icons-vue'
import { multimodalApi } from '@/api/multimodal'

const loading = ref(false)
const activeTab = ref('image')

// 图像相关
const imagePrompt = ref('')
const imageWidth = ref(1024)
const imageHeight = ref(1024)
const imageResult = ref<any>(null)
const uploadedImage = ref<File | null>(null)
const understandPrompt = ref('')
const understandResult = ref<any>(null)

// 音频相关
const ttsText = ref('')
const ttsVoice = ref('')
const ttsResult = ref<any>(null)
const uploadedAudio = ref<File | null>(null)
const sttResult = ref<any>(null)

// 多模态对话
const chatText = ref('')
const imageUrlsText = ref('')
const chatResult = ref<any>(null)

const generateImage = async () => {
  if (!imagePrompt.value) {
    message.warning('请输入提示词')
    return
  }
  loading.value = true
  try {
    const res = await multimodalApi.generateImage({
      prompt: imagePrompt.value,
      width: imageWidth.value,
      height: imageHeight.value
    })
    imageResult.value = res.data
    message.success('生成成功')
  } catch (error: any) {
    message.error('生成失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const handleImageUpload = (file: File) => {
  uploadedImage.value = file
  message.success('图像上传成功')
  return false
}

const understandImage = async () => {
  if (!uploadedImage.value) {
    message.warning('请先上传图像')
    return
  }
  loading.value = true
  try {
    const res = await multimodalApi.understandImage(uploadedImage.value, understandPrompt.value)
    understandResult.value = res.data
    message.success('理解成功')
  } catch (error: any) {
    message.error('理解失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const textToSpeech = async () => {
  if (!ttsText.value) {
    message.warning('请输入文本')
    return
  }
  loading.value = true
  try {
    const res = await multimodalApi.textToSpeech(ttsText.value, ttsVoice.value)
    ttsResult.value = res.data
    message.success('转换成功')
  } catch (error: any) {
    message.error('转换失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const handleAudioUpload = (file: File) => {
  uploadedAudio.value = file
  message.success('音频上传成功')
  return false
}

const speechToText = async () => {
  if (!uploadedAudio.value) {
    message.warning('请先上传音频')
    return
  }
  loading.value = true
  try {
    const res = await multimodalApi.speechToText(uploadedAudio.value)
    sttResult.value = res.data
    message.success('转换成功')
  } catch (error: any) {
    message.error('转换失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const multimodalChat = async () => {
  if (!chatText.value) {
    message.warning('请输入文本')
    return
  }
  loading.value = true
  try {
    const imageUrls = imageUrlsText.value
      .split('\n')
      .map(url => url.trim())
      .filter(url => url)
    
    const res = await multimodalApi.multimodalChat({
      text: chatText.value,
      imageUrls: imageUrls
    })
    chatResult.value = res.data
    message.success('对话成功')
  } catch (error: any) {
    message.error('对话失败: ' + error.message)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.multimodal-test {
  padding: 16px;
}
</style>

