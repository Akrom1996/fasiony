FROM node:18-alpine as base

RUN apk add --no-cache bash
RUN apk add --no-cache libc6-compat \
  chromium \
  nss \
  freetype \
  harfbuzz \
  ca-certificates \
  ttf-freefont
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
  PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV DATABASE_URL=postgresql://postgres:1234admin@fasiony-1.chmboteymrgw.ap-northeast-1.rds.amazonaws.com:5432/fasiony?schema=public

# Create app directory
WORKDIR /usr/src/app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json .
COPY prisma ./prisma/

# Install app dependencies
RUN npm install
RUN node node_modules/puppeteer/install.js

# Bundle app source
COPY . .

# Creates a "dist" folder with the production build
RUN npx prisma generate

# Use this command if migration is already DONE
RUN npx prisma migrate deploy
# Use command below if the DB newly created
# RUN npx prisma migrate dev --name init1

RUN npm run build

EXPOSE 3002


# Start the server using the production build
CMD [ "node", "dist/main.js" ]