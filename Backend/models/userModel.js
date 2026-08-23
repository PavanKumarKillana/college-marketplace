const db=require("../config/db")

function createUser(email,hashedPassword,name,role,roomNumber,hostelId,year,callback){
    db.query(
        "INSERT INTO users(email,password,name,role,room_number,hostel_id,year)VALUES(?,?,?,?,?,?,?)",
        [email,hashedPassword,name,role,roomNumber||null,hostelId||null,year||null],
        (err,result)=>{
            if(err) callback(err,null)
            else callback(null,result)
        }
    )
}

function getUserByEmail(email,callback){
    db.query("SELECT * FROM users WHERE email=?",[email],(err,result)=>{
        if(err) callback(err,null)
        else callback(null,result)
    })
}

function getUserById(id,callback){
    const query=`
        SELECT u.*, h.name AS hostel_name, h.code AS hostel_code
        FROM users u
        LEFT JOIN hostels h ON u.hostel_id = h.id
        WHERE u.id=?
    `
    db.query(query,[id],(err,result)=>{
        if(err) callback(err,null)
        else callback(null,result)
    })
}

/**
 * updateUserHostel — updates hostel_id, room_number, and year for a user.
 * Also syncs hostel_id to the linked seller record if one exists.
 */
function updateUserHostel(id,hostelId,roomNumber,year,callback){
    db.query(
        "UPDATE users SET hostel_id=?, room_number=?, year=? WHERE id=?",
        [hostelId||null, roomNumber||null, year||null, id],
        (err,result)=>{
            if(err){ callback(err,null); return }
            // Sync seller hostel_id if user has a shop
            db.query(
                "UPDATE sellers SET hostel_id=? WHERE user_id=?",
                [hostelId||null, id],
                () => callback(null,result)
            )
        }
    )
}

function updateUserRole(id,role,callback){
    db.query("UPDATE users SET role=? WHERE id=?",[role,id],(err,result)=>{
        if(err) callback(err,null)
        else callback(null,result)
    })
}

function updateUserPassword(email,hashedPassword,callback){
    db.query("UPDATE users SET password=? WHERE email=?",[hashedPassword,email],(err,result)=>{
        if(err) callback(err,null)
        else callback(null,result)
    })
}

function setUserBlockStatus(id,isBlocked,callback){
    db.query("UPDATE users SET is_blocked=? WHERE id=?",[isBlocked,id],(err,result)=>{
        if(err) callback(err,null)
        else callback(null,result)
    })
}

module.exports={
    createUser,
    getUserByEmail,
    getUserById,
    updateUserHostel,
    updateUserRole,
    updateUserPassword,
    setUserBlockStatus
}
