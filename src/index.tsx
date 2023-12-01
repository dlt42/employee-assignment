import React from "react";
import { createRoot } from "react-dom/client";
import EmployeeAssignment from "./EmployeeAssignment";

const container = document.getElementById("app");
const root = createRoot(container!)
root.render(<EmployeeAssignment />);
