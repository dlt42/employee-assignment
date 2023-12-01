import React, { useCallback, useMemo } from "react";
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

  // Only update the assignents for the product channel if the dependencies change
  const assignmentsForChannelProduct = useMemo(
    () => assignments.filter((assignment) => assignment.channel === channel),
    [assignments, channel]
  );

  // Only create the handleUnassign callback once
  const handleUnassign = useCallback((assignment: Assignment) => {
    socket.emit("unassign", assignment._id);
  }, []);


  // Only create the handleUnassign callback if the idleEmployees prop or channel prop changes
  const handleAssign = useCallback(() => {
    const idleEmployee = idleEmployees[0];
    socket.emit("assign", {
      channel,
      employeeId: idleEmployee._id,
    });
  }, [idleEmployees, channel]);

  // Using useCallback prevents memoized downstream components from rerendering or any instances of useEffect 
  // with the callback as a dependency from being triggered if the component rerendered (without useCallback 
  // the callback would be recreated on every rerender and trigger downstream updates)

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
