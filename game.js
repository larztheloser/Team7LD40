/*jshint maxerr: 1000 */

/*

TODO:
> Reduce gain: wind, highlight










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
	amplayingmulti=false; enemygen=true; tutorial=false;
	document.getElementById("bgimg").style.display="block";
	document.getElementById("menus").innerHTML="<div class='menublock'><a href='javascript: void(0)' onclick='survivegame()'>Survival Mode</a><a href='javascript: void(0)' onclick='campaigngame()'>Tutorial</a><a href='javascript: void(0)' onclick='options()'>Options</a><a href='javascript: void(0)' onclick='credits()'>Credits</a></div>";
	setLinksHighlights();//<a href='javascript: void(0)' onclick='multgame()'>Multiplayer</a>
}
function setLinksHighlights() {
	var links = document.querySelectorAll('.menublock>a'), i;
	for (i = 0; i < links.length; ++i) {
		links[i].addEventListener("mouseover",function() { getResource("sfxHighlight").play(); });
	}
}
function msgBox(txt,fwd) {
	showmenus();
	document.getElementById("menus").innerHTML="<div class='msgblock'>"+txt+"<br><a href='javascript: void(0)' onmouseover=\"getResource('sfxHighlight').play();\" onclick=\"getResource('sfxSelect').play();"+fwd+"\" class='msgclink'>Continue</a></div>";
}
prevSurviveMapTypeSelection="r";
prevSurviveMapSelection="arena";
prevSurviveMapSizeSelection="150";
function postManualQuitSurvival() {
	document.getElementById("game").innerHTML="";
	playMenuMusic();
	mainMenu();
}
function postSurvivalGame() {
	if(tutorial) { postManualQuitSurvival(); return; }
	document.getElementById("game").innerHTML="";
	document.getElementById("menus").innerHTML="<div class='msgblock'><span class='menutitle'>Loading - Please Wait</span></div>";
	ajax("leaderboard.php?m="+mapstyle+mapsize+"&t="+Math.random());
}
on("ajaxDone",function(v) {
	if(v[0].substring(0,17)=="leaderboard.php?s") {
		document.getElementById("menus").innerHTML="<div class='msgblock'><span class='menutitle'>Highscore Submitted</span>Thank you for playing!<br><a href='javascript: void(0)' onclick=\"getResource('sfxSelect').play(); playMenuMusic(); mainMenu();\" onmouseover=\"getResource('sfxHighlight').play();\" class='msgclink'>Continue</a></div>";
	} else if(v[0].substring(0,17)=="leaderboard.php?m") {
		var parsed = JSON.parse(v[1]);
		var cscores="<table style=\"width: 100%; font-size: 16px; font-family: 'I.F.C. LOS BANDITOS';\">";
		var winscore=false; var ths=0;
		for(var key in parsed) {
			if(parsed.hasOwnProperty(key)) {
				var score=parsed[key]; ths++;
				cscores+="<tr><td style='width: 50%;text-align:center;'>"+score.n+"</td><td>"+score.s+"</td></tr>";
				if(score.s<gamescore) winscore=true;
			}
		}
		cscores+="</table>";
		if(cscores=="<table></table>") { cscores="There are not yet any high scores for this map"; }
		if(ths<10) winscore=true;
		if(gamescore===0) winscore=false;
		var cont_action="getResource('sfxSelect').play(); playMenuMusic(); mainMenu();";
		if(winscore) cont_action="getResource('sfxSelect').play(); newHiScore();";
		document.getElementById("menus").innerHTML="<div class='msgblock'><span class='menutitle'>Highscores</span>Map name: "+mapstyle+mapsize+"<br>"+cscores+"<br>Your score: "+gamescore+"<br><a href='javascript: void(0)' onclick=\""+cont_action+"\" onmouseover=\"getResource('sfxHighlight').play();\" class='msgclink'>Continue</a></div>";
	}
});
savedname="";
function newHiScore() {
	document.getElementById("menus").innerHTML="<div class='msgblock'><span class='menutitle'>New High Score</span>Enter your name to submit your high score:<br><input id='hiscorename' maxlength='12' autocomplete='off'><br><a href='javascript: void(0)' onclick=\"getResource('sfxSelect').play(); submitscore();\" onmouseover=\"getResource('sfxHighlight').play();\" class='msgclink'>Submit High Score!</a><br><a href='javascript: void(0)' onclick=\"getResource('sfxSelect').play(); playMenuMusic(); mainMenu();\" onmouseover=\"getResource('sfxHighlight').play();\" class='msgclink'>Ignore</a></div>";
	document.getElementById("hiscorename").addEventListener("keypress",function (e) { var regex = new RegExp("^[a-zA-Z0-9]+$"); var str = String.fromCharCode(!e.charCode ? e.which : e.charCode); if (regex.test(str)) { return true; } e.preventDefault(); return false; });
	document.getElementById("hiscorename").value=savedname;
}
function submitscore() {
	savedname=document.getElementById("hiscorename").value;
	ajax("leaderboard.php?s="+gamescore+"&n="+savedname+"&m="+mapstyle+mapsize);
	document.getElementById("menus").innerHTML="<div class='msgblock'><span class='menutitle'>Submitting High Score...</span></div>";
}


function survivegame() {
	getResource('sfxSelect').play();
	document.getElementById("menus").innerHTML="<div class='menublock'><span class='menutitle'>Setup Game</span><table><tr><td style='width: 100px;'><label for='mcsgametype'>Game Type:</label></td><td><select onchange='updatesurvivegamemenu(false)' onclick=\"getResource('sfxHighlight').play();\" id='mcsgametype'><option value='r' selected>Random Map</option><option value='s'>Scenario</option></select></td></tr><tr><td><label for='mcsmapname'>Map Name:</label></td><td><select id='mcsmapname' onclick=\"getResource('sfxHighlight').play();\" onchange='updatesurvivemapname()'></select></td></tr><tr><td colspan=2 id='mapdesc' style='font-size: 11px; height: 30px;'></td></tr><tr id='mcshfscn'><td><label for='mcsmapsize'>Map Size:</label></td><td><select id='mcsmapsize' onclick=\"getResource('sfxHighlight').play();\" onchange='updatesurvivemapsize()'><option value='45'>Small</option><option value='100'>Medium</option><option value='150'>Large</option></select></td></tr></table><a href='javascript: void(0)' onclick=\"getResource('sfxBack').play();mainMenu()\">Back</a><a href='javascript: void(0)' onclick='startsurvivegame()'>PLAY</a></div>";
	document.getElementById("mcsgametype").value=prevSurviveMapTypeSelection;
	updatesurvivegamemenu(true);
	document.getElementById("mcsmapname").value=prevSurviveMapSelection;
	updateMapDesc();
	document.getElementById("mcsmapsize").value=prevSurviveMapSizeSelection;
	setLinksHighlights();
}
function updatesurvivegamemenu(a) {
	var elem=document.getElementById("mcsgametype");
	if(prevSurviveMapTypeSelection==elem.value && !a) return;
	prevSurviveMapTypeSelection=elem.value;
	var elem2=document.getElementById("mcsmapname");
	if(elem.value=="r") {
		elem2.innerHTML="<option value='arena'>Arena</option><option value='chase'>The Chase</option><option value='valleys'>Valleys</option>";
		document.getElementById("mcshfscn").style.display="table-row";
	} else {
		elem2.innerHTML="<option value='colosseum'>Colosseum</option><option value='grand canyon'>Grand Canyon</option><option value='pyramid'>Pyramid</option><option value='multispecial'>Ridges</option><option value='snake valley'>Snake Valley</option><option value='two worlds'>Two Worlds</option>";
		document.getElementById("mcshfscn").style.display="none";
	}
	if(!a) updatesurvivemapname();
}
function updatesurvivemapsize() { prevSurviveMapSizeSelection=document.getElementById("mcsmapsize").value; }
function updatesurvivemapname() { prevSurviveMapSelection=document.getElementById("mcsmapname").value; updateMapDesc(); }
function updateMapDesc() {
	var desc="",map=document.getElementById("mcsmapname").value;
	if(map=='arena') desc="Large open area in the middle with numerous canyons towards the edges of the map.";
	if(map=='chase') desc="A rough, usually circular gorge. Sometimes has starting issues.";
	if(map=='valleys') desc="Open mesas and plains with a few secluded spaces.";
	if(map=='colosseum') desc="Small map - fight in the classical dungeon of gladiators!";
	if(map=='pyramid') desc="Small map - watch your enemies run towards you in circles like Lemmings :)";
	if(map=='multispecial') desc="Medium map with tricky valleys.";
	if(map=='grand canyon') desc="Based on the real-world geography of the world-famous landmark.";
	if(map=='snake valley') desc="Maze-like canyons can make these valleys deceptive and hard to navigate.";
	if(map=='two worlds') desc="Small map - enemies will come at you from both left and right on this map.";
	document.getElementById("mapdesc").innerHTML=desc;
}

function startsurvivegame() {
	mapstyle=document.getElementById("mcsmapname").value;
	mapsize=parseInt(document.getElementById("mcsmapsize").value);
	enemygen=true;
	generateMap();
	renderGameTiles();
	createHealthbar();
	gameStartTime=new Date().getTime();
	createPlayer();
	getResource("sfxStart").play();
	playGameMusic();
	fallout = 0;
}
tutorial=false;
function campaigngame() {
	mapstyle="tutorial"; enemygen=false; tutorial=true;
	getResource('sfxSelect').play();
	generateMap();
	renderGameTiles();
	createHealthbar();
	gameStartTime=new Date().getTime();
	createPlayer();
	getResource("sfxStart").play();
	playGameMusic();
	startTutorialScript();
	fallout = 0;
}


var _warpclient,donecxn=false,amplayingmulti=false,multiroomId;
function multgame() {
	getResource('sfxSelect').play();
	if(donecxn) { _warpclient.getAllRooms(); return; }
	document.getElementById("menus").innerHTML="<div class='msgblock'><span class='menutitle'>Multiplayer</span>Enter your screen name:<br><input id='hiscorename' maxlength='12' autocomplete='off'><br><a href='javascript: void(0)' onclick=\"getResource('sfxSelect').play(); multcxn();\" onmouseover=\"getResource('sfxHighlight').play();\" class='msgclink'>Connect</a><br><a href='javascript: void(0)' onclick=\"getResource('sfxBack').play(); playMenuMusic(); mainMenu();\" onmouseover=\"getResource('sfxHighlight').play();\" class='msgclink'>Back</a></div>";
	document.getElementById("hiscorename").addEventListener("keypress",function (e) { var regex = new RegExp("^[a-zA-Z0-9]+$"); var str = String.fromCharCode(!e.charCode ? e.which : e.charCode); if (regex.test(str)) { return true; } e.preventDefault(); return false; });
	document.getElementById("hiscorename").value=savedname;
}
function multcxn() {
	savedname=document.getElementById("hiscorename").value;
	document.getElementById("menus").innerHTML="<div class='msgblock'><span class='menutitle'>Connecting</span></div>";
	AppWarp.WarpClient.initialize("9ddaa15aca7277917f49c9984fd8fc074152fd89844685943c2cc81ab3baa4e5", "c89792149bb73fdb7301c1618a94fa57414722e95cb82d69ba691b8022605677");
	_warpclient = AppWarp.WarpClient.getInstance();
	_warpclient.setResponseListener(AppWarp.Events.onConnectDone, monConnectDone);
	_warpclient.setResponseListener(AppWarp.Events.onGetAllRoomsDone, monGetAllRoomsDone);
	_warpclient.setResponseListener(AppWarp.Events.onGetLiveRoomInfoDone, monGetLiveRoomInfo);
	_warpclient.setResponseListener(AppWarp.Events.onJoinRoomDone, monJoinRoomDone);
	_warpclient.setResponseListener(AppWarp.Events.onCreateRoomDone, monCreateRoomDone);
	_warpclient.setResponseListener(AppWarp.Events.onSubscribeRoomDone, monSubscribeRoomDone);
	_warpclient.setResponseListener(AppWarp.Events.onLeaveRoomDone, monLeaveRoomDone);
	_warpclient.setResponseListener(AppWarp.Events.onChatReceived, monTest);
	_warpclient.setResponseListener(AppWarp.Events.onSendChatDone, monTest);
	_warpclient.connect(savedname);
}
function monConnectDone(res) {
	if(res != AppWarp.ResultCode.Success) msgBox("Connection Error","mainMenu()");
	else { donecxn=true; _warpclient.getAllRooms(); }}
function monGetAllRoomsDone(rooms) {
	for(var i=0; i<rooms.getRoomIds().length; ++i) {
		_warpclient.getLiveRoomInfo(rooms.getRoomIds()[i]);
	}
	document.getElementById("menus").innerHTML="<div class='msgblock'><span class='menutitle'>Join Room</span><div id='multiroomlist'></div><a href='javascript: void(0)' onclick=\"getResource('sfxSelect').play(); createmultiroom();\" onmouseover=\"getResource('sfxHighlight').play();\" class='msgclink'>Create Room</a><br><a href='javascript: void(0)' onclick=\"getResource('sfxBack').play(); mainMenu();\" onmouseover=\"getResource('sfxHighlight').play();\" class='msgclink'>Back</a></div>"; }
function monGetLiveRoomInfo(room) {
	document.getElementById("multiroomlist").innerHTML=document.getElementById("multiroomlist").innerHTML+"<a href='javascript: void(0)' onClick=\"joinRoom('"+room.getRoom().getRoomId()+"')\">" + room.getRoom().getName() + "</a><br>"; }
function createmultiroom() {
	document.getElementById("menus").innerHTML="<div class='msgblock'><span class='menutitle'>Create Room</span>Enter a room name:<br><input id='hiscorename' maxlength='12' autocomplete='off'><br><a href='javascript: void(0)' onclick=\"getResource('sfxSelect').play(); startRoom();\" onmouseover=\"getResource('sfxHighlight').play();\" class='msgclink'>Connect</a><br><a href='javascript: void(0)' onclick=\"getResource('sfxBack').play(); multgame();\" onmouseover=\"getResource('sfxHighlight').play();\" class='msgclink'>Back</a></div>";
	document.getElementById("hiscorename").addEventListener("keypress",function (e) { var regex = new RegExp("^[a-zA-Z0-9]+$"); var str = String.fromCharCode(!e.charCode ? e.which : e.charCode); if (regex.test(str)) { return true; } e.preventDefault(); return false; }); }
function startRoom() {
	var roomname=document.getElementById("hiscorename").value;
	document.getElementById("menus").innerHTML="<div class='msgblock'><span class='menutitle'>Connecting</span></div>";
	_warpclient.createRoom(roomname,savedname,20,null); }
function monCreateRoomDone(room) {
	joinRoom(room.getName()); }
function joinRoom(room) {
	document.getElementById("menus").innerHTML="<div class='msgblock'><span class='menutitle'>Connecting</span></div>";
	_warpclient.joinRoom(room); }
function monJoinRoomDone(room) { if(room.getResult() != AppWarp.ResultCode.Success) console.log(room.getResult()); _warpclient.subscribeRoom(room.getRoomId()); multiroomId=room.getRoomId(); }
function monLeaveRoomDone(room) { _warpclient.unsubscribeRoom(room.getRoomId()); }
function monSubscribeRoomDone(room) {
	_warpclient.setResponseListener(AppWarp.Events.onGetLiveRoomInfoDone, monTest);
	_warpclient.getLiveRoomInfo(room.getRoomId());
	hidemenus(); mapstyle="multispecial"; amplayingmulti=true; enemygen=false; generateMap();
	renderGameTiles(); createHealthbar(); gameStartTime=new Date().getTime();
	createPlayer(); getResource("sfxStart").play(); playGameMusic();
	_warpclient.sendChat("HI "+savedname);
	console.log("Room Sub Done "+savedname+" / " + room.getName());
}
function monTest(out) {
	console.log(out);
	_warpclient.setResponseListener(AppWarp.Events.onGetLiveRoomInfoDone, monGetLiveRoomInfo);
}

optInput='wasd'; optSfx=1.0; optMus=0.8;
function options() {
	getResource('sfxSelect').play();
	document.getElementById("menus").innerHTML="<div class='menublock'><span class='menutitle'>Options</span><table><tr><td style='width: 100px;'><label for='optinput'>Movement:</label></td><td><select id='optinput' onclick=\"getResource('sfxHighlight').play();\" onchange='optInput=this.value;'><option value='arrow'>Arrow Keys</option><option value='wasd'>WASD Keys</option></select></td></tr><tr><td style='width: 100px;'><label for='sfxslider'>SFX Volume:</label></td><td><input id=\"sfxslider\" onchange=\"setSfxVol(this.value)\" type=\"range\" min=\"0.0\" max=\"1.0\" step =\"0.05\" value=\"1.0\"></td></tr><tr><td style='width: 100px;'><label for='musslider'>Music Volume:</label></td><td><input id=\"musslider\" onchange=\"setMusVol(this.value)\" type=\"range\" min=\"0.0\" max=\"1.0\" step =\"0.05\" value=\"0.8\"></td></tr></table><a href='javascript: void(0)' onclick=\"getResource('sfxBack').play();mainMenu()\">Back</a></div>";
	document.getElementById("optinput").value=optInput;
	document.getElementById("sfxslider").value=optSfx;
	document.getElementById("musslider").value=optMus;
	setLinksHighlights();
}
function setSfxVol(x) {
	optSfx=x;
	for (var i = 0; i < registeredResources.length; i++) {
		if(registeredResources[i].name.substring(0, 3)=="sfx") registeredResources[i].res.volume(optSfx);
	}
	getResource("sfxGun").play();
}
function setMusVol(x) {
	optMus=x;
	for (var i = 0; i < registeredResources.length; i++) {
		if(registeredResources[i].name.substring(0, 5)=="music") registeredResources[i].res.volume(optMus);
	}
	getResource("musicGun").play();
}
function credits() {
	getResource('sfxSelect').play();
	msgBox("The credits are not yet available.","mainMenu()");
}
function hidemenus() {
	document.getElementById("menus").innerHTML="";
	document.getElementById("menus").style.width="0";
	document.getElementById("menus").style.height="0";
}
function showmenus() {
	document.getElementById("menus").style.width="100%";
	document.getElementById("menus").style.height="100%";
}

onload=function() {
	ap("<div id='bgimg' style='display: none;'></div>");
	ap("<div id='menus'></div>");
	ap("<div id='game'></div>");
	loadGame();
};

function loadGame() {
	var assetsLoaded=0, assetstotal=76; // remember to update the number of assets to load when changing this function
	document.getElementById("menus").innerHTML="<div class='msgblock'><div class='menutitle' style='color: #000;'>Loading</div><div id='loadbar' style='display: inline-block; width: 300px; height: 9px; border: 1px solid white; overflow: hidden'><div id='loadbarinner' style='width: 0; height: 9px; background-color: #fff;'></div></div></div>";
	function startTheGame() { playMenuMusic(); mainMenu(); }
	var assetCheck=function() {
		assetsLoaded++;
		document.getElementById('loadbarinner').style.width=100/assetstotal*assetsLoaded+"%";
		if(assetsLoaded==assetstotal) startTheGame();
	}.bind(this);
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
	pushasset("img15","dg_imgs/15.gif");
	pushasset("cactus","graphics/cactus.gif");
	pushasset("cactus2","graphics/cactus2.gif");
	pushasset("cactus3","50px/cactus.gif");
	pushasset("cactus4","50px/grass.gif");
	pushasset("walkerD","50px/edead.png");
	pushasset("fattyD","50px/e2dead.png");
	pushasset("jumpD","50px/e3dead.png");
	pushasset("walkerWD","50px/walker_walkingD.gif");
	pushasset("walkerWF","50px/walker_walkingF.gif");
	pushasset("walkerWL","50px/walker_walkingL.gif");
	pushasset("walkerWR","50px/walker_walkingR.gif");
	pushasset("fattyD","50px/FattyWalkD.gif");
	pushasset("fattyF","50px/FattyWalkF.gif");
	pushasset("fattyL","50px/FattyWalkL.gif");
	pushasset("fattyR","50px/FattyWalkR.gif");
	pushasset("jumpD","50px/jumper_JumpD.gif");
	pushasset("jumpF","50px/jumper_JumpF.gif");
	pushasset("jumpL","50px/jumper_JumpL.gif");
	pushasset("jumpR","50px/jumper_JumpR.gif");
	pushasset("rocks","graphics/rocks.gif");
	pushasset("tree","graphics/deadtree.gif");
	pushasset("grave","graphics/grave.gif");
	pushasset("windmill","graphics/windmill.gif");
	pushasset("watertower","graphics/watertower.gif");
	pushasset("skeleton","graphics/skeleton.gif");
	pushasset("crack","graphics/crack.gif");
	pushasset("sign","graphics/sign.gif");
	pushasset("svmap","maps/snakevalley.gif");
	pushasset("comap","maps/colosseum.gif");
	pushasset("twmap","maps/twoworlds.gif");
	pushasset("pymap","maps/pyramid.gif");
	pushasset("gcmap","maps/grandcanyon.gif");
	pushasset("multispecial","maps/multispecial.gif");
	pushasset("tutorial","maps/tutorial.gif");
	pushasset("flag","graphics/flag.gif");
	pushasset("target","graphics/target.gif");
	pushasset("radiation","graphics/radiation.png");
	on("scriptload",function(a) {
		if(a=="pathing.js"||a=="howler.js") {
			assetsLoaded++;
			if(a=="pathing.js") aStar=new PF.AStarFinder();
			if(assetsLoaded==assetstotal) startTheGame();
			if(a=="howler.js") {
				var pushsound=function(name,path) { var to=new Howl({src:[path],onload:function() { addResource(name,to); assetCheck(); }.bind(this)}); };
				var pushmusic=function(name,path) { var to=new Howl({src:[path],onload:function() { addResource(name,to); assetCheck(); }.bind(this), html5:true, loop:true, volume: 0.8}); };
				pushsound("sfxGun","sounds/Gun.mp3");
				pushsound("sfxStart","sounds/Start.mp3");
				pushsound("sfxSelect","sounds/Select.mp3");
				pushsound("sfxBack","sounds/Back.mp3");
				pushsound("sfxWind","sounds/Wind.mp3?v=2");
				pushsound("sfxRustling","sounds/Rustling.mp3");
				pushsound("sfxHawk","sounds/Hawk.mp3");
				pushsound("sfxHighlight","sounds/Highlight.mp3?v=2");
				pushsound("sfxDeath","sounds/Death.mp3");
				pushsound("sfxHit","sounds/Hit.mp3");
				pushsound("sfxWall","sounds/Wall Bullet.mp3?v=2");
				pushsound("sfxED","sounds/Enemy Death.mp3");
				pushsound("sfxEV1","sounds/Enemy Voice 02.mp3");
				pushsound("sfxEV2","sounds/Enemy Voice 03.mp3");
				pushsound("sfxEH","sounds/Enemy Hit.mp3");
				
				pushmusic("musicIngame1","music/main-loop-sketch_1.0.mp3");
				pushmusic("musicMenu","music/menu-sketch_2.0.mp3");
				
				var musicGun=new Howl({src:["sounds/Gun.mp3"],onload:function() { addResource("musicGun",musicGun); }.bind(this), volume: 0.8});
			}
		} }.bind(this));
	loadjscssfile("pathing.js","js");
	loadjscssfile("howler.js","js");
	loadjscssfile("appwarp.min.js","js");
}

/*

GAME

*/

