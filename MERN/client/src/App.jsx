import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import RecordList from './components/RecordList';
import Record from './components/Record';

function App() {
  return (
    <Routes>
      {/* index makes this the default route for the "/" path */}
      <Route path="/" element={<Home />} />
      <Route path="/Login" element={<Login />} />
      <Route path="/SignUp" element={<SignUp />} />
      <Route path="/records" element={<RecordList />} />
      <Route path="/edit/:id" element={<Record />} />
      <Route path="/create" element={<Record />} />
      
      {/* OPTIONAL: 404 Page (Redirects any broken links back to Home) */}
      <Route path="*" element={<Home />} />
    </Routes>
  );
}

export default App;
