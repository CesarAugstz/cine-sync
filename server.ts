import { createServer } from 'node:http'
import next from 'next'
import { WebSocketService } from './src/lib/websocket/websocket-service'

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || 'localhost'
const port = 3000

const app = next({ dev, hostname, port })
const handler = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer(handler)
  const webSocketService = new WebSocketService(httpServer)

  process.on('SIGINT', () => {
    console.log('Shutting down gracefully...')
    webSocketService.shutdown()
    process.exit(0)
  })

  process.on('SIGTERM', () => {
    console.log('Shutting down gracefully...')
    webSocketService.shutdown()
    process.exit(0)
  })

  httpServer
    .once('error', err => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
      console.log('> WebSocket service initialized')
    })
})