var fallout = 0;

var bulletSpeed = 5;
var bullets = [];
var maxBullets = 50;

gamemap=[];
contammap=[];
mapsize=150;
tilesize=20;
mapstyle="colosseum";
isGameActive=false;
pathfinder=false;
enemygen=false;
aStar={};

musicPlaying=null;

function playGameMusic() {
	stopMusic();
	musicPlaying=getResource("musicIngame1").play();
}
function playMenuMusic() {
	stopMusic();
	musicPlaying=getResource("musicMenu").play();
}
function stopMusic() {
	for (var i = 0; i < registeredResources.length; i++) {
		if(registeredResources[i].name.substring(0, 5)=="music" && registeredResources[i].res.playing()) registeredResources[i].res.stop();
	}
}

function generateMap() {
	pathfinder=new PF.Grid(mapsize, mapsize); var tempcanvas,tempctx,row,col;
	if(mapstyle=="snake valley" || mapstyle=="colosseum" || mapstyle=="two worlds" || mapstyle=="grand canyon" || mapstyle=="pyramid" || mapstyle=="multispecial" || mapstyle=="tutorial") {
		var scenario;
		if(mapstyle=="snake valley") scenario=getResource("svmap");
		if(mapstyle=="colosseum") scenario=getResource("comap");
		if(mapstyle=="two worlds") scenario=getResource("twmap");
		if(mapstyle=="pyramid") scenario=getResource("pymap");
		if(mapstyle=="grand canyon") scenario=getResource("gcmap");
		if(mapstyle=="multispecial") scenario=getResource("multispecial");
		if(mapstyle=="tutorial") scenario=getResource("tutorial");
		tempcanvas = document.createElement('canvas');
		tempcanvas.width = scenario.width;
		tempcanvas.height = scenario.height;
		tempctx=tempcanvas.getContext('2d');
		tempctx.drawImage(scenario, 0, 0, scenario.width, scenario.height);
		mapsize=scenario.width;
	}
	for(row=0;row<mapsize;row++) {
		for(col=0;col<mapsize;col++) {
			if(mapstyle=="snake valley" || mapstyle=="colosseum" || mapstyle=="two worlds" || mapstyle=="grand canyon" || mapstyle=="pyramid" || mapstyle=="multispecial" || mapstyle=="tutorial") {
				if(tempctx.getImageData(row, col, 1, 1).data[0]>0) {
					gamemap[row*mapsize+col]=1;
					pathfinder.setWalkableAt(row, col, true);
				} else {
					gamemap[row*mapsize+col]=0;
					pathfinder.setWalkableAt(row, col, false);
				}
				continue;
			}
			gamemap[row*mapsize+col]=0;
			pathfinder.setWalkableAt(row, col, false);
		}
	}
	if(mapstyle=="snake valley" || mapstyle=="colosseum" || mapstyle=="two worlds" || mapstyle=="grand canyon" || mapstyle=="pyramid" || mapstyle=="multispecial" || mapstyle=="tutorial") return;
	var halfmapsize=Math.round(mapsize/2);
	var cpos;
	function getX() { return cpos%mapsize; }
	function getY() { return (cpos-getX())/mapsize; }
	function goUp() { if(getY()>=2) cpos-=mapsize; }
	function goDown() { if(getY()<=mapsize-2) cpos+=mapsize; }
	function goLeft() { if(getX()>=2) cpos-=1; }
	function goRight() { if(getX()<=mapsize-2) cpos+=1; }
	function reset() {
		if(mapstyle=="arena" || mapstyle=="chase") cpos=halfmapsize*mapsize+halfmapsize;
		if(mapstyle=="valleys") cpos=Math.floor(Math.random()*mapsize*mapsize);
	}
	var maxnumit=mapsize*5;
	if(mapstyle=="chase") maxnumit=mapsize*8;
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
	if(mapstyle=="chase") {
		maxnumit=mapsize/10;
		for(i=0;i<maxnumit;i++) {
			reset(); gamemap[cpos]=0;
			while(true) {
				switch(Math.floor(Math.random()*4)+1) {
					case 1: goUp(); break;
					case 2: goDown(); break;
					case 3: goLeft(); break;
					case 4: goRight(); break;
				}
				gamemap[cpos]=0;
				pathfinder.setWalkableAt(getY(), getX(), false);
				if(Math.random()<0.005) break;
			}
		}
	}
	for(row=0;row<mapsize;row++) {
		for(col=0;col<mapsize;col++) {
			if(row===0 || col===0 || row==mapsize-1 || col==mapsize-1) {
				gamemap[row*mapsize+col]=0;
				pathfinder.setWalkableAt(row, col, false);
			}
		}
	}
}
function renderGameTiles() {
	document.getElementById("game").innerHTML="<div id='gameinner'><div id='gameinner2'></div></div><div id='gameinner3'></div>";
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
			else if(gp(row,col)) context.drawImage(getResource("img15"), row*tilesize, col*tilesize);
			else context.fillRect(row*tilesize, col*tilesize, tilesize, tilesize);
			if(Math.random()<0.008 && gp(row,col)) createGameObject(getResource("cactus"), row*tilesize, col*tilesize);
			if(Math.random()<0.004 && gp(row,col)) createGameObject(getResource("cactus2"), row*tilesize, col*tilesize);
			if(Math.random()<0.003 && gp(row,col)) context.drawImage(getResource("rocks"), row*tilesize, col*tilesize);
			if(Math.random()<0.003 && gp(row,col)) context.drawImage(getResource("cactus4"), row*tilesize, col*tilesize, 20, 20);
			if(Math.random()<0.002 && gp(row,col)) context.drawImage(getResource("cactus3"), row*tilesize, col*tilesize, 20, 20);
			if(Math.random()<0.0015 && gp(row,col)) context.drawImage(getResource("crack"), row*tilesize, col*tilesize, 20, 20);
			if(Math.random()<0.0012 && gp(row,col)) context.drawImage(getResource("grave"), row*tilesize, col*tilesize);
			if(Math.random()<0.0009 && gp(row,col)) createGameObject(getResource("tree"), row*tilesize, col*tilesize-20,col*tilesize);
			if(Math.random()<0.0008 && gp(row,col)) context.drawImage(getResource("skeleton"), row*tilesize, col*tilesize);
			if(Math.random()<0.0008 && gp(row,col)) createGameObject(getResource("sign"), row*tilesize, col*tilesize);
			if(Math.random()<0.0005 && gp(row,col)) createGameObject(getResource("windmill"), row*tilesize, col*tilesize-20,col*tilesize);
			if(Math.random()<0.0005 && gp(row,col)) createGameObject(getResource("watertower"), row*tilesize, col*tilesize-20,col*tilesize);
		}
	}
}
enemyCounter=0;
activeEnemies=[];
function spawnEnemy(type,x,y) {
	var enemyspeed=playerSpeed*(Math.random()*0.5+0.4);
	if(type==2) enemyspeed=enemyspeed*0.45;
	if(type==3) enemyspeed=playerSpeed*(Math.random()*0.4+0.8);
	if(type==4) enemyspeed=0;
	var enemyhealth=5;
	if(type==2) enemyhealth=12;
	if(type==3) enemyhealth=2;
	if(type==4) enemyhealth=1;
	activeEnemies.push({
		id: "enemy"+enemyCounter,
		closeEnoughToPlayer: false,
		nextPathingUpdate: -9999999999,
		x:x, y:y, speed: enemyspeed,
		health:enemyhealth,maxhealth:enemyhealth, path:[], type:type
	});
	document.getElementById("gameinner2").insertAdjacentHTML('beforeend', "<div class='enemy' id='enemy"+enemyCounter+"' style='left: "+x+"px; top: "+y+"px; z-index: "+y+"; position: absolute; width: 20px; height: 20px; background-color: transparent; background-size: contain; background-image: url("+getEnemySpritePath(type,0)+"); overflow: visible;'><div class='ehpbar' id='enemy"+enemyCounter+"h' style='width: 20px; height: 2px; background-color: #F00; position: absolute; top: -4px; display: none;'><div id='enemy"+enemyCounter+"hi' style='width: 20px; height: 2px; background-color: #0F0; position: absolute;'></div></div></div>");
	enemyCounter++;
}
function spawnEnemyNearEdge(type) {
	if(activeEnemies.length>=150) return;
	var x,y,maxcount=0;
	switch(Math.floor(Math.random()*4)+1) {
		case 1:
			y=mappadding; x=mappadding+parseInt(Math.random()*mapsize)*tilesize;
			while(!canMove(x+6,y+9)) {
				y+=tilesize;
				if(mapstyle=="pyramid" || mapstyle=="grand canyon" || mapstyle=="two worlds") { maxcount++; if(maxcount>3) return; }
				if(y>=mappadding+tilesize*mapsize) return; }
			break;
		case 2:
			x=mappadding; y=mappadding+parseInt(Math.random()*mapsize)*tilesize;
			while(!canMove(x+6,y+9)) {
				x+=tilesize;
				if(mapstyle=="pyramid" || mapstyle=="grand canyon" || mapstyle=="two worlds") { maxcount++; if(maxcount>3) return; }
				if(x>=mappadding+tilesize*mapsize) return; }
			break;
		case 3:
			y=mappadding+(mapsize-1)*tilesize; x=mappadding+parseInt(Math.random()*mapsize)*tilesize;
			while(!canMove(x+6,y+9)) {
				y-=tilesize;
				if(mapstyle=="pyramid" || mapstyle=="grand canyon" || mapstyle=="two worlds") { maxcount++; if(maxcount>3) return; }
				if(y<=mappadding) return; }
			break;
		default:
			x=mappadding+(mapsize-1)*tilesize; y=mappadding+parseInt(Math.random()*mapsize)*tilesize;
			while(!canMove(x+6,y+9)) {
				x-=tilesize;
				if(mapstyle=="pyramid" || mapstyle=="grand canyon" || mapstyle=="two worlds") { maxcount++; if(maxcount>3) return; }
				if(x<=mappadding) return; }
			break;
	}
	var enemyspeed=playerSpeed*(Math.random()*0.7+0.4)*((fallout+500)/1000);
	if(type==2) enemyspeed=enemyspeed*0.45;
	if(type==3) enemyspeed=playerSpeed*(Math.random()*0.4+0.8)*((fallout+500)/1000);
	var enemyhealth=5*((fallout+500)/1000);
	if(type==2) enemyhealth=12*((fallout+500)/1000);
	if(type==3) enemyhealth=2*((fallout+500)/1000);
	activeEnemies.push({
		id: "enemy"+enemyCounter,
		closeEnoughToPlayer: false,
		nextPathingUpdate: -9999999999,
		x:x, y:y, speed: enemyspeed,
		health:enemyhealth,maxhealth:enemyhealth, path:[], type:type
	});
	document.getElementById("gameinner2").insertAdjacentHTML('beforeend', "<div class='enemy' id='enemy"+enemyCounter+"' style='left: "+x+"px; top: "+y+"px; z-index: "+y+"; position: absolute; width: 20px; height: 20px; background-color: transparent; background-size: contain; background-image: url("+getEnemySpritePath(type,0)+"); overflow: visible;'><div class='ehpbar' id='enemy"+enemyCounter+"h' style='width: 20px; height: 2px; background-color: #F00; position: absolute; top: -4px; display: none;'><div id='enemy"+enemyCounter+"hi' style='width: 20px; height: 2px; background-color: #0F0; position: absolute;'></div></div></div>");
	enemyCounter++;
	spawnEnemy(type,x,y);
}
function getEnemySpritePath(type, direction) {
	switch(type) {
		case 1:
			switch(direction) {
				case 0: return "50px/walker_walkingD.gif";
				case 1: return "50px/walker_walkingF.gif";
				case 2: return "50px/walker_walkingL.gif";
				case 3: return "50px/walker_walkingR.gif";
				default:  break;
			} break;
		case 2:
			switch(direction) {
				case 0: return "50px/FattyWalkD.gif";
				case 1: return "50px/FattyWalkF.gif";
				case 2: return "50px/FattyWalkL.gif";
				case 3: return "50px/FattyWalkR.gif";
				default:  break;
			} break;
		case 3:
			switch(direction) {
				case 0: return "50px/jumper_JumpD.gif";
				case 1: return "50px/jumper_JumpF.gif";
				case 2: return "50px/jumper_JumpL.gif";
				case 3: return "50px/jumper_JumpR.gif";
				default:  break;
			} break;
		case 4: return "graphics/target.gif"
	}
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
	}
	return e; 
}
function playWindSounds() {
	if(getResource("sfxWind").playing() || getResource("sfxRustling").playing()) return;
	if(Math.random()<0.008) { getResource("sfxWind").play(); return; }
	if(Math.random()<0.005) { getResource("sfxRustling").play(); return; }
	if(Math.random()<0.005) { getResource("sfxHawk").play(); return; }
}
enemyDamage = 1;
// the last time the player was attacked
playerLastAttacked = 0;
// the amount of time the player is invulnerable for after being hit, in milliseconds
playerInvulnTime = 400;
function updateEnemies() {
	var tickTime=pt();
	for(var i = 0; i < activeEnemies.length; i++) {
		var e=activeEnemies[i];
		if(e.speed===0) continue;
		//attack logic is here
		var time = pt();
		if(e.closeEnoughToPlayer && Math.abs(e.x-playerX)<=20 && Math.abs(e.y-playerY)<=20 && time - playerLastAttacked > playerInvulnTime) {
			//todo: play enemy attack animation
			//todo: play player hurt animation
			playerHealth -= enemyDamage;
			playerLastAttacked = time;
			getResource("sfxEH").play();
		}
		
		if(e.nextPathingUpdate<=tickTime) { e=updateEnemyPath(e); e.nextPathingUpdate=tickTime+1500; activeEnemies[i]=e; }
		if(e.closeEnoughToPlayer) continue;
		if(e.path.length===0) continue;
		var nextSpot=e.path[0]; var nxX=nextSpot[0],nxY=nextSpot[1],el=document.getElementById(e.id);
		if(Math.abs(e.x-mappadding-nxX*tilesize)<=e.speed && Math.abs(e.y-mappadding-nxY*tilesize)<=e.speed) {
			e.x=nxX*tilesize+mappadding; e.y=nxY*tilesize+mappadding; e.path.shift(); }
		if(nxX*tilesize+mappadding>e.x) { e.x+=e.speed; el.style.backgroundImage = "url("+getEnemySpritePath(e.type,3)+")"; }
		if(nxX*tilesize+mappadding<e.x) { e.x-=e.speed; el.style.backgroundImage = "url("+getEnemySpritePath(e.type,2)+")"; }
		if(nxY*tilesize+mappadding>e.y) { e.y+=e.speed; el.style.backgroundImage = "url("+getEnemySpritePath(e.type,0)+")"; }
		if(nxY*tilesize+mappadding<e.y) { e.y-=e.speed; el.style.backgroundImage = "url("+getEnemySpritePath(e.type,1)+")"; }
		activeEnemies[i]=e;
	}
}

