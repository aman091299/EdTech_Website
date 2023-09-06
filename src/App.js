import "./App.css";
import{Route,Routes} from "react-router-dom"
import Home  from "./pages/Home";
import Navbar from "./components/common/Navbar"
import ForgotPassword from "./pages/ForgetPassword";
import { useState } from "react";
import Login from './pages/Login'
import Signup from './pages/Signup'
import UpdatePassword from "./pages/UpdatePassword";
import VerifyEmail from "./pages/VerifyEmail";
import OpenRoute from './components/core/Auth/OpenRoutes'
import About from  './pages/About'
import Contact from './pages/Contact'
import  MyProfile from './components/core/Dashboard/MyProfile'
import Dashboard from './pages/Dashboard'
import PrivateRoute from "./components/core/Auth/PrivateRoute";
import Error from './pages/Error'
import Settings from "./components/core/Dashboard/Settings/ChangeProfilePicture";
import DeleteAccount from "./components/core/Dashboard/Settings/DeleteAccount"
import EditProfile from "./components/core/Dashboard/Settings/EditProfile"
import UpdatePassword1  from "./components/core/Dashboard/Settings/UpdatePassword"
import EnrolledCourses from "./components/core/Dashboard/EnrolledCourses";
import { Cart } from "./components/core/Dashboard/Cart/index";
import MyCourses from "./components/core/Dashboard/MyCourses"
import {ACCOUNT_TYPE} from "./utils/constants"
import { useSelector } from "react-redux";
import AddCourse from "./components/core/Dashboard/AddCourses/index"
import EditCourse from "./components/core/Dashboard/EditCourse";
import Catalog from "./pages/Catalog";
import CourseDetails from "./pages/CourseDetails";
import VideoDetails from "./components/core/ViewCourse/VideoDetails";
import ViewCourse from "./pages/ViewCourse";
import Instructor from "./components/core/Dashboard/Instructor";

function App() {

  const {user}=useSelector(state=>state.profile)


  const [isLoggedIn,setIsLoggedIn]=useState(false);
  return (
<div className="w-screen min-h-screen bg-richblack-900 flex flex-col font-inter  ">
<Navbar/>


<Routes>
<Route path="/" element={<Home/>}/>
<Route path="/catalog/:catalogName" element={<Catalog/>}/>
<Route path="/courses/:courseId" element={<CourseDetails/>}/>

<Route path="signup" element={
            <OpenRoute>
              <Signup setIsLoggedIn={setIsLoggedIn} />
            </OpenRoute>
          }
        />
        
<Route path="login" element={
            <OpenRoute>
              <Login setIsLoggedIn={setIsLoggedIn} />
            </OpenRoute>
          }
        />

<Route path="update-password/:id"  element={
         <OpenRoute>
    <UpdatePassword/> 
    </OpenRoute>
    }/>

   <Route path="verify-email"  element={
       <OpenRoute>
    <VerifyEmail/> 
    </OpenRoute>
    }/>

 <Route path="forget-password" element={
    //jo non login user hai vo open route ko excess kr paye
    //jo log login nhi vo vyki  yha pe a aske te hai 
                                     <OpenRoute>
                                <ForgotPassword/>
                                </OpenRoute>
                                }/>

<Route path="about" element={
    <About/>
   
     }/>


<Route path="contact"  element={
    <Contact/>
     }/>

    
<Route element={  

<Dashboard/> 

 } >

<Route path="dashboard/my-profile" element={<MyProfile/>}/>

 {/* <Route path="dashboard/settings" element={
     <Settings/>
 }/> */}
  {/* <Route path="dashboard/settings" element={
     <DeleteAccount/>
 }/> */}
  {/* <Route path="dashboard/settings" element={
     <EditProfile/> */}
  {/* <Route path="dashboard/settings" element={
     <UpdatePassword1/>
 }/> */}
   <Route path="dashboard/settings" element={
     <EditProfile/>
 }/>

 {
  user?.accountType === ACCOUNT_TYPE.STUDENT &&(
    <>
    <Route path="dashboard/enrolled-courses" element={<EnrolledCourses/>}/>
 <Route path="dashboard/Cart" element={<Cart/>}/>
 </>)
 }


{

  user?.accountType === ACCOUNT_TYPE.INSTRUCTOR && (
    <>
      <Route path="dashboard/add-course" element={<AddCourse/>}/>
      <Route path="dashboard/instructor" element={<Instructor/>}/>
      <Route path="dashboard/my-courses" element={<MyCourses/>}/>
      <Route path="dashboard/edit-course/:courseId" element={<EditCourse/>}/>
    </>
  )
}
 
</Route>

{/* route ke ander ek or route */}
<Route element={
  <PrivateRoute>
    <ViewCourse/>
  </PrivateRoute>
}>
{
  user?.accountType === ACCOUNT_TYPE.STUDENT && (
    <>
      <Route
        path="view-course/:courseId/section/:sectionId/sub-section/:subSectionId"
        element={<VideoDetails/>}
      />
    </>
  )
}

</Route>
<Route path="*" element={ <Error/>}/>
 
</Routes>

{/* <Routes>

  </Routes> */}
</div>
  );
}

export default App;
