import { Link } from "react-router-dom";
//import LandingPageFeatures from './LandingPageFeatures'
//import  ReviewForm from './Premiums/ReviewForm'
//import ChatWindow from "./Chatdashboard/ChatWindow";
//import UseCaseCarousel from './UseCaseCarousel'
//import SEOComponent from "./SEOComponent";
//import Standup from './Standup'
//import AppLauncher from './AppLauncher'
import { FaCheckCircle, FaBrain, FaListAlt, FaRegLightbulb, FaDollarSign, FaCogs } from "react-icons/fa";

function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6 text-gray-800 mt-20">
      <div className="text-center max-w-3xl bg-white p-8 rounded-lg shadow-xl">
        <h1 className="text-4xl font-bold text-yellow-600">Sprintify</h1>
        <p className="mt-4 text-lg text-gray-700">
        The go-to tool for Agile teams to simulate product development, optimize workflows, 
        and deliver high-quality products faster.</p>
        <Link to="/allapps">
          <button className="mt-6 px-6 py-3 bg-yellow-600 text-white text-lg rounded-lg shadow-md hover:bg-yellow-700 transition">
            Try Sprintify
          </button>
        </Link>
        
      </div>
     
      
      <div className="mt-12 w-full px-6 text-center">
        <h2 className="text-3xl font-semibold text-yellow-600 mb-6">Why Sprintify?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-lg shadow-md">
            <FaCheckCircle className="text-blue-600 text-4xl mb-4" />
            <h3 className="text-xl font-semibold mb-2">Easy to Use</h3>
            <p className="text-gray-700">
              Sprintify's intuitive interface makes it easy to get started, even for beginners.
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <FaBrain className="text-yellow-600 text-4xl mb-4" />
            <h3 className="text-xl font-semibold mb-2">Effective Sprint Estimation</h3>
            <p className="text-gray-700">
              Accurately estimate and plan sprints.
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <FaListAlt className="text-green-600 text-4xl mb-4" />
            <h3 className="text-xl font-semibold mb-2">Smooth Backlog & Prioritization</h3>
            <p className="text-gray-700">
              Prioritize tasks and ideas effortlessly for better sprint execution.
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <FaRegLightbulb className="text-green-600 text-4xl mb-4" />
            <h3 className="text-xl font-semibold mb-2">Brainstorming Made Easy</h3>
            <p className="text-gray-700">
              Capture ideas instantly during sprint planning with Sprintify's collaborative tools.
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <FaDollarSign className="text-blue-600 text-4xl mb-4" />
            <h3 className="text-xl font-semibold mb-2">Business/Users Value Estimator</h3>
            <p className="text-gray-700">
            Teams can collaboratively evaluate the potential value of features to ensure maximum ROI for business/users.
            </p>
          </div>
         

          <div className="p-6 bg-white rounded-lg shadow-md">
            <FaCogs className="text-yellow-600 text-4xl mb-4" />
            <h3 className="text-xl font-semibold mb-2">Effort & Feature Sizing</h3>
            <p className="text-gray-700">
              Accurately size your features to estimate the effort required for each sprint.
            </p>
          </div>
        </div>
      </div>
    
    </div>
    
  );
}

export default HomePage;