function contaminate(x, y, power) {
	x-=mappadding; y-=mappadding;
	x2=Math.floor((x+10)/tilesize); y2=Math.floor((y+12)/tilesize);
	x=Math.floor((x+3)/tilesize); y=Math.floor((y+5)/tilesize);
	contammap[x*mapsize+y]=1;
	var context = document.getElementById('drawcanvas').getContext("2d");
	context.drawImage(getResource("radiation"), x*tilesize, y*tilesize);
	if(power > 1) {
		var rand = Math.random();
		if(rand < 0.25) contaminate(x+tilesize, y, power-1);
		else if(rand < 0.5) contaminate(x-tilesize, y, power-1);
		else if(rand < 0.75) contaminate(x, y+tilesize, power-1);
		else contaminate(x-tilesize, y-tilesize, power-1);
	}
}

function createGameObject(img,x,y,z) {
	x+=mappadding;y+=mappadding;
	if(typeof z==="undefined") z=y;
	else z+=mappadding;
	document.getElementById("gameinner2").insertAdjacentHTML('afterbegin', "<div class='gaiaObj' style='left: "+x+"px; top: "+y+"px; z-index: "+z+"; position: absolute;'><img src=\""+img.src+"\"></div>"); }

deadEnemyCounter=0;
function spawnDeadEnemy(x,y) {
	var deadEnemyNum=deadEnemyCounter; var cPos=0;
	document.getElementById("gameinner2").insertAdjacentHTML('beforeend', "<div id='deadEnemy"+deadEnemyNum+"' style='left: "+x+"px; top: "+y+"px; z-index: "+y+"; width: "+tilesize+"px; height: "+tilesize+"px; position: absolute; background-image: url(50px/edead.png); background-size: 20px 476px; background-color: transparent; background-position: 0 0; background-repeat: no-repeat;'></div>");
	var doDeathAnimation=setInterval(function(){
		var elem=document.getElementById("deadEnemy"+deadEnemyNum); if(elem===null) return;
		cPos++; if(cPos>19) return;
		elem.style.backgroundPosition="0 -"+cPos*24+"px";
	}.bind(this),75);
	setTimeout(function() { clearInterval(doDeathAnimation); var elem=document.getElementById("deadEnemy"+deadEnemyNum); if(elem!==null) elem.parentNode.removeChild(elem); }.bind(this),2500);
	deadEnemyCounter++;
	contaminate(x, y, 3);
}
function spawnDeadEnemy2(x,y) {
	var deadEnemyNum=deadEnemyCounter; var cPos=0;
	document.getElementById("gameinner2").insertAdjacentHTML('beforeend', "<div id='deadEnemy"+deadEnemyNum+"' style='left: "+x+"px; top: "+y+"px; z-index: "+y+"; width: "+tilesize+"px; height: "+tilesize+"px; position: absolute; background-image: url(50px/e2dead.png); background-size: 20px 384px; background-color: transparent; background-position: 0 0; background-repeat: no-repeat;'></div>");
	var doDeathAnimation=setInterval(function(){
		var elem=document.getElementById("deadEnemy"+deadEnemyNum); if(elem===null) return;
		cPos++; if(cPos>15) return;
		elem.style.backgroundPosition="0 -"+cPos*24+"px";
	}.bind(this),75);
	setTimeout(function() { clearInterval(doDeathAnimation); var elem=document.getElementById("deadEnemy"+deadEnemyNum); if(elem!==null) elem.parentNode.removeChild(elem); }.bind(this),2500);
	deadEnemyCounter++;
	contaminate(x, y, 6);
}
function spawnDeadEnemy3(x,y) {
	var deadEnemyNum=deadEnemyCounter; var cPos=0;
	document.getElementById("gameinner2").insertAdjacentHTML('beforeend', "<div id='deadEnemy"+deadEnemyNum+"' style='left: "+x+"px; top: "+y+"px; z-index: "+y+"; width: "+tilesize+"px; height: "+tilesize+"px; position: absolute; background-image: url(50px/e3dead.png); background-size: 20px 360px; background-color: transparent; background-position: 0 0; background-repeat: no-repeat;'></div>");
	var doDeathAnimation=setInterval(function(){
		var elem=document.getElementById("deadEnemy"+deadEnemyNum); if(elem===null) return;
		cPos++; if(cPos>16) return;
		elem.style.backgroundPosition="0 -"+cPos*24+"px";
	}.bind(this),75);
	setTimeout(function() { clearInterval(doDeathAnimation); var elem=document.getElementById("deadEnemy"+deadEnemyNum); if(elem!==null) elem.parentNode.removeChild(elem); }.bind(this),2500);
	deadEnemyCounter++;
	contaminate(x, y, 2);
}




