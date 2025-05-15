
import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'

const createNew = async(req, res) => {
  const correctCondition = Joi.object({
    title: Joi.string().required().min(3).max(50).trim().strict().message({
      'any.required': 'Title is required',
      'string.empty': 'Title cannot be empty',
      'string.min': 'Title must be at least 3 characters long',
      'string.max': 'Title must be at most 50 characters long',
      'string.trim': 'Title cannot contain leading or trailing whitespace'
    }),
    description: Joi.string().required().min(3).max(256).trim().strict()
  })

  try {
    console.log('Request Body:', req.body)

    await correctCondition.validateAsync(req.body, { abortEarly: false })

    // next()
    res.status(StatusCodes.CREATED).json({ message: 'Post Validation: Trello API create new Board is running' })
  }
  catch (error) {
    console.log(error)
    // console.log(new Error(error))
    res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({ error: new Error(error).message })
  }
}

export const boardValidation = { createNew }