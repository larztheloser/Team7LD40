/*jshint maxerr: 1000 */

/*

GENERAL UTILITY FUNCTIONS

*/

var startTime=new Date().getTime(); var gameStartTime=new Date().getTime(); timeOffset=parseInt(Math.random()*3600000);
//returns precise time (avoids too-large numbers in shaders)
function pt(){ return new Date().getTime()-startTime+timeOffset; }
function gamet(){ return new Date().getTime()-gameStartTime; }

//appends html to body
function ap(html) { document.body.insertAdjacentHTML("beforeend",html); }
//append a script
function loadjscssfile(filename, filetype){
	var fileref;
	if (filetype=="js"){
		fileref=document.createElement('script');
		fileref.setAttribute("type","text/javascript");
		fileref.setAttribute("onload","ev('scriptload',\""+filename+"\")");
		fileref.setAttribute("src", filename); }
	else if (filetype=="css"){
		fileref=document.createElement("link");
		fileref.setAttribute("rel", "stylesheet");
		fileref.setAttribute("type", "text/css");
		fileref.setAttribute("onload","ev('scriptload',\""+filename+"\")");
		fileref.setAttribute("href", filename);}
	if(typeof fileref!="undefined") document.getElementsByTagName("head")[0].appendChild(fileref); }

//resource management
var registeredResources=[];
function addResource(name,res) { registeredResources.push({name:name,res:res}); }
function findResource(name) { return registeredResources.findIndex(function(i){return i.name==name;}); }
function getResource(name) { return (typeof registeredResources[findResource(name)]!='undefined') ? registeredResources[findResource(name)].res : {loaded:false}; }

//hook/event system
var registeredHooks=[];
function once(t,e){var n;return function(){return t&&(n=t.apply(e||this,arguments),t=null),n}}
function on(hook,fn) {
	if(hook.constructor===Array) { for (var i=0; i<hook.length; i++) this.on(hook[i],fn); }
	if('undefined'==typeof(registeredHooks[hook])) registeredHooks[hook]=[];
	registeredHooks[hook].push(fn); }
function onNext(hook,fn) { this.on(hook,once(fn)); }
function ev(hook,args) {
	if('undefined'==typeof registeredHooks[hook]) return;
	if('undefined'==typeof args) args=[];
	for(var i=0; i<registeredHooks[hook].length; i++) { registeredHooks[hook][i](args); }}

//loading stuff
function ajax(url) {
	var x=new XMLHttpRequest();
	x.onreadystatechange=function() {
		if(this.readyState==4 && this.status==200) ev("ajaxDone",[url,this.responseText]);
		else if(this.readyState==4 && this.status>=400) ev("ajaxError",[url,this.status]); };
	x.open("GET", url, true); x.send(); }


/*

MENU

*/

function mainMenu() {
	document.getElementById("menus").innerHTML="<div class='menublock'><a href='javascript: void(0)' onclick='survivegame()'>Survival Mode</a><a href='javascript: void(0)' onclick='campaigngame()'>Campaign</a><a href='javascript: void(0)' onclick='multgame()'>Multiplayer</a><a href='javascript: void(0)' onclick='options()'>Options</a><a href='javascript: void(0)' onclick='credits()'>Credits</a></div>";
}
function msgBox(txt,fwd) {
	document.getElementById("menus").innerHTML="<div class='msgblock'>"+txt+"<br><a href='javascript: void(0)' onclick=\""+fwd+"\" class='msgclink'>Continue</a></div>";
}
function survivegame() {
	generateMap();
	renderGameTiles();
	gameStartTime=new Date().getTime();
	createPlayer();
}
function campaigngame() {
	msgBox("This game mode is not yet available.","mainMenu()");
}
function multgame() {
	msgBox("This game mode is not yet available.","mainMenu()");
}
function options() {
	msgBox("The options are not yet available.","mainMenu()");
}
function credits() {
	msgBox("The credits are not yet available.","mainMenu()");
}
function hidemenus() {
	document.getElementById("menus").innerHTML="";
	document.getElementById("menus").style.width="0";
	document.getElementById("menus").style.height="0";
}

onload=function() {
	ap("<div id='menus'></div>");
	ap("<div id='game'></div>");
	loadGame();
};