activeOtherPlayers=[];

function monChatReceived(chat) {
	console.log("chat");
	if(!amplayingmulti) return;
	chat=chat.getChat();
	console.log(chat);
	chat=chat.split(" ");
	switch(chat[0]) {
		case "HI":
			break;
		case "SU":
			break;
	}
}
function broadcast() {
	console.log("Sending: SU "+savedname+" "+playerX+" "+playerY+" "+playerDX+" "+playerDY+" "+playerSpeed+" "+playerHealth);
	if(!amplayingmulti) return;
	_warpclient.sendChat("SU "+savedname+" "+playerX+" "+playerY+" "+playerDX+" "+playerDY+" "+playerSpeed+" "+playerHealth); }

var mappadding=2500;
var playerX=0,playerY=0,playerDX=0,playerDY=0,playerSpeed=2, playerMaxHealth = 15, playerHealth = playerMaxHealth, gamescore=0;
function createPlayer() {
	playerX=Math.floor(mapsize/2)*tilesize+mappadding; playerY=Math.floor(mapsize/2)*tilesize+mappadding; gamescore=0;
	if(!canMove(playerX,playerY)) { while(!canMove(playerX,playerY)) { playerX+=tilesize; } }
	document.getElementById("gameinner2").insertAdjacentHTML('afterbegin', "<div id='playerAvatar' style='left: "+playerX+"px; top: "+playerY+"px; background-color: transparent; background-image: url(graphics/playermd.gif); background-size: contain; width: "+tilesize+"px; height: "+tilesize+"px; position: absolute;'></div>");
	document.getElementById("bgimg").style.display="none";
	hidemenus(); isGameActive=true; requestAnimationFrame(doAnimations);
}

