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
    <div className="bg-white p-6 sm:p-8 lg:p-10 rounded-xl shadow-xl w-full border border-gray-100">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 sm:mb-8 text-center text-gray-800">{title}</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm sm:text-base">
          {error}
        </div>
      )}
      
      <form onSubmit={onSubmit} className="space-y-5 sm:space-y-6">
        <div>
          <label className="block text-gray-700 text-sm sm:text-base font-semibold mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="shadow-sm border border-gray-300 rounded-lg w-full py-3 sm:py-4 px-4 text-gray-700 text-sm sm:text-base leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
            required
            placeholder="ejemplo@correo.com"
          />
        </div>
        
        <div>
          <label className="block text-gray-700 text-sm sm:text-base font-semibold mb-2">
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="shadow-sm border border-gray-300 rounded-lg w-full py-3 sm:py-4 px-4 text-gray-700 text-sm sm:text-base leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
            required
            placeholder="••••••••"
          />
        </div>
        
        <div className="pt-2 sm:pt-4">
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 sm:py-4 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] text-sm sm:text-base shadow-lg"
          >
            {submitLabel}
          </button>
        </div>
      </form>

      {alternativeLink && (
        <div className="mt-6 sm:mt-8 text-center">
          <p className="text-gray-600 text-sm sm:text-base mb-4">{alternativeLinkLabel}</p>
          <Link 
            to={alternativeLink} 
            className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 sm:py-4 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 text-sm sm:text-base border border-gray-300"
          >
            {alternativeLinkText}
          </Link>
        </div>
      )}
    </div>
  );
};

export default AuthForm;
  