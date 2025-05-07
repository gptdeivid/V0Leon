import ChatInterface from "@/components/chat-interface"
import Image from "next/image"
import { Card } from "@/components/ui/card"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col items-center mb-10">
            <div className="relative">
              <div className="absolute -inset-1 bg-[#d5522b]/10 rounded-full blur-md"></div>
              <Image
                src="/images/global-ai-bootcamp-logo.png"
                alt="Global AI Bootcamp León 2025 Logo"
                width={180}
                height={180}
                className="relative"
              />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-center text-[#d5522b] mt-6">
              Global AI Bootcamp León 2025
            </h1>
            <p className="text-gray-600 mt-2 text-center max-w-2xl">
              Explora el potencial de la inteligencia artificial con nuestro asistente virtual
            </p>
          </div>

          <ChatInterface />

          <footer className="mt-12 text-center text-gray-500 text-sm">
            <Card className="p-4 bg-white/80 shadow-sm">
              <p>© 2025 Global AI Bootcamp León. Todos los derechos reservados.</p>
              <p className="mt-1">Desarrollado con tecnología de Azure OpenAI para el Global AI Bootcamp León 2025.</p>
            </Card>
          </footer>
        </div>
      </div>
    </main>
  )
}