function createHealthbar() {
	playerHealth=playerMaxHealth;
	document.getElementById("gameinner3").insertAdjacentHTML('afterbegin', "<div id='healthbarBackground' style='left: 4px; top: 4px; background-color: #FF0000; background-size: contain; width: 100px; height: 8px; position: absolute;'></div><div id='healthbar' style='left: 4px; top: 4px; background-color: #00FF00; background-size: contain; width: "+((playerHealth/playerMaxHealth)*100)+"px; height: 8px; position: absolute;'></div><p id='healthbarText' style='left: 4px; top: 4px; background-color: transparent; background-size: contain; width: 100px; height: 8px; position: absolute; text-align: left;'>Health: "+playerHealth+"/"+playerMaxHealth+"</p><p id='fallout' style='left: 4px; top: 20px; background-color: transparent; background-size: contain; width: 100px; height: 8px; position: absolute; text-align: left;'>Fallout: 0</p>");
	document.getElementById("gameinner3").insertAdjacentHTML('afterbegin', "<div id='gamescore' style='right: 4px; top: 4px; position: absolute;'>Score: 0</div>");
}

function canMove(x,y) {
	x-=mappadding; y-=mappadding;
	x2=Math.floor((x+10)/tilesize); y2=Math.floor((y+12)/tilesize);
	x=Math.floor((x+3)/tilesize); y=Math.floor((y+5)/tilesize);
	return gamemap[x*mapsize+y]==1&&gamemap[x2*mapsize+y2]==1&&gamemap[x2*mapsize+y]==1&&gamemap[x*mapsize+y2]==1;
}

