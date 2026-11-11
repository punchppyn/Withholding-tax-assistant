const STORAGE_KEY = "withholdingAI.history.v1";
const $ = (id) => document.getElementById(id);
const money = (value) => new Intl.NumberFormat("th-TH",{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(value)||0);
const today = new Date();
$("paymentDate").value = new Date(today.getTime()-today.getTimezoneOffset()*60000).toISOString().slice(0,10);

const categories = [
 {id:"rent",icon:"⌂",title:"ค่าเช่า",desc:"การจ่ายเงินเพื่อใช้ทรัพย์สิน เช่น อาคาร สำนักงาน หรือพื้นที่ โดยต้องพิจารณาลักษณะสัญญาและสถานะผู้รับเงิน",check:"ตรวจสัญญาเช่า ผู้รับเงิน และข้อกำหนดตามประมวลรัษฎากร"},
 {id:"service",icon:"⚙",title:"ค่าบริการ / จ้างทำของ",desc:"ค่าตอบแทนจากการให้บริการหรือรับจ้างทำงาน ต้องแยกจากการซื้อขายสินค้าและพิจารณาเนื้อหางานจริง",check:"ตรวจลักษณะบริการ ผู้รับเงิน และหลักเกณฑ์ตามคำสั่งกรมสรรพากร"},
 {id:"advertising",icon:"◈",title:"ค่าโฆษณา",desc:"ค่าใช้จ่ายเพื่อเผยแพร่หรือประชาสัมพันธ์สินค้าและบริการ ต้องพิจารณาว่าเป็นค่าโฆษณาตามหลักเกณฑ์หรือบริการประเภทอื่น",check:"ตรวจสัญญาและลักษณะสื่อ/บริการที่ได้รับ"},
 {id:"transport",icon:"⇢",title:"ค่าขนส่ง",desc:"ค่าตอบแทนการขนส่งสินค้าโดยผู้ประกอบการขนส่ง ต้องแยกจากการจัดส่งที่เป็นส่วนหนึ่งของการขายสินค้า",check:"ตรวจผู้ให้บริการ เส้นทาง และเงื่อนไขในสัญญา"},
 {id:"goods",icon:"▣",title:"ซื้อสินค้า",desc:"การซื้อขายสินค้าโดยทั่วไปต้องพิจารณาว่ามีบริการอื่นรวมอยู่ด้วยหรือไม่ เช่น ค่าติดตั้งหรือค่าบริการแยกต่างหาก",check:"ตรวจใบกำกับภาษี ใบสั่งซื้อ และบริการประกอบ"},
 {id:"hotel",icon:"⌂",title:"ค่าห้องพักโรงแรม",desc:"พิจารณาลักษณะการให้บริการ สถานะผู้รับเงิน และข้อเท็จจริงของการจ่ายเงิน",check:"ตรวจเอกสารการเข้าพักและลักษณะผู้ให้บริการ"},
 {id:"restaurant",icon:"♨",title:"ค่าอาหารภัตตาคาร",desc:"การจ่ายค่าอาหารและบริการในร้านอาหารต้องพิจารณาข้อเท็จจริงและประเภทผู้รับเงิน",check:"ตรวจใบเสร็จ/ใบกำกับภาษีและวัตถุประสงค์การจ่าย"},
 {id:"other",icon:"⋯",title:"อื่น ๆ / ข้อมูลกำกวม",desc:"กรณีที่ยังจำแนกประเภทเงินได้ไม่ได้ หรือมีข้อเท็จจริงซับซ้อน ควรขอข้อมูลเพิ่มเติมก่อนสรุป",check:"หยุดการคำนวณและส่งให้ผู้เชี่ยวชาญตรวจสอบ"}
];
const getHistory=()=>{try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]")}catch{return []}};
const saveHistory=(items)=>localStorage.setItem(STORAGE_KEY,JSON.stringify(items));
let historyItems=getHistory();

function go(page){
 document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===`page-${page}`));
 document.querySelectorAll(".nav-link").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
 const names={dashboard:"ภาพรวมระบบ",analysis:"วิเคราะห์ภาษี",knowledge:"ฐานความรู้ภาษี",history:"ประวัติการวิเคราะห์"};
 $("breadcrumbCurrent").textContent=names[page]||"ภาพรวมระบบ";
 $("sidebar").classList.remove("open");
 if(page==="dashboard")renderDashboard();
 if(page==="history")renderHistory();
 window.scrollTo({top:0,behavior:"smooth"});
}
document.querySelectorAll("[data-page]").forEach(b=>b.addEventListener("click",e=>{e.preventDefault();go(b.dataset.page)}));
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.go)));
$("mobileMenu").addEventListener("click",()=>$("sidebar").classList.toggle("open"));

