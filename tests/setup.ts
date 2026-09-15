import process from 'node:process'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { afterAll } from 'vitest'

const mongod = await MongoMemoryServer.create({
  instance: {
    launchTimeout: 30000,
  },
})
const uri = mongod.getUri()

process.env.DATABASE_URI = uri

await mongoose.connect(uri)

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})
