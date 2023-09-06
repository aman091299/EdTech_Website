const mongoose=require("mongoose");
const mailSender = require("../utils/mailSender");
const emailTemplate=require("../mail/templates/emailVerificationTemplate")
const OTPSchema=new mongoose.Schema({
  email:{
    type:String,
    required:true,
  },
  otp:{
    type:String,
    required:true,
  },
  createdAt:{
    type:Date,
    default:Date.now(),
    expires :5*60*1000,// The document will be automatically deleted after 5 minutes of its creation time
  }

});
 
//a function -> to send emails

async function sendVerificationEmail(email,otp){
  try {
     const mailResponse=await mailSender(
      email,
      "verification email from StudyNotion",
      emailTemplate(otp),
      );
      console.log("Email sent successfully",mailResponse);
  } catch (error) {
    console.log("error occur while sending mail :",error);
    throw error;
  }
}

OTPSchema.pre("save",async function(next){
  await sendVerificationEmail(this.email,this.otp);
  next();
})



module.exports=mongoose.model("OTP",OTPSchema);