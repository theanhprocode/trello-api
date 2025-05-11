/* eslint-disable no-console */
import express from 'express'
import { CONNECT_DB, GET_DB, CLOSE_DB } from '~/config/mongodb'
import exitHook from 'async-exit-hook'
// import 'dotenv/config'
import { env } from '~/config/environment'


const START_SERVER = () => {
  const app = express()


  app.get('/', async (req, res) => {
    res.end('<h1>Hello World!</h1><hr>')
  })

  app.listen(env.APP_PORT, env.APP_HOST, () => {
    // eslint-disable-next-line no-console
    console.log(`Hello ${env.AUTHOR}, I am running at http://${env.APP_PORT}:${env.APP_HOST}/`)
  })

  exitHook(() => {
    CLOSE_DB()
  })
}


(async () => {
  try {
    console.log('Connecting to MongoDB...')
    await CONNECT_DB()
    console.log('Connected to MongoDB')

    START_SERVER()
  } catch (error) {
    console.error(error)
    process.exit(0)
  }
})()