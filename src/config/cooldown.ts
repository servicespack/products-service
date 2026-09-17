import type http from 'node:http'
import process from 'node:process'
import mongoose from 'mongoose'
import { logger } from './logger'

function cooldown({ server }: {
  server: http.Server
}): void {
  const close = (code: number) => () => {
    logger.info('Graceful shutdown initiated')

    const timer = setTimeout(() => {
      logger.error('Graceful shutdown timed out, force exiting')
      process.exit(code)
    }, 10000)

    server.close(() => {
      mongoose.disconnect()
        .then(() => {
          clearTimeout(timer)
          process.exit(code)
        })
        .catch((error) => {
          clearTimeout(timer)
          logger.error(error)
          process.exit(code)
        })
    })
  }

  process.on('SIGHUP', close(128 + 1))
  process.on('SIGINT', close(128 + 2))
  process.on('SIGTERM', close(128 + 15))
}

export default cooldown
