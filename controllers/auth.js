// importing libraries
const passport = require("passport");

if (process.env.NODE_ENV !== "production") require("dotenv").config();

// importing models
const User = require("../models/user");
const uid = require("uid");
const fs = require("fs");
const deleteImage = require("../utils/delete_image");
const sharp = require("sharp");

exports.getLandingPage = async (_req, res) => {
  return res.render("landing.html");
};

exports.getAdminLoginPage = (req, res, next) => {
  res.render("admin/adminLogin");
};

exports.getAdminLogout = (req, res, next) => {
  req.logout();
  res.redirect("/");
};

exports.getAdminSignUp = (req, res, next) => {
  res.render("signup");
};

exports.postAdminSignUp = async (req, res, next) => {
  try {
    if (req.body.adminCode === process.env.ADMIN_SECRET) {
      const newAdmin = new User({
        username: req.body.username,
        email: req.body.email,
        isAdmin: true,
      });

      const user = await User.register(newAdmin, req.body.password);
      await passport.authenticate("local")(req, res, () => {
        req.flash(
          "success",
          "Hello, " + user.username + " Welcome to Admin Dashboard"
        );
        res.redirect("/admin");
      });
    } else {
      req.flash("error", "Secret code does not matching!");
      return res.redirect("back");
    }
  } catch (err) {
    req.flash(
      "error",
      "Given info matches someone registered as User. Please provide different info for registering as Admin"
    );
    return res.render("signup");
  }
};

exports.getUserLoginPage = (req, res, next) => {
  res.render("user/userLogin");
};

exports.getUserLogout = async (req, res, next) => {
  await req.session.destroy();
  req.logout(err => {
    if (err) {
      // throw new Error('Error occurred during logout');
    }
    res.redirect("/");
  });
};

exports.getUserSignUp = (req, res, next) => {
  res.render("user/userSignup");
};

exports.postUserSignUp = async (req, res, next) => {
  try {
    const newUser = new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      username: req.body.username,
      email: req.body.email,
      gender: req.body.gender,
      address: req.body.address,
      // image: req.body.profile_pic_base64,
    });

    imageUrl = `${uid()}__${req.file.originalname}`;
    let filename = `images/${imageUrl}`;
    // let previousImagePath = `images/${newUser.image}`;
    //
    // const imageExist = fs.existsSync(previousImagePath);
    // if (imageExist) {
    //   deleteImage(previousImagePath);
    // }
    await sharp(req.file.path).rotate().resize(500, 500).toFile(filename);

    fs.unlink(req.file.path, (err) => {
      if (err) {
        console.log(err);
      }
    });
    newUser.image = imageUrl;

    await User.register(newUser, req.body.password);
    await passport.authenticate("local")(req, res, () => {
      res.redirect("/user/1");
    });
  } catch (err) {
    console.log(err);
    return res.render("user/userSignup");
  }
};
