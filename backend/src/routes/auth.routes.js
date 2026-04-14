const express = require('express')
const router = express.Router()
const authcontroller = require('../controllers/auth.controllers')
const authMiddleware = require('../middlewares/auth.middlewares')



/**
* @route POST /api/auth/register
* @description Register a new user
* @access Public
*/
router.post('/register',authcontroller.registerUser)



/**
* @route POST /api/auth/login
* @description Login a  user
* @access Public
*/
router.post('/login',authcontroller.loginUser)



/**
* @route get /api/auth/logout
* @description logout a  user clear token in cookie and add token in blacklist
* @access Public
*/
router.get('/logout',authcontroller.logoutUser)


/**
* @route get /api/auth/get-me
* @description get current user login detail
* @access Private
*/
router.get('/get-me',authMiddleware.authUser , authcontroller.getme)




module.exports = router