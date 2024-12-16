import express from 'express'

import { router as ProductsRouter } from './routers/products.router'

const server = express()

server.use(express.json())
server.use(ProductsRouter)

export { server }
