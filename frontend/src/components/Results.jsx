import React from "react";

const Results = ({ data }) => {
  if (!data) {
    return (
      <div className="card">
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ maxWidth: "100%", wordWrap: "break-word" }}>
      <h2 style={{ marginBottom: "20px", color: "#fff", fontSize: "28px" }}>Meeting Summary</h2>
      <div 
        style={{ 
          padding: "20px", 
          backgroundColor: "rgba(255, 255, 255, 0.05)", 
          borderRadius: "8px",
          marginBottom: "30px",
          whiteSpace: "pre-wrap",
          wordWrap: "break-word",
          overflowWrap: "break-word",
          border: "1px solid rgba(255, 255, 255, 0.1)"
        }}
      >
        <p style={{ 
          margin: 0, 
          lineHeight: "1.8", 
          fontSize: "16px",
          color: "#e0e0e0",
          maxHeight: "none",
          overflow: "visible"
        }}>
          {data.summary || "No summary available"}
        </p>
      </div>

      {data.mom && (
        <>
          <h3 style={{ marginTop: "30px", marginBottom: "15px", color: "#fff", fontSize: "22px" }}>Minutes of Meeting (MOM)</h3>
          {Array.isArray(data.mom) ? (
            <ul style={{ paddingLeft: "20px", lineHeight: "1.8", color: "#e0e0e0" }}>
              {data.mom.map((item, i) => (
                <li key={i} style={{ marginBottom: "12px" }}>{item}</li>
              ))}
            </ul>
          ) : (
            <div 
              style={{ 
                padding: "20px", 
                backgroundColor: "rgba(255, 255, 255, 0.05)", 
                borderRadius: "8px",
                whiteSpace: "pre-wrap",
                wordWrap: "break-word",
                border: "1px solid rgba(255, 255, 255, 0.1)"
              }}
            >
              <p style={{ margin: 0, lineHeight: "1.8", color: "#e0e0e0" }}>{data.mom}</p>
            </div>
          )}
        </>
      )}

      {data.tasks && data.tasks.length > 0 && (
        <>
          <h3 style={{ marginTop: "30px", marginBottom: "15px", color: "#fff", fontSize: "22px" }}>Tasks</h3>
          <ul style={{ paddingLeft: "20px", lineHeight: "1.8", color: "#e0e0e0" }}>
            {data.tasks.map((t, i) => (
              <li key={i} style={{ marginBottom: "12px" }}>
                {typeof t === "object" ? (
                  <div>
                    <strong style={{ color: "#fff" }}>{t.task || JSON.stringify(t)}</strong>
                    {t.date && <span style={{ color: "#a0a0a0", marginLeft: "10px" }}>- Due: {t.date}</span>}
                    {t.owner && <span style={{ color: "#a0a0a0", marginLeft: "10px" }}>(Owner: {t.owner})</span>}
                  </div>
                ) : (
                  t
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {data.important_dates && data.important_dates.length > 0 && (
        <>
          <h3 style={{ marginTop: "30px", marginBottom: "15px", color: "#fff", fontSize: "22px" }}>Important Dates</h3>
          <ul style={{ paddingLeft: "20px", lineHeight: "1.8", color: "#e0e0e0" }}>
            {data.important_dates.map((date, i) => (
              <li key={i} style={{ marginBottom: "10px" }}>{date}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default Results;
