import type { AIProvider, Message } from "ai"

export class AzureOpenAIProvider implements AIProvider {
  private endpoint: string
  private apiKey: string
  private deployment: string

  constructor(options: {
    endpoint: string
    apiKey: string
    deployment: string
  }) {
    this.endpoint = options.endpoint
    this.apiKey = options.apiKey
    this.deployment = options.deployment
  }

  static create(options: {
    endpoint: string
    apiKey: string
    deployment: string
  }): AIProvider {
    return new AzureOpenAIProvider(options)
  }

  async generateText(options: {
    prompt: string
    system?: string
  }): Promise<{ text: string }> {
    const response = await fetch(
      `${this.endpoint}/openai/deployments/${this.deployment}/chat/completions?api-version=2023-05-15`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": this.apiKey,
        },
        body: JSON.stringify({
          messages: [
            ...(options.system ? [{ role: "system", content: options.system }] : []),
            { role: "user", content: options.prompt },
          ],
        }),
      },
    )

    if (!response.ok) {
      throw new Error(`Azure OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    return { text: data.choices[0].message.content }
  }

  async generateTextStream(options: {
    prompt: string
    system?: string
    messages?: Message[]
    onChunk: (chunk: { text: string }) => void
  }): Promise<{ text: string }> {
    const messages = options.messages || [{ role: "user", content: options.prompt }]

    if (options.system) {
      messages.unshift({ role: "system", content: options.system })
    }

    const response = await fetch(
      `${this.endpoint}/openai/deployments/${this.deployment}/chat/completions?api-version=2023-05-15`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": this.apiKey,
        },
        body: JSON.stringify({
          messages: messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
            ...(msg.experimental_attachments
              ? {
                  file_ids: msg.experimental_attachments.map((attachment) => attachment.id),
                }
              : {}),
          })),
          stream: true,
        }),
      },
    )

    if (!response.ok) {
      throw new Error(`Azure OpenAI API error: ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let fullText = ""

    if (reader) {
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split("\n").filter((line) => line.trim() !== "" && line.trim() !== "data: [DONE]")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6))
                if (data.choices && data.choices[0].delta.content) {
                  const text = data.choices[0].delta.content
                  fullText += text
                  options.onChunk({ text })
                }
              } catch (e) {
                console.error("Error parsing JSON:", e)
              }
            }
          }
        }
      } finally {
        reader.releaseLock()
      }
    }

    return { text: fullText }
  }
}
