import exppress from 'express'
import { StatusCodes } from 'http-status-codes'
import { boardRoutes } from './boardRoutes.js'

const Router = exppress.Router()

Router.get('/status', (req, res) => {
  res.status(StatusCodes.OK).json({ message: 'Trello API is running' })
})

Router.use('/boards', boardRoutes)

export const API_V1 = Router