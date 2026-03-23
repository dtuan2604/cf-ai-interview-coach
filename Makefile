.DEFAULT_GOAL := help

#------------------Dev Commands------------------#

run-app:
	@echo "Running app locally..."
	npm run dev

run-local-worker:
	@echo "Running worker locally..."
	npm run dev:worker

help:
	@echo "Makefile commands:"
	@echo "\t make run-app\t\t- Run the app locally"
	@echo "\t make run-local-worker\t\t- Run the Cloudflare worker locally"