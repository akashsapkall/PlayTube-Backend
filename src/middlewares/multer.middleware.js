import multer from 'multer';
// import path from 'path';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
    // destination: function (req, file, cb) {
    //   cb(null, path.join(__dirname, '../../public/temp'));
    // },
    destination: function (req, file, cb) {
      cb(null, "./public/temp");
    },
    filename: function (req, file, cb) {
        const fileName = `${Date.now()}_${file.originalname}`;
        cb(null, fileName)
    }
});

export const upload=multer({ storage, })