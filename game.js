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

//keyboard binding


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

on("scriptload",function(c) {
	if(c=="dragscroll.js") dragscroll.reset();
});

onload=function() {
	ap("<div id='menus' unselectable=\"on\" onselectstart=\"return false;\"></div>");
	ap("<div id='game' class='dragscroll'></div>");
	loadjscssfile("dragscroll.js","js");
	mainMenu();
};

/*

GAME

*/

gamemap=[];
mapsize=150;
//current random maps: arena, valleys
mapstyle="valleys";
isGameActive=false;

//todo: implement load screen to ensure these are loaded before the game is run
img00 = new Image();
img00.src = "dg_imgs/00.gif";
img01 = new Image();
img01.src = "dg_imgs/01.gif";
img02 = new Image();
img02.src = "dg_imgs/02.gif";
img03 = new Image();
img03.src = "dg_imgs/03.gif";
img04 = new Image();
img04.src = "dg_imgs/04.gif";
img05 = new Image();
img05.src = "dg_imgs/05.gif";
img06 = new Image();
img06.src = "dg_imgs/06.gif";
img07 = new Image();
img07.src = "dg_imgs/07.gif";
img08 = new Image();
img08.src = "dg_imgs/08.gif";
img09 = new Image();
img09.src = "dg_imgs/09.gif";
img10 = new Image();
img10.src = "dg_imgs/10.gif";
img11 = new Image();
img11.src = "dg_imgs/11.gif";
img14 = new Image();
img14.src = "dg_imgs/14.gif";

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
	if(mapstyle=="arena") maxnumit=50*mapsize;
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
	document.getElementById("game").innerHTML="<canvas id='drawcanvas' width=\""+(mapsize*20)+"\" height=\""+(mapsize*20)+"\">";
	var context = document.getElementById('drawcanvas').getContext("2d");
	function gp(r,c) { return gamemap[r*mapsize+c]==1; }
	for(var row=0;row<mapsize;row++) {
		for(var col=0;col<mapsize;col++) {
			var tt=row*mapsize+col; drawn=true;
			context.fillStyle = "#982";
			if(gp(row,col) && gp(row+1,col) && gp(row-1,col) && gp(row,col+1) && gp(row,col-1)) context.drawImage(img14, row*20, col*20);
			else if(gp(row,col) && gp(row+1,col) && gp(row-1,col) && gp(row,col+1)) context.drawImage(img08, row*20, col*20);
			else if(gp(row,col) && gp(row+1,col) && gp(row-1,col) && gp(row,col-1)) context.drawImage(img10, row*20, col*20);
			else if(gp(row,col) && gp(row-1,col) && gp(row,col+1) && gp(row,col-1)) context.drawImage(img11, row*20, col*20);
			else if(gp(row,col) && gp(row+1,col) && gp(row,col+1) && gp(row,col-1)) context.drawImage(img09, row*20, col*20);
			else if(gp(row,col) && gp(row+1,col) && gp(row-1,col)) context.drawImage(img00, row*20, col*20);
			else if(gp(row,col) && gp(row,col+1) && gp(row,col-1)) context.drawImage(img02, row*20, col*20);
			else if(gp(row,col) && gp(row+1,col) && gp(row,col+1)) context.drawImage(img04, row*20, col*20);
			else if(gp(row,col) && gp(row+1,col) && gp(row,col-1)) context.drawImage(img05, row*20, col*20);
			else if(gp(row,col) && gp(row-1,col) && gp(row,col+1)) context.drawImage(img06, row*20, col*20);
			else if(gp(row,col) && gp(row-1,col) && gp(row,col-1)) context.drawImage(img07, row*20, col*20);
			else if(gp(row,col) && gp(row+1,col)) context.drawImage(img01, row*20, col*20);
			else if(gp(row,col) && gp(row-1,col)) context.drawImage(img03, row*20, col*20);
			else if(gp(row,col)) context.drawImage(img14, row*20, col*20);
			else context.fillRect(row*20, col*20, 20, 20);
		}
	}
	dragscroll.reset();
}
var playerX=0,playerY=0,playerDX=0,playerDY=0,playerSpeed=4.25;
function createPlayer() {
	playerX=Math.round(mapsize/2)*20; playerY=Math.round(mapsize/2)*20;
	document.getElementById("game").insertAdjacentHTML('afterbegin', "<div id='playerAvatar' style='left: "+playerX+"px; top: "+playerY+"px; background-color: red; width: 12px; height: 12px; position: relative;'></div>");
	document.getElementById('game').scrollTop = playerX-window.innerHeight/2+8;
	document.getElementById('game').scrollLeft = playerY-window.innerWidth/2+8;
	hidemenus(); isGameActive=true; requestAnimationFrame(doAnimations);
}
document.onkeydown = checkKey;
document.onkeyup = checkKey;
function checkKey(e) {
	if(!isGameActive) return;
	e = e || window.event;
	if (e.keyCode == '38') playerDY=-1;
	else if (e.keyCode == '40') playerDY=1;
	else if (e.keyCode == '37') playerDX=-1;
	else if (e.keyCode == '39') playerDX=1;
}
setInterval(function() {
	if(!isGameActive) return;
	playerX+=playerDX*playerSpeed;
	playerY+=playerDY*playerSpeed;
	playerDY=0; playerDX=0;
},30);
doAnimations=function() {
	document.getElementById('playerAvatar').style.left = playerX+"px";
	document.getElementById('playerAvatar').style.top = playerY+"px";
	document.getElementById('game').scrollLeft = playerX-window.innerWidth/2+8;
	document.getElementById('game').scrollTop = playerY-window.innerHeight/2+8;
	requestAnimationFrame(doAnimations);
};









