# FROM node:18-alpine
FROM node:latest
WORKDIR /fembi-booking-webapp

COPY . /fembi-booking-webapp

RUN npm cache clean --force
RUN npm install -g npm@10.3.0
RUN npm install

RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start"]
