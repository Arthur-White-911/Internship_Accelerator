import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Assessment from './pages/Assessment';
import Programs from './pages/Programs';
import Interview from './pages/Interview';
import Training from './pages/Training';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import Auth from './pages/Auth';
import JobsHome from './pages/JobsHome';
import JobsList from './pages/JobsList';
import JobDetail from './pages/JobDetail';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/assessment" element={<Assessment />} />
        <Route path="/programs" element={<Programs />} />
        <Route path="/interview" element={<Interview />} />
        <Route path="/training" element={<Training />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/jobs" element={<JobsHome />} />
        <Route path="/jobs/list" element={<JobsList />} />
        <Route path="/jobs/:id" element={<JobDetail />} />
      </Routes>
    </Layout>
  );
}
