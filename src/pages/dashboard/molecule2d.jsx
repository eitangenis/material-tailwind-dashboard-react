import React, { useRef } from "react";
import { Editor } from "ketcher-react";
import { RemoteStructServiceProvider } from "ketcher-core";
import "ketcher-react/dist/index.css";

const structServiceProvider = new RemoteStructServiceProvider(
  "https://lifescience.opensource.epam.com/indigo/service"
);

export function Molecule2D() {
  const editorRef = useRef(null);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <Editor
        ref={editorRef}
        staticResourcesUrl="https://unpkg.com/ketcher-react@3.2.0/dist/"
        structServiceProvider={structServiceProvider}
        style={{ height: 600, border: "1px solid #ccc", borderRadius: 8 }}
      />
    </div>
  );
}

export default Molecule2D;
