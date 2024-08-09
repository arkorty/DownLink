"use client";
import React from "react";
import DownloadForm from "./DownloadForm";
import { TypeAnimation } from "react-type-animation";

const Home = () => {
  return (
    <div className="relative z-10 pt-20">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-white mb-4 text-4xl sm:text-5xl lg:text-6xl font-extrabold">
          <TypeAnimation
            sequence={[
              "Easy To Use!",
              1200,
              "HD Quality!",
              1200,
              "Download YouTube Videos!",
              1200,
            ]}
            wrapper="span"
            speed={30}
            repeat={Infinity}
            className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-500"
          />
        </h1>
        <DownloadForm />
      </div>
    </div>
  );
};

export default Home;
