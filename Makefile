.PHONY: all start stop

all: start

# start front- and back-end
start:
	# start backend stack
	cd aws-cdk; npm install; export AWS_ACCESS_KEY_ID=test; export AWS_SECRET_ACCESS_KEY=test; export AWS_DEFAULT_REGION=eu-central-1; docker-compose up -d; npm run all
	# start frontend (continues to run in the console)
	cd webclient; npm install; npm run dev

# stop the back-end docker container
stop:
	cd aws-cdk; docker-compose down
