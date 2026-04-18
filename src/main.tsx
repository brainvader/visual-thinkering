import React from "react";
import ReactDOM from "react-dom/client";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { ProjectListPage } from "./pages/ProjectListPage";
import { EditorPage } from "./pages/EditorPage";
import "./App.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    {/* Tauri との互換性のため MemoryRouter を使用 */}
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<ProjectListPage />} />
        <Route path="/editor" element={<EditorPage />} />
      </Routes>
    </MemoryRouter>
    <Toaster position="bottom-right" richColors />
  </React.StrictMode>,
);