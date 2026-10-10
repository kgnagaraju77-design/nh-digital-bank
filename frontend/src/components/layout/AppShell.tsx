import type { ReactNode } from "react";

import TopBar from "./TopBar";
import Sidebar from "./Sidebar";


interface AppShellProps {
  children: ReactNode;
}


export default function AppShell({
  children
}: AppShellProps) {

  return (

    <div
      className="nh-app"
      data-testid="nh-app"
    >

      <TopBar />


      <div
        className="nh-layout"
      >

        <Sidebar />


        <main
          className="nh-content"
          data-testid="main-content"
        >
          {children}
        </main>

      </div>

    </div>
  );
}