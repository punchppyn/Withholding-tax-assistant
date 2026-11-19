const STORAGE_KEY = "withholdingAI.history.v2";
const $ = (id) => document.getElementById(id);
const money = (value) => new Intl.NumberFormat("th-TH",{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(value)||0);
const today = new Date();
$("paymentDate").value = new Date(today.getTime()-today.getTimezoneOffset()*60000).toISOString().slice(0,10);

const categories = [
 {id:"rent",icon:"⌂",title:"ค่าเช่า",desc:"ค่าเช่าทรัพย์สินตามมาตรา 40(5)(ก) โดยทั่วไปใช้อัตรา 5% เมื่อผู้จ่ายเป็นนิติบุคคลและผู้รับอยู่ในประเทศ",check:"ตรวจสัญญาเช่า ประเภทผู้รับ และข้อยกเว้น เช่น ลีสซิ่งหรือค่าเช่าเรือ"},
 {id:"service",icon:"⚙",title:"ค่าบริการ / จ้างทำของ",desc:"ค่าบริการทั่วไปหรือค่าจ้างทำของในประเทศ โดยทั่วไปใช้อัตรา 3% เมื่อเข้าเงื่อนไขคำสั่งกรมสรรพากร",check:"ตรวจเนื้องานว่าเป็นบริการจริง ไม่ใช่การขายสินค้า หรือบริการโรงแรม/ภัตตาคาร"},
 {id:"advertising",icon:"◈",title:"ค่าโฆษณา",desc:"ค่าโฆษณาที่จ่ายโดยนิติบุคคลให้ผู้รับในประเทศ โดยทั่วไปใช้อัตรา 2%",check:"ตรวจสัญญาและลักษณะสื่อ/บริการว่าเป็นค่าโฆษณาจริง"},
 {id:"transport",icon:"⇢",title:"ค่าขนส่ง",desc:"ค่าขนส่งสินค้าในประเทศ โดยทั่วไปใช้อัตรา 1% ไม่รวมค่าโดยสารขนส่งสาธารณะ",check:"ตรวจว่าเป็นค่าขนส่งสินค้า ไม่ใช่ค่าโดยสารผู้โดยสารหรือค่าขนส่งที่รวมเป็นส่วนหนึ่งของการขายสินค้า"},
 {id:"goods",icon:"▣",title:"ซื้อสินค้า",desc:"การซื้อขายสินค้าทั่วไปโดยปกติไม่อยู่ในรายการหัก ณ ที่จ่ายทั่วไป แต่มีสินค้าบางชนิดและข้อเท็จจริงเฉพาะที่อาจมีหน้าที่หัก",check:"ตรวจว่ามีบริการแยกต่างหากหรือเป็นสินค้าพิเศษตามคำสั่งกรมสรรพากร"},
 {id:"hotel",icon:"⌂",title:"ค่าห้องพักโรงแรม",desc:"บริการโรงแรมถูกยกเว้นจากกฎบริการทั่วไปบางกรณี แต่สัญญา/รายการเรียกเก็บอาจมีองค์ประกอบอื่น",check:"ตรวจใบแจ้งหนี้และลักษณะสัญญาก่อนสรุป"},
 {id:"restaurant",icon:"♨",title:"ค่าอาหารภัตตาคาร",desc:"ค่าบริการภัตตาคารไม่ถูกรวมในกฎบริการทั่วไปตามข้อ 12/1 แต่ต้องตรวจลักษณะรายการจริง",check:"ตรวจว่าเป็นค่าอาหารภัตตาคารจริงหรือเป็นงานจัดเลี้ยง/บริการอื่น"},
 {id:"other",icon:"⋯",title:"อื่น ๆ / ข้อมูลกำกวม",desc:"ไม่อยู่ในชุดกฎที่ระบบคำนวณได้",check:"หยุดการคำนวณและส่งให้ผู้เชี่ยวชาญตรวจสอบ"}
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
function escapeHTML(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function typeName(t){return {company:"นิติบุคคลไทย",person:"บุคคลธรรมดา",foreign:"นิติบุคคลต่างประเทศ",government:"หน่วยงานรัฐ"}[t]||t}
function renderDashboard(){
 $("statTotal").textContent=historyItems.length;
 $("statWithhold").textContent=historyItems.filter(x=>x.status==="calculated" && x.tax>0).length;
 $("statReview").textContent=historyItems.filter(x=>x.status==="review").length;
 const tax=historyItems.reduce((sum,x)=>sum+(x.status==="calculated"?(Number(x.tax)||0):0),0);
 $("statTax").textContent="฿"+money(tax);
 const recent=historyItems.slice(0,4);
 $("recentList").innerHTML=recent.length?recent.map(x=>`<div class="recent-row"><strong>${escapeHTML(x.payee)}</strong><span>${escapeHTML(labelFor(x.type))} · ${money(x.amount)} บาท · ${x.status==="review"?"รอตรวจสอบ":"ภาษี "+money(x.tax)+" บาท"}</span></div>`).join(""):`<div class="empty-state"><div class="empty-symbol">▤</div><strong>ยังไม่มีรายการวิเคราะห์</strong><p>เริ่มกรอกข้อมูลธุรกรรมเพื่อดูผลลัพธ์ที่นี่</p><button class="btn btn-outline" data-go="analysis">สร้างรายการแรก</button></div>`;
 const btn=$("recentList").querySelector("[data-go]");if(btn)btn.addEventListener("click",()=>go("analysis"));
}

/* Conservative rule engine: only supported domestic transactions are calculated. */
function calculateTax(d){
 const review=(reason)=>({status:"review",rate:null,tax:null,net:null,form:"ต้องตรวจสอบแบบนำส่ง",legal:"",reason});
 if(d.date < "2026-01-01") return review("ชุดกฎนี้กำหนดขอบเขตการคำนวณอัตโนมัติสำหรับการจ่ายตั้งแต่ 1 มกราคม 2569 เป็นต้นไป กรณีปีก่อนหน้าอาจมีมาตรการลดอัตราชั่วคราวและต้องตรวจสอบตามวันที่จ่าย");
 if(d.residency!=="thai" || d.payeeType==="foreign") return review("ผู้รับเงินหรือถิ่นที่อยู่เกี่ยวข้องกับต่างประเทศ ต้องตรวจแหล่งเงินได้ อนุสัญญาภาษีซ้อน มาตรา 70 และสถานประกอบการถาวร");
 if(d.payerType!=="company") return review("ชุดกฎอัตโนมัตินี้รองรับผู้จ่ายที่เป็นบริษัท/ห้างหุ้นส่วนนิติบุคคลเท่านั้น ผู้จ่ายบุคคลธรรมดาหรือหน่วยงานรัฐอาจอยู่ภายใต้บทบัญญัติอื่น");
 if(d.payeeType==="government") return review("ผู้รับเป็นหน่วยงานรัฐ อาจเกี่ยวข้องกับมาตรา 69 ทวิหรือหลักเกณฑ์เฉพาะ ไม่ใช้ตารางทั่วไปนี้");
 if(d.special) return review("มีเงื่อนไขพิเศษที่ผู้ใช้ระบุ จึงต้องตรวจเอกสารและข้อยกเว้นก่อนใช้อัตราทั่วไป");
 if(["other","goods","hotel","restaurant"].includes(d.type)) return review(d.type==="goods"?"การซื้อสินค้าทั่วไปมักไม่ถูกหัก แต่ต้องตรวจสินค้าพิเศษและแยกบริการประกอบ":d.type==="hotel"||d.type==="restaurant"?"บริการโรงแรมและภัตตาคารมีข้อยกเว้นจากกฎบริการทั่วไปบางกรณี จึงต้องตรวจใบแจ้งหนี้และลักษณะรายการ":"ยังไม่มีหลักเกณฑ์ที่รองรับประเภทธุรกรรมนี้");
 const rules={
  rent:{rate:5,legal:"คำสั่งกรมสรรพากร ท.ป.4/2528 ข้อ 6"},
  service:{rate:3,legal:"คำสั่งกรมสรรพากร ท.ป.4/2528 ข้อ 8 หรือข้อ 12/1 (ขึ้นกับลักษณะเงินได้)"},
  advertising:{rate:2,legal:"คำสั่งกรมสรรพากร ท.ป.4/2528 ข้อ 10"},
  transport:{rate:1,legal:"คำสั่งกรมสรรพากร ท.ป.4/2528 ข้อ 12/4"}
 };
 const rule=rules[d.type];if(!rule)return review("ไม่พบกฎที่รองรับ");
 const contractValue=Number(d.contractTotal)||0;
 if(d.amount<1000 && !contractValue) return review("ยอดที่จ่ายครั้งนี้ต่ำกว่า 1,000 บาท แต่ยังไม่ทราบมูลค่าตามสัญญารวม จึงตรวจเกณฑ์ 1,000 บาทต่อสัญญารายหนึ่ง ๆ ไม่ได้");
 if((contractValue||d.amount)<1000) return {status:"calculated",rate:0,tax:0,net:round2(d.amount+d.vat),form:"โดยทั่วไปไม่ต้องยื่นจากรายการนี้เพียงรายการเดียว",legal:"คำสั่งกรมสรรพากร ท.ป.4/2528 ข้อ 12/7",reason:"มูลค่าตามสัญญารายหนึ่ง ๆ ต่ำกว่า 1,000 บาท ตามเกณฑ์ขั้นต่ำในข้อ 12/7"};
 const tax=round2(d.amount*rule.rate/100);
 return {status:"calculated",rate:rule.rate,tax,net:round2(d.amount+d.vat-tax),form:d.payeeType==="person"?"ภ.ง.ด.3":"ภ.ง.ด.53",legal:rule.legal,reason:"เข้าเงื่อนไขเบื้องต้นของกฎที่รองรับ โดยคำนวณจากฐานเงินได้ก่อน VAT และหักภาษี ณ ที่จ่ายจากฐานดังกล่าว"};
}
function round2(n){return Math.round((Number(n)+Number.EPSILON)*100)/100}
function getVat(){
 const amount=Number($("amount").value)||0;
 if($("autoVat").checked) return round2(amount*(Number($("vatRate").value)||0)/100);
 return Number($("vat").value)||0;
}
function syncVat(){
 const auto=$("autoVat").checked;$("vat").readOnly=auto;$("vat").style.background=auto?"#f5f7fa":"#fff";
 $("vat").value=auto&&$("amount").value?money(getVat()):auto?"0":$("vat").value;
}
$("autoVat").addEventListener("change",syncVat);$("amount").addEventListener("input",syncVat);$("vatRate").addEventListener("input",syncVat);syncVat();

$("taxForm").addEventListener("submit",e=>{
 e.preventDefault();
 const data={id:Date.now(),createdAt:new Date().toISOString(),payer:$("payerName").value.trim(),payerType:$("payerType").value,payee:$("payeeName").value.trim(),payeeType:$("payeeType").value,residency:$("residency").value,type:$("transactionType").value,date:$("paymentDate").value,description:$("description").value.trim(),amount:Number($("amount").value),contractTotal:Number($("contractTotal").value)||0,vat:getVat(),vatRate:$("autoVat").checked?(Number($("vatRate").value)||0):null,special:$("special").value.trim()};
 if(!data.payer||!data.payee||!data.description||!data.type||!data.date||!data.payerType||!data.payeeType||!data.residency||!(data.amount>0)||data.vat<0){showToast("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");return}
 Object.assign(data,calculateTax(data));historyItems.unshift(data);saveHistory(historyItems);renderResult(data);renderDashboard();showToast("คำนวณและบันทึกรายการแล้ว");
});
function renderResult(d){
 const result=$("resultPanel");result.classList.remove("hidden");const calculated=d.status==="calculated";
 const statusText=calculated?(d.rate===0?"ไม่ถึงเกณฑ์ขั้นต่ำ":"คำนวณตามกฎที่รองรับ"):"ต้องตรวจสอบก่อนสรุป";
 result.innerHTML=`
 <div class="result-head"><div><div class="eyebrow">WITHHOLDING TAX / RESULT</div><h3>ผลการคำนวณ</h3><p>${escapeHTML(d.payee)} · ${escapeHTML(labelFor(d.type))}</p></div><span class="status-pill ${calculated?"status-demo":"status-review"}">${statusText}</span></div>
 <div class="result-grid">
  <div class="result-metric"><small>ประเภทธุรกรรม</small><strong style="font:600 14px 'IBM Plex Sans Thai'">${escapeHTML(labelFor(d.type))}</strong></div>
  <div class="result-metric"><small>ฐานภาษีก่อน VAT</small><strong>฿${money(d.amount)}</strong></div>
  <div class="result-metric"><small>อัตราหัก ณ ที่จ่าย</small><strong>${calculated?d.rate+"%":"—"}</strong></div>
  <div class="result-metric"><small>ภาษีหัก ณ ที่จ่าย</small><strong>${calculated?"฿"+money(d.tax):"รอตรวจสอบ"}</strong></div>
  <div class="result-metric"><small>VAT ${d.vatRate!==null&&d.vatRate!==undefined?"("+d.vatRate+"%)":""}</small><strong>฿${money(d.vat)}</strong></div>
  <div class="result-metric"><small>ยอดจ่ายสุทธิ</small><strong>${calculated?"฿"+money(d.net):"รอตรวจสอบ"}</strong></div>
 </div>
 <div class="result-explain"><strong>วิธีคำนวณ</strong><br>ฐานเงินได้ก่อน VAT ฿${money(d.amount)} × ${calculated?d.rate:0}% = ${calculated?"฿"+money(d.tax):"ยังไม่คำนวณ"}<br>มูลค่าตามสัญญารวมก่อน VAT = ฿${money(d.contractTotal||d.amount)}<br>ยอดก่อนหัก = ฿${money(d.amount+d.vat)}<br>ยอดสุทธิ = ยอดก่อนหัก − ภาษีหัก ณ ที่จ่าย = ${calculated?"฿"+money(d.net):"ยังไม่คำนวณ"}<br><br><strong>เหตุผล:</strong> ${escapeHTML(d.reason)}<br><strong>หลักเกณฑ์อ้างอิง:</strong> ${escapeHTML(d.legal||"ยังไม่สามารถระบุได้")}<br><strong>แบบนำส่งที่ควรตรวจสอบ:</strong> ${escapeHTML(d.form||"ยังไม่สามารถระบุได้")}<br><strong>ผู้จ่าย:</strong> ${escapeHTML(d.payer)} (${escapeHTML(typeName(d.payerType))}) · <strong>ผู้รับ:</strong> ${escapeHTML(d.payee)} (${escapeHTML(typeName(d.payeeType))}) · <strong>วันที่จ่าย:</strong> ${escapeHTML(d.date)}<br><strong>รายละเอียด:</strong> ${escapeHTML(d.description)}</div>
 <div class="result-warning"><span>⚠</span><span><strong>${calculated?"ผลคำนวณเบื้องต้นตามชุดกฎที่รองรับ":"ระบบไม่คำนวณเพราะข้อมูลอยู่นอกขอบเขต"}</strong><br>${calculated?"ผลนี้ใช้ได้เมื่อข้อเท็จจริงตรงตามเงื่อนไขที่ระบุเท่านั้น ต้องตรวจสัญญา ข้อยกเว้น และกฎหมายที่มีผล ณ วันที่จ่ายก่อนนำส่งจริง":"ระบบตั้งใจไม่เดาอัตราภาษีในกรณีที่ข้อมูลหรือกฎหมายมีความซับซ้อน โปรดให้ผู้ทำบัญชี/ผู้เชี่ยวชาญตรวจสอบ"}</span></div>
 <div style="margin-top:13px;font-size:10px;color:#8291a5">แหล่งอ้างอิง: <a style="color:#3478d9" href="https://www.rd.go.th/3479.html" target="_blank" rel="noopener">คำสั่งกรมสรรพากร ท.ป.4/2528 ↗</a> · <a style="color:#3478d9" href="https://www.rd.go.th/" target="_blank" rel="noopener">กรมสรรพากร ↗</a></div>`;
 result.scrollIntoView({behavior:"smooth",block:"start"});
}
$("taxForm").addEventListener("reset",()=>{$("resultPanel").classList.add("hidden");setTimeout(()=>{$("vat").value="0";$("autoVat").checked=false;$("vatRate").value="7";$("paymentDate").value=new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10);syncVat()},0)});
function renderKnowledge(filter=""){
 const grid=$("knowledgeGrid"),list=categories.filter(c=>(c.title+" "+c.desc).toLowerCase().includes(filter.toLowerCase()));
 grid.innerHTML=list.map(c=>`<article class="knowledge-card"><div class="knowledge-card-icon">${c.icon}</div><div><h3>${escapeHTML(c.title)}</h3><p>${escapeHTML(c.desc)}</p><small>ควรตรวจสอบ: ${escapeHTML(c.check)}</small></div></article>`).join("")||`<div class="empty-state">ไม่พบหัวข้อที่ค้นหา</div>`;
}
$("knowledgeSearch").addEventListener("input",e=>renderKnowledge(e.target.value));
function renderHistory(filter=""){
 const body=$("historyBody"),items=historyItems.filter(x=>(x.payee+" "+labelFor(x.type)).toLowerCase().includes(filter.toLowerCase()));
 $("historyCount").textContent=`${historyItems.length} รายการ`;
 body.innerHTML=items.map(x=>`<tr><td>${new Date(x.date+"T00:00:00").toLocaleDateString("th-TH")}</td><td><strong>${escapeHTML(x.payee)}</strong></td><td>${escapeHTML(labelFor(x.type))}</td><td>฿${money(x.amount)}</td><td><span class="status-pill ${x.status==="calculated"?"status-demo":"status-review"}">${x.status==="calculated"?(x.rate===0?"ไม่ถึงเกณฑ์":"คำนวณแล้ว"):"รอตรวจสอบ"}</span></td><td><button class="row-action" data-detail="${x.id}">ดูผล</button></td></tr>`).join("");
 $("historyEmpty").classList.toggle("hidden",items.length>0);
 body.querySelectorAll("[data-detail]").forEach(b=>b.addEventListener("click",()=>{const item=historyItems.find(x=>x.id===Number(b.dataset.detail));if(item){go("analysis");renderResult(item)}}));
}
$("historySearch").addEventListener("input",e=>renderHistory(e.target.value));
$("clearHistory").addEventListener("click",()=>{if(!historyItems.length){showToast("ไม่มีประวัติให้ล้าง");return}if(confirm("ต้องการลบประวัติการวิเคราะห์ทั้งหมดหรือไม่?")){historyItems=[];saveHistory(historyItems);renderHistory();renderDashboard();showToast("ล้างประวัติแล้ว")}});
renderKnowledge();renderDashboard();
