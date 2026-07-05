import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { GET_DB } from '~/config/mongodb.js'
import { INVITATION_TYPE, BOARD_INVITATION_STATUS } from '~/utils/constants'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'
import { userModel } from '~/models/userModel'
import { boardModel } from '~/models/boardModel.js'

const INVITATION_COLLECTION_NAME = 'invitations'
const INVITATION_COLLECTION_SCHEMA = Joi.object({
  // người gửi lời mời
  inviterId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
  // người nhận lời mời
  inviteeId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
  // loại lời mời
  type: Joi.string().required().valid(...Object.values(INVITATION_TYPE)),
  // lời mời vào board
  boardInvitation: Joi.object({
    boardId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
    status: Joi.string().required().valid(...Object.values(BOARD_INVITATION_STATUS))
  }).optional(),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

const INVALID_UPDATE_FIELDS = ['_id', 'inviterId', 'inviteeId', 'type', 'createdAt']

const validateBeforeCreate = async (data) => {
  return await INVITATION_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

const createNewBoardInvitation = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)
    // Biến đổi dữ liệu liên quan tới ObjectId
    let newInvitationToAdd = {
      ...validData,
      inviterId: new ObjectId(validData.inviterId),
      inviteeId: new ObjectId(validData.inviteeId)
    }

    if (validData.boardInvitation) {
      newInvitationToAdd.boardInvitation = {
        ...validData.boardInvitation,
        boardId: new ObjectId(validData.boardInvitation.boardId)
      }
    }
    // Gọi insert vào DB
    const createInvitation = await GET_DB().collection(INVITATION_COLLECTION_NAME).insertOne(newInvitationToAdd)
    return createInvitation
  } catch (error) { throw new Error(error) }
}

const findOneById = async (invitationId) => {
  try {
    const result = await GET_DB().collection(INVITATION_COLLECTION_NAME).findOne({ _id: new ObjectId(invitationId) })
    return result
  } catch (error) { throw new Error(error) }
}

const update = async (invitationId, updateData) => {
  try {
    // Loại bỏ các trường không được phép update
    Object.keys(updateData).forEach(fieldName => {
      if (INVALID_UPDATE_FIELDS.includes(fieldName)) {
        delete updateData[fieldName] // Xóa các trường không được phép cập nhật
      }
    })

    if (updateData.boardInvitation) {
      updateData.boardInvitation = {
        ...updateData.boardInvitation,
        boardId: new ObjectId(updateData.boardInvitation.boardId)
      }
    }

    const result = await GET_DB().collection(INVITATION_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(invitationId) },
      { $set: updateData },
      { returnDocument: 'after' }
    )
    return result
  } catch (error) { throw new Error(error) }
}

// Lấy tất cả lời mời dành cho user
const findByUser = async (userId) => {
  try {
    const queryCondition = [
      { inviteeId: new ObjectId(userId) }, //Tìm theo inviteeId
      { _destroy: false }
    ]

    const results = await GET_DB().collection(INVITATION_COLLECTION_NAME).aggregate([
      { $match: { $and: queryCondition } },
      { $lookup: {
        from: userModel.USER_COLLECTION_NAME,
        localField: 'inviterId', // Người gửi lời mời
        foreignField: '_id',
        as: 'inviter',
        pipeline: [{ $project: { 'password': 0, 'verifyToken': 0 } }]
      } },
      { $lookup: {
        from: userModel.USER_COLLECTION_NAME,
        localField: 'inviteeId', // Người nhận lời mời
        foreignField: '_id',
        as: 'invitee',
        pipeline: [{ $project: { 'password': 0, 'verifyToken': 0 } }]
      } },
      { $lookup: {
        from: boardModel.BOARD_COLLECTION_NAME,
        localField: 'boardInvitation.boardId', // Thông tin của board được mời
        foreignField: '_id',
        as: 'board'
      } }
    ]).toArray()

    return results

  } catch (error) {
    throw new Error(error)
  }
}

const deleteOneById = async (invitationId) => {
  return await GET_DB().collection(INVITATION_COLLECTION_NAME).deleteOne({ _id: new ObjectId(invitationId) })
}

const deleteManyByIds = async (invitationIds) => {
  const objectIds = invitationIds.map(id => new ObjectId(id))
  return await GET_DB().collection(INVITATION_COLLECTION_NAME)
    .deleteMany({ _id: { $in: objectIds } })
}

export const invitationModel = {
  INVITATION_COLLECTION_NAME,
  INVITATION_COLLECTION_SCHEMA,
  createNewBoardInvitation,
  findOneById,
  update,
  deleteOneById,
  deleteManyByIds,
  findByUser
}
