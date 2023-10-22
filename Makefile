.PHONY: build

SRCS = src/index.ts src/indent.ts

build: $(SRCS)
	npm run prepare

release:
	npm publish
	git tag v$(cat package.json | jq -r .version)
