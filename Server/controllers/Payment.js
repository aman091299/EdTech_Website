const {paymentSuccessEmail}=require("../mail/templates/paymentSuccessEmail");
const {courseEnrollmentEmail}=require("../mail/templates/courseEnrollmentEmail")

const {instance}=require("../config/razorpay");
const Course=require("../models/Course");
const User=require("../models/User");
const mailSender=require("../utils/mailSender");

// const {courseEnrollmentEmail}=require("");
const mongoose=require('mongoose');
const crypto=require("crypto");
const CourseProgress = require("../models/CourseProgress");
//for multiple courses  payment using razor pay
//intiate the razorpay order

exports.capturePayment=async(req,res)=>{
    console.log("hey capture payment",req.body)

    const {courses}=req.body;
    const userId=req.user.id;
    
    if(courses.length === 0 ){
        return res.json({
            success:false,
            message:"Please provide Course Id"
        })
    }

    let totalAmount = 0;

    for(const course_id of courses){
        console.log("Type of courseid",typeof(course_id))
        let course;
        try{
            course=await Course.findById(course_id);
            if(!course){
                return res.status(200).json({
                    success:false,
                    message:"could not find the course"
                })
            }
            
            console.log("courseid",course_id)

            const uid =new mongoose.Types.ObjectId(userId);
            if(course.studentsEnrolled.includes(uid)){
                return res.status(200).json(
                    {success:false,
                        message:"Student is already Enrolled"
                })
            }
            totalAmount +=course.price;
        }
        catch(error){
            console.log(error);
            return res.status(500).json({
                success:false,
                message:error.message
            })
        }
    }
    const options={
        amount :totalAmount*100,
        currency :"INR",
        receipt : Math.random(Date.now()).toString(),
   
    }
    console.log("ye math random date now function kya krega",Math.random(Date.now()))

    try{
        const paymentResponse=await instance.orders.create(options);
        console.log("paymentResponse",paymentResponse)
        return res.json({
            success:true,
            message:paymentResponse
        })
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:error  })
    }
  
}

//verify the payment

exports.verifyPayment =async(req,res)=>{
 console.log("hey verify payment")
  const razorpay_order_id=req.body?.razorpay_order_id;
  const razorpay_payment_id=req.body?.razorpay_payment_id;
  const razorpay_signature=req.body?.razorpay_signature;
  const courses=req.body?.courses;
  const userId=req.user.id;
  //for generating signature we use orderid paymentid and signature
  if(!razorpay_order_id ||
     !razorpay_payment_id ||
     !razorpay_signature ||
     !courses ||
     !userId
    ){
        return res.status(200).json({
            success:false,
            message:"Payment Failed"
        })
    }

    let body =razorpay_order_id + "|" + razorpay_payment_id;
     const expectedSignature =crypto
    .createHmac("sha256",process.env.RAZORPAY_SECRET)
    .update(body.toString())
    .digest("hex");

    if(expectedSignature === razorpay_signature){
        //enroll kawao student ko
               await enrollStudents(courses,userId,res);
        //return response
        return res.status(200).json({
            success:true,
            message:"Payment Verified"
        })

      
    }
    return res.status(200).json({
        success:false,
        message:"Payment Failed"
    })
}

const enrollStudents =async(courses,userId,res)=>{
     
    if(!courses || !userId){
        return res.status(400).json({
            success:false,
            message:"Please Provide data for Courses or UserId"
        })
    }
        console.log("hey student enrolled",courses)
    for(const courseId of courses){
     try {
           //find the course and enroll the student in it
           const enrolledCourse=await Course.findOneAndUpdate({_id:courseId},
            {$push:{studentsEnrolled:userId}},

            {new:true}
            )
        if(!enrolledCourse){
            return res.status(500).json({
                success:false,
                message:"Courses not Found"
            })
        }
console.log("hey before course progress")
        const courseProgress=await CourseProgress.create({
            courseID:courseId,
            userId:userId,
            completedVideos:[],
              
        }) 
        console.log(" after course progress",courseProgress)

        //find the student and add them in courses
        const enrolledStudent =await User.findByIdAndUpdate(userId,
            {$push:{
                courses:courseId,
                courseProgress:courseProgress._id,
            }},
            {new:true}
            )
      console.log("enrolled student",enrolledStudent)
          /// bache ko mail send kardo
          const emailResponse=await mailSender(
            enrolledStudent.email,
            `Successfully Enrolled into ${enrolledCourse.courseName}`,
            courseEnrollmentEmail(enrolledCourse.courseName, `${enrolledStudent.firstName}`)
          )  

          console.log("email Sent Successfully",emailResponse)
        
     } catch (error) {
        
        console.log(error);
        return res.status(500).json({
            success:false,
            message:error.message
        })
     }
    }

}


