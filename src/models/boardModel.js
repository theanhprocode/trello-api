import Joi from 'joi'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'
import { GET_DB } from '~/config/mongodb'
import { ObjectId } from 'mongodb'
import { BOARD_TYPES } from '~/utils/constants'
import { columnModel } from '~/models/columnModel.js'
import { cardModel } from '~/models/cardModel.js'
import { pagingSkipValue } from '~/utils/algorithms.js'
import { userModel } from '~/models/userModel.js'


const BOARD_COLLECTION_NAME = 'boards'
const BOARD_COLLECTION_SCHEMA = Joi.object({
  title: Joi.string().required().min(3).max(50).trim().strict(),
  slug: Joi.string().required().min(3).max(50).trim().strict(),
  description: Joi.string().required().min(3).max(255).trim().strict(),

  type: Joi.string().valid(BOARD_TYPES.PUBLIC, BOARD_TYPES.PRIVATE).required(),

  columnOrderIds: Joi.array().items(
    Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)
  ).default([]),

  // Những admin của board
  ownerIds: Joi.array().items(
    Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)
  ).default([]),

  // Những thành viên của board
  memberIds: Joi.array().items(
    Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)
  ).default([]),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

// Các trường không được phép cập nhật
const INVALID_UPDATE_FIELDS = ['_id', 'createdAt']

const validateBeforeCreate = async (data) => {
  return await BOARD_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

const createNew = async (userId, data) => {
  try {
    const validatedData = await validateBeforeCreate(data)
    const newBoardToAdd = {
      ...validatedData,
      ownerIds: [new ObjectId(userId)]
    }
    // console.log('Validated Data:', validatedData)
    const createBoard = await GET_DB().collection(BOARD_COLLECTION_NAME).insertOne(newBoardToAdd)
    return createBoard
  } catch (error) {
    throw new Error(error)
  }
}

const findOneById = async (id) => {
  try {
    return await GET_DB().collection(BOARD_COLLECTION_NAME).findOne({ _id: new ObjectId(id) })
  } catch (error) {
    throw new Error(error)
  }
}

const getDetails = async (userId, boardId) => {
  try {
    // return await GET_DB().collection(BOARD_COLLECTION_NAME).findOne({ _id: new ObjectId(id) })

    // Sử dụng aggregate để lấy chi tiết board kèm theo các cột (columns) và thẻ (cards) liên quan
    const queryCondition = [
      { _id: new ObjectId(boardId) },
      { _destroy: false },
      { $or: [
        { memberIds: { $all: [new ObjectId(userId)] } },
        { ownerIds: { $all: [new ObjectId(userId)] } }
      ] }
    ]

    const result = await GET_DB().collection(BOARD_COLLECTION_NAME).aggregate([
      { $match: { $and: queryCondition } },
      { $lookup: {
        from: columnModel.COLUMN_COLLECTION_NAME,
        localField: '_id',
        foreignField: 'boardId',
        as: 'columns'
      } },
      { $lookup: {
        from: cardModel.CARD_COLLECTION_NAME,
        localField: '_id',
        foreignField: 'boardId',
        as: 'cards'
      } },
      { $lookup: {
        from: userModel.USER_COLLECTION_NAME,
        localField: 'ownerIds',
        foreignField: '_id',
        as: 'owners',
        // pipeline trong lookup là để xử lý một hoặc nhiều luồng cannaf thiết
        // $project để chỉ định vài field không muốn lấy về bằng cách gán nó bằng 0
        pipeline: [{ $project: { 'password': 0, 'verifyToken': 0 } }]
      } },
      { $lookup: {
        from: userModel.USER_COLLECTION_NAME,
        localField: 'memberIds',
        foreignField: '_id',
        as: 'members',
        pipeline: [{ $project: { 'password': 0, 'verifyToken': 0 } }]
      } }
    ]).toArray()

    return result[0] || undefined

  } catch (error) {
    throw new Error(error)
  }
}


// push 1 giá trị columnis vào trong mảng columnOrderIds
const pushColumnOrderIds = async (column) => {
  try {
    const result = await GET_DB().collection(BOARD_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(column.boardId) },
      { $push: { columnOrderIds: new ObjectId(column._id) } },
      { returnDocument: 'after' } //trả về kết qủa mới sau khi cập nhật
    )

    return result

  } catch (error) {
    throw new Error(error)
  }
}

const update = async (boardId, updateData) => {
  try {
    Object.keys(updateData).forEach(fieldName => {
      if (INVALID_UPDATE_FIELDS.includes(fieldName)) {
        delete updateData[fieldName] // Xóa các trường không được phép cập nhật
      }
    })

    // biến dổi dữ liệu ObjectId ở đây
    if (updateData.columnOrderIds) {
      updateData.columnOrderIds = updateData.columnOrderIds.map(_id => (new ObjectId(_id)))
    }

    const result = await GET_DB().collection(BOARD_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(boardId) },
      { $set: updateData },
      { returnDocument: 'after' } //trả về kết qủa mới sau khi cập nhật
    )

    return result

  } catch (error) {
    throw new Error(error)
  }
}

const getBoards = async (userId, page, itemPerPage, search) => {
  try {
    const queryCondition = [
      // Điều kiện 1: Boards chưa bị xoá
      { _destroy: false },

      // Điều kiện 2: userId đang thực hiện yêu cầu có trong mảng memberIds hoặc ownerId, sừ dụng $all của MongoDB
      { $or: [
        { memberIds: { $all: [new ObjectId(userId)] } },
        { ownerIds: { $all: [new ObjectId(userId)] } }
      ] }
    ]

    if (search) {
      const escapedSearch = search.toString().replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')
      const titleRegex = { $regex: escapedSearch, $options: 'i' }

      queryCondition.push({ title: titleRegex })
    }

    const query = await GET_DB().collection(BOARD_COLLECTION_NAME).aggregate(
      [
        { $match: { $and: queryCondition } },
        { $sort: { title: 1 } }, // Sắp xếp theo title tăng dần
        // Xử lý nhiều luồng trong 1 truy vấn
        { $facet: {
          // Luồng 1: Query Board
          'queryBoards': [
            { $skip: pagingSkipValue(page, itemPerPage) }, // Bỏ qua số bản ghi tương ứng với các trang trước
            { $limit: itemPerPage } // Giới hạn số lượng bản ghi trả về trên 1 trang
          ],

          // Luồng 2: Query đếm tổng tất cả các board trong database trả về biến countedAllBoards
          'queryBoardTotal': [{ $count: 'countedAllBoards' }]
        } }
      ],
      // collation để hỗ trợ sort không phân biệt hoa thường
      { collation: { locale: 'en' } }
    ).toArray()
    // console.log('Aggregate Query Result:', query)

    const res = query[0]

    return {
      boards: res.queryBoards || [],
      totalBoards: res.queryBoardTotal[0]?.countedAllBoards || 0
    }

  } catch (error) {
    throw new Error(error)
  }
}

const pushMemberIds = async (boardId, userId) => {
  try {
    const result = await GET_DB().collection(BOARD_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(boardId) },
      { $push: { memberIds: new ObjectId(userId) } },
      { returnDocument: 'after' } //trả về kết qủa mới sau khi cập nhật
    )

    return result

  } catch (error) {
    throw new Error(error)
  }
}

export const boardModel = {
  BOARD_COLLECTION_NAME,
  BOARD_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  getDetails,
  pushColumnOrderIds,
  update,
  getBoards,
  pushMemberIds
}
