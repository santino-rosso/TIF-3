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
        <div className="flex items-center justify-center h-screen bg-gray-100">
          <AuthForm
            title="Iniciar sesión"
            onSubmit={handleLogin}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            error={error}
            submitLabel="Entrar"
          />
        </div>
    );
};
 
export default Login;
