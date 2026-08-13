const AuthPageLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <img
            src="/Reseya.png"
            alt="ReseYa Logo"
            className="mx-auto w-48 h-auto"
          />
        </div>

        {children}
      </div>
    </div>
  );
};

export default AuthPageLayout;