function inContaminatedSpace(x,y) {
	x-=mappadding; y-=mappadding;
	x2=Math.floor((x+10)/tilesize); y2=Math.floor((y+12)/tilesize);
	x=Math.floor((x+3)/tilesize); y=Math.floor((y+5)/tilesize);
	return contammap[x*mapsize+y]==1||contammap[x2*mapsize+y2]==1||contammap[x2*mapsize+y]==1||contammap[x*mapsize+y2]==1;
}

document.onmousedown = checkMouseDown;
document.onkeydown = checkKeyDown;
document.onkeyup = checkKeyUp;
function checkKeyDown(e) {
	if(!isGameActive) return;
	e = e || window.event;
	if (e.keyCode == '27') {
		isGameActive=false;
		stopMusic();
		if(amplayingmulti) _warpclient.leaveRoom(multiroomId);
		if(getResource("sfxWind").playing()) getResource("sfxWind").stop();
		if(getResource("sfxRustling").playing()) getResource("sfxRustling").stop();
		getResource('sfxBack').play();
		for(var i = 0; i < bullets.length; i++) destroyBullet(i);
		for(i = 0; i < activeEnemies.length; i++) killEnemy(i);
		activeEnemies=[]; bullets=[];
		msgBox("Game over - you have quit the game manually.","postManualQuitSurvival()");
		return;
	}
	if(tutorial_nobullets) return;
	if(optInput=="arrow") {
		if (e.keyCode == '38') playerDY=-1;
		else if (e.keyCode == '40') playerDY=1;
		else if (e.keyCode == '37') playerDX=-1;
		else if (e.keyCode == '39') playerDX=1;
		if(amplayingmulti) broadcast();
	}
	if(optInput=="wasd") {
		if (e.keyCode == '87') playerDY=-1;
		else if (e.keyCode == '83') playerDY=1;
		else if (e.keyCode == '65') playerDX=-1;
		else if (e.keyCode == '68') playerDX=1;
		if(amplayingmulti) broadcast();
	}
}

