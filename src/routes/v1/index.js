import exppress from 'express'
import { StatusCodes } from 'http-status-codes'
import { boardRoute } from './boardRoute.js'

const Router = exppress.Router()

Router.get('/status', (req, res) => {
  res.status(StatusCodes.OK).json({ message: 'Trello API is running' })
})

Router.use('/boards', boardRoute)

export const API_V1 = Router