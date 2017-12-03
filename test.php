<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>LD40 - Team7</title>
<link href="font/stylesheet.css" rel="stylesheet">
<style>
html, body { height: 100%; margin: 0; padding: 0; overflow: hidden; text-align: center; background-color: #000;color: #fff; font-family: sans-serif; }
#menus {
	position: absolute;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
	-moz-user-select: none; -webkit-user-select: none; -ms-user-select:none; user-select:none;-o-user-select:none;
	z-index: 10000000000000;
	font-family: Arial;
}
.menublock {
	width: 300px;
	background-color: #aaa;
	border: 3px solid gold;
}
.menublock a {
	display: block;
	color: #fff;
	background-color: #006;
	text-decoration: none;
	border: 3px inset #003;
	padding: 9px; margin: 4px;
}
.menublock a:hover, .msgclink:hover {
	background-color: #008;
}
.msgblock {
	width: 600px; padding: 20px;
	background-color: #aaa;
	border: 3px solid gold;
}
.msgclink {
	display: inline-block;
	color: #fff;
	background-color: #006;
	text-decoration: none;
	border: 3px inset #003;
	padding: 9px; margin: 4px;
	width: 300px;
}
.menutitle {
	display: block;
	padding: 4px;
	font-weight: bold;
	font-size: 26px;
	font-family: 'I.F.C. LOS BANDITOS';
}
select {
	padding: 4px 12px;
}
.menublock table {
	text-align: left;
	border: 0;
	margin: 5px 0;
}
#game {
	width: 100%; height: 100%; overflow: hidden; position: absolute;
}
#gameinner {
	position: absolute; left: 50%; top: 50%; margin-left: -400px; width: 800px; margin-top: -300px; height: 600px; overflow: hidden;
}
#gameinner2 {
	transform: scale(2.6);
	padding: 2500px;
}
</style>
</head>
<body oncontextmenu="return false;" unselectable="on" onselectstart="return false;">
<script src="game.js?v=1"></script>
</body>
</html>