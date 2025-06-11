/* eslint-disable no-useless-catch */
import ApiError from '~/utils/ApiError'
import { slugify } from '~/utils/formatters'
import { cardModel } from '~/models/cardModel'
import { StatusCodes } from 'http-status-codes'
import { cloneDeep } from 'lodash'


const createNew = async (reqBody) => {
  try {
    const newCard = {
      ...reqBody
    }

    const createdCard = await cardModel.createNew(newCard)
    // console.log('createCard', createdCard)
    const getNewCard = await cardModel.findOneById(createdCard.insertedId)

    //

    return getNewCard
  } catch (error) {
    throw error
  }
}


export const cardService = {
  createNew
}