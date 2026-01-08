import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Results from "../components/Results";
import DownloadPDF from "../components/DownloadPDF";

const ResultPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state) {
    return (
      <div className="container">
        <p>No results available. Please process a meeting first.</p>
        <button onClick={() => navigate("/upload")}>Go to Upload Page</button>
      </div>
    );
  }

  return (
    <div className="container">
      <Results data={state} />
      <DownloadPDF data={state} />
    </div>
  );
};

export default ResultPage;
