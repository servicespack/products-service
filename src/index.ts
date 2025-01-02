import process from 'node:process'

async function main() {
  const [
    { database },
    { logger },
    { server },
  ] = await Promise.all([
    import('./config/database.config'),
    import('./logger'),
    import('./server'),
  ])

  await database
    .orm
    .getSchemaGenerator()
    .updateSchema()

  const { SERVER_PORT } = process.env

  server.listen(SERVER_PORT, () => logger.info(`Server listening on ${SERVER_PORT}`))
}

export default main()
