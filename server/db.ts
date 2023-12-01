import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient, Db } from "mongodb";

let mongoServer: MongoMemoryServer;
let client: MongoClient;
let db: Db;

export async function startInMemoryMongoDB (): Promise<Db> {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  client = new MongoClient(uri);
  await client.connect();
  db = client.db("employees");
  return db;
}

export async function stopInMemoryMongoDB (): Promise<void> {
  if (client) {
    await client.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
}

// Optional: Helper method to clear database
export async function clearDatabase (): Promise<void> {
  const collections = await db.listCollections().toArray();
  for (const collection of collections) {
    await db.collection(collection.name).deleteMany({});
  }
}

export async function seedDatabase (): Promise<void> {
  await db.collection("product").insertOne({
    marketingPoints: {
      Newspapers: 0,
      TV: 0,
      GoogleAds: 0,
    },
    name: "Product 1",
  });

  await db.collection("employees").insertMany([
    {
      name: "Jorgen",
      type: "marketing",
    },
    {
      name: "Emil",
      type: "marketing",
    },
    {
      name: "Davide",
      type: "marketing",
    },
    {
      name: "Stian",
      type: "marketing",
    },
  ]);
}
