all: wmacore.min.js wmacore_dev.min.js

wmacore.min.js: ../wmacore.js
	closure-compiler --js ../wmacore.js --js_output_file wmacore.min.js

wmacore_dev.min.js: ../wmacore_dev.js
	closure-compiler --js ../wmacore_dev.js --js_output_file wmacore_dev.min.js
