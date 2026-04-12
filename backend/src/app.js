 const express  = require('express')
 const app = express()
const connectdb = require('./db/db');
const cookieParser = require('cookie-parser');
const cors = require('cors')
const authRoutes = require('./routes/auth.routes')
const interviewRouter = require('./routes/interview.routes')

//database call
connectdb();


//middleware
app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin:"http://localhost:5173",
    credentials:true
}))



// prefix
app.use('/api/auth' , authRoutes)
app.use('/api/interview' , interviewRouter)


 module.exports = app