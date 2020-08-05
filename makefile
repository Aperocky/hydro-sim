tsc:
	@tsc src/main/display/main.ts --target es5 --esModuleInterop
	@tsc src/test/testSim.ts --target es5 --esModuleInterop
	@browserify src/main/display/main.js -o src/out/script.js
	@uglifyjs src/out/script.js > src/out/script.min.js
	@cp src/out/script.js asset/static/script.js
	@cp src/out/script.min.js asset/static/script.min.js

test:
	@node src/test/testSim.js

service:
	@python3 server/server.py
