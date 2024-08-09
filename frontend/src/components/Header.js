import React from "react";

const Header = () => {
  return (
    <header className="bg-gradient-to-r from-cyan-500 via-green-500 to-blue-500 text-white p-4 animate-gradient">
      <h1 className="text-xl font-bold">DownLink</h1>
      <style jsx>{`
        @keyframes gradientFlow {
          0% {
            background-position: 0% 0%;
          }
          50% {
            background-position: 100% 100%;
          }
          100% {
            background-position: 0% 0%;
          }
        }

        .animate-gradient {
          background-size: 300% 300%;
          animation: gradientFlow 15s ease infinite;
        }
      `}</style>
    </header>
  );
};

export default Header;
