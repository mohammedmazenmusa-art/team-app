const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

function loadData() {

if (fs.existsSync("data.json")) {
return JSON.parse(
fs.readFileSync("data.json")
);
}

return {
main: [],
reserve: [],
waiting: [],
open: true,
devices: {}
};
}

function saveData() {
fs.writeFileSync(
"data.json",
JSON.stringify(data, null, 2)
);
}

let data = loadData();

function find(list, name, number) {
return list.findIndex(p => p.name === name && p.number === number);
}

io.on("connection", (socket) => {
const ADMIN_PASSWORD = "57719@";

socket.on("adminReset", (password) => {

if(password !== ADMIN_PASSWORD){
return socket.emit("msg","كلمة المرور غير صحيحة");
}

data = {
main: [],
reserve: [],
waiting: [],
open: true,
devices: {}
};

saveData();
io.emit("update", data);
});

socket.emit("update", data);

// تسجيل
socket.on("register", (p) => {

const deviceId = socket.id;

if (!data.open) return socket.emit("msg", "التسجيل مغلق");

// منع الجهاز إذا كان مسجل حالياً
if (data.devices[deviceId]?.active) {
return socket.emit("msg", "هذا الجهاز سجل مسبقاً");
}

const all = [...data.main, ...data.reserve, ...data.waiting];
const exists = all.some(x => x.name === p.name && x.number === p.number);

if (exists) return socket.emit("msg", "انت مسجل مسبقاً");

if (data.main.length < 24) data.main.push(p);
else if (data.reserve.length < 3) data.reserve.push(p);
else if (data.waiting.length < 3) data.waiting.push(p);

data.devices[deviceId] = {
active: true,
name: p.name,
number: p.number
};

saveData();
io.emit("update", data);

});

// اعتذار + ترحيل تلقائي
socket.on("cancel", (p) => {

const i = find(data.main, p.name, p.number);
const j = find(data.reserve, p.name, p.number);
const k = find(data.waiting, p.name, p.number);

if (i === -1 && j === -1 && k === -1)
return socket.emit("msg", "البيانات غير صحيحة");

if (i !== -1) {
data.main.splice(i, 1);

if (data.reserve.length > 0) {
data.main.push(data.reserve.shift());
}
if (data.waiting.length > 0) {
data.reserve.push(data.waiting.shift());
}
}

else if (j !== -1) {
data.reserve.splice(j, 1);

if (data.waiting.length > 0) {
data.reserve.push(data.waiting.shift());
}
}

else if (k !== -1) {
data.waiting.splice(k, 1);
}

delete data.devices[socket.id];

saveData();
io.emit("update", data);

});

// فتح/إغلاق التسجيل
socket.on("toggle", (password) => {

const ADMIN_PASSWORD = "57719@";

if (!password || password !== ADMIN_PASSWORD) {
return socket.emit("msg", "كلمة المرور غير صحيحة");
}

data.open = !data.open;

saveData();
io.emit("update", data);

});


// 🔐 عرض تفصيلي آمن (إضافة جديدة فقط)
socket.on("adminView", (password, callback) => {

if (password !== ADMIN_PASSWORD) {
return callback({ error: "كلمة المرور غير صحيحة" });
}

const all = [
...data.main,
...data.reserve,
...data.waiting
];

callback({
data: all.map(p => ({
name: p.name,
number: p.number
}))
});

});


// تنظيف كامل
socket.on("reset", () => {
data = { main: [], reserve: [], waiting: [], open: true, devices: {} };

saveData();
io.emit("update", data);
});
});

const PORT = process.env.PORT || 3000;
server.listen(PORT);