import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Room from "./pages/Room";
import AddEntry from "./pages/AddEntry";
import WikidataTest from "./pages/WikidataTest";
import OpeningIntro from "./components/OpeningIntro";

export default function App() {
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowIntro(false), 2500);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      {showIntro && <OpeningIntro />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:code" element={<Room />} />
        <Route path="/room/:code/add" element={<AddEntry />} />
        <Route path="/wiki" element={<WikidataTest />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
