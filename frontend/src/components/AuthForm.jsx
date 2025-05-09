// src/components/AuthForm.jsx
const AuthForm = ({
    title,
    onSubmit,
    email,
    setEmail,
    password,
    setPassword,
    error,
    submitLabel,
  }) => {
    return (
      <form onSubmit={onSubmit} className="bg-white p-6 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center">{title}</h2>
  
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
  
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring focus:ring-blue-200"
          />
        </div>
  
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring focus:ring-blue-200"
          />
        </div>
  
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
        >
          {submitLabel}
        </button>
      </form>
    );
  };
  
  export default AuthForm;
  