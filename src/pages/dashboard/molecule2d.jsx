import React, { useEffect, useRef } from "react";

export function Molecule2D() {
  const containerRef = useRef(null);

  useEffect(() => {
    // Inject the Ketcher Standalone HTML into the container
    fetch("/ketcher/index.html")
      .then((res) => res.text())
      .then((html) => {
        if (containerRef.current) {
          // Extract the body content
          const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
          containerRef.current.innerHTML = bodyMatch ? bodyMatch[1] : html;

          // Dynamically load the main JS bundle
          const script = document.createElement("script");
          script.src = "/ketcher/static/js/main.7d7d7a03.js";
          script.async = true;
          containerRef.current.appendChild(script);
        }
      });

    // Add the main CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/ketcher/static/css/main.aafe9c71.css";
    document.head.appendChild(link);

    // Clean up on unmount
    return () => {
      document.head.removeChild(link);
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, []);

  return (
    <div style={{ width: "100%", height: "100vh", background: "#f5f5f5" }}>
      <div
        ref={containerRef}
        id="ketcher-container"
        style={{ width: "100%", height: "100vh", background: "white" }}
      />
    </div>
  );
}

export default Molecule2D;
