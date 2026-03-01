tsc:
	@npx esbuild src/main/display/main.ts --bundle --minify --outfile=output/script.js

test:
	@npx jest
