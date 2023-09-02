const express = require("express");
const UserRoute = express.Router();
// Sau khi set up xong home page và add page thì: gọi tới models User và multer
const User = require("../models/user.models");
const multer = require("multer"); // middleware upload file
const fs = require("fs").promises; // sử dụng static file

// Khởi tạo một đối tượng lưu trữ cho Multer để xác định cách lưu trữ tệp tin sau khi tải lên.
let storage = multer.diskStorage({
  // Xác định thư mục đích cho tệp tin tải lên.
  destination: function (req, file, cb) {
    cb(null, "./uploads"); // bên file server.js phải tạo thêm 1 static file link tới thư mục uploads
  },
  // Xác định tên tệp tin sau khi tải lên
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
  },
});

// Khởi tạo middleware Multer để xử lý tải lên tệp tin.
let upload = multer({
  storage: storage, // Sử dụng đối tượng storage đã khởi tạo bên trên
  // Đặt tùy chọn chỉ cho phép tải lên một tệp tin với trường tên là "image"
}).single("image"); // trùng với giá trị for của thẻ input

// thêm User vào cơ sở dữ liệu
UserRoute.post("/add", upload, async (req, res) => {
  const newUser = new User({
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    image: req.file.filename,
  });
  try {
    await newUser.save(); // Save the new user instance to the database
    req.session.message = {
      type: "success",
      message: "Thêm sinh viên thành công",
    };
    res.redirect("/"); // Redirect to homepage after successful save
  } catch (err) {
    res.json({ message: err.message });
  }
});
// Xử lý render home page
UserRoute.get("/", (req, res) => {
  User.find()
    .catch((err) => {
      res.json({ message: err.message });
    })
    .then((users) => {
      res.render("index", { title: "home page", users: users });
    });
});
// Hàm xử lý render add page
UserRoute.get("/add", (req, res) => {
  res.render("add_user", { title: "add user" });
});

// Hàm xử lý render edit page
UserRoute.get("/edit/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id);
    if (!user) {
      res.render("error", { message: "Người dùng không tồn tại" });
    } else {
      res.render("edit_user", { user: user, title: "edit user" });
    }
  } catch (error) {
    console.log(error);
    res.render("error", { message: "Đã xảy ra lỗi ở trang edit" });
  }
});

// POST route để cập nhật thông tin người dùng
UserRoute.post("/update/:id", upload, async (req, res) => {
  try {
    const { id } = req.params;
    // Kiểm tra xem người dùng có tồn tại không
    const user = await User.findById(id);
    if (!user) {
      console.error(`Không tồn tại hợp đồng có id: ${id}.`);
      res.status(404).json({ message: "Người dùng không tồn tại!!" });
      return;
    }
    let new_image = req.body.old_image; // Để mặc định hình cũ

    if (!req.body.old_image) {
      // Nếu có hình ảnh hiện tại, xóa hình cũ
      await fs.unlink(`./uploads/${user.image}`);
    }

    // Nếu một hình mới được tải lên, cập nhật 'new_image'
    if (req.file) {
      new_image = req.file.filename;
    }

    // Sử dụng async/await với findByIdAndUpdate để cập nhật người dùng
    const result = await User.findByIdAndUpdate(id, {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      image: new_image,
    });

    if (result) {
      req.session.message = {
        type: "success",
        message: "Đã Cập nhật sinh viên thành công",
      };
      res.redirect("/"); // Chuyển hướng tới homepage sau khi cập nhật thành công
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Cập nhật thất bại!!!" }); // Xử lý lỗi
  }
});

// Xóa người dùng
UserRoute.get("/delete/:id", async (req, res) => {
  try {
    const {id} = req.params;
    const del = await User.findByIdAndRemove(id);
    if(del.image != ' '){
      await fs.unlink(`./uploads/${del.image}`);
    }
    req.session.message = {
      type: "success",
      message: `Đã Xóa thành công sinh viên có id: ${id}`,
    }
    res.redirect("/");
  } catch (error) {
    console.log(error.message);
    res.status(500).json({message: "Lỗi không thể xóa người dùng"});
  }
});

module.exports = UserRoute;
