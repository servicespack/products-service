import { configuration, connectDatabase, cooldown, logger } from './config'
import { server } from './infrastructure/http/server'

async function main() {
  await connectDatabase()

  const port = configuration.servers.http.port

  server.listen(port, () => {
    logger.info(`Server listening on ${port}`)
  })

  cooldown({ server })
}

export default main()
