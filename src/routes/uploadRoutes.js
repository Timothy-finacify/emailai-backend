const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subDir = 'general';
    if (file.fieldname === 'avatar') subDir = 'avatars';
    if (file.fieldname === 'banner') subDir = 'banners';
    if (file.fieldname === 'file') subDir = 'files';
    
    const dir = path.join(uploadDir, subDir);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const id = crypto.randomBytes(8).toString('hex');
    cb(null, `${Date.now()}-${id}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const imageExts = /jpeg|jpg|png|gif|webp|svg/;
  const docExts = /pdf|doc|docx|xls|xlsx|csv|txt/;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');

  if (file.fieldname === 'file') {
    if (docExts.test(ext)) return cb(null, true);
    return cb(new Error('Invalid file type'));
  }
  if (imageExts.test(ext)) return cb(null, true);
  return cb(new Error('Invalid image type'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3001}`;

// POST /api/upload/image - Single image
router.post('/image', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No image provided' });
    const subDir = req.file.destination.includes('avatars') ? 'avatars' : 
                   req.file.destination.includes('banners') ? 'banners' : 'general';
    res.json({ success: true, data: { url: `${BASE_URL}/uploads/${subDir}/${req.file.filename}` } });
  } catch (e) { res.status(500).json({ success: false, error: 'Upload failed' }); }
});

// POST /api/upload/images - Multiple images
router.post('/images', authMiddleware, upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) return res.status(400).json({ success: false, error: 'No images' });
    const urls = req.files.map(file => `${BASE_URL}/uploads/general/${file.filename}`);
    res.json({ success: true, data: { urls } });
  } catch (e) { res.status(500).json({ success: false, error: 'Upload failed' }); }
});

// POST /api/upload/file - Document upload
router.post('/file', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file' });
    res.json({ success: true, data: { url: `${BASE_URL}/uploads/files/${req.file.filename}`, name: req.file.originalname, size: req.file.size } });
  } catch (e) { res.status(500).json({ success: false, error: 'Upload failed' }); }
});

// POST /api/upload/community-avatar
router.post('/community-avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No avatar' });
    res.json({ success: true, data: { url: `${BASE_URL}/uploads/avatars/${req.file.filename}` } });
  } catch (e) { res.status(500).json({ success: false, error: 'Upload failed' }); }
});

// POST /api/upload/community-banner
router.post('/community-banner', authMiddleware, upload.single('banner'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No banner' });
    res.json({ success: true, data: { url: `${BASE_URL}/uploads/banners/${req.file.filename}` } });
  } catch (e) { res.status(500).json({ success: false, error: 'Upload failed' }); }
});

// DELETE /api/upload/:filename
router.delete('/:filename', authMiddleware, async (req, res) => {
  try {
    const fp = path.join(uploadDir, req.params.filename);
    if (fs.existsSync(fp)) { fs.unlinkSync(fp); return res.json({ success: true }); }
    res.status(404).json({ success: false, error: 'Not found' });
  } catch (e) { res.status(500).json({ success: false, error: 'Delete failed' }); }
});

module.exports = router;