import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import AuthForm from "../components/AuthForm";

const Register = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const response = await axiosInstance.post("/register", {
                email: email,
                password: password,
              });
            navigate("/login"); 
        } catch (err) {
            setError(err.response?.data?.detail || "Ocurrió un error al iniciar sesión.");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo Section */}
                <div className="text-center mb-6">
                    <img 
                        src="/Reseya.png" 
                        alt="ReseYa Logo" 
                        className="mx-auto w-48 h-auto"
                    />
                </div>

                <AuthForm
                    title="Registrarse"
                    onSubmit={handleRegister}
                    email={email}
                    setEmail={setEmail}
                    password={password}
                    setPassword={setPassword}
                    error={error}
                    submitLabel="Crear cuenta"
                    alternativeLink="/login"
                    alternativeLinkText="Iniciar sesión"
                    alternativeLinkLabel="¿Ya tienes una cuenta?"
                />
            </div>
        </div>
    );
};
 
export default Register;
