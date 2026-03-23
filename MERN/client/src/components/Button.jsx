const Button = ({ children, onClick, variant = 'primary' }) => {
  const baseStyles = "px-6 py-2 rounded-lg font-semibold transition-all duration-200 active:scale-95";
  
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-md",
    outline: "border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
  };

  return (
    <button 
      onClick={onClick} 
      className={`${baseStyles} ${variants[variant]}`}
    >
      {children}
    </button>
  );
};

export default Button;