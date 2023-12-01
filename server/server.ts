import express from "express";
import { Server } from "socket.io";
import http from "http";
import cors from "cors";
import { Employee, Assignment, MarketingChannels } from "../types";
import { clearDatabase, seedDatabase, startInMemoryMongoDB } from "./db";
import { ObjectId } from "bson";

// Set up express app
const app = express();
app.use(cors());

// Set up http server
const server = http.createServer(app);

// Set up socket.io server
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const sleep = () => new Promise((resolve) => setTimeout(resolve, 500));

async function start () {
  const db = await startInMemoryMongoDB();

  clearDatabase();
  seedDatabase();

  server.listen(3001);
  // Set up socket.io connection handler
  io.on("connection", async (socket) => {
    console.log("Client connected to socket.io server");

    socket.on("initial", async () => {
      console.log("Initial data requested");

      const employees = await db.collection("employees").find().toArray();
      const assignments = await db.collection("assignments").find().toArray();

      // Prevent multiple assignments for an employee
      db.createIndex("assignments", "employeeId", { unique: true });
      const product = await db.collection("product").findOne();

      socket.emit("employees", employees);
      socket.emit("assignments", assignments);
      socket.emit("product", product);
    });


    // Listen for new assignment
    socket.on("assign", async (args: { employeeId: string, channel: MarketingChannels }) => {
      const { employeeId, channel } = args;

      const assignment: Omit<Assignment, "_id"> = {
        employeeId: new ObjectId(employeeId),
        channel,
      };

      console.log("New assignment", assignment);

      // sleep for 500ms to simulate latency
      await sleep()

      // Add assignment to database (and catch the error if it exists)
      const insertedId = await db.collection("assignments").insertOne(assignment).then(async (insertResult)=> {

        // Only update the marketing points for the product if an assignment was created
        await db.collection("product").updateOne(
          {},
          {
            $inc: {
              [`marketingPoints.${channel}`]: 1,
            },
          }
        );
        return insertResult.insertedId;
      }).catch((error: any) => {
        if (error.code === 11000) {
          console.error("Assignment ignored - Duplicate index error");
        }
      });
      // sleep for 500ms to simulate latency
      await sleep()

      // Only refresh the UI if an assignment was created
      if (insertedId) {
        const newAssignment = await db.collection("assignments").findOne({
          _id: insertedId,
        });
        const updatedProduct = await db.collection("product").findOne();
        io.emit("assignment_add", newAssignment);
        io.emit("product", updatedProduct);
      }    
    });

    // Listen for deleted assignment
    socket.on("unassign", async (assignmentId: string) => {
      console.log("Deleted assignment", assignmentId);

      const assignment = await db.collection("assignments").findOne({
        _id: new ObjectId(assignmentId),
      });

      if (!assignment) return;

      // sleep for 500ms to simulate latency
      await sleep()

      // Delete assignment from database (if it exists)
      const deletedCount = await db.collection("assignments").deleteOne({
        _id: new ObjectId(assignmentId),
      }).then(async ({deletedCount}) => {

        // Only update the marketing points for a product if an assignment was deleted
        if (deletedCount) {
          await db.collection("product").updateOne(
            {},
            {
              $inc: {
                [`marketingPoints.${assignment.channel}`]: -1,
              },
            }
          );
        }
        return deletedCount;
      })

      // sleep for 500ms to simulate latency
      await sleep()

      // Only refresh the UI if an assignment was deleted
      if (deletedCount) {
        const updatedProduct = await db.collection("product").findOne();
        io.emit("product", updatedProduct);
        io.emit("assignment_remove", assignmentId);
      }
    });
  });

  console.log("Socket server listening on http://localhost:3001");
}

start();
