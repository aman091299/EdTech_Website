const nodemailer=require("nodemailer");

const mailSender=async (email,title,body)=>{
    try {
           console.log("inside mailsender 1",process.env.MAIL_HOST,process.env.MAIL_USER,process.env.MAIL_PASS);
        const transporter=nodemailer.createTransport({
            host:process.env.MAIL_HOST,
        port: 465, // or 587 with secure: false
      secure: true, // true for 465, false for 587
            auth:{
                user:process.env.MAIL_USER,
                pass:process.env.MAIL_PASS,
            }
        })
     let info=await transporter.sendMail({
         from:'StudyNotion',
         to:`${email}`,
         subject:`${title}`,
         html:`${body}`
     })
   console.log("inside mail Sender2",info);
   return info;
        
    } catch (error) {
        console.log(error.message);
        
    }
}

module.exports=mailSender;