function showToast(message){const t=$("toast");t.textContent=message;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2600)}
function labelFor(id){return categories.find(c=>c.id===id)?.title||"ไม่ระบุ"}
function renderDashboard(){
 $("statTotal").textContent=historyItems.length;
 $("statWithhold").textContent=historyItems.filter(x=>x.status==="review").length; // No legal conclusion is asserted by prototype.
 $("statReview").textContent=historyItems.length;
 const tax=historyItems.reduce((sum,x)=>sum+(Number(x.tax)||0),0);
 $("statTax").textContent="฿"+money(tax);
 const recent=historyItems.slice(0,4);
 $("recentList").innerHTML=recent.length?recent.map(x=>`<div class="recent-row"><strong>${escapeHTML(x.payee)}</strong><span>${escapeHTML(labelFor(x.type))} · ${money(x.amount)} บาท</span></div>`).join(""):`<div class="empty-state"><div class="empty-symbol">▤</div><strong>ยังไม่มีรายการวิเคราะห์</strong><p>เริ่มกรอกข้อมูลธุรกรรมเพื่อดูผลลัพธ์ที่นี่</p><button class="btn btn-outline" data-go="analysis">สร้างรายการแรก</button></div>`;
 const btn=$("recentList").querySelector("[data-go]");if(btn)btn.addEventListener("click",()=>go("analysis"));
}
function escapeHTML(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}

$("taxForm").addEventListener("submit",e=>{
 e.preventDefault();
 const data={
  id:Date.now(),createdAt:new Date().toISOString(),payer:$("payerName").value.trim(),payerType:$("payerType").value,
  payee:$("payeeName").value.trim(),payeeType:$("payeeType").value,residency:$("residency").value,
  type:$("transactionType").value,date:$("paymentDate").value,description:$("description").value.trim(),
  amount:Number($("amount").value),vat:Number($("vat").value||0),special:$("special").value.trim()
 };
 if(!data.payer||!data.payee||!data.description||!data.type||!data.date||!data.payerType||!data.payeeType||!data.residency||!(data.amount>0)){
  showToast("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");return;
 }
 const uncertain=data.residency==="foreign"||data.payeeType==="foreign"||data.type==="other"||data.special.length>0||data.type==="goods"||data.type==="hotel"||data.type==="restaurant";
 data.status=uncertain?"review":"pending";
 data.tax=0;
 historyItems.unshift(data);saveHistory(historyItems);
 renderResult(data);
 renderDashboard();
 showToast("บันทึกรายการวิเคราะห์แล้ว");
});
function renderResult(d){
 const result=$("resultPanel");result.classList.remove("hidden");
 const reason=d.residency==="foreign"||d.payeeType==="foreign"?"ผู้รับเงินหรือถิ่นที่อยู่เกี่ยวข้องกับต่างประเทศ อาจมีประเด็นภาษีระหว่างประเทศและมาตรา 70 ที่ต้องตรวจสอบ":d.type==="goods"?"ต้องตรวจสอบว่าเป็นการซื้อขายสินค้าอย่างเดียวหรือมีบริการอื่นรวมอยู่ด้วย":d.type==="other"?"ยังไม่สามารถจำแนกประเภทธุรกรรมจากข้อมูลที่ให้มาได้":d.special?"มีเงื่อนไขพิเศษที่ต้องตรวจสอบเพิ่มเติม":`ระบบจัดหมวดหมู่เบื้องต้นเป็น “${labelFor(d.type)}” แต่ยังต้องตรวจสอบข้อเท็จจริงและหลักเกณฑ์กฎหมายที่มีผลในวันที่จ่ายเงินจริง`;
 result.innerHTML=`
 <div class="result-head"><div><div class="eyebrow">ANALYSIS RESULT / ${new Date().toLocaleDateString("th-TH")}</div><h3>ผลการตรวจสอบเบื้องต้น</h3><p>${escapeHTML(d.payee)} · ${escapeHTML(labelFor(d.type))}</p></div><span class="status-pill status-review">ต้องตรวจสอบก่อนสรุป</span></div>
 <div class="result-grid">
  <div class="result-metric"><small>ประเภทเงินได้เบื้องต้น</small><strong style="font:600 14px 'IBM Plex Sans Thai'">${escapeHTML(labelFor(d.type))}</strong></div>
  <div class="result-metric"><small>ฐานข้อมูลธุรกรรม (ก่อน VAT)</small><strong>฿${money(d.amount)}</strong></div>
  <div class="result-metric"><small>ภาษีหัก ณ ที่จ่าย</small><strong>ยังไม่คำนวณ</strong></div>
  <div class="result-metric"><small>VAT ที่ระบุ</small><strong>฿${money(d.vat)}</strong></div>
  <div class="result-metric"><small>ยอดรวมก่อนหัก</small><strong>฿${money(d.amount+d.vat)}</strong></div>
  <div class="result-metric"><small>ยอดจ่ายสุทธิ</small><strong>ยังไม่คำนวณ</strong></div>
 </div>
 <div class="result-explain"><strong>เหตุผลประกอบการตรวจสอบ</strong><br>${escapeHTML(reason)}<br><br><strong>ข้อมูลที่ระบบได้รับ:</strong> ผู้จ่าย ${escapeHTML(d.payer)} (${escapeHTML(typeName(d.payerType))}) · ผู้รับ ${escapeHTML(d.payee)} (${escapeHTML(typeName(d.payeeType))}) · วันที่จ่าย ${escapeHTML(d.date)}<br><strong>รายละเอียด:</strong> ${escapeHTML(d.description)}</div>
 <div class="result-warning"><span>⚠</span><span><strong>ยังไม่แสดงอัตราหรือยอดภาษี</strong><br>ต้นแบบนี้ยังไม่มีชุดกฎกฎหมายที่ผ่านการตรวจสอบและผูกกับวันที่จ่ายเงิน จึงไม่คำนวณภาษีหรือแสดงแบบนำส่งเสมือนเป็นข้อสรุปที่ถูกต้อง โปรดตรวจสอบกฎหมายและประกาศกรมสรรพากร หรือให้นักบัญชี/ผู้เชี่ยวชาญพิจารณาก่อนใช้งานจริง</span></div>
 <div style="margin-top:13px;font-size:10px;color:#8291a5">แหล่งอ้างอิงสำหรับตรวจสอบ: <a style="color:#3478d9" href="https://www.rd.go.th/" target="_blank" rel="noopener">กรมสรรพากร ↗</a> · ประมวลรัษฎากรและคำสั่งที่เกี่ยวข้อง (ต้องตรวจสอบฉบับที่มีผล ณ วันที่จ่าย)</div>`;
 result.scrollIntoView({behavior:"smooth",block:"start"});
}
function typeName(t){return {company:"นิติบุคคลไทย",person:"บุคคลธรรมดา",foreign:"นิติบุคคลต่างประเทศ",government:"หน่วยงานรัฐ"}[t]||t}
$("taxForm").addEventListener("reset",()=>{$("resultPanel").classList.add("hidden");setTimeout(()=>{$("vat").value="0";$("paymentDate").value=new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10)},0)});

