import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import AuthForm from "../components/AuthForm";

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const response = await axiosInstance.post("/login", new URLSearchParams({
                username: email,
                password: password,
            }), {
                headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                },
            });

            localStorage.setItem("token", response.data.access_token);
            localStorage.setItem("token_refresh", response.data.refresh_token);
            navigate("/"); 
        } catch (err) {
            setError(err.response?.data?.detail || "Ocurrió un error al iniciar sesión.");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo Section */}
                <div className="text-center mb-6">
                    <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                        <svg 
                            className="w-8 h-8 text-white" 
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                        >
                            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                        </svg>
                    </div>
                </div>

                <AuthForm
                    title="Iniciar sesión"
                    onSubmit={handleLogin}
                    email={email}
                    setEmail={setEmail}
                    password={password}
                    setPassword={setPassword}
                    error={error}
                    submitLabel="Iniciar sesión"
                    alternativeLink="/register"
                    alternativeLinkText="Registrarse"
                    alternativeLinkLabel="¿No tenes una cuenta?"
                />
            </div>
        </div>
    );
};
 
export default Login;
