tsc:
	@tsc src/main/display/main.ts --target es5
	@tsc $$(find src/test -name "*.ts" -type f)
	@browserify src/main/display/main.js -o src/out/script.js
	@uglifyjs src/out/script.js > src/out/script.min.js
	@mv src/out/script.js asset/static/script.js
	@mv src/out/script.min.js asset/static/script.min.js

test:
	@find src/test -name "*.js" -type f | xargs -I{} node {}

service:
	@python3 server/server.py
