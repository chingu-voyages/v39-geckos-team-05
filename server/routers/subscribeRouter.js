const express = require('express');
const router = express.Router();
const pool = require('../db.js');

//  Insert DB module to populate data in an empty DB 
//  I also can use Sequelize libarary ORM tool!
router.post('/subscribe', async (req, res) => {
    console.log("req : " , req.body);
    // when request contains duplicate key value, server dies
    try{
        await pool.query("INSERT INTO subscriber(firstname, lastname, email) values($1, $2, $3);", 
         [req.body.firstname, req.body.lastname, req.body.email])
         res.status(200).send("new subscriber sucessfully registered. ")
    } 
    catch(error)
    {   
        // error message structure
        //  {"length":293,"name":"error","severity":"ERROR","code":"23505","detail":"Key (email)=(rrr6@jalsdf3.com) already exists.","schema":"public","table":"subscriber","constraint":"subscriber_email_key","file":"d:\\pginstaller_12.auto\\postgres.windows-x64\\src\\backend\\access\\nbtree\\nbtinsert.c","line":"570","routine":"_bt_check_unique"}
        // JSON.stringify(error)
        //  23505 error code duplicate key value
        console.log("router err: " , JSON.stringify(error.code).includes("23505"))
        if(JSON.stringify(error.code).includes("23505"))
        {
            res.status(200).send("duplicate email but I guess it is okay");    
        }else{            
            const errMsg = 'Error while registering new subscriber: ' + error
            //  'ERR_HTTP_INVALID_STATUS_CODE'  Invalid status code . put wrong argument at send function
            res.status(400).send(errMsg);
        }
        
    }
})

module.exports = router