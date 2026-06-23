FROM node:18-alpine

WORKDIR /app

# On installe nodemon globalement dans l'image
RUN npm install -g nodemon

COPY package*.json ./

# On installe les dépendances locales
RUN npm install

COPY . .

# On donne les permissions d'exécution au dossier (pour éviter le code 126)
RUN chmod -R 777 /app

EXPOSE 3000

# On lance nodemon directement
CMD ["nodemon", "src/server.js"]