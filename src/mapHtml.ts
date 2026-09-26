// Leaflet xarita — MAX: yo'nalish o'qi (heading), silliq harakat, OSRM yo'l marshruti, tiniq plitka.
// RN → JS: setCouriers, updateCourier, setOmbor, focusCourier, enterPickMode, confirmPick, cancelPick, setMe, clearRoute
// JS → RN: {type:'ready'} | {type:'pick',lat,lng} | {type:'eta',list} | {type:'locate'} | {type:'route',id,min,km}
export const MAP_HTML = `<!doctype html>
<html><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html,body,#map{height:100%;margin:0;background:#EAEEF2}
  .lbl{background:rgba(255,255,255,.96);border:0;box-shadow:0 2px 6px rgba(0,0,0,.22);border-radius:9px;padding:3px 9px;font:800 11px/1.2 system-ui,sans-serif;color:#11202b;white-space:nowrap}
  .lbl b{color:#C4571B}
  .omb-ic{background:#0B7A56;width:28px;height:28px;border-radius:9px 9px 9px 2px;border:3px solid #fff;transform:rotate(45deg);box-shadow:0 2px 7px rgba(0,0,0,.35)}
  .me-dot{background:#2E6FE0;width:18px;height:18px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 4px rgba(46,111,224,.28)}
  /* Kuryer — yo'nalish ko'rsatuvchi o'q (heading bo'yicha aylanadi) */
  .cu{width:34px;height:34px;position:relative}
  .cu .ring{position:absolute;left:5px;top:5px;width:24px;height:24px;border-radius:50%;background:#E06A28;border:3px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.4)}
  .cu .arr{position:absolute;left:50%;top:-2px;width:0;height:0;margin-left:-7px;border-left:7px solid transparent;border-right:7px solid transparent;border-bottom:12px solid #E06A28;filter:drop-shadow(0 0 1px #fff)}
  .cu.moving .ring{background:#E4551F}
  .btn{position:absolute;z-index:1000;background:#fff;border:0;border-radius:12px;width:46px;height:46px;box-shadow:0 2px 8px rgba(0,0,0,.22);display:flex;align-items:center;justify-content:center;cursor:pointer}
  #locate{right:12px;bottom:24px}
  #cross{position:absolute;inset:0;z-index:900;display:none;align-items:center;justify-content:center;pointer-events:none}
  #cross.on{display:flex}
  #cross .c{width:44px;height:44px;border:3px solid #0B7A56;border-radius:50%;background:rgba(11,122,86,.15);margin-bottom:44px}
  #hint{position:absolute;top:12px;left:50%;transform:translateX(-50%);z-index:1001;background:#0B7A56;color:#fff;font:700 12px/1 system-ui;padding:9px 14px;border-radius:20px;display:none}
  #hint.on{display:block}
  .leaflet-container{background:#EAEEF2}
</style></head>
<body>
<div id="map"></div>
<div id="cross"><div class="c"></div></div>
<div id="hint">Xaritani suring — ombor shu yerda</div>
<button class="btn" id="locate" title="Men turgan joy"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2E6FE0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg></button>
<script>
var map=L.map('map',{zoomControl:true,attributionControl:false,zoomAnimation:true}).setView([41.311,69.279],12);
// Tiniq, ozoda plitka (CartoDB Voyager) + OSM zaxira
var tiles=L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{maxZoom:20,subdomains:'abcd'});
tiles.on('tileerror',function(){ if(!window._osm){window._osm=1; L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);} });
tiles.addTo(map);
var cur={},ombor=null,ombMarker=null,meMarker=null,data={},pick=false,routeLine=null,routeFor=null;
function post(m){try{window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify(m));}catch(e){}}
function hav(a,b,c,d){var R=6371,p=Math.PI/180,x=Math.sin((c-a)*p/2)**2+Math.cos(a*p)*Math.cos(c*p)*Math.sin((d-b)*p/2)**2;return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));}
function eta(c){if(!ombor)return null;var km=hav(c.lat,c.lng,ombor.lat,ombor.lng);var v=(c.speed&&c.speed>1)?c.speed*3.6:22;return{km:km,min:Math.max(1,Math.round(km/v*60))};}
function courIcon(head,moving){return L.divIcon({className:'',html:'<div class="cu'+(moving?' moving':'')+'"><div class="arr" style="transform:rotate('+(head||0)+'deg);transform-origin:7px 19px"></div><div class="ring"></div></div>',iconSize:[34,34],iconAnchor:[17,17]});}

// Silliq harakat — eski→yangi orasida ~700ms interpolatsiya
function animateTo(marker,to){
  var from=marker.getLatLng(),t0=performance.now(),dur=700;
  function step(now){var k=Math.min(1,(now-t0)/dur);var e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
    marker.setLatLng([from.lat+(to[0]-from.lat)*e,from.lng+(to[1]-from.lng)*e]);
    if(k<1)requestAnimationFrame(step);}
  requestAnimationFrame(step);
}
function render(c){
  var e=eta(c),moving=c.speed&&c.speed>0.8;
  var txt=(c.name||c.full_name||'Kuryer')+(e?' <b>'+e.min+' daq</b>':'');
  if(cur[c.courier_id]){
    var o=cur[c.courier_id];
    animateTo(o.m,[c.lat,c.lng]);
    o.m.setIcon(courIcon(c.heading,moving));
    o.m.setTooltipContent(txt);
  } else {
    var m=L.marker([c.lat,c.lng],{icon:courIcon(c.heading,moving)}).addTo(map);
    m.bindTooltip(txt,{permanent:true,direction:'top',className:'lbl',offset:[0,-14]});
    cur[c.courier_id]={m:m};
  }
  if(routeFor===c.courier_id)drawRoute(c.courier_id);
}
window.updateCourier=function(c){if(!c||c.lat==null||c.lng==null)return;data[c.courier_id]=Object.assign(data[c.courier_id]||{},c);render(data[c.courier_id]);pushEta();};
window.setCouriers=function(list){
  (list||[]).forEach(function(c){if(c.lat!=null&&c.lng!=null){data[c.courier_id]=c;render(c);}});
  var pts=(list||[]).filter(function(c){return c.lat!=null&&c.lng!=null;}).map(function(c){return [c.lat,c.lng];});
  if(ombor)pts.push([ombor.lat,ombor.lng]);
  if(pts.length===1)map.setView(pts[0],14);else if(pts.length>1)map.fitBounds(L.latLngBounds(pts).pad(0.3));
  pushEta();
};
window.setOmbor=function(o){
  ombor=(o&&o.lat!=null)?o:null;
  if(ombMarker){map.removeLayer(ombMarker);ombMarker=null;}
  if(ombor){var ic=L.divIcon({className:'',html:'<div class="omb-ic"></div>',iconSize:[28,28],iconAnchor:[14,28]});ombMarker=L.marker([ombor.lat,ombor.lng],{icon:ic}).addTo(map).bindTooltip(ombor.name||'Ombor',{permanent:true,direction:'top',className:'lbl',offset:[0,-26]});}
  Object.keys(data).forEach(function(k){render(data[k]);});pushEta();
};
window.setMe=function(lat,lng,center){
  var ll=[lat,lng];
  if(meMarker)meMarker.setLatLng(ll);
  else meMarker=L.marker(ll,{icon:L.divIcon({className:'',html:'<div class="me-dot"></div>',iconSize:[18,18],iconAnchor:[9,9]})}).addTo(map).bindTooltip('Siz',{permanent:false,direction:'top',className:'lbl'});
  if(center!==false)map.setView(ll,16);
};

// OSRM — haqiqiy yo'l marshruti (kuryer → ombor), yo'nalish chizig'i + haydash vaqti
function drawRoute(id){
  var c=data[id]; if(!c||!ombor)return;
  routeFor=id;
  var url='https://router.project-osrm.org/route/v1/driving/'+c.lng+','+c.lat+';'+ombor.lng+','+ombor.lat+'?overview=full&geometries=geojson';
  fetch(url).then(function(r){return r.json();}).then(function(j){
    if(!j.routes||!j.routes[0])return;
    var rt=j.routes[0],coords=rt.geometry.coordinates.map(function(p){return [p[1],p[0]];});
    if(routeLine)map.removeLayer(routeLine);
    routeLine=L.polyline(coords,{color:'#2E6FE0',weight:5,opacity:.85,dashArray:'1,0'}).addTo(map);
    map.fitBounds(routeLine.getBounds().pad(0.25));
    post({type:'route',id:id,min:Math.max(1,Math.round(rt.duration/60)),km:+(rt.distance/1000).toFixed(1)});
  }).catch(function(){});
}
window.focusCourier=function(id){var c=data[id];if(!c)return;map.setView([c.lat,c.lng],15);drawRoute(id);};
window.clearRoute=function(){routeFor=null;if(routeLine){map.removeLayer(routeLine);routeLine=null;}};

window.enterPickMode=function(){pick=true;document.getElementById('cross').classList.add('on');document.getElementById('hint').classList.add('on');if(ombor)map.setView([ombor.lat,ombor.lng],16);};
window.confirmPick=function(){if(!pick)return;pick=false;document.getElementById('cross').classList.remove('on');document.getElementById('hint').classList.remove('on');var c=map.getCenter();post({type:'pick',lat:c.lat,lng:c.lng});};
window.cancelPick=function(){pick=false;document.getElementById('cross').classList.remove('on');document.getElementById('hint').classList.remove('on');};
document.getElementById('locate').onclick=function(){post({type:'locate'});};
function pushEta(){var list=Object.keys(data).map(function(k){var c=data[k];var e=eta(c);return{id:c.courier_id,name:c.name||c.full_name||'Kuryer',km:e?e.km:null,min:e?e.min:null,heading:c.heading,speed:c.speed,updated_at:c.updated_at};});post({type:'eta',list:list});}
post({type:'ready'});
</script></body></html>`;
