import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import Home from "./components/Home";
import Background from "./components/Background";

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen relative">
        <Background />
        <div className="relative z-10 flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
