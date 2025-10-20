import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'
import { JwtProvider } from '~/providers/JwtProvider'
import { env } from '~/config/environment'

const isAuthorized = async (req, res, next) => {
  const clientAccessToken = req.cookies?.accessToken

  // Nếu như clientAccessToken không tồn tại thì trả về lỗi
  if (!clientAccessToken) {
    next(new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized (token not found)'))
    return
  }

  try {
    // kiểm tra token có hợp lệ hay không
    const accessTokenDecoded = await JwtProvider.verifyToken(clientAccessToken, env.ACCESS_TOKEN_SECRET_KEY)
    // console.log('accessTokenDecoded: ', accessTokenDecoded)

    // Gán thông tin giải mã được vào req để các middleware hoặc controller ở phía sau có thể sử dụng
    req.jwtDecoded = accessTokenDecoded
    next() // Token hợp lệ, cho phép đi tiếp
  } catch (error) {
    // nếu accessToken bị hết hạn thì trả về mã lỗi 410
    if (error?.message?.includes('jwt expired')) {
      next(new ApiError(StatusCodes.GONE, 'need to refresh token'))
      return
    }

    // Nếu có lỗi khác xảy ra (ngoài hết hạn) thì trả về lỗi 401 cho fe gọi api sign-out
    next(new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized'))
  }
}

export const authMiddleware = {
  isAuthorized
}