function loadGame() {
	var assetsLoaded=0, assetstotal=28;
	var assetCheck=function() { assetsLoaded++; if(assetsLoaded==assetstotal) mainMenu(); }.bind(this);
	var pushasset=function(name,path) { var to=new Image(); to.onload=function() { addResource(name,to); assetCheck(); }.bind(this); to.src=path; };

	pushasset("player","graphics/playermd.gif");
	pushasset("playermr","graphics/playermr.gif");
	pushasset("playerml","graphics/playerml.gif");
	pushasset("playermu","graphics/playermu.gif");
	pushasset("img00","dg_imgs/00.gif");
	pushasset("img01","dg_imgs/01.gif");
	pushasset("img02","dg_imgs/02.gif");
	pushasset("img03","dg_imgs/03.gif");
	pushasset("img04","dg_imgs/04.gif");
	pushasset("img05","dg_imgs/05.gif");
	pushasset("img06","dg_imgs/06.gif");
	pushasset("img07","dg_imgs/07.gif");
	pushasset("img08","dg_imgs/08.gif");
	pushasset("img09","dg_imgs/09.gif");
	pushasset("img10","dg_imgs/10.gif");
	pushasset("img11","dg_imgs/11.gif");
	pushasset("img12","dg_imgs/12.gif");
	pushasset("img13","dg_imgs/13.gif");
	pushasset("img14","dg_imgs/14.gif");
	pushasset("cactus","graphics/cactus.gif");
	pushasset("cactus2","graphics/cactus2.gif");
	pushasset("cactus3","50px/cactus.gif");
	pushasset("cactus4","50px/grass.gif");
	pushasset("rocks","graphics/rocks.gif");
	pushasset("grave","graphics/grave.gif");
	pushasset("windmill","graphics/windmill.gif");
	pushasset("watertower","graphics/watertower.gif");
	pushasset("skeleton","graphics/skeleton.gif");
	on("scriptload",function(a) { if(a=="pathing.js") { assetsLoaded++; aStar=new PF.AStarFinder(); if(assetsLoaded==assetstotal) mainMenu(); } }.bind(this));
	loadjscssfile("pathing.js","js");
}

/*

GAME

*/

var bulletSpeed = 5;
var bullets = [];
var maxBullets = 25;

gamemap=[];
mapsize=150;
tilesize=20;
//current random maps: arena, valleys
mapstyle="arena";
isGameActive=false;
pathfinder=false;
aStar={};

