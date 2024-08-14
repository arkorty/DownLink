"use client";

import React from "react";
import DownloadForm from "./DownloadForm";
import { TypeAnimation } from "react-type-animation";

const Home = () => {
  return (
    <div className="relative z-10 sm: pt-32 md: pt-64 lg:pt-96">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-white mb-4 text-4xl sm:text-5xl lg:text-6xl font-extrabold">
          <TypeAnimation
            sequence={[
              "From YouTube!",
              800,
              "And Instagram!",
              800,
              "Download Now!",
              800,
              "HD Quality!",
              800,
              "DownLink!",
              800,
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
