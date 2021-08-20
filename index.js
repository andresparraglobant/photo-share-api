const { ApolloServer } = require('apollo-server-express')
const express = require('express')
const expressPlayground = require('graphql-playground-middleware-express').default
const { readFileSync } = require('fs')
const { MongoClient } = require('mongodb')
require('dotenv').config()

const typeDefs = readFileSync('./typeDefs.graphql', 'UTF-8')
const resolvers = require('./resolvers')

var app = express()

async function startApolloServer(typeDefs, resolvers) {
    const app = express();
    // const MONGO_DB = process.env.MDB_HOST
    // const client = await MongoClient.connect(
    //     MONGO_DB,
    //     { useNewUrlParser: true }
    // )
    // const db = client.db()
    // const redshiftClient = require('./redshift.js')
    // // using promises
    // redshiftClient.query('SELECT * FROM edw.dim_rating_variations', {raw: true})
    // .then(function(data){
    // console.log(data);

    // // if you want to close client pool, uncomment redshift.close() line
    // // but you won't be able to make subsequent calls because connection is terminated
    // // redshift.close();
    // }, function(err){
    // throw err;
    // });

    const db = require('./redshift.js')
    const context = { db }
    const server = new ApolloServer({
        typeDefs,
        resolvers,
        context
    })
    await server.start();
    server.applyMiddleware({ app });
    app.get('/', (req, res) => res.end('Welcome to the PhotoShare API'));
    app.get('/playground', expressPlayground({ endpoint: '/graphql' }))
    await new Promise(resolve => app.listen({ port: 4000 }, resolve));
    console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`);
}

startApolloServer(typeDefs, resolvers);
