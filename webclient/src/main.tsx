import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Dashboard from "./Dashboard";
import "./index.css";
import ResultsPage from "./Results";
import TaskPage from "./Task";
import Login from "./Login";
import Register from "./Register";
import AuthGuard from "./guards/AuthGuard";
import GuestGuard from "./guards/GuestGuard";
import { ToastProvider } from "./components/ui/ToastProvider";

createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
        <ToastProvider>
            <Routes>
                <Route
                    path='/'
                    element={
                        <AuthGuard>
                            <Dashboard />
                        </AuthGuard>
                    }
                />

                <Route
                    path='/login'
                    element={
                        <GuestGuard>
                            <Login />
                        </GuestGuard>
                    }
                />

                <Route
                    path='/register'
                    element={
                        <GuestGuard>
                            <Register />
                        </GuestGuard>
                    }
                />

                <Route
                    path='/dashboard'
                    element={
                        <AuthGuard>
                            <Dashboard />
                        </AuthGuard>
                    }
                />

                <Route
                    path='/task'
                    element={
                        <AuthGuard>
                            <TaskPage />
                        </AuthGuard>
                    }
                />

                <Route
                    path='/results'
                    element={
                        <AuthGuard>
                            <ResultsPage />
                        </AuthGuard>
                    }
                />
            </Routes>
        </ToastProvider>
    </BrowserRouter>
);
