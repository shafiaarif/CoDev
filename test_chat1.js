const readline = require("readline");
const io = require("socket.io-client");

const socket = io("http://localhost:8000"); // note port 8000

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

socket.on("connect", () => {
  console.log("User1 connected");

  // Join room first
  socket.emit("joinRoom", { roomId: "1", userId: "user1_id", username: "User1" });

  rl.setPrompt("You(User1): ");
  rl.prompt();

  rl.on("line", (line) => {
    if (line.toLowerCase() === "exit") {
      rl.close();
      socket.disconnect();
      return;
    }
    socket.emit("message", { roomId: "1", username: "User1", message: line });
    rl.prompt();
  });
});

socket.on("message", (data) => {
  if (data.username !== "User1") {
    console.log(`\n${data.username}: ${data.message}`);
    rl.prompt();
  }
});

socket.on("typing", (data) => {
  process.stdout.write(`\r${data} \n`);
  rl.prompt();
});
