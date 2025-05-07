import { type NextRequest, NextResponse } from "next/server"
import { AzureOpenAIClient } from "@/lib/azure-openai-client"
import { ThreadStore } from "@/lib/thread-store"

export const runtime = "nodejs"
export const maxDuration = 60

// Helper function to ensure we always return a JSON response
function jsonResponse(data: any, status = 200) {
  return new NextResponse(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  })
}

export async function POST(req: NextRequest) {
  try {
    // Parse form data
    let formData
    try {
      formData = await req.formData()
    } catch (error) {
      console.error("Error parsing form data:", error)
      return jsonResponse({ error: "Datos de formulario inválidos" }, 400)
    }

    const message = formData.get("message") as string

    // Use a simple user ID for demo purposes
    const userId = "user-1"

    // Validate environment variables
    if (!process.env.AZURE_OPENAI_API_KEY) {
      return jsonResponse({ error: "Azure OpenAI API Key no configurada" }, 500)
    }

    if (!process.env.AZURE_OPENAI_ENDPOINT) {
      return jsonResponse({ error: "Azure OpenAI Endpoint no configurado" }, 500)
    }

    if (!process.env.AZURE_OPENAI_ASSISTANT_ID) {
      return jsonResponse({ error: "Azure OpenAI Assistant ID no configurado" }, 500)
    }

    let client
    try {
      client = new AzureOpenAIClient()
    } catch (error: any) {
      console.error("Error creating Azure OpenAI client:", error)
      return jsonResponse({ error: `Error al inicializar el cliente de Azure OpenAI: ${error.message}` }, 500)
    }

    // Get existing thread or create a new one
    let threadId = ThreadStore.getThread(userId)
    if (!threadId) {
      try {
        const thread = await client.createThread()
        threadId = thread.id
        ThreadStore.setThread(userId, threadId)
      } catch (error: any) {
        console.error("Error creating thread:", error)
        return jsonResponse({ error: `Error al crear el hilo de conversación: ${error.message}` }, 500)
      }
    }

    // Log the message we're sending
    console.log(`Sending message to thread ${threadId}: ${message.substring(0, 100)}...`)

    // Add message to thread
    try {
      await client.addMessageToThread(threadId, message)
    } catch (error: any) {
      console.error("Error adding message to thread:", error)
      return jsonResponse({ error: `Error al añadir mensaje al hilo: ${error.message}` }, 500)
    }

    // Run the thread with the configured assistant
    let run
    try {
      run = await client.runThread(threadId)
    } catch (error: any) {
      console.error("Error running thread:", error)
      return jsonResponse({ error: `Error al ejecutar el hilo: ${error.message}` }, 500)
    }

    // Poll for completion
    let runStatus
    let attempts = 0
    const maxAttempts = 60 // 60 seconds timeout

    try {
      runStatus = await client.getRunStatus(threadId, run.id)

      while (
        runStatus.status !== "completed" &&
        runStatus.status !== "failed" &&
        runStatus.status !== "cancelled" &&
        attempts < maxAttempts
      ) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        runStatus = await client.getRunStatus(threadId, run.id)
        attempts++

        // Log status every 10 attempts
        if (attempts % 10 === 0) {
          console.log(`Run status after ${attempts} seconds: ${runStatus.status}`)
        }
      }

      if (runStatus.status === "failed") {
        return jsonResponse(
          {
            error: `Ejecución fallida: ${runStatus.last_error?.message || "Error desconocido"}`,
          },
          500,
        )
      }

      if (runStatus.status === "cancelled") {
        return jsonResponse({ error: "La ejecución fue cancelada" }, 500)
      }

      if (runStatus.status !== "completed") {
        return jsonResponse({ error: "Tiempo de procesamiento agotado" }, 408)
      }
    } catch (error: any) {
      console.error("Error checking run status:", error)
      return jsonResponse({ error: `Error al verificar el estado de la ejecución: ${error.message}` }, 500)
    }

    // Get messages
    try {
      const messages = await client.getMessages(threadId)
      return jsonResponse({ messages: messages.data })
    } catch (error: any) {
      console.error("Error getting messages:", error)
      return jsonResponse({ error: `Error al obtener mensajes: ${error.message}` }, 500)
    }
  } catch (error: any) {
    // Catch-all error handler
    console.error("Unhandled error in chat API:", error)
    return jsonResponse({ error: `Ocurrió un error inesperado: ${error.message}` }, 500)
  }
}
