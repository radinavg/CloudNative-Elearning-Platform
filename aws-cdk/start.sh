#!/bin/bash
npm install; export AWS_ACCESS_KEY_ID=test; export AWS_SECRET_ACCESS_KEY=test; export AWS_DEFAULT_REGION=eu-central-1; docker-compose up -d; npm run all
