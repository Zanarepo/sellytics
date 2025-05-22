import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./component/HomePage";
import LandingFooterLayout from "./component/LandingFooterLayout";
import Navbar from "./component/Navbar";
//import Footer from "./component/Footer";
//import RegisteredHomePage from './component/UserDashboard/RegisteredHomePage'
// Registered Users components
import Registration from './component/Auth/Registration'

import AdminDasboard from './component/SprintDashboard/AdminDasboard'
import SignaturePad from "./component/VariexContents/SignaturePad";


import AdminNav from './component/SprintDashboard/AdminNav';
import AdminRegistration from './component/Auth/AdminRegistration';
import Login from "./component/Auth/Login";
import Forgotpassword from './component/Auth/Forgotpassword'
import ResetPassword from './component/Auth/ResetPassword'
import RegisteredNavbar from './component/RegisteredNavbar'
import Tools from './component/Tools'

import RegisteredDashboards from './component/RegisteredDashboards'


// Registered Users components
import UserHomepage from './component/UserDashboard/UserHomepage'
import TeamSignup from './component/Auth/TeamSignup'
import StoreUsersHome from './component/UserDashboard/StoreUsersHome'
import Admins from './component/AdminAuth/Admins'
import AdminHome from './component/AdminDashboard/AdminHome'
import SalesMetrics from "./component/UserDashboard/SalesMetrics";
import PoductPurchaseCost from "./component/UserDashboard/ProductsPurchaseCost";
import MainDashboard from './component/UserDashboard/Simplex'

//import Profile from './component/UserDashboard/Profile'
//import ServicesDashboard from './component/UserDashboard/ServicesDashboard'
//import TrackingTools from './component/UserDashboard/TrackingTools'

//import CostRevExp from './component/UserDashboard/CostRevExp'

//import ExpenseTracker from './component/UserDashboard/ExpenseTracker'
//import DebtTracker from './component/UserDashboard/DebtTracker'
//import ProductList from './component/UserDashboard/ProductList'
import SalesTracker from './component/UserDashboard/SalesTracker'
//import Customers from './component/UserDashboard/Customers'
//import Inventory from './component/UserDashboard/Inventory'
import StoresAdmin from './component/Ops/StoresAdmin'
import Profile from './component/UserDashboard/Profile'
import SellyticsPayment from './component/Payments/SellyticsPayment'
import PremiumHomepage from './component/Premiums/PremiumHomepage'
import PushNotifications from "./component/Premiums/PushNotifications";
import Test from './component/UserDashboard/Test'
import FooterLayout from "./component/FooterLayout";










const App = () => {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        {/* Primary navbar for all users */}

        
        <Navbar />
        <div className="flex-grow">
       
        
      


          <Routes>

  
          
            <Route element={<LandingFooterLayout />}>
       
            <Route path="/" element={<HomePage />} />
            
 </Route>

            <Route path="/register" element={<Registration />} />
           <Route path="/login" element={<Login />} />
            <Route path="/login" element={<Login />} />
            
            <Route path="/forgot-password" element={<Forgotpassword />} />

            
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/team-signup" element={<TeamSignup/>} />
            <Route path="/push-notifications" element={< PushNotifications/>} />
            <Route path="/signaturepad" element={<SignaturePad />} />
            <Route path="/test" element={<Test />} />

            {/* premium routes duplicates */}
            
            
          {/* Dashboard*/}

          </Routes>
         

          
          <Routes>
          <Route element={<FooterLayout />}>
          <Route element={<AdminNav />}>
          <Route path="/admindashboard" element={<AdminDasboard/>} />



          <Route path="/adminregister" element={<AdminRegistration/>} /> </Route>
          <Route path="/admin" element={<Admins/>} />
          <Route path="/regdashboard" element={<RegisteredDashboards />} />
         
          <Route path="/dashboard" element={<UserHomepage />} />
          <Route path="/admin-dashboard" element={<AdminHome />} />
          <Route path="/team-dashboard" element={< StoreUsersHome />} />
          <Route path="/sales-metrics" element={<SalesMetrics />} />
          <Route path="/product-cost" element={<PoductPurchaseCost />} />
          <Route path="/main" element={<MainDashboard />} />
          <Route path="/salestrack" element={<SalesTracker />} />
          <Route path="/owner-dashboard" element={<StoresAdmin />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/payment" element={<SellyticsPayment />} />
          <Route path="/premiumdashboard" element={<PremiumHomepage />} />
          <Route path="/push-notifications" element={< PushNotifications/>} />
          <Route path="/signaturepad" element={<SignaturePad />} />
    
</Route>


          
          
          
          
            
                    </Routes>
        


          {/* Dashbaord*/}

          <Routes>
            {/* Routes using the RegisteredNavbar layout */}
            <Route element={<RegisteredNavbar />}>
            <Route element={<RegisteredDashboards />}>
            <Route path="/tools" element={<Tools />} />
            
     

            </Route>
            </Route>
            <Route element={<RegisteredDashboards />}>
           
            </Route>
             
            
            <Route element={<RegisteredNavbar />}>
              <Route path="/dashboard" element={<UserHomepage />} />
              <Route path="/admin-dashboard" element={<AdminHome />} />
              <Route path="/sales-metrics" element={<SalesMetrics />} />
              <Route path="/team-dashboard" element={< StoreUsersHome />} />
              <Route path="/product-cost" element={<PoductPurchaseCost />} />
              <Route path="/main" element={<MainDashboard />} />
              <Route path="/salestrack" element={<SalesTracker />} />
              <Route path="/owner-dashboard" element={<StoresAdmin />} />
              <Route path="/profile" element={<Profile />} />
            
              <Route path="/premiumdashboard" element={<PremiumHomepage />} />
            

            </Route>
          </Routes>






















 
        </div>
       
      </div>
    </Router>
  );
};

export default App;
