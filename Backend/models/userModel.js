const db=require("../config/db")
function createUser(email,hashedPassword,name,role,roomNumber,callback){
    db.query(
        "INSERT INTO users(email,password,name,role,room_number)VALUES(?,?,?,?,?)",
        [email,hashedPassword,name,role,roomNumber],
        (err,result)=>{
            if(err){
                callback(err,null)
            }
            else{
                callback(null,result)
            }
        }
    )
}
function getUserByEmail(email,callback){
    db.query("SELECT * FROM users WHERE email=?",[email],(err,result)=>{
        if(err){
            callback(err,null)
        }
        else{
            callback(null,result)
        }
    })
}
function getUserById(id,callback){
    db.query("SELECT * FROM users WHERE id=?",[id],(err,result)=>{
        if(err){
            callback(err,null)
        }
        else{
            callback(null,result)
        }
    })
}
function updateUserRole(id,role,callback){
    db.query("UPDATE users SET role=? WHERE id=?",[role,id],(err,result)=>{
        if(err){
            callback(err,null)
        }
        else{
            callback(null,result)
        }
    })
}
function updateUserPassword(email,hashedPassword,callback){
    db.query("UPDATE users SET password=? WHERE email=?",[hashedPassword,email],(err,result)=>{
        if(err){
            callback(err,null)
        }
        else{
            callback(null,result)
        }
    })
}
function setUserBlockStatus(id,isBlocked,callback){
    db.query("UPDATE users SET is_blocked=? WHERE id=?",[isBlocked,id],(err,result)=>{
        if(err){
            callback(err,null)
        }
        else{
            callback(null,result)
        }
    })
}
module.exports={
    createUser,
    getUserByEmail,
    getUserById,
    updateUserRole,
    updateUserPassword,
    setUserBlockStatus
}

