FROM node:16-alpine
# install curl, awk is available by default
RUN apk add --no-cache curl

# Create app directory
RUN mkdir -p /code
WORKDIR /code

# Install app dependencies
COPY package.json /code/

# Copy default cron jobs
COPY crontab.default.jobs ./

# Install node packages
RUN npm install

# Bundle app source
COPY . /code

# Add default cron jobs and start application
CMD ["/bin/sh", "-c", "crontab -l > cronbak;cat crontab.default.jobs >> cronbak;crontab cronbak;rm cronbak;crond;node app.js"]