exports.sendPaymentSuccessEmail=async(req,res)=>{
  console.log("hey send payment email")
    const {orderId,paymentId,amount}=req.body;
    console.log("req.body in payment",req.body)
    
    const userId=req.user.id;
    console.log(userId)
    if(!orderId || !paymentId || !amount  || !userId ){
        return res.status(400).json({success:false,
        message:"Please provide all the field"}
        )
    }

    try {
        //student lo dhundo
        
        const enrolledStudent =await User.findById(userId);

        console.log("enrolledStudent.email",enrolledStudent.email)
    await mailSender (
        enrolledStudent.email,
        'Payment Received',
        paymentSuccessEmail(`${enrolledStudent.firstName}`,
        amount/100,
        orderId,
        paymentId
        
        )

    )
    } catch (error) {
       console.log("error in sending mail") ;
       return res.status(500).json({
        message:"Could not send email",
        success:false,
       })
    }


}





//capture the payment and initiate the Razorpay order
//create of payment


// exports.capturePayment=async (req,res)=>{
//    //fetch courseId and UserId
//    const {course_id}=req.body;
//    const userId=req.user.id;
//    //validation
//    if(!course_id || !userId){
//       return res.status(400).json({
//         success:false,
//         message:'Please provide valid course Id',
//       });
//    } 
//    //valid courseDetail
//    try{
//        const  courseDetail=await Course.findById(course_id);
//        if(!courseDetail){
//         return res.status(401).json({
//             success:false,
//             message:'Could not find the course',
//         })
//        }
//  //user already pay for the same course
//  // userId string me hai convert into object Id
//  const uid=new mongoose.Types.ObjectId(userId);
// if(Course.studentEnrolled.includes(uid)){
//     return res.status(400).json({
//         success:false,
//         message:'Student is already enrolled',
//     })
// }

//  }catch(error){
//     console.error(error);
//     return res.status(500).json({
//         success:false,
//         message:" payment failed",
//         error:error.message,
//     })

//    }
 
//   //create order
// const amount=courseDetail.price;
// const currency="INR";
//  console.log("ye math random date now function kya krega",Math.random(Date.now()))
// const options={
//     amount:amount*100,
//     currency,
//     receipt:Math.random(Date.now()).toString(),
//     notes:{
//         courseId:course_id,
//         userId
//     }
// }
   
// try {
//     //payment ho gya razor pay ne kiya hai sb
//     //initiate the payment using razorpay
//     const paymentResponse=await instance.orders.create(options);
//     console.log("payment ka response",paymentResponse);

//     //response
//     return res.status(200).json({
//         success:true,
//         courseName:courseDetail.courseName,
//         courseDescription:courseDetail.courseDescription,
//         thumbnail:courseDetail.thumbnail,
//         orderId:paymentResponse.id,
//         currency:paymentResponse.currency,
//         amount:paymentResponse.amount,
//     })
// } catch (error) {
//     console.log(error);
//     return res.json({
//         success:false,
//         message:"could not intiate order payment using razor failed",
//     })
// }
  
// }; 
// //payment hone ke bd ka action
// //notification send by razor pay for payment
// //verify signature of Razorpay and server
// //matching of razorpay and server secret key
// //hw:checksum ?

// exports.verifySignature=async (req,res)=>{
//    const webhookSecret="12345678";
//    //encrypted key by razor pay
//    const signature=req.header("x-razorpay-signature"); 
// //convertion of webhookSecret to encrypted data
//    const shasum=crypto.createHmac("sha256",webhookSecret)  ; 
//    shasum.update(JSON.stringify(req.body));
//    //now this webhook is converted in digest
//    const digest=shasum.digest("hex");
//    //match signature and digest key both keys
//   if(signature==digest) {
//     console.log("Payment is Authorised");
//       //payment hone ke bd ki khani
//     const {courseId,userId}=req.body.payload.entity.notes;

//     try {
//         //fullfil the action

//         //find the course and enroll the student in it
//         const courseDetails=await Course.findOneAndUpdate({_id:courseId},
//                                                          {$push:{
//                                                             //userid ko new mongoose object id q nhi  kiya
//                                                             studentsEnrolled:userId,
//                                                          }
//                                                         },
//                                                         {new:true} ,            
//             );

//        if(!courseDetails){
//         return res.json({
//             success:false,
//             message:"course not found"

//         })
//        }
//        console.log(courseDetails);
  
//       //find the user and add the course
//        const userDetails=await User.findOneAndUpdate({_id:userId},
//                                                      { push$: {courses:courseId} },
//                                                       {new:true},
                                                    
//        );
//        console.log(userDetails);

//        //sending mail to user on registration of course
//       const emailResponse=await mailSender(userDetails.email,"Congratulation from StudyNotion",`Congratulations,you are onboarded into new course ${courseDetails.courseName} on studyNotion`);
//       console.log(courseEnrollmentEmail);
//       console.log(emailResponse)
//       return res.status(200).json({
//         success:true,
//         message:'Signature Verified and Course Added'
//       })
//     } catch (error) {
//         console.log(error);
//         return res.status(500).json({
//             success:false,
//             message:error.message,
//         })
//     }
// }
//     return res.status(400).json({
//         success:false,
//         message:"signature verification failed",
//     })

 
//   };


    
  



