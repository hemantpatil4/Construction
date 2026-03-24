import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { Toaster } from "react-hot-toast";
import { store } from "./store/store";
import { useAppSelector, useAppDispatch } from "./store/hooks";
import { useEffect } from "react";
import { fetchSettings } from "./store/slices/appSettingsSlice";

// Layout
import Layout from "./components/Layout/Layout";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";

// Pages
import Home from "./pages/Home/Home";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import Dashboard from "./pages/Dashboard/Dashboard";
import AdminPanel from "./pages/Admin/Admin";
import Profile from "./pages/Profile/Profile";
import Buildings from "./pages/Buildings/Buildings";
import BuildingDetail from "./pages/Buildings/BuildingDetail";
import Flats from "./pages/Flats/Flats";
import ParametricViewerPage from "./pages/ParametricViewer/ParametricViewerPage";
import Contact from "./pages/Contact/Contact";
import MapView from "./pages/Map/MapView";
import Projects from "./pages/Projects/Projects";
import FlatInteriorPage from "./pages/FlatInterior/FlatInteriorPage";
import NotFound from "./pages/NotFound/NotFound";

// Styles
import "./styles/global.css";

// ─── Theme & App Settings Initializer ───
const AppInitializer = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useAppDispatch();
  const { mode } = useAppSelector((s) => s.theme);
  const { appName } = useAppSelector((s) => s.appSettings);

  useEffect(() => {
    dispatch(fetchSettings());
  }, [dispatch]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
  }, [mode]);

  useEffect(() => {
    document.title = `${appName} — Building Management`;
  }, [appName]);

  return <>{children}</>;
};

const App = () => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppInitializer>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: "var(--bg-card)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-md)",
                fontSize: "0.9rem",
                boxShadow: "var(--shadow-lg)",
              },
              success: {
                iconTheme: { primary: "#10b981", secondary: "#fff" },
              },
              error: {
                iconTheme: { primary: "#ef4444", secondary: "#fff" },
              },
            }}
          />
          <Routes>
            <Route element={<Layout />}>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Routes — Any authenticated user */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* Buildings & Flats — Any authenticated user */}
              <Route
                path="/buildings"
                element={
                  <ProtectedRoute>
                    <Buildings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/buildings/:id"
                element={
                  <ProtectedRoute>
                    <BuildingDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/flats"
                element={
                  <ProtectedRoute>
                    <Flats />
                  </ProtectedRoute>
                }
              />

              {/* Protected Routes — Admin only */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="Admin">
                    <AdminPanel />
                  </ProtectedRoute>
                }
              />

              {/* Parametric 3D Building Viewer */}
              <Route
                path="/viewer"
                element={
                  <ProtectedRoute>
                    <ParametricViewerPage />
                  </ProtectedRoute>
                }
              />

              {/* Building Map */}
              <Route
                path="/map"
                element={
                  <ProtectedRoute>
                    <MapView />
                  </ProtectedRoute>
                }
              />

              {/* Flat Interior 3D Walkthrough */}
              <Route
                path="/flat/:flatNumber/interior"
                element={
                  <ProtectedRoute>
                    <FlatInteriorPage />
                  </ProtectedRoute>
                }
              />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </AppInitializer>
      </BrowserRouter>
    </Provider>
  );
};

export default App;
