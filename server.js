import http from "http";
import express from "express";
import { Server } from "socket.io";
import moment from "moment";
import {
  userJoin,
  userLeave,
  getRoomUsers,
  checkUserNameExists,
} from "./utils/users.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

const server = http.createServer(app);//layering 
const io = new Server(server); //http k top layer pr websocket 

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));
app.use("/css", express.static(path.join(__dirname, "dist")));
app.use("/js", express.static(path.join(__dirname, "public/js")));

app.get("/", (req, res) => res.render("index.ejs"));
app.get("/chat", (req, res) => res.render("chat.ejs"));
app.get("*", (req, res) => {
  res.redirect("/");
});


const messages = [];
io.on("connection", (socket) => {
  socket.on("checkUsername", ({ username }) => {
    socket.emit("usernameCheckResult", checkUserNameExists(username));
  });

  socket.on("join_room", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room); //Alpha --> [001,002,005] total --> 001,002,003,004
    console.log("Server: New Connection");
    console.log(user);


    socket.broadcast //current user ko chodkr 005 X 001 002
      .to(user.room)
      .emit("system_msg", `${username} joined the chat`);

  
    io.to(user.room).emit("room_users", { 
      room: user.room,
      users: getRoomUsers(room),
    });

    console.log("Users:");
    console.log(getRoomUsers(room));


    socket.on("chat_message", (msg) => {
      console.log("emit chat message");
      const message = {
        id: socket.id,
        username: user.username,
        room: user.room,
        text: msg,
        time: moment().format("h:mm a"),
      };
      messages.push(message);
      console.log({ messages });
      io.to(user.room).emit("chat_msg", message);
      
    });

    

    socket.on("disconnect", () => {
      const user = userLeave(socket.id); 

      if (user)
        io.to(user.room).emit("system_msg", `${username} left the chat`);
    });
  });
});

server.listen(port, () => console.log(`Server running on port ${port}`));
