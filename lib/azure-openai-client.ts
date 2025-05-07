export class AzureOpenAIClient {
  private apiKey: string
  private endpoint: string
  private apiVersion = "2024-02-15-preview"
  private assistantId: string

  constructor() {
    this.apiKey = process.env.AZURE_OPENAI_API_KEY || ""
    this.endpoint = process.env.AZURE_OPENAI_ENDPOINT || ""
    this.assistantId = process.env.AZURE_OPENAI_ASSISTANT_ID || ""

    if (!this.apiKey || !this.endpoint || !this.assistantId) {
      throw new Error("Azure OpenAI credentials not configured")
    }
  }

  private async fetchWithAuth(url: string, options: RequestInit = {}) {
    try {
      const headers = {
        "Content-Type": "application/json",
        "api-key": this.apiKey,
        ...options.headers,
      }

      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        let errorText
        try {
          const errorJson = await response.json()
          errorText = JSON.stringify(errorJson)
        } catch (e) {
          errorText = await response.text()
        }
        throw new Error(`Azure OpenAI API error: ${response.status} ${errorText}`)
      }

      return response
    } catch (error) {
      console.error("Error in fetchWithAuth:", error)
      throw error
    }
  }

  async getAssistant() {
    try {
      const url = `${this.endpoint}/openai/assistants/${this.assistantId}?api-version=${this.apiVersion}`
      const response = await this.fetchWithAuth(url)
      return response.json()
    } catch (error) {
      console.error("Error getting assistant:", error)
      throw error
    }
  }

  async createThread() {
    try {
      const url = `${this.endpoint}/openai/threads?api-version=${this.apiVersion}`

      const response = await this.fetchWithAuth(url, {
        method: "POST",
        body: JSON.stringify({}),
      })

      return response.json()
    } catch (error) {
      console.error("Error creating thread:", error)
      throw error
    }
  }

  async addMessageToThread(threadId: string, content: string) {
    try {
      const url = `${this.endpoint}/openai/threads/${threadId}/messages?api-version=${this.apiVersion}`

      const response = await this.fetchWithAuth(url, {
        method: "POST",
        body: JSON.stringify({
          role: "user",
          content,
        }),
      })

      return response.json()
    } catch (error) {
      console.error("Error adding message to thread:", error)
      throw error
    }
  }

  async runThread(threadId: string) {
    try {
      const url = `${this.endpoint}/openai/threads/${threadId}/runs?api-version=${this.apiVersion}`

      const response = await this.fetchWithAuth(url, {
        method: "POST",
        body: JSON.stringify({
          assistant_id: this.assistantId,
        }),
      })

      return response.json()
    } catch (error) {
      console.error("Error running thread:", error)
      throw error
    }
  }

  async getRunStatus(threadId: string, runId: string) {
    try {
      const url = `${this.endpoint}/openai/threads/${threadId}/runs/${runId}?api-version=${this.apiVersion}`

      const response = await this.fetchWithAuth(url)
      return response.json()
    } catch (error) {
      console.error("Error getting run status:", error)
      throw error
    }
  }

  async getMessages(threadId: string) {
    try {
      const url = `${this.endpoint}/openai/threads/${threadId}/messages?api-version=${this.apiVersion}`

      const response = await this.fetchWithAuth(url)
      return response.json()
    } catch (error) {
      console.error("Error getting messages:", error)
      throw error
    }
  }
}
