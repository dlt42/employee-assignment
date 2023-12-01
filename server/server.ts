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

  await server.listen(3001);
  // Set up socket.io connection handler
  io.on("connection", async (socket) => {
    console.log("Client connected to socket.io server");

    socket.on("initial", async () => {
      console.log("Initial data requested");

      const employees = await db.collection("employees").find().toArray();
      const assignments = await db.collection("assignments").find().toArray();
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

      // Add assignment to database
      const { insertedId } = await db.collection("assignments").insertOne(assignment);

      await db.collection("product").updateOne(
        {},
        {
          $inc: {
            [`marketingPoints.${channel}`]: 1,
          },
        }
      );

      // sleep for 500ms to simulate latency
      await sleep()

      const newAssignment = await db.collection("assignments").findOne({
        _id: insertedId,
      });

      const updatedProduct = await db.collection("product").findOne();

      io.emit("product", updatedProduct);
      io.emit("assignment_add", newAssignment);
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

      // Delete assignment from database
      await db.collection("assignments").deleteOne({
        _id: new ObjectId(assignmentId),
      });

      await db.collection("product").updateOne(
        {},
        {
          $inc: {
            [`marketingPoints.${assignment.channel}`]: -1,
          },
        }
      );

      // sleep for 500ms to simulate latency
      await sleep()

      const updatedProduct = await db.collection("product").findOne();

      io.emit("product", updatedProduct);
      io.emit("assignment_remove", assignmentId);
    });
  });

  console.log("Socket server listening on http://localhost:3001");
}

start();
