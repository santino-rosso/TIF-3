const EmptyState = ({ message, imageAlt, className = "flex flex-col items-center justify-center py-16", messageClassName = "text-lg text-gray-600 mb-6" }) => {
  return (
    <div className={className}>
      <p className={messageClassName}>{message}</p>
      <img src="/Reseya.png" alt={imageAlt} className="w-32 opacity-60" />
    </div>
  );
};

export default EmptyState;
