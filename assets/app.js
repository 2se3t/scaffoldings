(()=>{
'use strict';
const config=JSON.parse(document.getElementById('site-data').textContent);
const kk=config.lang==='kk';
const settings=window.YSM_SETTINGS||{};
const digits=String(settings.whatsapp||'').replace(/\D/g,'');
config.whatsapp=/^\d{10,15}$/.test(digits)?digits:null;
document.querySelectorAll('[data-contact-phone]').forEach(el=>{if(!settings.phone)return;const link=document.createElement('a');link.href='tel:'+String(settings.phone).replace(/[^+\d]/g,'');link.textContent=settings.phone;el.replaceChildren(link);});
document.querySelectorAll('[data-contact-address]').forEach(el=>{const address=kk?(settings.addressKk||settings.address):settings.address;if(address)el.textContent=address;});
const menu=document.querySelector('.menu-toggle');
const mobileNav=document.getElementById('mobile-nav');
let backdrop=document.querySelector('.nav-backdrop');
if(!backdrop&&mobileNav){backdrop=document.createElement('div');backdrop.className='nav-backdrop';document.body.appendChild(backdrop);backdrop.addEventListener('click',closeMenu);}
function closeMenu(){if(!menu)return;menu.setAttribute('aria-expanded','false');mobileNav.hidden=true;document.body.classList.remove('menu-open');}
menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')==='true';menu.setAttribute('aria-expanded',String(!open));mobileNav.hidden=open;document.body.classList.toggle('menu-open',!open);});
mobileNav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',event=>{if(event.key==='Escape'){closeMenu();}});
const form=document.getElementById('quote-form');
const dialog=document.getElementById('request-dialog');
const requestText=document.getElementById('request-text');
const status=document.getElementById('dialog-status');
const send=document.getElementById('send-whatsapp');
if(send)send.hidden=!config.whatsapp;
const fmt=new Intl.NumberFormat(kk?'kk-KZ':'ru-RU',{maximumFractionDigits:2});
let opener;
function getData(){if(!form)return null;const data=new FormData(form);return {equipment:data.get('equipment'),length:Number(data.get('length')),height:Number(data.get('height')),quantity:Number(data.get('quantity')),days:Number(data.get('days')),delivery:data.get('delivery')};}
function updateSummary(){const data=getData();if(!data)return;const decks=data.equipment==='decks';document.querySelector('.dimensions').hidden=decks;document.querySelectorAll('.dimensions input').forEach(i=>{i.disabled=decks;});document.querySelector('.quantity-field').hidden=!decks;form.elements.quantity.disabled=!decks;document.getElementById('summary-label').textContent=decks?(kk?'Төсем саны':'Количество трапов'):config.labels.area;const value=decks?Number(form.elements.quantity.value):Number(form.elements.length.value)*Number(form.elements.height.value);const amount=document.getElementById('summary-amount');amount.replaceChildren(document.createTextNode(Number.isFinite(value)&&value>0?fmt.format(value)+' ':'— '));const unit=document.createElement('small');unit.textContent=decks?config.labels.pieces:'м²';amount.append(unit);const days=document.getElementById('summary-days');days.replaceChildren(document.createTextNode(data.days>0?fmt.format(data.days)+' ':'— '));const dayUnit=document.createElement('small');dayUnit.textContent=config.labels.dayUnit;days.append(dayUnit);
const output=document.getElementById('rental-total');
if(output){const rate=decks?settings.deckRatePerPiecePerDay:settings.scaffoldingRatePerM2PerDay;const total=Number(rate)*value*data.days;output.textContent=typeof rate==='number'&&rate>0&&Number.isFinite(total)&&total>0?fmt.format(total)+' ₸':'— ₸';}
}
function message(){const d=getData();if(!d)return '';const parts=kk?['Сәлеметсіз бе! YugStroyMontazh-тан жалға алу құнын есептеуді сұраймын.',d.equipment==='decks'?`Жабдық: траптар мен төсемдер\nСаны: ${d.quantity} дана\nӨлшемдері және орман жүйесі: нақтылау қажет`:`Жабдық: құрылыс ормандары\nҚасбет: ${fmt.format(d.length)} × ${fmt.format(d.height)} м\nҚасбет ауданы: ${fmt.format(d.length*d.height)} м²\nТөсемдер қажеттілігі: нақтылау қажет`,`Мерзімі: ${d.days} күн`,`Алу тәсілі: ${d.delivery}`,'Нысан мекенжайы: ','Басталу күні: ','Қолжетімділігін, жинақтамасын, бағасын және жалға алу шарттарын хабарлаңыз.']:['Здравствуйте! Прошу рассчитать аренду в YugStroyMontazh.',d.equipment==='decks'?`Оборудование: трапы и настилы\nКоличество: ${d.quantity} шт.\nРазмеры и система лесов: нужно уточнить`:`Оборудование: строительные леса\nФасад: ${fmt.format(d.length)} × ${fmt.format(d.height)} м\nПлощадь фасада: ${fmt.format(d.length*d.height)} м²\nНужны ли трапы: уточнить`,`Срок: ${d.days} дней`,`Получение: ${d.delivery}`,'Адрес объекта: ','Дата начала: ','Подскажите наличие, комплектацию, стоимость и условия аренды.'];return parts.join('\n\n');}
function updateWhatsApp(){if(send&&config.whatsapp)send.href='https://wa.me/'+config.whatsapp.replace(/\D/g,'')+'?text='+encodeURIComponent(requestText.value);}
form?.addEventListener('input',updateSummary);
form?.addEventListener('change',updateSummary);
form?.addEventListener('submit',event=>{event.preventDefault();if(!form.reportValidity())return;opener=document.activeElement;requestText.value=message();status.textContent='';updateWhatsApp();dialog.showModal();});
document.querySelectorAll('[data-product]').forEach(a=>a.addEventListener('click',()=>{if(!form)return;const radio=form.querySelector(`input[value="${a.dataset.product}"]`);if(radio){radio.checked=true;updateSummary();}}));
document.querySelector('.dialog-close')?.addEventListener('click',()=>dialog.close());
dialog?.addEventListener('click',event=>{if(event.target!==dialog)return;const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();});
dialog?.addEventListener('close',()=>opener?.focus());
requestText?.addEventListener('input',updateWhatsApp);
document.getElementById('copy-request')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(requestText.value);status.textContent=config.labels.copied;}catch{requestText.focus();requestText.select();try{status.textContent=document.execCommand('copy')?config.labels.copied:config.labels.copyError;}catch{status.textContent=config.labels.copyError;}}});
document.getElementById('download-request')?.addEventListener('click',()=>{const blob=new Blob(['\ufeff'+requestText.value],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='yugstroymontazh-request.txt';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
updateSummary();
})();
