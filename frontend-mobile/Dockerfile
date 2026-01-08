FROM node:20-alpine

WORKDIR /frontend-mobile

COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE 8081 19000 19001 19002

ENV EXPO_NO_INTERACTIVE=1
ENV EXPO_NO_WEB=true
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0

CMD ["npx", "expo", "start", "--lan"]