import { StatusCodes } from 'http-status-codes'
import { cardService } from '~/services/cardService'


const createNew = async (req, res, next) => {
  try {
    const createCard = await cardService.createNew(req.body)
    res.status(StatusCodes.CREATED).json(createCard)
  } catch (error) { next(error) }
}

const deleteCardItem = async (req, res, next) => {
  try {
    // console.log('req.params: ', req.params)
    const cardId = req.params.id
    const result = await cardService.deleteCardItem(cardId)

    res.status(StatusCodes.OK).json(result)
  } catch (error) { next(error) }
}

const updateCardTitle = async (req, res, next) => {
  try {
    const cardId = req.params.id
    const { title } = req.body

    const updatedCard = await cardService.updateCardTitle(cardId, title)

    res.status(StatusCodes.OK).json(updatedCard)
  } catch (error) {
    next(error)
  }
}


export const cardController = { createNew, deleteCardItem, updateCardTitle }