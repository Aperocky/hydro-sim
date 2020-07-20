tsc:
	@tsc src/main/main.ts --target es5
	@tsc $$(find src/test -name "*.ts" -type f)
	@browserify src/main/main.js -o src/out/script.js
	@uglifyjs src/out/script.js > src/out/script.min.js
