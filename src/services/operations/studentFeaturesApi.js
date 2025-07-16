import { toast } from 'react-hot-toast';
import {studentEndpoints} from '../apis'
import {apiConnector} from '../apiconnector'
import rzpLogo from "../../assets/Logo.svg"
import {setPaymentLoading} from '../../slices/courseSlice'
import {resetCart}  from '../../slices/cartSlice'



const{
COURSE_PAYMENT_API,
COURSE_VERIFY_API,
SEND_PAYMENT_SUCCESS_EMAIL_API
}

=studentEndpoints;

//body ke andr jo script src me bheji add kr do
function loadScript(src){
    return new Promise((resolve)=>{
        const script =document .createElement("script");
         script.src=src ;
         
         script.onload=()=>{
            resolve(true);

         }
         script.oneerror=()=>{
            resolve(false);
         }
         document.body.appendChild(script);


    })
}

//buy course 

export async function buyCourse(token,courses,userDetails,navigate,dispatch){
    console.log("userDetails",userDetails);
    const toastId=toast.loading("Loading...")

  try {
     //load the script
   const res=await loadScript("https://checkout.razorpay.com/v1/checkout.js") ;
   if(!res){
    toast.error("RazorPay SDK failed to load");
    return;
   }

   //intiate the order form order id
   const orderResponse =await apiConnector("POST",COURSE_PAYMENT_API,
   {
    courses
   },
   {
     Authorization:`Bearer ${token}`,
   }
   )
if(!orderResponse.data.success){
    throw new Error(orderResponse.data.message);
}

//option
//order id generated
 console.log("order response",orderResponse );
 console.log("razorpay key",process.env.RAZORPAY_KEY)
const options={
    key:"rzp_test_kXISdNLX54psIM",
    currency :orderResponse.data.message.currency,
    amount:`${orderResponse.data.message.amount}`,
    order_id: orderResponse.data.message.id,
    name:"StudyNotion",
    description:"Thank You for Purchasing the Course",
    image:rzpLogo,
    prefill:{
        name:`${userDetails.firstName}`,
        email:userDetails.email
    },
    handler:function(response){
        //send successfull wala mail
        console.log("response",response)
    sendPaymentSuccessEmail(response,orderResponse.data.message.amount,token)


        //verifyPayment 
        verifyPayment({...response,courses},token,navigate,dispatch)
    }
}

//miss ho gya tha ye
//opening modal of razor pay ->study Notion
//for response ->signature,payment id
const paymentObject=new window.Razorpay(options);
//payment ho gi
paymentObject.open();
paymentObject.on("payment failed",function(response){
    toast.error("oops,payment failed");
    console.log(response.error);
})
    
  } catch (error) {
   console.log("Payment API error...",error);
   toast.error("Could not make Payment");
    
  }
toast.dismiss();
}

// Send the Payment Success Email
async function sendPaymentSuccessEmail(response,amount,token){
    try{
        
        const mail=await apiConnector("POST",SEND_PAYMENT_SUCCESS_EMAIL_API,{
            
            paymentId:response.razorpay_payment_id,
            orderId:response.razorpay_order_id,
            amount, 
         },{
            Authorization:`Bearer ${token}`
         }
        
         )
         console("mail successfully",mail)
    }
    catch(error){

        console.log("Payment Success Email Error...",error)
    }
}


//verify payment

async function verifyPayment(bodyData,token,navigate,dispatch){
    const toastId=toast.loading("Verifying Payment...");
    dispatch(setPaymentLoading(true));
    try {
        const response=await apiConnector("POST",COURSE_VERIFY_API,bodyData,{
            Authorization :`Bearer ${token}`,
        })
        console.log("response of verify payment",response)
        if(!response.data.success){
            throw new Error(response.data.message);
        }
        toast.success("Payment Successfull,you are added to the course");
        navigate("/dashboard/enrolled-courses");
        dispatch(resetCart());
    } catch (error) {
        console.log("payment verify Error...",error);
        toast.error("Could not verify Payment")
    }
    toast.dismiss(toastId);
    dispatch(setPaymentLoading(false));
}
