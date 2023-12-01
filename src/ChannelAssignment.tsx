import React from "react";
import { Assignment, Employee, MarketingChannels, Product } from "../types";
import { socket } from "./socket";

type Props = {
  employees: Employee[];
  idleEmployees: Employee[];
  assignments: Assignment[];
  channel: MarketingChannels;
  product: Product | null;
}

const ChannelAssignment = (props: Props) => {
  const {
    channel,
    employees,
    idleEmployees,
    assignments,
    product
  } = props;

  const assignmentsForChannelProduct = assignments.filter(
    (assignment) => assignment.channel === channel
  );

  const handleUnassign = (assignment: Assignment) => {
    socket.emit("unassign", assignment._id);
  }

  const handleAssign = () => {
    const idleEmployee = idleEmployees[0];
    socket.emit("assign", {
      channel,
      employeeId: idleEmployee._id,
    });
  }

  return (
    <div>
      <p>{product?.marketingPoints[channel] || 0} Assignments in {channel}</p>

      {assignmentsForChannelProduct.map((assignment) => (
        <button
          key={assignment._id.toString()}
          onClick={() => handleUnassign(assignment)}
        >
          Unassign {employees.find(e => e._id === assignment.employeeId)?.name || "<Could not find employee>"}
        </button>
      ))}

      {!!idleEmployees.length && (
        <button onClick={handleAssign}>
          Assign
        </button>
      )}
    </div>
  );
};

export default ChannelAssignment;
