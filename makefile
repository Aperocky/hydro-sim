tsc:
	@tsc src/main/sim/sim.ts --target es5
	@tsc $$(find src/test -name "*.ts" -type f)
	@browserify src/main/sim/sim.js -o src/out/script.js
	@uglifyjs src/out/script.js > src/out/script.min.js

test:
	@find src/test -name "*.js" -type f | xargs -I{} node {} 
