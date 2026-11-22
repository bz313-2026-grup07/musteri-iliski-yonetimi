/**
 * Bilet ekleri için Multer ayarı (Fizibilite 6.1: bu dönem sunucu dosya sisteminde saklanır).
 * Güvenlik: rastgele dosya adı, boyut sınırı, MIME beyaz listesi.
 * Kullanım:  router.post('/:id/attachments', upload.array('files', 5), handler)
 */
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const multer = require('multer');
const config = require('../config');
const { badRequest } = require('../utils/httpError');

const uploadRoot = path.resolve(__dirname, '../../', config.uploadDir);
fs.mkdirSync(uploadRoot, { recursive: true });

const ALLOWED = new Set([
  'image/png', 'image/jpeg', 'image/gif', 'image/webp',
  'application/pdf', 'text/plain', 'text/csv',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
]);

const storage = multer.diskStorage({
  destination: uploadRoot,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(0, 10);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: config.maxUploadMb * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.has(file.mimetype)) return cb(badRequest(`İzin verilmeyen dosya türü: ${file.mimetype}`));
    cb(null, true);
  },
});

/** CSV içe aktarma için: diske yazmadan bellekte tutar */
const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024, files: 1 },
});

module.exports = { upload, csvUpload, uploadRoot };
