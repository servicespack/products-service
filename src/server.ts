import type { Router } from 'express'
import express from 'express'

export function createServer(productsRouter: Router) {
    const server = express()

    server.use(express.json())
    server.use(productsRouter)

    return server
}
