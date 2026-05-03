const socket = io();

socket.on("update", (d) => {

  document.getElementById("main").innerHTML =
    d.main.map((p,i)=>`<li>${i+1}. ${p.name}</li>`).join("");

  document.getElementById("reserve").innerHTML =
    d.reserve.map((p,i)=>`<li>${i+1}. ${p.name}</li>`).join("");

  document.getElementById("waiting").innerHTML =
    d.waiting.map((p,i)=>`<li>${i+1}. ${p.name}</li>`).join("");

  document.getElementById("m1").innerText = 24 - d.main.length;
  document.getElementById("m2").innerText = 3 - d.reserve.length;
  document.getElementById("m3").innerText = 3 - d.waiting.length;
});

socket.on("msg", (m) => {
  document.getElementById("msg").innerText = m;
  setTimeout(()=> document.getElementById("msg").innerText = "", 3000);
});

function register(){
  let name = document.getElementById("name").value;
  let number = document.getElementById("number").value;

  if(number.length !== 3){
    alert("الرقم المدخل غير مطابق للشروط");
    return;
  }

  socket.emit("register",{name,number});
}

function cancel(){
  socket.emit("cancel",{
    name: document.getElementById("name").value,
    number: document.getElementById("number").value
  });
}

/* ✅ FIXED TOGGLE ONLY */
function toggle(){

  const password = prompt("أدخل كلمة مرور الإدارة");

  socket.emit("toggle", password);

}

function reset(){
  socket.emit("reset");
}

function showAdminModal(){
  document.getElementById("adminModal").style.display = "block";
}

function closeAdminModal(){

  document.getElementById("adminModal").style.display = "none";

  document.getElementById("adminPassword").value = "";

}
function confirmAdminReset(){

  const password =
    document.getElementById("adminPassword").value;

  socket.emit("adminReset", password);

  document.getElementById("adminPassword").value = "";

  closeAdminModal();
}