"use client";

import React from "react";
import { useDashboard } from "@/context/DashboardContext";

type Props = {
  params: {
    projectId: string;
    componentId: string;
  };
};

export default function Page({ params }: Props) {
  const { selectedProject, selectedComponent } = useDashboard();

  return (
    <main
      style={{
        height: "100vh",
        margin: 0,
        backgroundColor: "#fff",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily:
          "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
      }}
    >
      <div>
        <text style={{ color: "#000", fontSize: "24px" }}>
          Project: {selectedProject?.name || params.projectId} / Component:{" "}
          {selectedComponent?.name || params.componentId}
        </text>
      </div>
    </main>
  );
}
