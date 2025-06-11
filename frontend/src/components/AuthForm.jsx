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
    <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-xl w-full border border-gray-100">
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6 text-center text-gray-800">{title}</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="shadow-sm border border-gray-300 rounded-lg w-full py-2.5 sm:py-3 px-3 bg-white text-gray-700 text-sm leading-tight focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
            required
            placeholder="ejemplo@correo.com"
          />
        </div>
        
        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-1">
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="shadow-sm border border-gray-300 rounded-lg w-full py-2.5 sm:py-3 px-3 bg-white text-gray-700 text-sm leading-tight focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
            required
            placeholder="••••••••"
          />
        </div>
        
        <div className="pt-2">
          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 sm:py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] text-sm shadow-lg"
          >
            {submitLabel}
          </button>
        </div>
      </form>

      {alternativeLink && (
        <div className="mt-4 sm:mt-6 text-center">
          <p className="text-gray-600 text-sm mb-3">{alternativeLinkLabel}</p>
          <Link 
            to={alternativeLink} 
            className="block w-full bg-gray-100 hover:bg-green-100 text-green-700 hover:text-green-700 font-semibold py-2.5 sm:py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 text-sm border border-gray-300 hover:border-green-300"
          >
            {alternativeLinkText}
          </Link>
        </div>
      )}
    </div>
  );
};

export default AuthForm;
