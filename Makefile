YUICOMPRESSOR := $(shell command -v yui-compressor 2>/dev/null || command -v yuicompressor 2>/dev/null)

LEGACY_MINIFIED := \
	min/wmaglobe3d.min.js \
	min/utils.min.js \
	min/wmajt_dev.min.js \
	min/wmajt.min.js \
	min/wmacore_dev.min.js \
	min/wmacore.min.js

.PHONY: all legacy globe check-yui clean-globe

all: legacy globe

legacy: $(LEGACY_MINIFIED)

globe:
	npm run build:globe

check-yui:
	@test -n "$(YUICOMPRESSOR)" || { \
		echo "No YUI Compressor found; install yui-compressor to rebuild legacy assets."; \
		exit 1; \
	}

$(LEGACY_MINIFIED): | check-yui

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

clean-globe:
	rm -f min/wma-globe.min.js min/wma-globe.min.js.map
	rm -f min/wma-globe.min.css min/wma-globe.min.css.map
