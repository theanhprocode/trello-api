import { StatusCodes } from 'http-status-codes'
import { userService } from '~/services/userService'
import ms from 'ms'
import ApiError from '~/utils/ApiError.js'

const createNew = async (req, res, next) => {
  try {
    const createdUser = await userService.createNew(req.body)
    res.status(StatusCodes.CREATED).json(createdUser)
  } catch (error) {
    next(error)
  }
}

// const verifyAccount = async (req, res, next) => {
//   try {
//     const result = await userService.verifyAccount(req.query)
//     res.status(StatusCodes.OK).json(result)
//   } catch (error) {
//     next(error)
//   }
// }

const login = async (req, res, next) => {
  try {
    const result = await userService.login(req.body)

    // xử lý trả về http only cho phía trình duyệt
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: ms('14d'),
      partitioned: true
    })

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: ms('14d'),
      partitioned: true
    })

    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

const logout = async (req, res, next) => {
  try {
    res.clearCookie('accessToken')
    res.clearCookie('refreshToken')

    res.status(StatusCodes.OK).json({ loggedOut: true })
  } catch (error) {
    next(error)
  }
}

const refreshToken = async (req, res, next) => {
  try {
    const result = await userService.refreshToken(req.cookies?.refreshToken)

    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: ms('14d'),
      partitioned: true
    })

    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(new ApiError(StatusCodes.FORBIDDEN, 'Please login again'))
  }
}

const update = async (req, res, next) => {
  try {
    const userAvatarFile = req.file
    // console.log('Uploaded Avatar File:', userAvatarFile)
    const userId = req.jwtDecoded._id
    const updatedUser = await userService.update(userId, req.body, userAvatarFile)
    res.status(StatusCodes.OK).json(updatedUser)
  } catch (error) {
    next(error)
  }
}

export const userController = {
  createNew,
  // verifyAccount,
  login,
  update,
  logout,
  refreshToken
}