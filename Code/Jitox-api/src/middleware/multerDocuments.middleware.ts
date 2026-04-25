import fs from "fs";
import multer from "multer";
import path from "path";

const documentsDir = path.join(process.cwd(), "uploads", "documents");

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    fs.mkdirSync(documentsDir, { recursive: true });
    cb(null, documentsDir);
  },
  filename(_req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, uniqueSuffix + path.extname(file.originalname).toLowerCase());
  },
});

const allowedMime = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (allowedMime.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, PNG, JPEG, DOC, or DOCX files are allowed."));
  }
};

/** Dashboard document library uploads → `uploads/documents/` (served under `/uploads/...`). */
export const uploadDocumentFile = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 },
});
