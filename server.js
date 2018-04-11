var express = require("express");
var app = express();

const PORT = process.env.PORT || 80;

app.use('/', express.static(__dirname));

app.listen(PORT, function() {
	if (PORT === 80) console.log("express server is up on port " + PORT);
});
