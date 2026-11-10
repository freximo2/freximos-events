import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './guards/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import EventForm from './pages/EventForm';
import MyRegistrations from './pages/MyRegistrations';
import Payments from './pages/Payments';
import Requests from './pages/Requests';
import Stats from './pages/Stats';
import Sponsors from './pages/Sponsors';
import Clients from './pages/Clients';
import AdminSpaces from './pages/AdminSpaces';
import Groups from './pages/Groups';
import AccessControl from './pages/AccessControl';
import EventTypeRequests from './pages/EventTypeRequests';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        {/* Events */}
        <Route
          path="/events"
          element={
            <ProtectedRoute>
              <Events />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/new"
          element={
            <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
              <EventForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/:id"
          element={
            <ProtectedRoute>
              <EventDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/:id/edit"
          element={
            <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
              <EventForm />
            </ProtectedRoute>
          }
        />
        {/* Registrations */}
        <Route
          path="/my-registrations"
          element={
            <ProtectedRoute>
              <MyRegistrations />
            </ProtectedRoute>
          }
        />
        {/* Payments */}
        <Route
          path="/payments"
          element={
            <ProtectedRoute>
              <Payments />
            </ProtectedRoute>
          }
        />
        {/* Requests */}
        <Route
          path="/requests"
          element={
            <ProtectedRoute>
              <Requests />
            </ProtectedRoute>
          }
        />
        {/* Stats - All users */}
        <Route
          path="/stats"
          element={
            <ProtectedRoute>
              <Stats />
            </ProtectedRoute>
          }
        />
        {/* Sponsors - Super Admin */}
        <Route
          path="/sponsors"
          element={
            <ProtectedRoute roles={['SUPER_ADMIN']}>
              <Sponsors />
            </ProtectedRoute>
          }
        />
        {/* Clients - Super Admin */}
        <Route
          path="/clients"
          element={
            <ProtectedRoute roles={['SUPER_ADMIN']}>
              <Clients />
            </ProtectedRoute>
          }
        />
        {/* Admin Dashboard */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        {/* Admin Spaces - Super Admin */}
        <Route
          path="/admin/spaces"
          element={
            <ProtectedRoute roles={['SUPER_ADMIN']}>
              <AdminSpaces />
            </ProtectedRoute>
          }
        />
        {/* Groups - Admin */}
        <Route
          path="/groups"
          element={
            <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
              <Groups />
            </ProtectedRoute>
          }
        />
        {/* Event Type Requests - All */}
        <Route
          path="/event-type-requests"
          element={
            <ProtectedRoute>
              <EventTypeRequests />
            </ProtectedRoute>
          }
        />
        {/* Access Control - Admin */}
        <Route
          path="/access-control"
          element={
            <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
              <AccessControl />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}
