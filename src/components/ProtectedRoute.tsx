import { Navigate, Outlet, useLocation } from "react-router-dom";

export const ProtectedRoute = () => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");
    const location = useLocation();
    const isAuthenticated = !!token;

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    const isTeacherRoute = location.pathname === "/teacher" || location.pathname.startsWith("/teacher/");
    const isStudentOnlyRoute = [
        "/dashboard", 
        "/search", 
        "/detail",
        "/saved", 
        "/applications", 
        "/matcher", 
        "/travel-guide", 
        "/consultant", 
        "/checklist", 
        "/timeline", 
        "/visa"
    ].some(path => location.pathname.startsWith(path));

    if (role === "teacher" && isStudentOnlyRoute) {
        return <Navigate to="/teacher" replace />;
    }

    if (role === "student" && isTeacherRoute) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
};