function generateMap() {
	pathfinder=new PF.Grid(mapsize, mapsize);
	for(var row=0;row<mapsize;row++) {
		for(var col=0;col<mapsize;col++) {
			gamemap[row*mapsize+col]=0;
			pathfinder.setWalkableAt(row, col, false);
		}
	}
	var halfmapsize=Math.round(mapsize/2);
	var cpos;
	function getX() { return cpos%mapsize; }
	function getY() { return (cpos-getX())/mapsize; }
	function goUp() { if(getY()!==1) cpos-=mapsize; }
	function goDown() { if(getY()!==mapsize-1) cpos+=mapsize; }
	function goLeft() { if(getX()!==1) cpos-=1; }
	function goRight() { if(getX()!==mapsize-1) cpos+=1; }
	function reset() {
		if(mapstyle=="arena") cpos=halfmapsize*mapsize+halfmapsize;
		if(mapstyle=="valleys") cpos=Math.floor(Math.random()*mapsize*mapsize);
	}
	var maxnumit=mapsize*5;
	if(mapstyle=="arena") maxnumit=mapsize*8;
	for(var i=0;i<maxnumit;i++) {
		reset(); gamemap[cpos]=1;
		while(true) {
			switch(Math.floor(Math.random()*4)+1) {
				case 1: goUp(); break;
				case 2: goDown(); break;
				case 3: goLeft(); break;
				case 4: goRight(); break;
			}
			gamemap[cpos]=1;
			pathfinder.setWalkableAt(getY(), getX(), true);
			if(Math.random()<0.005) break;
		}
	}
}
function renderGameTiles() {
	document.getElementById("game").innerHTML="<div id='gameinner'><div id='gameinner2'></div></div>";
	document.getElementById("gameinner2").innerHTML="<canvas id='drawcanvas' width=\""+(mapsize*tilesize)+"\" height=\""+(mapsize*tilesize)+"\">";
	var context = document.getElementById('drawcanvas').getContext("2d");
	function gp(r,c) { return gamemap[r*mapsize+c]==1; }
	for(var row=0;row<mapsize;row++) {
		for(var col=0;col<mapsize;col++) {
			var tt=row*mapsize+col; drawn=true;
			context.fillStyle = "#982";
			if(gp(row,col) && gp(row+1,col) && gp(row-1,col) && gp(row,col+1) && gp(row,col-1)) context.drawImage(getResource("img14"), row*tilesize, col*tilesize);
			else if(gp(row,col) && gp(row+1,col) && gp(row-1,col) && gp(row,col+1)) context.drawImage(getResource("img08"), row*tilesize, col*tilesize);
			else if(gp(row,col) && gp(row+1,col) && gp(row-1,col) && gp(row,col-1)) context.drawImage(getResource("img10"), row*tilesize, col*tilesize);
			else if(gp(row,col) && gp(row-1,col) && gp(row,col+1) && gp(row,col-1)) context.drawImage(getResource("img11"), row*tilesize, col*tilesize);
			else if(gp(row,col) && gp(row+1,col) && gp(row,col+1) && gp(row,col-1)) context.drawImage(getResource("img09"), row*tilesize, col*tilesize);
			else if(gp(row,col) && gp(row+1,col) && gp(row-1,col)) context.drawImage(getResource("img00"), row*tilesize, col*tilesize);
			else if(gp(row,col) && gp(row,col+1) && gp(row,col-1)) context.drawImage(getResource("img02"), row*tilesize, col*tilesize);
			else if(gp(row,col) && gp(row+1,col) && gp(row,col+1)) context.drawImage(getResource("img04"), row*tilesize, col*tilesize);
			else if(gp(row,col) && gp(row+1,col) && gp(row,col-1)) context.drawImage(getResource("img05"), row*tilesize, col*tilesize);
			else if(gp(row,col) && gp(row-1,col) && gp(row,col+1)) context.drawImage(getResource("img06"), row*tilesize, col*tilesize);
			else if(gp(row,col) && gp(row-1,col) && gp(row,col-1)) context.drawImage(getResource("img07"), row*tilesize, col*tilesize);
			else if(gp(row,col) && gp(row+1,col)) context.drawImage(getResource("img01"), row*tilesize, col*tilesize);
			else if(gp(row,col) && gp(row-1,col)) context.drawImage(getResource("img03"), row*tilesize, col*tilesize);
			else if(gp(row,col) && gp(row,col+1)) context.drawImage(getResource("img13"), row*tilesize, col*tilesize);
			else if(gp(row,col) && gp(row,col-1)) context.drawImage(getResource("img12"), row*tilesize, col*tilesize);
			else if(gp(row,col)) context.drawImage(getResource("img14"), row*tilesize, col*tilesize);
			else context.fillRect(row*tilesize, col*tilesize, tilesize, tilesize);
		//	context.drawImage(getResource("sand"), row*tilesize, col*tilesize);
			if(Math.random()<0.008 && gp(row,col)) createGameObject(getResource("cactus"), row*tilesize, col*tilesize);
			if(Math.random()<0.004 && gp(row,col)) createGameObject(getResource("cactus2"), row*tilesize, col*tilesize);
			if(Math.random()<0.003 && gp(row,col)) context.drawImage(getResource("rocks"), row*tilesize, col*tilesize);
			if(Math.random()<0.003 && gp(row,col)) context.drawImage(getResource("cactus4"), row*tilesize, col*tilesize, 20, 20);
			if(Math.random()<0.002 && gp(row,col)) context.drawImage(getResource("cactus3"), row*tilesize, col*tilesize, 20, 20);
			if(Math.random()<0.0012 && gp(row,col)) context.drawImage(getResource("grave"), row*tilesize, col*tilesize);
			if(Math.random()<0.0008 && gp(row,col)) context.drawImage(getResource("skeleton"), row*tilesize, col*tilesize);
			if(Math.random()<0.0005 && gp(row,col)) createGameObject(getResource("windmill"), row*tilesize, col*tilesize-20,col*tilesize);
			if(Math.random()<0.0005 && gp(row,col)) createGameObject(getResource("watertower"), row*tilesize, col*tilesize-20,col*tilesize);
		}
	}
}

