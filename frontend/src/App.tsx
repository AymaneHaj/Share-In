// src/App.tsx
import { Routes, Route, Outlet } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import ProtectedRoute from "./router/ProtectedRoute";
import AdminProtectedRoute from "./router/AdminProtectedRoute";

import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";

/**
 * This layout wraps all public pages
 * (e.g., Landing Page, Login, Register)
 */
const PublicLayout = () => (
  <div className="flex flex-col min-h-screen">
    <Header />
    <main className="flex-grow">
      {/* Outlet renders the child route (e.g., <HomePage />) */}
      <Outlet />
    </main>
    <Footer />
  </div>
);

function App() {
  return (
    // Note: <BrowserRouter> and <AuthProvider> are in main.tsx
    <Routes>
      {/* Group 1: Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Group 2: Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <MainLayout>
              <DashboardPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Group 3: Admin Routes */}
      <Route
        path="/admin"
        element={
          <AdminProtectedRoute>
            <MainLayout>
              <AdminDashboardPage />
            </MainLayout>
          </AdminProtectedRoute>
        }
      />

      {/* Example for other protected routes */}
      {/* <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ProfilePage />
            </MainLayout>
          </ProtectedRoute>
        }
      /> 
      */}

      {/* TODO: Add a 404 Not Found page */}
      {/* <Route path="*" element={<NotFoundPage />} /> */}
    </Routes>
  );
}

export default App;
