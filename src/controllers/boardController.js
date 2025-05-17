import { StatusCodes } from 'http-status-codes'


const createNew = async (req, res) => {
  try {
    console.log('Request Body:', req.body)
    res.status(StatusCodes.CREATED).json({ message: 'Post Controller: Trello API create new Board is running' })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      errors: error.message
    })
  }
}


export const boardController = { createNew }