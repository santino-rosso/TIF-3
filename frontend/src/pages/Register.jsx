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
        <div className="flex items-center justify-center h-screen bg-gray-100">
          <AuthForm
            title="Registrarse"
            onSubmit={handleRegister}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            error={error}
            submitLabel="Crear cuenta"
          />
        </div>
    );
};
 
export default Register;
