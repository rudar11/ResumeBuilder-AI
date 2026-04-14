const userModel = require('../models/user.models')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const blacklistModel = require('../models/blacklist.models')


/**
* @route registerUser
* @description Register a new user , expects username , email ,password
* @access Public
*/

async function registerUser(req, res) {

    try {
        const { username, email, password } = req.body

        if (!username || !email || !password) {
            return res.status(400).json({ message: "please provide username , email , password" })
        }

        const isuserAlreadyExists = await userModel.findOne({
            $or: [{ username }, { email }]
        })

        if (isuserAlreadyExists) {
            return res.status(400).json({ message: "account alreday exists with this username or email" })
        }

        const hash = await bcrypt.hash(password, 10);


        const user = await userModel.create({ username, email, password: hash })


        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" })

        res.cookie("token", token)

        return res.status(201).json({ message: "user created succcessfully", user: { id: user._id, username: user.username, email: user.email }, token })
    } catch (error) {
        return res.status(500).json({ message: "server error in register" })
    }

}



/**
* @route loginUser
* @description login a new user, expects  email ,password in the body
* @access Public
*/

async function loginUser(req, res) {


    try {
        const { email, password } = req.body


       const user = await userModel.findOne({ email })

        if (!user) {
            return res.status(401).json({ message: "invalid email or password" })
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)  //usr.password is hashed passwrd

        if (!isPasswordValid) {
            return res.status(401).json({ message: "invalid email or password" })
        }


        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" })

        res.cookie("token", token)

        return res.status(200).json({
            message: "login successful",
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            },
            token
        })
    } catch (error) {
        return res.status(500).json({ message: "server error in login" });
    }

}


/**
* @route logoutUser
* @description logout a  user, and blacklist token
* @access Public
*/
async function logoutUser(req, res) {

    try {

        const token = req.cookies.token

        if (!token) {
            return res.status(400).json({ message: "no token provided" })
        }

        await blacklistModel.create({ token })

        res.clearCookie("token")

        return res.status(200).json({ message: "user logout successfully" })

    } catch (err) {
        return res.status(500).json({ message: "server error in logout user" })
    }

}


/**
* @route getme contoller
* @description get the current logged user in details
* @access private
*/
async function getme(req,res){
const user = await userModel.findById(req.user.id)


res.status(200).json({
    message: "User details fetched successfully",
    user: {
        id: user._id,
        username: user.username,
        email: user.email
    }
})

}



module.exports = { registerUser, loginUser, logoutUser , getme }