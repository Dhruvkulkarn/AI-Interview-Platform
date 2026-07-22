const dns = require("node:dns");
const mongoose = require("mongoose");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

async function connectDatabase() {
  try {
    console.log("Connecting to MongoDB...");

    const connection = await mongoose.connect(
      process.env.MONGODB_URI,
      {
        serverSelectionTimeoutMS: 15000,
      }
    );

    console.log(
      `MongoDB connected: ${connection.connection.host}`
    );
  } catch (error) {
    console.error("\n❌ MongoDB connection failed!");
    console.error("Error Name:", error.name);
    console.error("Error Message:", error.message);

    if (error.reason?.servers) {
      console.error("\nIndividual Atlas server errors:");

      for (const [address, server] of error.reason.servers) {
        console.error(`\nServer: ${address}`);

        if (server.error) {
          console.error(
            "Network error name:",
            server.error.name
          );

          console.error(
            "Network error message:",
            server.error.message
          );

          if (server.error.cause) {
            console.error(
              "Network error cause:",
              server.error.cause
            );
          }
        } else {
          console.error(
            "No detailed server error available."
          );
        }
      }
    }

    process.exit(1);
  }
}

module.exports = connectDatabase;