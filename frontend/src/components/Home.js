"use client";

import React from "react";
import DownloadForm from "./DownloadForm";
import { TypeAnimation } from "react-type-animation";

const Home = () => {
  return (
    <div className="relative z-10 pt-20">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-white mb-4 text-4xl sm:text-5xl lg:text-6xl xl:text-8xl font-extrabold">
          <TypeAnimation
            sequence={[
              "From YouTube!",
              1000,
              "And Instagram!",
              1000,
              "Download Now!",
              1000,
              "HD Quality!",
              1000,
              "DownLink!",
              1000,
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
