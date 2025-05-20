import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError.js'
import { boardService } from '~/services/boardService'


const createNew = async (req, res, next) => {
  try {
    // console.log('Request Body:', req.body)
    // res.status(StatusCodes.CREATED).json({ message: 'Post Controller: Trello API create new Board is running' })

    const createBoard = await boardService.createNew(req.body)
    res.status(StatusCodes.CREATED).json(createBoard)
  } catch (error) { next(error) }
}


export const boardController = { createNew }