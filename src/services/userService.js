/* eslint-disable no-useless-catch */
import { userModel } from '~/models/userModel.js'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'
import bcryptjs from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { pickUser } from '~/utils/formatters'
import { WEBSITE_DOMAIN } from '~/utils/constants'
import { ResendProvider } from '~/providers/ResendProvider'
import { env } from '~/config/environment'
import { JwtProvider } from '~/providers/JwtProvider'


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
    const verificationlink = `${WEBSITE_DOMAIN}/account/verification?email=${getNewUser.email}&token=${getNewUser.verifyToken}`
    const customSubject = 'Trello: Please verify your email'
    const htmlContent = `
      <h3>Here is your verification link:</h3>
      <h3>${verificationlink}</h3>
      <h3>Thank you for registering!</h3>
    `
    // Gọi tới provider gửi email
    await await ResendProvider.sendEmail(getNewUser.email, customSubject, htmlContent)

    // Trả về kết quả cho controller
    return pickUser(getNewUser)
  } catch (error) {
    throw error
  }
}

const verifyAccount = async (reqBody) => {
  try {
    // Kiểm tra user có tồn tại hay không
    const existUser = await userModel.findOneByEmail(reqBody.email)

    if (!existUser) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found!')
    if ( existUser.isActive ) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Account already activated!')
    if ( existUser.verifyToken !== reqBody.token ) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Invalid token!')

    // Nếu mọi thứ oke thì cập nhật lại thông tin user để kích hoạt tài khoản
    const updatedData = {
      isActive: true,
      verifyToken: null
    }
    // Cập nhật thông tin user
    const updatedUser = await userModel.update(existUser._id, updatedData)
    return pickUser(updatedUser)
  } catch (error) { throw error }
}

const login = async (reqBody) => {
  try {
    const existUser = await userModel.findOneByEmail(reqBody.email)

    if (!existUser) throw new ApiError(StatusCodes.NOT_FOUND, 'Account not found!')
    if (!existUser.isActive ) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Account is not activated!')
    if (!bcryptjs.compareSync(reqBody.password, existUser.password) ) {
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Your email or password is incorrect!')
    }

    /** Nếu mọi thứ oke thì tạo token và trả về cho client */
    // Tạo thông tin đính kèm trong JWT Token bao gồm _id và email của user
    const userInfo = { _id: existUser._id, email: existUser.email }

    // tạo accessToken và refreshToken
    const accessToken = await JwtProvider.generateToken(
      userInfo,
      env.ACCESS_TOKEN_SECRET_KEY,
      // 5
      env.ACCESS_TOKEN_LIFE
    )
    const refreshToken = await JwtProvider.generateToken(
      userInfo,
      env.REFRESH_TOKEN_SECRET_KEY,
      env.REFRESH_TOKEN_LIFE
    )

    return { accessToken, refreshToken, ...pickUser(existUser) }
  } catch (error) { throw error }
}

const refreshToken = async (clientRefreshToken) => {
  try {
    // verify cái refresh token xem có hợp lệ không
    const refreshTokenDecoded = await JwtProvider.verifyToken(clientRefreshToken, env.REFRESH_TOKEN_SECRET_KEY)

    // đã lưu những thông tin unique và cố định của user trong token rồi nên không cần truy vấn db
    const userInfo = { _id: refreshTokenDecoded._id, email: refreshTokenDecoded.email }

    // tạo accessToken mới
    const accessToken = await JwtProvider.generateToken(
      userInfo,
      env.ACCESS_TOKEN_SECRET_KEY,
      env.ACCESS_TOKEN_LIFE
    )

    return { accessToken }
  } catch (error) {
    throw error
  }
}


export const userService = {
  createNew,
  verifyAccount,
  login,
  refreshToken
}