const multer = require("multer");

module.exports = multer({
  storage: multer.diskStorage({
    destination: "uploads/",
    filename: (_, file, cb) =>
      cb(null, Date.now() + "-" + file.originalname),
  }),
});