function checkKeyUp(e) {
	if(!isGameActive) return;
	e = e || window.event;
	if(optInput=="arrow") {
		if(e.keyCode == '38' || e.keyCode == '40') playerDY = 0;
		else if(e.keyCode == '37' || e.keyCode == '39') playerDX = 0;
		if(amplayingmulti) broadcast();
	}
	if(optInput=="wasd") {
		if(e.keyCode == '87' || e.keyCode == '83') playerDY = 0;
		else if(e.keyCode == '68' || e.keyCode == '65') playerDX = 0;
		if(amplayingmulti) broadcast();
	}
}

function checkMouseDown(e) {
	if(!isGameActive) return;
	e = e || window.event;
	// 1 is left mouse button
	if(e.which == 1) playerShootBullet(e.clientX, e.clientY);
}

bulletID = -1;
function playerShootBullet(clickX, clickY) {
	if(tutorial_nobullets) return;
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
	getResource("sfxGun").play();
	fallout+=0.25;
}

bulletSize = 2;
function createBullet(bullet) {
	document.getElementById("gameinner2").insertAdjacentHTML('afterbegin', "<div id='bullet"+bullet.bulletid+"' style='left: "+bullet.x+"px; top: "+bullet.y+"px; background-color: #000000; background-size: contain; width: "+bulletSize+"px; height: "+bulletSize+"px; position: absolute;'></div>");
}

function destroyBullet(i) {
	var elem=document.getElementById('bullet'+bullets[i].bulletid);
	if(elem!==null) elem.parentNode.removeChild(elem);
	bullets.splice(i, 1);
}

function killEnemy(en) {
	var elem = document.getElementById(activeEnemies[en].id);
	if(elem!==null) elem.parentNode.removeChild(elem);
	activeEnemies.splice(en, 1);
}

function canBulletPass(x,y) {
	x-=mappadding; y-=mappadding;
	x=Math.floor(x/tilesize); y=Math.floor(y/tilesize);
	return gamemap[x*mapsize+y]==1;
}

function updateBullets() {
	var timecheck=pt()-5000;
	for(var i = 0; i < bullets.length; i++) {
		if(bullets[i].killtimer<timecheck-5000 || !canBulletPass(bullets[i].x,bullets[i].y)) {
			destroyBullet(i);
			getResource("sfxWall").play();
			continue; }
		bullets[i].x += bullets[i].dx * bulletSpeed;
		bullets[i].y += bullets[i].dy * bulletSpeed;
		for(var en = 0; en < activeEnemies.length; en++) {
			var e = activeEnemies[en];
			if(typeof bullets[i]=="undefined" || typeof e=="undefined") continue;
			if(bullets[i].x > e.x && bullets[i].x < e.x + 20 && bullets[i].y > e.y && bullets[i].y < e.y + 20) {
				e.health -= 1;
				document.getElementById(e.id+"h").style.display="block";
				getResource("sfxWall").play();
				gamescore+=1;
				//todo play enemy hurt animation
				if(e.health <= 0) {
					if(e.type==1) spawnDeadEnemy(e.x,e.y);
					if(e.type==2) spawnDeadEnemy2(e.x,e.y);
					if(e.type==3) spawnDeadEnemy3(e.x,e.y);
					gamescore+=19;
					if(e.type==2) gamescore+=15;
					else if(e.type==3) gamescore+=30;
					killEnemy(en);
					if(Math.random()<0.5) getResource("sfxEV1").play();
					else getResource("sfxEV2").play();
				} else {
					getResource("sfxED").play();
				}
				destroyBullet(i);
				continue;
			}
		}
	}
}

function updateHealthbar() {
	document.getElementById('healthbar').style.width = (playerHealth/playerMaxHealth)*100+"px";
	document.getElementById('healthbarText').innerHTML = "Health: "+playerHealth+"/"+playerMaxHealth;
	document.getElementById('gamescore').innerHTML = "Score: "+gamescore;
	document.getElementById('fallout').innerHTML = "Fallout: "+Math.round(fallout);
}

