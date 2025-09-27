import JWT from 'jsonwebtoken'


// tạo mới 1 JWT token có 3 tham số là userInfo, secretKey, tokenLife
const generateToken = async (userInfo, secretKey, tokenLife) => {
  try {
    return JWT.sign(userInfo, secretKey, { expiresIn: tokenLife, algorithm: 'HS256' })
  } catch (error) {
    throw new Error(error)
  }
}

const verifyToken = async (token, secretKey) => {
  try {
    return JWT.verify(token, secretKey)
  } catch (error) {
    throw new Error(error)
  }
}

export const JwtProvider = {
  generateToken,
  verifyToken
}
