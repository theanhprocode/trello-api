import express from 'express'
import { StatusCodes } from 'http-status-codes'

const Router = express.Router()

Router.route('/')
  .get((req, res) => {
    res.status(StatusCodes.OK).json({ message: 'Get: Trello API Board is running' })
  })
  .post((req, res) => {
    res.status(StatusCodes.CREATED).json({ message: 'Post: Trello API create new Board is running' })
  })

export const boardRoutes = Router