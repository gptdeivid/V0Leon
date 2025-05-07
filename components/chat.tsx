"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useChat } from "@ai-sdk/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Paperclip, Send, FileText } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

export default function Chat() {
  const [files, setFiles] = useState<FileList | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isPdfUploaded, setIsPdfUploaded] = useState(false)

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
    onResponse: () => {
      // Clear files after sending
      setFiles(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Check if any of the files is a PDF
      const hasPdf = Array.from(e.target.files).some((file) => file.type === "application/pdf")
      setIsPdfUploaded(hasPdf)
      setFiles(e.target.files)
    } else {
      setIsPdfUploaded(false)
      setFiles(null)
    }
  }

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    handleSubmit(e, {
      experimental_attachments: files || undefined,
    })
  }

  return (
    <div className="flex flex-col h-[80vh] w-full">
      <Card className="flex-1 mb-4">
        <CardContent className="p-4 h-full">
          <ScrollArea className="h-full pr-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                <div>
                  <FileText className="mx-auto h-12 w-12 mb-2" />
                  <p>Upload a PDF and ask questions about it</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex flex-col max-w-[80%] rounded-lg p-4",
                      message.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted",
                    )}
                  >
                    <div className="text-sm font-medium mb-1">{message.role === "user" ? "You" : "AI Assistant"}</div>
                    <div className="whitespace-pre-wrap">{message.content}</div>

                    {/* Display PDF attachments */}
                    {message.role === "user" &&
                      message.experimental_attachments?.map((attachment, index) => {
                        if (attachment.contentType === "application/pdf") {
                          return (
                            <div key={index} className="mt-2 flex items-center text-xs">
                              <FileText className="h-4 w-4 mr-1" />
                              <span>{attachment.name}</span>
                            </div>
                          )
                        }
                        return null
                      })}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <form onSubmit={handleFormSubmit} className="flex items-end gap-2">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className={cn(isPdfUploaded && "bg-green-100")}
            >
              <Paperclip className={cn("h-4 w-4", isPdfUploaded && "text-green-600")} />
            </Button>
            <Input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
              multiple
            />
            {isPdfUploaded && <span className="text-xs text-green-600">PDF ready to upload</span>}
          </div>
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask a question about your PDF..."
            className="flex-1"
          />
        </div>
        <Button type="submit" size="icon" disabled={isLoading}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
