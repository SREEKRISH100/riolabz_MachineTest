const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'testround',
  api_key: process.env.CLOUDINARY_API_KEY || '116451454564182',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'gMgKDHdixLz2tE2kZ6y16-xoZ-s',
});

// Root backend uploads directory (backend/uploads)
const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');

/**
 * Ensures target uploads directory exists
 * @param {String} subfolder
 * @returns {String} Absolute directory path
 */
const ensureUploadsDir = (subfolder = '') => {
  const targetDir = subfolder ? path.join(UPLOADS_DIR, subfolder) : UPLOADS_DIR;
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  return targetDir;
};

/**
 * Uploads a file buffer to Cloudinary
 * @param {Buffer} buffer - File buffer from multer memoryStorage
 * @param {String} folder - Cloudinary folder name
 * @returns {Promise<Object>} Resolves with { url, publicId }
 */
const uploadToCloudinary = (buffer, folder = 'testround') => {
  const quality = process.env.IMAGE_QUALITY || 'auto:good';

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        quality: quality,
        fetch_format: 'auto',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    stream.end(buffer);
  });
};

/**
 * Smart image uploader:
 * - If NODE_ENV === 'development': Saves locally to backend root /uploads folder
 * - Else (production): Uploads directly to Cloudinary
 *
 * @param {Object} file - Multer file object (buffer, originalname, mimetype)
 * @param {String} folder - Target subfolder (e.g. 'categories', 'products')
 * @param {Object} [req] - Express request for generating absolute domain URLs
 * @returns {Promise<{ url: String, publicId: String, storage: 'local'|'cloudinary' }>}
 */
const uploadImage = async (file, folder = 'general', req = null) => {
  const isDevelopment = (process.env.NODE_ENV || 'development') === 'development';

  if (isDevelopment) {
    // 1. Upload to local backend root /uploads directory
    const targetDir = ensureUploadsDir(folder);
    const ext = path.extname(file.originalname || '') || '.jpg';
    const cleanBaseName = path
      .basename(file.originalname || 'image', ext)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-');
    const uniqueFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${cleanBaseName}${ext}`;
    const filePath = path.join(targetDir, uniqueFileName);

    await fs.promises.writeFile(filePath, file.buffer);

    const subPath = folder ? `${folder}/${uniqueFileName}` : uniqueFileName;
    const relativeUrl = `/uploads/${subPath}`;
    const fullUrl = req ? `${req.protocol}://${req.get('host')}${relativeUrl}` : relativeUrl;

    return {
      url: fullUrl,
      publicId: relativeUrl,
      storage: 'local',
      fileName: uniqueFileName,
    };
  } else {
    // 2. Upload to Cloudinary in production
    const cloudFolder = `testround/${folder}`;
    const cloudResult = await uploadToCloudinary(file.buffer, cloudFolder);
    return {
      url: cloudResult.url,
      publicId: cloudResult.publicId,
      storage: 'cloudinary',
    };
  }
};

/**
 * Extracts Cloudinary public_id from a secure URL
 * @param {String} url
 * @returns {String|null}
 */
const extractPublicId = (url) => {
  if (!url || typeof url !== 'string') return null;
  if (!url.includes('cloudinary.com')) return null;

  try {
    const matches = url.match(/\/upload\/(?:v\d+\/)?([^\.]+)/);
    if (matches && matches[1]) {
      return matches[1];
    }
  } catch (err) {
    console.warn('Failed to parse Cloudinary public_id from URL:', url);
  }
  return null;
};

/**
 * Deletes an image from Cloudinary or local disk
 * @param {String} publicIdOrUrl
 * @returns {Promise<Object>}
 */
const deleteImage = async (publicIdOrUrl) => {
  if (!publicIdOrUrl) return null;

  // Check if it's a local file in /uploads
  if (
    publicIdOrUrl.includes('/uploads/') ||
    publicIdOrUrl.startsWith('/uploads') ||
    publicIdOrUrl.startsWith('uploads/')
  ) {
    try {
      const uploadIdx = publicIdOrUrl.indexOf('/uploads/');
      const relativePart =
        uploadIdx !== -1
          ? publicIdOrUrl.substring(uploadIdx + '/uploads/'.length)
          : publicIdOrUrl.replace(/^\/?uploads\//, '');

      const localPath = path.join(UPLOADS_DIR, relativePart);
      if (fs.existsSync(localPath)) {
        await fs.promises.unlink(localPath);
        console.log(`🗑️ Local file deleted: ${localPath}`);
        return { result: 'ok', storage: 'local' };
      }
    } catch (err) {
      console.warn(`Could not delete local file (${publicIdOrUrl}):`, err.message);
    }
    return null;
  }

  // Cloudinary deletion
  let publicId = publicIdOrUrl;
  if (publicIdOrUrl.startsWith('http://') || publicIdOrUrl.startsWith('https://')) {
    publicId = extractPublicId(publicIdOrUrl);
  }

  if (!publicId) {
    return null;
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log(`🗑️ Cloudinary image deleted: ${publicId} (result: ${result.result})`);
    return result;
  } catch (err) {
    console.error(`❌ Failed to delete Cloudinary image (${publicId}):`, err.message);
    return null;
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  uploadImage,
  extractPublicId,
  deleteFromCloudinary: deleteImage, // Alias for seamless backward compatibility
  deleteImage,
  UPLOADS_DIR,
};
