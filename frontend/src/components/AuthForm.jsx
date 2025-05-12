import { Link } from "react-router-dom";

const AuthForm = ({
  title,
  onSubmit,
  email,
  setEmail,
  password,
  setPassword,
  error,
  submitLabel,
  alternativeLink,
  alternativeLinkText,
  alternativeLinkLabel
}) => {
  return (
    <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">{title}</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={onSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors"
          >
            {submitLabel}
          </button>
        </div>
      </form>


      {alternativeLink && (
        <div className="mt-6 text-center">
          <p className="text-gray-600">{alternativeLinkLabel}</p>
          <Link 
            to={alternativeLink} 
            className="mt-2 block w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded transition-colors"
          >
            {alternativeLinkText}
          </Link>
        </div>
      )}
    </div>
  );
};

export default AuthForm;
  