var socket = io();
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});
if (!username || !room) {
  console.log("Redirect user to the home page if the parameters are missing");
  window.location.href = "/"; 
} else {

  socket.emit("checkUsername", { username });
  socket.on("usernameCheckResult", (isTaken) => {
    if (isTaken) {
      console.log("Redirecting to homepage. Username already taken.");
      window.location.href = "/"; 
    }
  });

  console.log("Access granted. Username and room are present.");
 
  console.log({ username, room });
  document.getElementById("roomHeading").innerText = room;

  socket.emit("join_room", { username, room });

  socket.on("console_msg", (msg) => {
    console.log(msg); 
  });

  socket.on("system_msg", (msg) => {
    console.log(msg);
    appendSystemMessage(msg);
  });  

  socket.on("chat_msg", (msg) => {
    console.log(msg); 
    appendMessage(msg);
  });


  const newMsgForm = document.getElementById("newMessageForm");//[input,button]
  newMsgForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const msg = e.target.elements[0].value;

   
    socket.emit("chat_message", msg);
    document.getElementById("messageInput").value = "";
    document.getElementById("messageInput").focus();
  });


  function appendMessage(msg) {
    console.log("append msg");
    console.log({ msg });

    var messages = document.getElementById("messages");
    var messagesDiv = document.getElementById("messages-container");
    let bubble = `<div class="message-bubble bg-gray-300 dark:bg-gray-700 dark:text-gray-100 rounded-lg shadow p-3 my-2 mx-4">
        <div class="message-header flex justify-between items-center mb-2">
          <span class="message-username italic text-gray-800 dark:text-gray-300">${msg.username}</span>
          <span class="message-time text-sm text-gray-500 dark:text-gray-400">${msg.time}</span>
        </div>
        <div class="message-content text-lg text-gray-600 dark:text-gray-100">${msg.text}</div>
        `;

    
    messages.insertAdjacentHTML("beforeend", bubble);
  }

  function appendSystemMessage(msg) {
    var messages = document.getElementById("messages");
    var messagesDiv = document.getElementById("messages-container");
    const systemMsg = `<p class='systemMsg dark:text-zinc-400 text-grey-100 italic text-center my-2 mx-4 text-sm'>${msg}</p>`;

    messages.insertAdjacentHTML("beforeend", systemMsg);
  }



  socket.on("room_users", ({ room, users }) => {
    console.log(room);
    console.log(users);
    updateUserCountAndList(users);
  });

  

  function updateUserCountAndList(users) {
    const userCount = users.length;
    console.log("userCount:" + userCount);
    document.getElementById("userCount").textContent = userCount;

    const userList = document.getElementById("userList");
    userList.innerHTML = ""; 
    users.forEach((user) => {
      const li = document.createElement("li");
      li.textContent = user.username;

      if (user.username == username) {
        li.className = "text-orange-600 dark:text-orange-500";
        userList.prepend(li);
      } else {
        userList.appendChild(li);
      }
    });
  }
}