function renderKnowledge(filter=""){
 const grid=$("knowledgeGrid");
 const list=categories.filter(c=>(c.title+" "+c.desc).toLowerCase().includes(filter.toLowerCase()));
 grid.innerHTML=list.map(c=>`<article class="knowledge-card"><div class="knowledge-card-icon">${c.icon}</div><div><h3>${c.title}</h3><p>${c.desc}</p><small>ควรตรวจสอบ: ${c.check}</small></div></article>`).join("")||`<div class="empty-state">ไม่พบหัวข้อที่ค้นหา</div>`;
}
$("knowledgeSearch").addEventListener("input",e=>renderKnowledge(e.target.value));
function renderHistory(filter=""){
 const body=$("historyBody"),items=historyItems.filter(x=>(x.payee+" "+labelFor(x.type)).toLowerCase().includes(filter.toLowerCase()));
 $("historyCount").textContent=`${historyItems.length} รายการ`;
 body.innerHTML=items.map(x=>`<tr><td>${new Date(x.date+"T00:00:00").toLocaleDateString("th-TH")}</td><td><strong>${escapeHTML(x.payee)}</strong></td><td>${escapeHTML(labelFor(x.type))}</td><td>฿${money(x.amount)}</td><td><span class="status-pill status-review">รอตรวจสอบ</span></td><td><button class="row-action" data-detail="${x.id}">ดูผล</button></td></tr>`).join("");
 $("historyEmpty").classList.toggle("hidden",items.length>0);
 body.querySelectorAll("[data-detail]").forEach(b=>b.addEventListener("click",()=>{const item=historyItems.find(x=>x.id===Number(b.dataset.detail));if(item){go("analysis");renderResult(item)}}));
}
$("historySearch").addEventListener("input",e=>renderHistory(e.target.value));
$("clearHistory").addEventListener("click",()=>{if(!historyItems.length){showToast("ไม่มีประวัติให้ล้าง");return}if(confirm("ต้องการลบประวัติการวิเคราะห์ทั้งหมดหรือไม่?")){historyItems=[];saveHistory(historyItems);renderHistory();renderDashboard();showToast("ล้างประวัติแล้ว")}});
renderKnowledge();renderDashboard();