function loseGame() {
	isGameActive=false;
	stopMusic();
	if(amplayingmulti) _warpclient.leaveRoom(multiroomId);
	if(getResource("sfxWind").playing()) getResource("sfxWind").stop();
	if(getResource("sfxRustling").playing()) getResource("sfxRustling").stop();
	getResource('sfxDeath').play();
	for(var i = 0; i < bullets.length; i++) destroyBullet(i);
	for(i = 0; i < activeEnemies.length; i++) killEnemy(i);
	activeEnemies=[]; bullets=[];
	msgBox("Game over - you have been killed by radioactive mutants.","postSurvivalGame()");
}
tutorial_nobullets=false; tutorialStage=0;
function startTutorialScript() {
	tutorial_nobullets=true; tutorialStage=1;
	msgBox("<div style='text-align:left'>Welcome to Contamination! Contamination is a game about killing mutants and surviving in a post-apocalyptic world. This tutorial will teach you how to play.<br><br>You can quit the tutorial, or any game, at any time by hitting ESCAPE.</div>","setTimeout(tuscr2,400); hidemenus(); tutorial_nobullets=false;");
}
function tuscr2() {
	tutorial_nobullets=true; tutorialStage=2;
	msgBox("<div style='text-align:left'>First, you need to know how to move around this hostile environment. To move, use the WASD or arrow keys on your keyboard. You can configure which one you want in your game settings.<br><br>Try moving your character to the red flag that just spawned to your left.</div>","hidemenus(); tutorial_nobullets=false;");
	createGameObject(getResource("flag"), 31*tilesize, 27*tilesize-20,27*tilesize);
}
function tuscr3() {
	tutorial_nobullets=true; tutorialStage=3;
	msgBox("<div style='text-align:left'>Excellent. Now follow the trail of flags I have set up for you. Notice that you can't move on top of cliffs.</div>","hidemenus(); tutorial_nobullets=false;");
	createGameObject(getResource("flag"), 36*tilesize, 30*tilesize-20,30*tilesize);
	createGameObject(getResource("flag"), 30*tilesize, 34*tilesize-20,34*tilesize);
	createGameObject(getResource("flag"), 23*tilesize, 33*tilesize-20,33*tilesize);
	createGameObject(getResource("flag"), 16*tilesize, 31*tilesize-20,31*tilesize);
}
function tuscr4() {
	tutorial_nobullets=true; tutorialStage=4;
	msgBox("<div style='text-align:left'>It seems you have mastered the art of movement. However, you will need more than just running away if you want to survive in this world.<br><br> Therefore, you have a weapon available - your gun. To fire the gun, click with your mouse button towards the target you wish to shoot.<br><br>Try shooting the target I have set up to your left.</div>","hidemenus(); tutorial_nobullets=false;");
	spawnEnemy(4, 11*tilesize+mappadding, 32*tilesize+mappadding);
}
function tuscr5() {
	tutorial_nobullets=true; tutorialStage=5;
	msgBox("<div style='text-align:left'>Great job. Of course, a real enemy will be more dangerous than some dummy target. Enemies walk towards you - and if they get close enough, they will attack and cause you to lose health. You can check your current health and score the top of the screen.<br><br>Attack the spawned alien.</div>","hidemenus(); tutorial_nobullets=false; tutorialStage=6; spawnEnemy(1, 9*tilesize+mappadding, 35*tilesize+mappadding);");
}
function tuscr7() {
	tutorial_nobullets=true; tutorialStage=7;
	msgBox("<div style='text-align:left'>Good. Now let's see how you do with multiple enemies at once.</div>","hidemenus(); tutorial_nobullets=false; tutorialStage=8; spawnEnemy(1, 9*tilesize+mappadding, 35*tilesize+mappadding); spawnEnemy(1, 9*tilesize+mappadding, 36*tilesize+mappadding);spawnEnemy(1, 10*tilesize+mappadding, 35*tilesize+mappadding);");
}
function tuscr9() {
	tutorial_nobullets=true; tutorialStage=9;
	msgBox("<div style='text-align:left'>Looks like they won't be bothering us any more! There are also other types of enemies in the game, with different strengths and weaknesses. Try shooting two different types of enemies.</div>","hidemenus(); tutorial_nobullets=false; tutorialStage=10; spawnEnemy(2, 9*tilesize+mappadding, 35*tilesize+mappadding); spawnEnemy(3, 9*tilesize+mappadding, 36*tilesize+mappadding);");
}

function updateTutorialScript() {
	if(tutorialStage==2) {
		if(Math.abs(playerX-3118)<10 && Math.abs(playerY-3052)<10) tuscr3();
	}
	if(tutorialStage==3) {
		if(Math.abs(playerX-2820)<10 && Math.abs(playerY-3124)<10) tuscr4();
	}
	if(tutorialStage==4) {
		if(activeEnemies.length===0) tuscr5();
	}
	if(tutorialStage==6) {
		if(activeEnemies.length===0) tuscr7();
	}
	if(tutorialStage==8) {
		if(activeEnemies.length===0) tuscr9();
	}
}

setInterval(function() {
	if(!isGameActive) return;
	if(canMove(playerX+playerDX*playerSpeed,playerY+playerDY*playerSpeed)) {
		contamFactor = 1;
		if(inContaminatedSpace(playerX, playerY)) contamFactor = 0.5;
		playerX+=playerDX*playerSpeed*contamFactor;
		playerY+=playerDY*playerSpeed*contamFactor;
	}
	if(playerDX==-1) document.getElementById("playerAvatar").style.backgroundImage="url(graphics/playerml.gif)";
	else if(playerDX==1) document.getElementById("playerAvatar").style.backgroundImage="url(graphics/playermr.gif)";
	else if(playerDY==-1) document.getElementById("playerAvatar").style.backgroundImage="url(graphics/playermu.gif)";
	else document.getElementById("playerAvatar").style.backgroundImage="url(graphics/playermd.gif)";
	updateBullets();
	updateEnemies();
	updateHealthbar();
	playWindSounds();
	if(enemygen) {
		if(Math.random()<0.0025+fallout/28000) spawnEnemyNearEdge(1);
		if(mapstyle=="pyramid" && Math.random()<0.01+fallout/28000) spawnEnemyNearEdge(1);
		if(Math.random()<-0.0015+fallout/21500) spawnEnemyNearEdge(2);
		if(Math.random()<-0.006+fallout/20000) spawnEnemyNearEdge(3);
	}
	if(playerHealth <= 0) loseGame();
	if(tutorial) updateTutorialScript();
	fallout+=1/60;
},15);

doAnimations=function() {
	if(!isGameActive) return;
	for(var i = 0; i < bullets.length; i++) {
		document.getElementById('bullet'+bullets[i].bulletid).style.left = bullets[i].x+"px";
		document.getElementById('bullet'+bullets[i].bulletid).style.top = bullets[i].y+"px";
		document.getElementById('bullet'+bullets[i].bulletid).style.zIndex = bullets[i].y;
	}
	for(i = 0; i < activeEnemies.length; i++) {
		var e=activeEnemies[i],el=document.getElementById(e.id);
		el.style.left = e.x+"px"; el.style.top = e.y+"px"; el.style.zIndex = e.y;
		document.getElementById(e.id+"hi").style.width=(20/e.maxhealth*e.health) +"px";
	}
	document.getElementById('playerAvatar').style.left = playerX+"px";
	document.getElementById('playerAvatar').style.top = playerY+"px";
	document.getElementById('playerAvatar').style.zIndex = playerY;
	document.getElementById('gameinner').scrollLeft = (playerX-392)*2.6-mappadding*1.34;
	document.getElementById('gameinner').scrollTop = (playerY-6*mapsize-100)*2.6-mappadding*1.62;
	requestAnimationFrame(doAnimations);
};






