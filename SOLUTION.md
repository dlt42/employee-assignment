Please fill in your explanation of the solution here.


The server may receive a request from a client to add or remove an assignment, but there may be a delay before the update is returned and processed by the client(s).

If a second request to add or remove the same assignment (user/product combo) is sent from a client before the previous update has been sent by the server and processed by the client(s) then the server will create a second assignment for the same combination.

To prevent this the employeeId attribute of the assignments table should be marked as unique - so that an employee id can be only exist once across all assignments (i.e. an employee can only be assigned to one product at any given time).

With the employeeId attribute marked as unique the database will throw a duplicate index error if an attempt is made to create a second copy of an assignment. This error should be trapped, and possibly logged.

The product channel assignment count should only be increased or decreased if the assignment was successfully created or deleted.

However, the product channel assignment count should use the length of the assignment array if displayed in the UI, or be calculated via a query if needed for logic on the server, rather than being stored in the database and returned from the server. It is possible for the counts to be out of sync if stored as an independently maintained value.