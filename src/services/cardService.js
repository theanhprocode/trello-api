/* eslint-disable no-useless-catch */
import ApiError from '~/utils/ApiError'
// import { slugify } from '~/utils/formatters'
import { cardModel } from '~/models/cardModel'
import { StatusCodes } from 'http-status-codes'
// import { cloneDeep } from 'lodash'
import { columnModel } from '~/models/columnModel'


const createNew = async (reqBody) => {
  try {
    const newCard = {
      ...reqBody
    }

    const createdCard = await cardModel.createNew(newCard)
    // console.log('createCard', createdCard)
    const getNewCard = await cardModel.findOneById(createdCard.insertedId)

    if (getNewCard) {
      await columnModel.pushCardOrderIds(getNewCard)
    }

    return getNewCard
  } catch (error) {
    throw error
  }
}

const deleteCardItem = async (cardId) => {
  try {
    // xoá card trong column đó
    await cardModel.deleteCardOne(cardId)

    return { deleteResult: 'Card đã xoá thành công!' }
  } catch (error) {
    throw error
  }
}

const updateCardTitle = async (cardId, newTitle) => {
  try {
    const updatedCard = await cardModel.updateTitle(cardId, newTitle)

    if (!updatedCard) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Card not found!')
    }

    return updatedCard
  } catch (error) {
    throw error
  }
}

export const cardService = {
  createNew,
  deleteCardItem,
  updateCardTitle
}