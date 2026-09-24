// MapLibre GL JS (OSM) — WebView ichida. RN tomondan window.setCouriers / window.updateCourier chaqiriladi.
export const MAP_HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/>
<link href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" rel="stylesheet"/>
<script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
<style>
  html,body,#map{margin:0;height:100%;width:100%;background:#0B0E12}
  .cur{display:flex;flex-direction:column;align-items:center;transform:translateY(-4px)}
  .cur .dot{width:18px;height:18px;border-radius:50%;background:#F0813F;border:3px solid #fff;box-shadow:0 0 0 2px rgba(240,129,63,.4)}
  .cur .nm{margin-top:3px;font:600 11px/1.2 system-ui,sans-serif;color:#fff;background:rgba(11,14,18,.82);padding:2px 6px;border-radius:6px;white-space:nowrap}
</style>
</head>
<body>
<div id="map"></div>
<script>
var style={version:8,sources:{osm:{type:'raster',tiles:['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png','https://b.tile.openstreetmap.org/{z}/{x}/{y}.png'],tileSize:256,attribution:'© OpenStreetMap'}},layers:[{id:'osm',type:'raster',source:'osm'}]};
var map=new maplibregl.Map({container:'map',style:style,center:[69.2797,41.3111],zoom:11,attributionControl:false});
map.addControl(new maplibregl.NavigationControl({showCompass:false}),'top-right');
var markers={};
function mk(name){var el=document.createElement('div');el.className='cur';el.innerHTML='<div class="dot"></div><div class="nm"></div>';el.querySelector('.nm').textContent=name||'';return el;}
window.updateCourier=function(c){
  if(!c||c.lat==null||c.lng==null)return;
  if(markers[c.courier_id]){markers[c.courier_id].setLngLat([c.lng,c.lat]);}
  else{var el=mk(c.name||c.full_name);markers[c.courier_id]=new maplibregl.Marker({element:el}).setLngLat([c.lng,c.lat]).addTo(map);}
};
window.setCouriers=function(list){
  (list||[]).forEach(window.updateCourier);
  var pts=(list||[]).filter(function(c){return c.lat!=null&&c.lng!=null;});
  if(pts.length===1){map.easeTo({center:[pts[0].lng,pts[0].lat],zoom:13});}
  else if(pts.length>1){var b=new maplibregl.LngLatBounds();pts.forEach(function(c){b.extend([c.lng,c.lat]);});map.fitBounds(b,{padding:60,maxZoom:14});}
};
function post(m){try{window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify(m));}catch(e){}}
map.on('load',function(){post({type:'ready'});});
</script>
</body>
</html>`;
