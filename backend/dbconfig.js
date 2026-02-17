import { MongoClient } from "mongodb";  

const url = "mongodb+srv://nodeuser:m307uyOVgazHRM30@cluster0.r10ruzd.mongodb.net/?appName=Cluster0"
const dbName="express-project";
export const collectionName="todolist";
const client = new MongoClient(url)
export const connection =async()=>{

    const connect = await client.connect()
    return await connect.db(dbName)   
}