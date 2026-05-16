import multer from "multer";
import path from "path";
import type { Request, Response, NextFunction, RequestHandler } from "express";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed!"), false);
  }
};

const maxFileBytes = 5 * 1024 * 1024; // 5 MB

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: maxFileBytes },
});

/**
 * Proof upload variant for receipts / proofs / attachments where we
 * want JPG, JPEG, PNG, WEBP or PDF up to 20 MB. Kept separate from
 * `upload` so existing PDF-only routes (e.g. some account documents)
 * are unaffected. Cash voucher create uses `singleProofUpload`.
 */
const ALLOWED_PROOF_MIMES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
]);
const ALLOWED_PROOF_EXTS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".pdf",
]);

const proofFileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: any
) => {
  const mime = String(file.mimetype || "").toLowerCase();
  const ext = path.extname(file.originalname || "").toLowerCase();
  if (ALLOWED_PROOF_MIMES.has(mime) || ALLOWED_PROOF_EXTS.has(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only JPG, JPEG, PNG, WEBP, or PDF files are allowed."
      ),
      false
    );
  }
};

const maxProofBytes = 20 * 1024 * 1024; // 20 MB

export const proofUpload = multer({
  storage: storage,
  fileFilter: proofFileFilter,
  limits: { fileSize: maxProofBytes },
});

/**
 * Wraps a multer single-file middleware so file-type / size errors come
 * back as a clean 400 (`{ success: false, message }`) instead of being
 * swallowed by the global error handler as "Something went wrong!".
 */
export const singleProofUpload = (field: string): RequestHandler => {
  const handler = proofUpload.single(field);
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, (err: any) => {
      if (!err) return next();
      const isMulter = err instanceof multer.MulterError;
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? "Proof file must be 20 MB or smaller."
          : err.message || "Could not upload file.";
      return res.status(400).json({
        success: false,
        message,
        ...(isMulter && { code: err.code }),
      });
    });
  };
};

/**
 * Runs proof multer only for `multipart/form-data` so JSON clients (e.g. fail
 * without attachment) still get `req.body` from express.json.
 */
export const optionalProofUpload = (field: string): RequestHandler => {
  const handler = proofUpload.single(field);
  return (req: Request, res: Response, next: NextFunction) => {
    const ct = String(req.headers["content-type"] || "");
    if (!ct.toLowerCase().includes("multipart/form-data")) {
      return next();
    }
    handler(req, res, (err: any) => {
      if (!err) return next();
      const isMulter = err instanceof multer.MulterError;
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? "Proof file must be 20 MB or smaller."
          : err.message || "Could not upload file.";
      return res.status(400).json({
        success: false,
        message,
        ...(isMulter && { code: err.code }),
      });
    });
  };
};

const USER_PHOTO_MIMES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);
const USER_PHOTO_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

const userPhotoFileFilter = (
  _req: unknown,
  file: Express.Multer.File,
  cb: (e: Error | null, ok?: boolean) => void
) => {
  const mime = String(file.mimetype || "").toLowerCase();
  const ext = path.extname(file.originalname || "").toLowerCase();
  if (USER_PHOTO_MIMES.has(mime) || USER_PHOTO_EXTS.has(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, JPEG, PNG, or WEBP images are allowed."), false);
  }
};

const maxUserPhotoBytes = 2 * 1024 * 1024;

const userPhotoUpload = multer({
  storage,
  fileFilter: userPhotoFileFilter,
  limits: { fileSize: maxUserPhotoBytes },
});

/**
 * Runs multer only for `multipart/form-data` so JSON clients keep working.
 * Field name: `photo` (optional).
 */
export const optionalUserPhotoUpload = (field: string): RequestHandler => {
  const handler = userPhotoUpload.single(field);
  return (req: Request, res: Response, next: NextFunction) => {
    const ct = String(req.headers["content-type"] || "");
    if (!ct.toLowerCase().includes("multipart/form-data")) {
      return next();
    }
    handler(req, res, (err: any) => {
      if (!err) return next();
      const isMulter = err instanceof multer.MulterError;
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? "Profile photo must be 2 MB or smaller."
          : err.message || "Could not upload profile photo.";
      return res.status(400).json({
        success: false,
        message,
        ...(isMulter && { code: err.code }),
      });
    });
  };
};
