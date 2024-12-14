async function main() {
  const [
    { logger },
    { server }
  ] = await Promise.all([
    import('./logger'),
    import('./server')
  ])

  const { SERVER_PORT } = process.env

  server.listen(SERVER_PORT, () => logger.info(`Server listening on ${SERVER_PORT}`))
}

main()
