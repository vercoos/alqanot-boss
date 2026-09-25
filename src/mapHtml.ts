// MapLibre GL JS (OSM) — WebView ichida.
// RN → JS: window.setCouriers, window.updateCourier, window.setOmbor, window.focusCourier, window.enterPickMode
// JS → RN: {type:'ready'} | {type:'pick',lat,lng} | {type:'eta',list:[{id,min,km}]}
export const MAP_HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/>
<link href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" rel="stylesheet"/>
<script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
<style>
  html,body,#map{margin:0;height:100%;width:100%;background:#EAEEF2}
  .cur{display:flex;flex-direction:column;align-items:center;transform:translateY(-4px)}
  .cur .dot{width:16px;height:16px;border-radius:50%;background:#0E9F6E;border:3px solid #fff;box-shadow:0 0 0 2px rgba(14,159,110,.35)}
  .cur .nm{margin-top:3px;font:700 11px/1.2 system-ui,sans-serif;color:#0B2A20;background:rgba(255,255,255,.92);padding:2px 7px;border-radius:7px;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,.15)}
  .cur .eta{color:#0B7A56;font-weight:800}
  .cur.sel .dot{background:#0B7A56;transform:scale(1.25)}
  .omb{display:flex;flex-direction:column;align-items:center}
  .omb .pin{width:30px;height:30px;border-radius:9px 9px 9px 3px;background:#0B7A56;border:3px solid #fff;transform:rotate(45deg);box-shadow:0 2px 6px rgba(0,0,0,.3)}
  .omb .lb{margin-top:5px;font:800 11px/1.2 system-ui,sans-serif;color:#fff;background:#0B7A56;padding:2px 8px;border-radius:7px}
  #pick{position:absolute;top:0;left:0;right:0;bottom:0;display:none;align-items:center;justify-content:center;pointer-events:none;z-index:5}
  #pick .cross{width:44px;height:44px;border-radius:50%;border:3px solid #0B7A56;background:rgba(11,122,86,.15)}
  #pick.on{display:flex}
  #hint{position:absolute;top:12px;left:50%;transform:translateX(-50%);background:#0B7A56;color:#fff;font:700 12px/1 system-ui;padding:9px 14px;border-radius:20px;display:none;z-index:6;box-shadow:0 2px 8px rgba(0,0,0,.25)}
  #hint.on{display:block}
</style>
</head>
<body>
<div id="map"></div>
<div id="pick"><div class="cross"></div></div>
<div id="hint">Omborni tanlang — xaritani suring, keyin ✓</div>
<script>
var style={version:8,sources:{osm:{type:'raster',tiles:['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png','https://b.tile.openstreetmap.org/{z}/{x}/{y}.png'],tileSize:256,attribution:'© OpenStreetMap'}},layers:[{id:'osm',type:'raster',source:'osm'}]};
var map=new maplibregl.Map({container:'map',style:style,center:[69.2797,41.3111],zoom:11,attributionControl:false});
map.addControl(new maplibregl.NavigationControl({showCompass:false}),'top-right');
var markers={},data={},ombMarker=null,ombor=null,pick=false;

function post(m){try{window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify(m));}catch(e){}}
function hav(a,b,c,d){var R=6371,dLat=(c-a)*Math.PI/180,dLng=(d-b)*Math.PI/180,x=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(dLng/2)*Math.sin(dLng/2);return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));}
function etaText(c){ if(!ombor)return ''; var km=hav(c.lat,c.lng,ombor.lat,ombor.lng); var v=(c.speed&&c.speed>1)?c.speed*3.6:22; var min=Math.max(1,Math.round(km/v*60)); return km.toFixed(1)+' km · '+min+' daq'; }

function mk(c){var el=document.createElement('div');el.className='cur';el.innerHTML='<div class="dot"></div><div class="nm"></div>';return el;}
function render(c){
  var m=markers[c.courier_id];
  if(!m){var el=mk(c);m=markers[c.courier_id]=new maplibregl.Marker({element:el}).setLngLat([c.lng,c.lat]).addTo(map);m._el=el;}
  else m.setLngLat([c.lng,c.lat]);
  var nm=m._el.querySelector('.nm'); var e=etaText(c);
  nm.innerHTML=(c.name||c.full_name||'Kuryer')+(e?' <span class="eta">· '+e+'</span>':'');
}
window.updateCourier=function(c){ if(!c||c.lat==null||c.lng==null)return; data[c.courier_id]=Object.assign(data[c.courier_id]||{},c); render(data[c.courier_id]); pushEta(); };
window.setCouriers=function(list){
  (list||[]).forEach(function(c){ if(c.lat!=null&&c.lng!=null){data[c.courier_id]=c;render(c);} });
  var pts=(list||[]).filter(function(c){return c.lat!=null&&c.lng!=null;});
  var b=new maplibregl.LngLatBounds(); var has=false;
  pts.forEach(function(c){b.extend([c.lng,c.lat]);has=true;});
  if(ombor){b.extend([ombor.lng,ombor.lat]);has=true;}
  if(pts.length===1&&!ombor){map.easeTo({center:[pts[0].lng,pts[0].lat],zoom:13});}
  else if(has){try{map.fitBounds(b,{padding:70,maxZoom:14});}catch(e){}}
  pushEta();
};
window.setOmbor=function(o){
  ombor=o&&o.lat!=null?o:null;
  if(ombMarker){ombMarker.remove();ombMarker=null;}
  if(ombor){var el=document.createElement('div');el.className='omb';el.innerHTML='<div class="pin"></div><div class="lb">'+(ombor.name||'Ombor')+'</div>';ombMarker=new maplibregl.Marker({element:el,anchor:'bottom'}).setLngLat([ombor.lng,ombor.lat]).addTo(map);}
  Object.keys(data).forEach(function(k){render(data[k]);});
  pushEta();
};
window.focusCourier=function(id){var c=data[id];if(c)map.easeTo({center:[c.lng,c.lat],zoom:14});Object.keys(markers).forEach(function(k){markers[k]._el.classList.toggle('sel',String(k)===String(id));});};
window.enterPickMode=function(){pick=true;document.getElementById('pick').classList.add('on');document.getElementById('hint').classList.add('on');if(ombor)map.easeTo({center:[ombor.lng,ombor.lat],zoom:15});};
window.confirmPick=function(){if(!pick)return;pick=false;document.getElementById('pick').classList.remove('on');document.getElementById('hint').classList.remove('on');var c=map.getCenter();post({type:'pick',lat:c.lat,lng:c.lng});};
window.cancelPick=function(){pick=false;document.getElementById('pick').classList.remove('on');document.getElementById('hint').classList.remove('on');};
function pushEta(){var list=Object.keys(data).map(function(k){var c=data[k];var km=ombor?hav(c.lat,c.lng,ombor.lat,ombor.lng):null;var v=(c.speed&&c.speed>1)?c.speed*3.6:22;return{id:c.courier_id,name:c.name||c.full_name||'Kuryer',km:km,min:km!=null?Math.max(1,Math.round(km/v*60)):null,updated_at:c.updated_at};});post({type:'eta',list:list});}
map.on('load',function(){post({type:'ready'});});
</script>
</body>
</html>`;
