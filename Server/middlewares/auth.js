const jwt=require("jsonwebtoken");
require('dotenv').config();
const User=require("../models/User")

//auth
exports.auth=async (req,res,next)=>{
   try {
    console.log("before token");
      const token=req.cookies.token || req.body.token ||req.header("Authorization").replace("Bearer ","");
      console.log("token aya kya",token);
      console.log("token aya kya cookies se",req.cookies.token);
      if(!token){
        return res.status(401).json({
            success:false,
            message:'Token not found'
        })
      }
      //authentication check
      //verification -issue
      try {

        const payload=jwt.verify(token,process.env.JWT_SECRET);
        req.user=payload;
        next();
      } catch (error) {
        return res.status(401).json({
            success:false,
            message:'token is invalid'
        })
       
      }
   
   } catch (error) {
      return res.status(401).json({
        success:false,
        message:'something went wrong while validating the token'
      })
   }
}

//isStudent
exports.isStudent=async(req,res,next)=>{
    try {
        if(req.user.role !== 'Student'){
            
        return res.status(401).json({
            success:false,
            message:"this is the protected route for student only"
        })
         
    }
    next(); 
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:'Student role cannot be verified,please try again'
        })
    }
}
//isInstructor
exports.isInstructor=async(req,res,next)=>{
    try {
          
        if(req.user.role != 'Instructor'){
            
        return res.status(401).json({
            success:false,
            message:"this is the protected route for insturctor only"
        })


      
       
    }
   
    next();   
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:'Instructor role cannot be verified,please try again'
        })
    }
}



//is Admin
exports.isAdmin=async(req,res,next)=>{
    try { 
       
        if(req.user.role != 'Admin'){
            
        return res.status(401).json({
            success:false,
            message:"This is the protected route for Admin only"
        })
         
    }
    next(); 
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:'Admin role cannot be verified,please try again'
        })
    }
}