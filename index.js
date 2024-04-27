const fs = require("fs");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

const app = express();

app.use(express.json());
app.use(cors());

const port = 3000;

let nextId = 1; // Inisialisasi ID berikutnya

// Endpoint untuk mengunggah foto
app.post("/photo", upload.single("photo"), (req, res, next) => {
  try {
    const file = req.file;
    const id = nextId++; // Menggunakan ID berikutnya dan meningkatkan nilai nextId untuk penggunaan berikutnya

    fs.renameSync(file.path, `uploads/${id}_${file.originalname}`);

    const uploadedFile = {
      id: id,
      fieldname: file.fieldname,
      originalname: file.originalname,
      encoding: file.encoding,
      mimetype: file.mimetype,
      destination: file.destination,
      filename: `${id}_${file.originalname}`,
      path: file.path,
      size: file.size,
    };

    res.status(200).json(uploadedFile);
  } catch (err) {
    next(err);
  }
});

// Mengonfigurasi Express untuk melayani file statis dari direktori 'uploads'
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Endpoint untuk mengambil semua foto
app.get("/photos", (req, res, next) => {
  try {
    fs.readdir("uploads", (err, files) => {
      if (err) {
        return next(err);
      }

      files.sort((a, b) => {
        return (
          fs.statSync(`uploads/${b}`).mtime.getTime() -
          fs.statSync(`uploads/${a}`).mtime.getTime()
        );
      });

      const photoData = files.map((file) => {
        const stats = fs.statSync(`uploads/${file}`);
        return {
          id: file.split("_")[0],
          // Menggunakan URL lengkap dari server untuk mengakses gambar
          filename: `http://localhost:3000/uploads/${file}`,
          size: stats.size,
          lastModified: stats.mtime,
        };
      });

      res.json({ photos: photoData });
    });
  } catch (err) {
    next(err);
  }
});

// Jalankan server
app.listen(port, () => {
  console.log(`Server is running at ${port}`);
});
