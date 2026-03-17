import React from "react";
import InstallPrompt from "./components/InstallPrompt";
import CardUploader from "./components/llm/CardUploader";

const App = () => {
  return (
    <div>
      <div className="text-center mt-5">
        <CardUploader />
        <InstallPrompt />

        {/* <BusinessCardExtractor /> */}
      </div>
    </div>
  );
};

export default App;
