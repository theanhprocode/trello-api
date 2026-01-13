/* eslint-disable no-useless-catch */
// import ApiError from '~/utils/ApiError'
// import { slugify } from '~/utils/formatters'
import { cardModel } from '~/models/cardModel'
// import { StatusCodes } from 'http-status-codes'
// import { cloneDeep } from 'lodash'
import { columnModel } from '~/models/columnModel'
import { CloudinaryProvider } from '~/providers/cloudinaryProvider'


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

const update = async (cardId, reqBody, cardCoverFile, userInfo) => {
  try {
    const updatedData = {
      ...reqBody,
      updatedAt: Date.now()
    }

    let updatedCard = {}

    if (cardCoverFile) {
      const uploadResult = await CloudinaryProvider.streamUpload(cardCoverFile.buffer, 'card-covers')
      // Lưu url trả về từ cloudinary vào database
      updatedCard = await cardModel.update(cardId, { cover: uploadResult.secure_url })
    } else if (updatedData.commentToAdd) {
      // Trường hợp thêm comment
      const commentData = {
        ...updatedData.commentToAdd,
        commentedAt: Date.now(),
        userId: userInfo.userId,
        userEmail: userInfo.email
      }
      updatedCard = await cardModel.unshiftNewComment(cardId, commentData)
    } else {
      // các trường hợp update chung
      updatedCard = await cardModel.update(cardId, updatedData)
    }

    return updatedCard
  } catch (error) {
    throw error
  }
}

export const cardService = {
  createNew,
  deleteCardItem,
  update
}