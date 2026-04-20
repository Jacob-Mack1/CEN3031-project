import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import AccountSettings from './pages/AccountSettings';
import Search from './pages/Search';
import AddCourse from './pages/AddCourse';
import Message from './pages/Message';
import CourseDetails from './pages/CourseDetails';
import FAQ from './pages/FAQ';
import RecordList from './components/RecordList';
import Record from './components/Record';

function App() {
  return (
    <Routes>
      {/* index makes this the default route for the "/" path */}
      <Route path="/" element={<Home />} />
      <Route path="/Login" element={<Login />} />
      <Route path="/SignUp" element={<SignUp />} />
      <Route path="/Dashboard" element={<Dashboard />} />
      <Route path="/account-settings" element={<AccountSettings />} />
      <Route path="/search" element={<Search />} />
      <Route path="/add-course" element={<AddCourse />} />
      <Route path="/message" element={<Message />} />
      <Route path="/course/:courseId" element={<CourseDetails />} />
      <Route path="/records" element={<RecordList />} />
      <Route path="/edit/:id" element={<Record />} />
      <Route path="/create" element={<Record />} />
      <Route path="/faq" element={<FAQ />} />
      
      {/* OPTIONAL: 404 Page (Redirects any broken links back to Home) */}
      <Route path="*" element={<Home />} />
    </Routes>
  );
}

export default App;
