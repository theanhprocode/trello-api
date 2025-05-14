
import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'

const createNew = (req, res) => {
  const correctCondition = Joi.object({
    title: Joi.string().required().min(3).max(50).trim().strict(),
    description: Joi.string().required().min(3).max(256).trim().strict()
  })

  try {
    console.log('Request Body:', req.body)
    res.status(StatusCodes.CREATED).json({ message: 'Post Validation: Trello API create new Board is running' })
  }
  catch (error) {
    console.log(error)
    // console.log(new Error(error))
    res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({ error: new Error(error).message })
  }
}

export const boardValidation = { createNew }