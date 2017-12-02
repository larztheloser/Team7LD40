/*jshint maxerr: 1000 */

/*

GENERAL UTILITY FUNCTIONS

*/

var startTime=new Date().getTime(); timeOffset=parseInt(Math.random()*3600000);
//returns precise time (avoids too-large numbers in shaders)
function pt(){ return new Date().getTime()-startTime+timeOffset; }

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
	loadGame(); mainMenu();
};

function loadGame() {
	var assetsLoaded=0, assetstotal=0;
	var assetCheck=function() { assetsLoaded++; if(assetsLoaded==assetstotal) mainMenu(); }.bind(this);
	var pushasset=function(name,path) { assetstotal++; var to=new Image(); to.onload=function() { addResource(name,to); assetCheck(); }.bind(this); to.src=path; };

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
	pushasset("rocks","graphics/rocks.gif");
	pushasset("grave","graphics/grave.gif");
	pushasset("windmill","graphics/windmill.gif");
	pushasset("watertower","graphics/watertower.gif");
	pushasset("skeleton","graphics/skeleton.gif");
}

/*

GAME

*/

gamemap=[];
mapsize=150;
tilesize=20;
//current random maps: arena, valleys
mapstyle="arena";
isGameActive=false;

function generateMap() {
	for(var row=0;row<mapsize;row++) {
		for(var col=0;col<mapsize;col++) {
			gamemap[row*mapsize+col]=0;
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
			if(Math.random()<0.0012 && gp(row,col)) context.drawImage(getResource("grave"), row*tilesize, col*tilesize);
			if(Math.random()<0.0008 && gp(row,col)) context.drawImage(getResource("skeleton"), row*tilesize, col*tilesize);
			if(Math.random()<0.0005 && gp(row,col)) createGameObject(getResource("windmill"), row*tilesize, col*tilesize-20,col*tilesize);
			if(Math.random()<0.0005 && gp(row,col)) createGameObject(getResource("watertower"), row*tilesize, col*tilesize-20,col*tilesize);
		}
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
	document.getElementById("gameinner2").insertAdjacentHTML('afterbegin', "<div id='playerAvatar' style='left: "+playerX+"px; top: "+playerY+"px; background-color: transparent; background-image: url(graphics/playermd.gif); background-size: contain; width: "+tilesize+"px; height: "+tilesize+"px; position: absolute;'></div>");
	hidemenus(); isGameActive=true; requestAnimationFrame(doAnimations);
}

function canMove(x,y) {
	x-=mappadding; y-=mappadding;
	x2=Math.floor((x+15)/20); y2=Math.floor((y+22)/20);
	x=Math.floor(x/20); y=Math.floor((y+5)/20);
	return gamemap[x*mapsize+y]==1&&gamemap[x2*mapsize+y2]==1;
}
document.onkeydown = checkKeyDown;
document.onkeyup = checkKeyUp;
function checkKeyDown(e) {
	if(!isGameActive) return;
	e = e || window.event;
	if (e.keyCode == '38') playerDY=-1;
	else if (e.keyCode == '40') playerDY=1;
	else if (e.keyCode == '37') playerDX=-1;
	else if (e.keyCode == '39') playerDX=1;
}

function checkKeyUp(e) {
	if(!isGameActive) return;
	e = e || window.event;
	if(e.keyCode == '38' || e.keyCode == '40') playerDY = 0;
	else if(e.keyCode == '37' || e.keyCode == '39') playerDX = 0;
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
},15);
doAnimations=function() {
	document.getElementById('playerAvatar').style.left = playerX+"px";
	document.getElementById('playerAvatar').style.top = playerY+"px";
	document.getElementById('playerAvatar').style.zIndex = playerY;
	document.getElementById('gameinner').scrollLeft = (playerX-392)*2.6-mappadding*1.34;
	document.getElementById('gameinner').scrollTop = (playerY-1012)*2.6-mappadding*1.62;
	requestAnimationFrame(doAnimations);
};









