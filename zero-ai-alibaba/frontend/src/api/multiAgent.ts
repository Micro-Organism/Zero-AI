/**
 * 多智能体 API
 */

export interface MultiAgentChatRequest {
  message: string
  threadId?: string
  userId?: string
}

export interface MultiAgentChatResponse {
  response: string
  threadId: string
  mode: string
}

/**
 * SupervisorAgent 模式对话
 */
export async function supervisorChat(request: MultiAgentChatRequest): Promise<MultiAgentChatResponse> {
  const response = await fetch('/api/multi-agent/supervisor/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: request.message,
      threadId: request.threadId || '',
      userId: request.userId || '1',
    }),
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return await response.json()
}

/**
 * SequentialAgent 模式对话
 */
export async function sequentialChat(request: MultiAgentChatRequest): Promise<MultiAgentChatResponse> {
  const response = await fetch('/api/multi-agent/sequential/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: request.message,
      threadId: request.threadId || '',
      userId: request.userId || '1',
    }),
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return await response.json()
}

/**
 * CoordinatorAgent 模式对话
 */
export async function coordinatorChat(request: MultiAgentChatRequest): Promise<MultiAgentChatResponse> {
  const response = await fetch('/api/multi-agent/coordinator/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: request.message,
      threadId: request.threadId || '',
      userId: request.userId || '1',
    }),
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return await response.json()
}

/**
 * SupervisorAgent 流式对话
 */
export async function supervisorChatStream(
  request: MultiAgentChatRequest,
  callbacks: {
    onMessage?: (chunk: string) => void
    onDone?: (fullMessage: string) => void
    onError?: (error: string) => void
    onThreadId?: (threadId: string) => void
  }
): Promise<void> {
  const response = await fetch('/api/multi-agent/supervisor/chat/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: request.message,
      threadId: request.threadId || '',
      userId: request.userId || '1',
    }),
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('无法获取响应流')
  }

  const decoder = new TextDecoder()
  let buffer = ''
  let currentEvent = ''
  let currentData = ''
  let messageBuffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('event:')) {
        currentEvent = line.substring(6).trim()
        currentData = ''
      } else if (line.startsWith('data:')) {
        const data = line.substring(5).trim()
        currentData += data

        if (currentEvent === 'threadId') {
          callbacks.onThreadId?.(data)
        } else if (currentEvent === 'message') {
          messageBuffer += data
          callbacks.onMessage?.(data)
        } else if (currentEvent === 'done') {
          callbacks.onDone?.(messageBuffer)
          messageBuffer = ''
        } else if (currentEvent === 'error') {
          callbacks.onError?.(data)
        }
      }
    }
  }
}

/**
 * SequentialAgent 流式对话
 */
export async function sequentialChatStream(
  request: MultiAgentChatRequest,
  callbacks: {
    onMessage?: (chunk: string) => void
    onDone?: (fullMessage: string) => void
    onError?: (error: string) => void
    onThreadId?: (threadId: string) => void
  }
): Promise<void> {
  const response = await fetch('/api/multi-agent/sequential/chat/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: request.message,
      threadId: request.threadId || '',
      userId: request.userId || '1',
    }),
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('无法获取响应流')
  }

  const decoder = new TextDecoder()
  let buffer = ''
  let currentEvent = ''
  let currentData = ''
  let messageBuffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('event:')) {
        currentEvent = line.substring(6).trim()
        currentData = ''
      } else if (line.startsWith('data:')) {
        const data = line.substring(5).trim()
        currentData += data

        if (currentEvent === 'threadId') {
          callbacks.onThreadId?.(data)
        } else if (currentEvent === 'message') {
          messageBuffer += data
          callbacks.onMessage?.(data)
        } else if (currentEvent === 'done') {
          callbacks.onDone?.(messageBuffer)
          messageBuffer = ''
        } else if (currentEvent === 'error') {
          callbacks.onError?.(data)
        }
      }
    }
  }
}

/**
 * CoordinatorAgent 流式对话
 */
export async function coordinatorChatStream(
  request: MultiAgentChatRequest,
  callbacks: {
    onMessage?: (chunk: string) => void
    onDone?: (fullMessage: string) => void
    onError?: (error: string) => void
    onThreadId?: (threadId: string) => void
  }
): Promise<void> {
  const response = await fetch('/api/multi-agent/coordinator/chat/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: request.message,
      threadId: request.threadId || '',
      userId: request.userId || '1',
    }),
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('无法获取响应流')
  }

  const decoder = new TextDecoder()
  let buffer = ''
  let currentEvent = ''
  let currentData = ''
  let messageBuffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('event:')) {
        currentEvent = line.substring(6).trim()
        currentData = ''
      } else if (line.startsWith('data:')) {
        const data = line.substring(5).trim()
        currentData += data

        if (currentEvent === 'threadId') {
          callbacks.onThreadId?.(data)
        } else if (currentEvent === 'message') {
          messageBuffer += data
          callbacks.onMessage?.(data)
        } else if (currentEvent === 'done') {
          callbacks.onDone?.(messageBuffer)
          messageBuffer = ''
        } else if (currentEvent === 'error') {
          callbacks.onError?.(data)
        }
      }
    }
  }
}

