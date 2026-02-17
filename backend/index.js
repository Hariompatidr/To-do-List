import express from "express"
import { connection, collectionName } from "./dbconfig.js"
import { ObjectId } from "mongodb"
import cors from "cors"
import jwt from "jsonwebtoken"
import cookieParser from "cookie-parser"

const app = express()

app.use(express.json())
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}))
app.use(cookieParser())    

app.post("/signup",async (req,resp)=>{
    try{

    const userdata = req.body

    if(userdata.email && userdata.password){
        const db = await connection()
        const collection = db.collection("users")
        const result = await collection.insertOne(userdata)
        if(result){
            jwt.sign({ id: result.insertedId, email: userdata.email },"secret",{expiresIn:'5d'},(err,token)=>{
            resp.send({
                success:true,
                message:'Signup successful',
                token})
            })
        }
        else{
            resp.send({
            success:false,
            message:'Signup failed',
            })
        }
    }
    }catch(error){
        console.log(error)
        resp.status(500).send({
        success: false,
        message: "Server error"
        })
    }
})
app.post("/login", async (req, resp) => {
    try {
        const userdata = req.body

        if (userdata.email && userdata.password) {

            const db = await connection()
            const collection = db.collection("users")

            const result = await collection.findOne({
                email: userdata.email,
                password: userdata.password
            })

            if (result) {
                jwt.sign(
                    { id: result._id, email: result.email },
                    "secret",
                    { expiresIn: '5d' },
                    (err, token) => {

                        if (err) {
                            return resp.status(500).send({
                                success: false,
                                message: "Token error"
                            })
                        }

                        resp.send({
                            success: true,
                            message: 'login successful',
                            token
                        })
                    }
                )
            } else {
                resp.send({
                    success: false,
                    message: 'login failed user not found'
                })
            }

        } else {
            // 🔥 THIS WAS MISSING
            resp.send({
                success: false,
                message: "Email and password required"
            })
        }

    } catch (error) {
        console.log(error)
        resp.status(500).send({
            success: false,
            message: "Server error"
        })
    }
})

app.post("/add",verifyJWTtoken,async (req,resp)=>{
    const db = await connection()
    const collection = await db.collection(collectionName)
    const result = await collection.insertOne(req.body)
    if(result){
        resp.send({message:'new task added',success:true,result})
    }else{
        resp.send({message:'failed to add task',success:false})
    }
})
app.get("/tasks",verifyJWTtoken,async (req,resp)=>{
    const db = await connection()
    
    const collection = await db.collection(collectionName)
    const result = await collection.find().toArray()
    if(result){
        resp.send({message:'Task Founded',success:true,result})
    }else{
        resp.send({message:'failed to find task',success:false})
    }
})

app.get("/task/:id",verifyJWTtoken,async (req,resp)=>{
    const db = await connection()
    const id = req.params.id
    const collection = await db.collection(collectionName)
    const result = await collection.findOne({_id:new ObjectId(id)})
    if(result){
        resp.send({message:'Task list fetched',success:true,result})
    }else{
        resp.send({message:'Failed to fetch task',success:false})
    }
})
app.put("/update-task",verifyJWTtoken,async (req,resp)=>{
    const db = await connection()
    const collection = await db.collection(collectionName)
    const {_id,...fields} = req.body
    const update = {$set:fields}
    console.log(fields)
    const result = await collection.updateOne({_id:new ObjectId(_id)},update)
    if(result){
        resp.send({message:'Task Updated',success:true,result})
    }else{
        resp.send({message:'failed to update task',success:false})
    }
})
app.delete("/tasks/:id",verifyJWTtoken, async (req, resp) => {
    try {
        const db = await connection()
        const id = req.params.id
        const collection = db.collection(collectionName)

        const result = await collection.deleteOne({ _id: new ObjectId(id) })

        if (result.deletedCount === 1) {
            resp.json({ message: 'Task Deleted', success: true })
        } else {
            resp.json({ message: 'Task not found', success: false })
        }

    } catch (error) {
        resp.status(500).json({ message: 'Server error', success: false })
    }
})
app.delete("/delete-multiple",verifyJWTtoken, async (req, resp) => {
    try {
        const db = await connection()
        const {selectedTasks} = req.body
        const deletetaskIds= selectedTasks.map(id => new ObjectId(id))

        const collection = db.collection(collectionName)
        const result = await collection.deleteMany({ _id:{$in:deletetaskIds} })

        if (result) {
            resp.send({ message: 'Task Deleted', success: true,result })
        } else {
            resp.send({ message: 'Task not found', success: false })
        }

    } catch (error) {
        resp.status(500).json({ message: 'Server error', success: false })
    }
})

function verifyJWTtoken(req, resp, next) {

    const token = req.cookies["token"]

    if (!token) {
        return resp.status(401).send({
            msg: "No token provided",
            success: false
        })
    }

    jwt.verify(token, "secret", (err, decoded) => {

        if (err) {
            return resp.status(401).send({
                msg: "Invalid token",
                success: false
            })
        }

        req.user = decoded   
        next()              
    })
}

app.listen(3200)