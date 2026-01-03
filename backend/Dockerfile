FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . ./
RUN npx prisma generate
RUN npm run build

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 4000

CMD ["npm", "run", "start:prod"]