enemyCounter=0;
activeEnemies=[];
function spawnEnemyNearEdge() {
	var x,y;
	switch(Math.floor(Math.random()*4)+1) {
		case 1:
			y=mappadding; x=mappadding+parseInt(Math.random()*mapsize)*tilesize;
			while(!canMove(x,y)) {
				y+=tilesize;
				if(y>=mappadding+tilesize*mapsize) return; }
			break;
		case 2:
			x=mappadding; y=mappadding+parseInt(Math.random()*mapsize)*tilesize;
			while(!canMove(x,y)) {
				x+=tilesize;
				if(x>=mappadding+tilesize*mapsize) return; }
			break;
		case 3:
			y=mappadding+mapsize*tilesize; x=mappadding+parseInt(Math.random()*mapsize)*tilesize;
			while(!canMove(x,y)) {
				y-=tilesize;
				if(y<=mappadding) return; }
			break;
		default:
			x=mappadding+mapsize*tilesize; y=mappadding+parseInt(Math.random()*mapsize)*tilesize;
			while(!canMove(x,y)) {
				x-=tilesize;
				if(x<=mappadding) return; }
			break;
	}
	activeEnemies.push({
		id: "enemy"+enemyCounter,
		closeEnoughToPlayer: false,
		nextPathingUpdate: -9999999999,
		x:x, y:y, speed: playerSpeed*(Math.random()*0.5+0.4),
		path:[]
	});
	document.getElementById("gameinner2").insertAdjacentHTML('beforeend', "<div class='enemy' id='enemy"+enemyCounter+"' style='left: "+x+"px; top: "+y+"px; z-index: "+y+"; position: absolute; width: 20px; height: 20px; background-color: transparent; background-size: contain; background-image: url(50px/walker_walkingD.gif);'></div>");
	enemyCounter++;
}
function updateEnemyPath(e) {
	var DPx=Math.abs(playerX-e.x);
	var DPy=Math.abs(playerY-e.y);
	if(DPx<=tilesize+1&&DPy<=tilesize+1) { e.closeEnoughToPlayer=true; e.path=[]; }
	else {
		e.closeEnoughToPlayer=false;
		var npather=pathfinder.clone();
		e.path=aStar.findPath(Math.floor((e.x+6-mappadding)/tilesize), Math.floor((e.y+9-mappadding)/tilesize), Math.floor((playerX+6-mappadding)/tilesize), Math.floor((playerY+9-mappadding)/tilesize), npather);
		if(e.path.length>=1) e.path.shift();
		else console.log(e);
	}
	return e; }
function updateEnemies() {
	var tickTime=pt();
	for(var i = 0; i < activeEnemies.length; i++) {
		var e=activeEnemies[i];
		//attacking logic goes here
		if(e.nextPathingUpdate<=tickTime) { e=updateEnemyPath(e); e.nextPathingUpdate=tickTime+1500; activeEnemies[i]=e; }
		if(e.closeEnoughToPlayer) continue;
		if(e.path.length===0) continue;
		var nextSpot=e.path[0]; var nxX=nextSpot[0],nxY=nextSpot[1],el=document.getElementById(e.id);
		if(Math.abs(e.x-mappadding-nxX*tilesize)<=e.speed && Math.abs(e.y-mappadding-nxY*tilesize)<=e.speed) {
			e.x=nxX*tilesize+mappadding; e.y=nxY*tilesize+mappadding; e.path.shift(); }
		if(nxX*tilesize+mappadding>e.x) { e.x+=e.speed; el.style.backgroundImage = "url('50px/walker_walkingR.gif')"; }
		if(nxX*tilesize+mappadding<e.x) { e.x-=e.speed; el.style.backgroundImage = "url('50px/walker_walkingL.gif')"; }
		if(nxY*tilesize+mappadding>e.y) { e.y+=e.speed; el.style.backgroundImage = "url('50px/walker_walkingD.gif')"; }
		if(nxY*tilesize+mappadding<e.y) { e.y-=e.speed; el.style.backgroundImage = "url('50px/walker_walkingF.gif')"; }
		el.style.left = e.x+"px"; el.style.top = e.y+"px"; el.style.zIndex = e.y;
		activeEnemies[i]=e;
	}
}

function createGameObject(img,x,y,z) {
	x+=mappadding;y+=mappadding;
	if(typeof z==="undefined") z=y;
	else z+=mappadding;
	document.getElementById("gameinner2").insertAdjacentHTML('afterbegin', "<div class='gaiaObj' style='left: "+x+"px; top: "+y+"px; z-index: "+z+"; position: absolute;'><img src=\""+img.src+"\"></div>"); }

var mappadding=2500;
var playerX=0,playerY=0,playerDX=0,playerDY=0,playerSpeed=2;
function createPlayer() {
	playerX=Math.round(mapsize/2)*tilesize+mappadding; playerY=Math.round(mapsize/2)*tilesize+mappadding;
	if(!canMove(playerX,playerY)) { while(!canMove(playerX,playerY)) { playerX+=tilesize; } }
	document.getElementById("gameinner2").insertAdjacentHTML('afterbegin', "<div id='playerAvatar' style='left: "+playerX+"px; top: "+playerY+"px; background-color: transparent; background-image: url(graphics/playermd.gif); background-size: contain; width: "+tilesize+"px; height: "+tilesize+"px; position: absolute;'></div>");
	hidemenus(); isGameActive=true; requestAnimationFrame(doAnimations);
}

