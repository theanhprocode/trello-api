import exppress from 'express'
import { StatusCodes } from 'http-status-codes'
import { boardRoute } from './boardRoute.js'
import { columnRoute } from './columnRoute.js'
import { cardRoute } from './cardRoute.js'

const Router = exppress.Router()

Router.get('/status', (req, res) => {
  res.status(StatusCodes.OK).json({ message: 'Trello API is running' })
})

Router.use('/boards', boardRoute)
Router.use('/columns', columnRoute)
Router.use('/cards', cardRoute)

export const API_V1 = Router