// Leaflet (OSM) xarita — Soft Chicken uslubida, geolocation "Siz" tugmasi bilan.
// RN → JS: setCouriers, updateCourier, setOmbor, focusCourier, enterPickMode, confirmPick, cancelPick, locateMe
// JS → RN: {type:'ready'} | {type:'pick',lat,lng} | {type:'eta',list:[...]}
export const MAP_HTML = `<!doctype html>
<html><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html,body,#map{height:100%;margin:0;background:#EAEEF2}
  .lbl{background:rgba(255,255,255,.94);border:0;box-shadow:0 1px 4px rgba(0,0,0,.2);border-radius:8px;padding:3px 8px;font:700 11px/1.2 system-ui,sans-serif;color:#11202b;white-space:nowrap}
  .lbl b{color:#C4571B}
  .omb-ic{background:#0B7A56;width:26px;height:26px;border-radius:8px 8px 8px 2px;border:3px solid #fff;transform:rotate(45deg);box-shadow:0 2px 6px rgba(0,0,0,.3)}
  .me-dot{background:#2E6FE0;width:16px;height:16px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 3px rgba(46,111,224,.3)}
  .cu-dot{background:#E06A28;width:16px;height:16px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 2px rgba(224,106,40,.35)}
  .btn{position:absolute;z-index:1000;background:#fff;border:0;border-radius:12px;width:46px;height:46px;box-shadow:0 2px 8px rgba(0,0,0,.22);display:flex;align-items:center;justify-content:center;cursor:pointer}
  #locate{right:12px;bottom:24px}
  #cross{position:absolute;top:0;left:0;right:0;bottom:0;z-index:900;display:none;align-items:center;justify-content:center;pointer-events:none}
  #cross.on{display:flex}
  #cross .c{width:44px;height:44px;border:3px solid #0B7A56;border-radius:50%;background:rgba(11,122,86,.15);margin-bottom:44px}
  #hint{position:absolute;top:12px;left:50%;transform:translateX(-50%);z-index:1001;background:#0B7A56;color:#fff;font:700 12px/1 system-ui;padding:9px 14px;border-radius:20px;display:none}
  #hint.on{display:block}
</style></head>
<body>
<div id="map"></div>
<div id="cross"><div class="c"></div></div>
<div id="hint">Xaritani suring — ombor shu yerda</div>
<button class="btn" id="locate" title="Men turgan joy"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2E6FE0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg></button>
<script>
var map=L.map('map',{zoomControl:true,attributionControl:false}).setView([41.311,69.279],12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
var cur={},ombor=null,ombMarker=null,meMarker=null,data={},pick=false;
function post(m){try{window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify(m));}catch(e){}}
function hav(a,b,c,d){var R=6371,p=Math.PI/180,x=Math.sin((c-a)*p/2)**2+Math.cos(a*p)*Math.cos(c*p)*Math.sin((d-b)*p/2)**2;return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));}
function eta(c){if(!ombor)return null;var km=hav(c.lat,c.lng,ombor.lat,ombor.lng);var v=(c.speed&&c.speed>1)?c.speed*3.6:22;return{km:km,min:Math.max(1,Math.round(km/v*60))};}
function courIcon(){return L.divIcon({className:'',html:'<div class="cu-dot"></div>',iconSize:[16,16],iconAnchor:[8,8]});}
function render(c){
  var e=eta(c);
  var txt=(c.name||c.full_name||'Kuryer')+(e?' <b>'+e.min+' daq</b>':'');
  if(cur[c.courier_id]){cur[c.courier_id].m.setLatLng([c.lat,c.lng]);cur[c.courier_id].m.setTooltipContent(txt);}
  else{var m=L.marker([c.lat,c.lng],{icon:courIcon()}).addTo(map);m.bindTooltip(txt,{permanent:true,direction:'top',className:'lbl',offset:[0,-8]});cur[c.courier_id]={m:m};}
}
window.updateCourier=function(c){if(!c||c.lat==null||c.lng==null)return;data[c.courier_id]=Object.assign(data[c.courier_id]||{},c);render(data[c.courier_id]);pushEta();};
window.setCouriers=function(list){
  (list||[]).forEach(function(c){if(c.lat!=null&&c.lng!=null){data[c.courier_id]=c;render(c);}});
  var pts=(list||[]).filter(function(c){return c.lat!=null&&c.lng!=null;}).map(function(c){return [c.lat,c.lng];});
  if(ombor)pts.push([ombor.lat,ombor.lng]);
  if(pts.length===1)map.setView(pts[0],13);else if(pts.length>1)map.fitBounds(L.latLngBounds(pts).pad(0.3));
  pushEta();
};
window.setOmbor=function(o){
  ombor=(o&&o.lat!=null)?o:null;
  if(ombMarker){map.removeLayer(ombMarker);ombMarker=null;}
  if(ombor){var ic=L.divIcon({className:'',html:'<div class="omb-ic"></div>',iconSize:[26,26],iconAnchor:[13,26]});ombMarker=L.marker([ombor.lat,ombor.lng],{icon:ic}).addTo(map).bindTooltip(ombor.name||'Ombor',{permanent:true,direction:'top',className:'lbl',offset:[0,-24]});}
  Object.keys(data).forEach(function(k){render(data[k]);});pushEta();
};
window.focusCourier=function(id){var c=data[id];if(c)map.setView([c.lat,c.lng],15);};
window.enterPickMode=function(){pick=true;document.getElementById('cross').classList.add('on');document.getElementById('hint').classList.add('on');if(ombor)map.setView([ombor.lat,ombor.lng],15);};
window.confirmPick=function(){if(!pick)return;pick=false;document.getElementById('cross').classList.remove('on');document.getElementById('hint').classList.remove('on');var c=map.getCenter();post({type:'pick',lat:c.lat,lng:c.lng});};
window.cancelPick=function(){pick=false;document.getElementById('cross').classList.remove('on');document.getElementById('hint').classList.remove('on');};
window.locateMe=function(){
  if(!navigator.geolocation){return;}
  navigator.geolocation.getCurrentPosition(function(p){
    var ll=[p.coords.latitude,p.coords.longitude];
    if(meMarker)meMarker.setLatLng(ll);
    else meMarker=L.marker(ll,{icon:L.divIcon({className:'',html:'<div class="me-dot"></div>',iconSize:[16,16],iconAnchor:[8,8]})}).addTo(map).bindTooltip('Siz',{permanent:false,direction:'top',className:'lbl'});
    map.setView(ll,15);
  },function(){},{enableHighAccuracy:true,timeout:8000});
};
document.getElementById('locate').onclick=window.locateMe;
function pushEta(){var list=Object.keys(data).map(function(k){var c=data[k];var e=eta(c);return{id:c.courier_id,name:c.name||c.full_name||'Kuryer',km:e?e.km:null,min:e?e.min:null,updated_at:c.updated_at};});post({type:'eta',list:list});}
post({type:'ready'});
</script></body></html>`;
