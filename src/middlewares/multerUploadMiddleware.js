import multer from 'multer'
import { LIMIT_COMMON_FILE_SIZE, ALLOW_COMMON_FILE_TYPES } from '~/utils/validators'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'

const customFileFilter = (req, file, cb) => {
  console.log('Multer File:', file)

  // Đối với multer kiểm tra kiểu file thì sử dụng mimetype
  if (!ALLOW_COMMON_FILE_TYPES.includes(file.mimetype)) {
    const errMessage = 'File type is invalid. Only accept jpg, jpeg and png'
    return cb(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errMessage), null)
  }

  // Nếu file hợp lệ thì cho phép lưu
  cb(null, true)
}

// Khởi tạo function upload
const upload = multer({
  limits: { fileSize: LIMIT_COMMON_FILE_SIZE },
  fileFilter: customFileFilter
})

export const multerUploadMiddleware = { upload }
