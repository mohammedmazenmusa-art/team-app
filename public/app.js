const socket = io();

let lastData = null;

let whistle = new Audio("/sounds/whistle.mp3");
whistle.volume = 1;

let soundInterval = null;
let wasFull = false;

function typeText(el, text, speed = 35){
  el.innerHTML = "";
  let i = 0;

  function typing(){
    if(i < text.length){
      el.innerHTML += text.charAt(i);
      i++;
      setTimeout(typing, speed);
    }
  }

  typing();
}

socket.on("update", (d) => {

  lastData = d;

  document.getElementById("main").innerHTML =
    d.main.map((p,i)=>`<li>${i+1}. ${p.name}</li>`).join("");

  document.getElementById("reserve").innerHTML =
    d.reserve.map((p,i)=>`<li>${i+1}. ${p.name}</li>`).join("");

  document.getElementById("waiting").innerHTML =
    d.waiting.map((p,i)=>`<li>${i+1}. ${p.name}</li>`).join("");

  document.getElementById("m1").innerText = 24 - d.main.length;
  document.getElementById("m2").innerText = 3 - d.reserve.length;
  document.getElementById("m3").innerText = 3 - d.waiting.length;

  const full =
    d.main.length >= 24 &&
    d.reserve.length >= 3 &&
    d.waiting.length >= 3;

  const btn = document.querySelector("button[onclick='register()']");
  const bar = document.getElementById("notifyBar");

  if(full){

    btn.innerText = "اكتمل العدد";
    btn.style.background = "red";
    btn.style.color = "white";
    btn.disabled = true;

    bar.style.display = "block";
    bar.classList.add("show");

    const msg =
      "🔔 اكتمل العدد الفعلي للتسجيل، سيتم إشعاركم عند توفر خانة فارغة - نشكركم على تفهمكم";

    typeText(bar, msg);

    if(!wasFull){
      whistle.play();

      soundInterval = setInterval(()=>{
        whistle.play();
      },15000);

      wasFull = true;
    }

  } else {

    btn.innerText = "تسجيل";
    btn.style.background = "gold";
    btn.style.color = "black";
    btn.disabled = false;

    if(bar){
      bar.style.display = "none";
      bar.innerHTML = "";
    }

    clearInterval(soundInterval);
    wasFull = false;
  }

});

socket.on("msg", (m) => {
  document.getElementById("msg").innerText = m;
  setTimeout(()=> document.getElementById("msg").innerText = "", 3000);
});

function register(){
  let name = document.getElementById("name").value;
  let number = document.getElementById("number").value;

  if(number.length !== 3){
    alert("يجب ان يكون الرقم من ثلاثة خانات فقط");
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

/* 🔐 العرض التفصيلي */
function openDetail(){

  const pass = document.getElementById("detailPassword").value;

  socket.emit("adminView", pass, (res)=>{

    if(res.error){
      alert(res.error);
      return;
    }

    let html = `
      <h3>📋 جميع اللاعبين</h3>
      <table style="width:100%;color:white;text-align:center;border-collapse:collapse">
        <tr>
          <th>الاسم</th>
          <th>الرقم</th>
        </tr>
    `;

    res.data.forEach(p=>{
      html += `
        <tr>
          <td>${p.name}</td>
          <td>${p.number}</td>
        </tr>
      `;
    });

    html += "</table>";

    document.getElementById("detailContent").innerHTML = html;
  });
}

function showDetail(){
  document.getElementById("detailModal").style.display = "block";
}

function closeDetail(){
  document.getElementById("detailModal").style.display = "none";
  document.getElementById("detailContent").innerHTML = "";
  document.getElementById("detailPassword").value = "";
}