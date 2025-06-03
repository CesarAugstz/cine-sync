export class WSErrorResponse extends Error {
  message: string
  success: boolean

  constructor(message: string, cause?: any) {
    super(message)
    this.message = message
    this.success = false
    this.cause = cause
  }

  toString(): string {
    const parts: string[] = []
    parts.push(`${this.name}: ${this.message}`)

    if (this.message) parts.push(`Message: ${this.message}`)

    if (this.cause) {
      parts.push('Caused by:')
      parts.push(
        this.cause instanceof Object
          ? this.cause.toString()
          : String(this.cause),
      )
    }

    return parts.join('\n')
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      cause: this.cause,
      stack: this.stack,
    }
  }
}
