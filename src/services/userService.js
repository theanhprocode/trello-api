/* eslint-disable no-useless-catch */
import { userModel } from '~/models/userModel.js'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'
import bcryptjs from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { pickUser } from '~/utils/formatters'


const createNew = async (reqBody) => {
  try {
    // Kiểm tra email đã tốn tại trong hệ thống hay chưa
    const existUser = await userModel.findOneByEmail(reqBody.email)
    if (existUser) {
      throw new ApiError(StatusCodes.CONFLICT, 'Email exists!')
    }

    // Tạo data để lưu vào database
    // nameFromEmail: nếu email là theanh@gmail.com thì sẽ lấy được 'theanh'
    const nameFromEmail = reqBody.email.split('@')[0]
    const newUser = {
      email: reqBody.email,
      password: bcryptjs.hashSync(reqBody.password, 8),
      userName: nameFromEmail,
      displayName: nameFromEmail,
      verifyToken: uuidv4() // Token để xác thực email
    }

    // Lưu thông tin user vào Database
    const createdUser = await userModel.createNew(newUser)
    const getNewUser = await userModel.findOneById(createdUser.insertedId)

    // Gửi email cho người dùng xác thực

    // Trả về kết quả cho controller
    return pickUser(getNewUser)
  } catch (error) {
    throw error
  }
}


export const userService = {
  createNew
}