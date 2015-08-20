jshint: node_modules/jshint/bin/jshint
	./node_modules/jshint/bin/jshint *.js

jscs: node_modules/jscs/bin/jscs
	./node_modules/jscs/bin/jscs *.js

node_modules/jshint/bin/jshint:
	npm install jshint --prefix .

node_modules/jscs/bin/jscs:
	npm install jscs --prefix .
