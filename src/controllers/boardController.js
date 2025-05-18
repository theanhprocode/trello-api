import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError.js'


const createNew = async (req, res, next) => {
  try {
    // console.log('Request Body:', req.body)
    // res.status(StatusCodes.CREATED).json({ message: 'Post Controller: Trello API create new Board is running' })

    throw new ApiError(StatusCodes.BAD_GATEWAY, 'Error: Something went wrong!')
  } catch (error) { next(error) }
}


export const boardController = { createNew }