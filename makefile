tsc:
	@npx esbuild src/main/display/main.ts --bundle --minify --outfile=output/script.js

test:
	@npx esbuild src/test/testSim.ts --bundle --platform=node --outfile=output/testSim.js
	@node output/testSim.js
