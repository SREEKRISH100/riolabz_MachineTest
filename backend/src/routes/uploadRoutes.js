const express = require('express');
const multer = require('multer');
const { uploadImage, deleteImage } = require('../config/cloudinary');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

const router = express.Router();

// Configurable image size limit from environment variables (default 5MB)
const maxFileSizeMB = parseInt(process.env.MAX_IMAGE_SIZE_MB, 10) || 5;

// Memory storage for direct processing to local disk or Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxFileSizeMB * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WEBP, GIF, SVG) are allowed!'), false);
    }
  },
});

// POST /api/upload/image (Single image upload)
router.post(
  '/image',
  verifyToken,
  authorize('admin'),
  upload.single('image'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw ApiError.badRequest('No image file uploaded');
    }

    const folder = req.body.folder || req.query.folder || 'categories';
    const result = await uploadImage(req.file, folder, req);

    return ApiResponse.success(
      res,
      result,
      `Image uploaded successfully to ${result.storage === 'local' ? 'local uploads folder' : 'Cloudinary'}`,
      201
    );
  })
);

// POST /api/upload/images (Multiple images upload - up to 5)
router.post(
  '/images',
  verifyToken,
  authorize('admin'),
  upload.array('images', 5),
  asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
      throw ApiError.badRequest('No image files uploaded');
    }

    const folder = req.body.folder || req.query.folder || 'products';
    const uploadPromises = req.files.map((file) => uploadImage(file, folder, req));
    const results = await Promise.all(uploadPromises);

    const storageType = results[0]?.storage || 'storage';
    return ApiResponse.success(
      res,
      results,
      `${results.length} images uploaded successfully to ${storageType === 'local' ? 'local uploads folder' : 'Cloudinary'}`,
      201
    );
  })
);

// POST /api/upload/delete (Delete image)
router.post(
  '/delete',
  verifyToken,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const { publicId, url } = req.body;
    const target = publicId || url;

    if (!target) {
      throw ApiError.badRequest('Please provide either publicId or url to delete');
    }

    const result = await deleteImage(target);

    return ApiResponse.success(
      res,
      result,
      'Image deletion requested successfully'
    );
  })
);

module.exports = router;
