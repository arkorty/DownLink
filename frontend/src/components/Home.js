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
              "From YouTube!",
              1200,
              "And Instagram",
              1200,
              "Download Now!",
              1200,
              "HD Quality!",
              1200,
              "DownLink!",
              1200,
            ]}
            wrapper="span"
            speed={30}
            repeat={Infinity}
            className="text-transparent bg-clip-text bg-white bg-opacity-80"
          />
        </h1>
        <DownloadForm />
      </div>
    </div>
  );
};

export default Home;