function canMove(x,y) {
	x-=mappadding; y-=mappadding;
	x2=Math.floor((x+15)/tilesize); y2=Math.floor((y+22)/tilesize);
	x=Math.floor(x/tilesize); y=Math.floor((y+5)/tilesize);
	return gamemap[x*mapsize+y]==1&&gamemap[x2*mapsize+y2]==1;
}

document.onmousedown = checkMouseDown;
document.onkeydown = checkKeyDown;
document.onkeyup = checkKeyUp;
function checkKeyDown(e) {
	if(!isGameActive) return;
	e = e || window.event;
	if (e.keyCode == '38' || e.keyCode == '87') playerDY=-1;
	else if (e.keyCode == '40' || e.keyCode == '83') playerDY=1;
	else if (e.keyCode == '37' || e.keyCode == '65') playerDX=-1;
	else if (e.keyCode == '39' || e.keyCode == '68') playerDX=1;
}

function checkKeyUp(e) {
	if(!isGameActive) return;
	e = e || window.event;
	if(e.keyCode == '38' || e.keyCode == '40' || e.keyCode == '87' || e.keyCode == '83') playerDY = 0;
	else if(e.keyCode == '37' || e.keyCode == '39' || e.keyCode == '65' || e.keyCode == '68') playerDX = 0;
}

function checkMouseDown(e) {
	if(!isGameActive) return;
	e = e || window.event;
	// 1 is left mouse button
	if(e.which == 1) playerShootBullet(e.clientX, e.clientY);
}

bulletID = -1;
function playerShootBullet(clickX, clickY) {
	bulletID++;
	var centerX = window.innerWidth / 2;
	var centerY = window.innerHeight / 2;
	var angle = Math.atan2(clickY - centerY, clickX - centerX)
	var bulletDY = Math.sin(angle);
	var bulletDX = Math.cos(angle);
	if(bullets.length >= maxBullets) { 
		document.getElementById('bullet'+bullets[0].bulletid).html = "";
		bullets.shift();
	}
	bullet = {x:playerX+tilesize/2, y:playerY+tilesize/2, dx:bulletDX, dy:bulletDY, bulletid:bulletID, killtimer:pt()};
	bullets.push(bullet);
	createBullet(bullet);
}

bulletSize = 2;
function createBullet(bullet) {
	document.getElementById("gameinner2").insertAdjacentHTML('afterbegin', "<div id='bullet"+bullet.bulletid+"' style='left: "+bullet.x+"px; top: "+bullet.y+"px; background-color: #000000; background-size: contain; width: "+bulletSize+"px; height: "+bulletSize+"px; position: absolute;'></div>");
}

function updateBullets() {
	var timecheck=pt()-5000;
	for(var i = 0; i < bullets.length; i++) {
		if(bullets[i].killtimer<timecheck-5000) {
			var elem=document.getElementById('bullet'+bullets[i].bulletid);
			elem.parentNode.removeChild(elem);
			bullets.splice(i, 1);
			continue; }
		bullets[i].x += bullets[i].dx * bulletSpeed;
		bullets[i].y += bullets[i].dy * bulletSpeed;
		document.getElementById('bullet'+bullets[i].bulletid).style.left = bullets[i].x+"px";
		document.getElementById('bullet'+bullets[i].bulletid).style.top = bullets[i].y+"px";
		document.getElementById('bullet'+bullets[i].bulletid).style.zIndex = bullets[i].y;
	}
}

setInterval(function() {
	if(!isGameActive) return;
	if(canMove(playerX+playerDX*playerSpeed,playerY+playerDY*playerSpeed)) {
		playerX+=playerDX*playerSpeed;
		playerY+=playerDY*playerSpeed;
	}
	if(playerDX==-1) document.getElementById("playerAvatar").style.backgroundImage="url(graphics/playerml.gif)";
	else if(playerDX==1) document.getElementById("playerAvatar").style.backgroundImage="url(graphics/playermr.gif)";
	else if(playerDY==-1) document.getElementById("playerAvatar").style.backgroundImage="url(graphics/playermu.gif)";
	else document.getElementById("playerAvatar").style.backgroundImage="url(graphics/playermd.gif)";
	updateBullets();
	updateEnemies();
	if(Math.random()<0.001+gamet()/10000000) spawnEnemyNearEdge();
},15);
doAnimations=function() {
	document.getElementById('playerAvatar').style.left = playerX+"px";
	document.getElementById('playerAvatar').style.top = playerY+"px";
	document.getElementById('playerAvatar').style.zIndex = playerY;
	document.getElementById('gameinner').scrollLeft = (playerX-392)*2.6-mappadding*1.34;
	document.getElementById('gameinner').scrollTop = (playerY-1012)*2.6-mappadding*1.62;
	requestAnimationFrame(doAnimations);
};









