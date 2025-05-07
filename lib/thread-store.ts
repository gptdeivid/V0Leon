// Simple in-memory store for threads
// In a production app, you would use a database
export class ThreadStore {
  private static threads: Map<string, string> = new Map()

  static getThread(userId: string): string | undefined {
    return this.threads.get(userId)
  }

  static setThread(userId: string, threadId: string): void {
    this.threads.set(userId, threadId)
  }
}
