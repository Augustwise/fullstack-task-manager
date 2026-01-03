import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import TasksPage from './pages/TasksPage.jsx';
import ForbiddenPage from './pages/ForbiddenPage.jsx';
import CatchAllPage from './pages/CatchAllPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/403" element={<ForbiddenPage />} />
        <Route path="*" element={<CatchAllPage />} />
      </Routes>
    </BrowserRouter>
  );
}
