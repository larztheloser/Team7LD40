<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>LD40 - Team7</title>
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
#game {
	max-width: 100%; max-height: 100%; overflow: hidden;
}
</style>
</head>
<body oncontextmenu="return false;">
<script src="game.js?v=1"></script>
</body>
</html>