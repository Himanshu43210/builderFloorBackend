FROM node:16
WORKDIR /app
RUN echo "Copying files...."
COPY . .
WORKDIR /app
RUN npm install
CMD ["npm", "run", "start"]
EXPOSE 7001
