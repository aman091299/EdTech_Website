const  express = require("express");
const OTP=require("../models/OTP");
const User=require("../models/User");
const mailSender=require("../utils/mailSender");
const otpGenerator=require("otp-generator");
const bcrypt=require("bcrypt");
const Profile=require("../models/Profile");
const jwt=require("jsonwebtoken");
require("dotenv").config();


//sentOTP
exports.sendotp=async (req,res)=>{
    try {
        const {email}=req.body;
        const checkUserPresent=await User.findOne({email});
        //generate otp
        if(!checkUserPresent){ 
            var otp=otpGenerator.generate(6,{
                upperCaseAlphabets:false,
                lowerCaseAlphabets:false,
                specialChars:false,
            })   
            console.log("otp generated: ",otp);

            //check unique otp
            let checkUniqueOtp=await OTP.findOne({otp:otp});
            
            while(checkUniqueOtp){
                otp=otpGenerator.generate(6,{
                    upperCaseAlphabets:false,
                    lowerCaseAlphabets:false,
                    specialChars:false,
                }) ;
                checkUniqueOtp=await OTP.findOne({otp:otp})  
            } 
            //now we have unique otp and email
             
            //create an entry for otp
             const otpPayload ={email,otp};
             //ye dekhna hai console me

             
            const otpBody=await OTP.create(otpPayload);
            console.log(otpBody);

            //return response successfully
           return res.status(200).json({
                success:true,
                message:'Otp generated successfully',
                otp
            })

               

        }
        //if user already exist,then return a response
        else{
            res.status(401).json({
                success:true,
                message:"user already exist"
            })
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success:false,
            message:`Internal server error ${error.message}`
        })
    }
  
}


//signUp
//ye smjh me nhi aya otp expire kaise hogi
exports.signup=async (req,res)=>{
    try {
        //data fetch from request ki body
        const {
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            accountType,
            contactNumber,
            otp
        }=req.body;

        //validate krlo
        if(!firstName || !lastName || !email || !password || !confirmPassword || !otp){
            return res.status(403).json({
                success:false,
                message:'All fields are mandatory'
            })
        }
        
        //check user already exist or not
        const checkUserExist=await User.findOne({email});
        console.log("checkUserExist",checkUserExist)
        
        if(checkUserExist){
         return  res.status(401).json({
                success:true,
                message:"user already exist ,login please"
        })
  }
  //2 password match 
  if(password !== confirmPassword){
         return res.status((400).json({
         success:false,
         message:"Password and ConfirmPassword value does not match ,please try again"
     }))
 }
              //find most recent otp stored for the user
              const recentOtp=await OTP.find({email:email}).sort({createdAt:-1}).limit(1);
                console.log("yha ye function return kya krega ye dekhna hai",recentOtp);
      
             //validate OTP
            if(recentOtp.length === 0){
                //otp not found
                return res.status(400).json({
                    success:false,
                    message:"Otp not found"
                })
            }
           
            else if(otp !== recentOtp[0].otp){
                      //invalid otp
                      return res.status(400).json({
                        success:false,
                        message:"Invalid Otp"   
                      })

            }
                //hashPassword
                const saltRounds=10;
                const hashedPassword=await bcrypt.hash(password,saltRounds);
                // Create the user
		let approved = "";
		approved === "Instructor" ? (approved = false) : (approved = true);

              const profileDetails=await Profile.create({
                gender:null,
                dateOfBirth:null,
                about:null,
                contactNumber:null,
              });
                //created entry in dp
                const user=await User.create({
                    firstName,
                    lastName,
                    email,
                    password:hashedPassword,
                    contactNumber,
                   accountType,
                   approved:approved,
                   additionalDetails:profileDetails._id,
                   image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
                })
                  console.log(user)
                //return response
               
                return res.status(200).json({
                    success:true,
                    message:"user is registered sucessfully",
                    user
                })

             
    
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:`user cannot be register,please try again ${error}`,
        })
    }
}

//Log in

exports.login=async (req,res)=>{
    try {
        //get data from req body
        const {email,password}=req.body;
        //validation data
        if(!email || !password){
           return res.status(403).json({
                success:false,
                message:'please enter email and password '
            })
        }
        const user=await User.findOne({email})
        .populate("additionalDetails")
        .populate("courses");
        //user not exist
        if(!user){
             return res.status(400).json({
                success:false,
                message:'please signup',
              }) 
        }

       //user exist
       //check password
         const compare=await bcrypt.compare(password,user.password);
         if(!compare){
          return  res.status(400).json({
                success:false,
                message:'incorrect password '
            })
         }
         //generate token

         const payload={
          email:user.email,
          id:user._id,
          role:user.accountType,
         }
         console.log("ye role galat hai kya payload me ",payload)
         //1 day me expire
        const token=jwt.sign(payload,process.env.JWT_SECRET,{
            expiresIn:'24h',
        });
        user.token=token;
        user.password=undefined;
       
        //cookie
        //3 DAY ME EXPIRE
        const options={
            expires:new Date(Date.now() + 3*24*60*60*1000),
            httpOnly:true,
        }
        res.cookie('token',token,options).status(200).json({
            success:true,
            token,
            user,
            message:"user successfully login"
         })

    } catch (error) {
       console.log(error) ;
       return res.status(500).json({
        success:false,
        message:"login failed please try again",
       })
    }
}





//changePassword
//update password means enter old password and change the password
exports.changePassword=async (req,res)=>{
   try {
    console.log("req",req.user)
     //gat data from req body
     const email=req.user.email
    //get oldPassword,new Password ,confirmNewPassword
    const {oldPassword,newPassword}=req.body;
    //validation
    if(!oldPassword || !newPassword){
        return res.json({
            success:false,
            message:'required all the field'
        })
    }
    // if(newPassword != confirmPassword){
    //     return res.status(401).json({
    //        success:false,
    //        message:'Password does not match',
    //     })
    // }
    
    const user=await User.findOne({email});

     const compare= await bcrypt.compare(oldPassword,user.password);
  
    
   if(!compare) {
       return res.status(401).json({
        success:false,
        message:"incorrect oldpassword "
       })
   }
 
 
   //hash password
   const hashedPassword=await bcrypt.hash(newPassword,10);
   console.log("hash",hashedPassword)
   //update password in db
   const userDetails= await User.findOneAndUpdate({email},
        { password:hashedPassword,  },
    {  new:true,  
 });


    //send mail -password updated
     await mailSender(email,"Password had been updated",`password is changed`);
     
    //return response
        return res.json({
            success:true,
            message:"Password is updated"
           })

   } catch (error) {
    return res.status(500).json({
        success:false,
        message:"something went wrong on password update"
    })
   }
    
}


