/* eslint-disable no-console */
import express from 'express'
import cors from 'cors'
import { corsOptions } from '~/config/cors'
import { CONNECT_DB, CLOSE_DB } from '~/config/mongodb'
import exitHook from 'async-exit-hook'
import { env } from '~/config/environment'
import { API_V1 } from '~/routes/v1/index.js'
import { errorHandlingMiddleware } from '~/middlewares/errorHandlingMiddleware'
import cookieParser from 'cookie-parser'
// Xử lý socket.io
import socketIo from 'socket.io'
import http from 'http'
import { inviteUserToBoardSocket } from '~/sockets/inviteUserToBoardSocket'
import { onlineUserSocket } from '~/sockets/onlineUserSocket'


const START_SERVER = () => {
  const app = express()

  // fix from disk cache của expressJs
  app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store')
    next()
  })

  // Cấu hình cookieParser
  app.use(cookieParser())

  app.use(cors(corsOptions))

  app.use(express.json())

  app.use('/v1', API_V1)

  // ping server
  app.get('/ping', (req, res) => {
    res.status(200).send('pong')
  })

  app.get('/', async (req, res) => {
    res.end('<h1>Hello World!</h1><hr>')
  })

  // middleware xử lý lỗi tập trung
  app.use(errorHandlingMiddleware)

  // Tạo server mới để tích hợp socket.io
  const server = http.createServer(app)
  // Khởi tạo bien socket.io với server và cors
  const io = new socketIo.Server(server, { cors: corsOptions })
  // Lắng nghe kết nối từ client
  io.on('connection', (socket) => {
    inviteUserToBoardSocket(io, socket)
    onlineUserSocket(io, socket)
  })

  if (env.BUILD_MODE === 'production') {
    server.listen(process.env.PORT, () => {
    // eslint-disable-next-line no-console
      console.log(`Production: Hello ${env.AUTHOR}, I am running at port: ${process.env.PORT}`)
    })
  } else {
    server.listen(env.LOCAL_DEV_APP_PORT, env.LOCAL_DEV_APP_HOST, () => {
    // eslint-disable-next-line no-console
      console.log(`Hello ${env.AUTHOR}, I am running at http://${env.LOCAL_DEV_APP_HOST}:${env.LOCAL_DEV_APP_PORT}/`)
    })
  }

  // app.listen(env.APP_PORT, env.APP_HOST, () => {
  //   // eslint-disable-next-line no-console
  //   console.log(`Hello ${env.AUTHOR}, I am running at http://${env.APP_HOST}:${env.APP_PORT}/`)
  // })

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