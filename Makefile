all: min/wmaglobe3d.min.js min/utils.min.js min/wmajt_dev.min.js min/wmajt.min.js min/wmacore_dev.min.js

min/wmaglobe3d.min.js: wmaglobe3d.js
	yui-compressor wmaglobe3d.js > min/wmaglobe3d.min.js

min/utils.min.js: utils.js
	yui-compressor utils.js > min/utils.min.js

min/wmajt_dev.min.js: wmajt_dev.js
	yui-compressor wmajt_dev.js > min/wmajt_dev.min.js

min/wmajt.min.js: wmajt.js
	yui-compressor wmajt.js > min/wmajt.min.js

min/wmacore_dev.min.js: wmacore_dev.js
	yui-compressor wmacore_dev.js > min/wmacore_dev.min.js

min/wmacore.min.js: wmacore.js
	yui-compressor wmacore.js > min/wmacore.min.js

