ifneq (, $(shell which yui-compressor))
 YUICOMPRESSOR := 'yui-compressor'
else ifneq (, $(shell which yuicompressor))
 YUICOMPRESSOR := 'yuicompressor'
else
	 $(error "No YUI Compressor found!")
endif

all: min/wmaglobe3d.min.js min/utils.min.js min/wmajt_dev.min.js min/wmajt.min.js min/wmacore_dev.min.js min/wmacore.min.js

min/wmaglobe3d.min.js: wmaglobe3d.js
	$(YUICOMPRESSOR) wmaglobe3d.js > min/wmaglobe3d.min.js

min/utils.min.js: utils.js
	$(YUICOMPRESSOR) utils.js > min/utils.min.js

min/wmajt_dev.min.js: wmajt_dev.js
	$(YUICOMPRESSOR) wmajt_dev.js > min/wmajt_dev.min.js

min/wmajt.min.js: wmajt.js
	$(YUICOMPRESSOR) wmajt.js > min/wmajt.min.js

min/wmacore_dev.min.js: wmacore_dev.js
	$(YUICOMPRESSOR) wmacore_dev.js > min/wmacore_dev.min.js

min/wmacore.min.js: wmacore.js
	$(YUICOMPRESSOR) wmacore.js > min/wmacore.min.js
