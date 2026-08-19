const db=require("../config/db")

function getAllUsers(callback){
    db.query("SELECT id, email, name, role, room_number FROM users",(err,result)=>{
        if(err){
            callback(err,null)
        }
        else{
            callback(null,result)
        }
    })
}

module.exports={
    getAllUsers
}
