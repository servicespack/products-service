import process from 'node:process'
import { MongoMemoryReplSet } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { afterAll } from 'vitest'

const mongod = await MongoMemoryReplSet.create({
  replSet: {
    count: 1,
  },
  instanceOpts: [
    {
      launchTimeout: 30000,
    },
  ],
})
const uri = mongod.getUri()

process.env.DATABASE_URI = uri
process.env.JWT_SECRET = 'test-secret'

await mongoose.connect(uri)

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})
