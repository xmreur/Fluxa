import { Outlet, Navigate, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";
import { Sidebar } from "./Sidebar";

export default function AuthProtectedLayout() {
    const { user, profile, loading } = useAuth();

    const location = useLocation()

    if (loading) return <div>Loading...</div>

    if (!user) {
        return <Navigate to='/auth' replace state={{ from: location }} />
    }

    return (
        <>
            <Sidebar />
            <main className="flex-1 max-h-svh p-8 overflow-y-auto ">
                <Outlet />
            </main>
        </>
    )
}