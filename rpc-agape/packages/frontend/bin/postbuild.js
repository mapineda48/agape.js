const fs = require("fs-extra");

fs.moveSync("build/index.html", "dist/index.html", { overwrite: true })
fs.moveSync("build", "dist/www", { overwrite: true })

//fs.copySync("dist", "../backend/lib/spa/build", { overwrite: true });
