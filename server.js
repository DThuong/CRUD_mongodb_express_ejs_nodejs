//import
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose"); // kết nối với cơ sở dữ liệu và thao tác với dữ liệu
const session = require("express-session"); // quản lý phiên người dùng như đăng nhập, giỏ hàng

const app = express();
const PORT = process.env.PORT || 3000; // truy cập biến môi trường
const DB_URI = process.env.DB_URI; // truy cập biến môi trường lấy đường dẫn tới database

// Kết nối tới cơ sở dữ liệu mongodb
const checkDBConnection = async () => {
  try {
    await mongoose.connect(DB_URI);
    console.log("Đã kết nối tới cơ sở dữ liệu MongoDB!");
  } catch (error) {
    console.error(
      "Không thể kết nối tới cơ sở dữ liệu MongoDB:",
      error.message
    );
  }
};
checkDBConnection();

// middlewares
app.use(express.urlencoded({ extended: true })); // xử lý định dạng form HTML qua các method post, put
app.use(express.json()); // chuyển các định dạng dữ liệu được lấy về sang dạng json
app.use(
  session({
    secret: "my secret key",
    saveUninitialized: true,
    resave: false,
  })
);
app.use((req,res,next) => { // lưu session message
  res.locals.message = req.session.message;
  delete req.session.message;
  next();
})

app.use(express.static("uploads")); // static file tới thư mục uploads để lưu ảnh trên server

// set template engine ejs
app.set('view engine', 'ejs');

// router prefix
app.use("", require("./routers/router"));


app.listen(PORT, () => {
  console.log(`server started at http://localhost:${PORT}`);
});
