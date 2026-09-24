import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import PageMotion from "./components/PageMotion";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./auth/AuthContext";

const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogDetails = lazy(() => import("./pages/BlogDetails"));
const CreateBlog = lazy(() => import("./pages/CreateBlog"));
const BlogAdmin = lazy(() => import("./pages/BlogAdmin"));
const Projects = lazy(() => import("./pages/Projects"));
const ProjectDetails = lazy(() => import("./pages/ProjectDetails"));
const CreateProject = lazy(() => import("./pages/CreateProject"));
const ProjectAdmin = lazy(() => import("./pages/ProjectAdmin"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));
const Login = lazy(() => import("./pages/Login"));

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />

        <Suspense
          fallback={
            <main className="route-loading" aria-live="polite">
              <span className="route-loading-orbit" aria-hidden="true" />
              <p>Loading mission...</p>
            </main>
          }
        >
          <PageMotion />
          <Routes>
            <Route path="/" element={<Home />} />

        <Route path="/blogs" element={<Blog />} />
        <Route path="/blogs/:id" element={<BlogDetails />} />

        <Route
          path="/blogs/new"
          element={
            <ProtectedRoute>
              <CreateBlog />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/blogs"
          element={
            <ProtectedRoute>
              <BlogAdmin />
            </ProtectedRoute>
          }
        />
        <Route path="/blog-admin" element={<Navigate to="/admin/blogs" replace />} />

        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDetails />} />

        <Route
          path="/projects/new"
          element={
            <ProtectedRoute>
              <CreateProject />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/projects"
          element={
            <ProtectedRoute>
              <ProjectAdmin />
            </ProtectedRoute>
          }
        />
        <Route path="/project-admin" element={<Navigate to="/admin/projects" replace />} />

        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute>
              <AdminAnalytics />
            </ProtectedRoute>
          }
        />

            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
